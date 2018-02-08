import chai from 'chai';

import { i18n } from '../src/i18n';
import {
  ValueInteger,
  ValueString,
  ValueTuple,
  ValueList,
  ValueStructure,
} from '../src/value';
import { GobstonesInterpreterAPI } from '../src/index';

function API() {
  return new GobstonesInterpreterAPI();
}

chai.expect();
const expect = chai.expect;

function emptyBoard(width, height) {
  let board = {};
  board.width = width;
  board.height = height;
  board.head = {x: 0, y: 0};
  board.table = [];
  for (let i = 0; i < height; i++) {
    let row = [];
    for (let j = 0; j < width; j++) {
      row.push({});
    }
    board.table.push(row);
  }
  return board;
}

describe('Gobstones API', () => {

  describe('Parsing', () => {

    it('Parse empty source', () => {
      let p = API().parse('');
      expect(p.program).equals(null);
    });

    it('Parse empty program', () => {
      let p = API().parse('program {}');
      expect(p.program.alias).equals('program');
    });

    it('Parse empty interactive program', () => {
      let p = API().parse('interactive program {}');
      expect(p.program.alias).equals('interactiveProgram');
    });

    it('Allow parsing definitions without a program', () => {
      let p = API().parse(
        'procedure P() {}' +
        'procedure Q() {}' +
        'function g() { return (1) }' +
        'function f() { return (1) }'
      );
      expect(p.program).equals(null);
      expect(p.declarations).deep.equals([
        {alias: 'procedureDeclaration', name: 'P'},
        {alias: 'procedureDeclaration', name: 'Q'},
        {alias: 'functionDeclaration', name: 'f'},
        {alias: 'functionDeclaration', name: 'g'},
      ]);
    });

    it('Parse a program with a syntax error', () => {
      let p = API().parse('program { P() }');
      expect(p.reason.code).equals('undefined-procedure');
      expect(p.reason.detail).deep.equals(['P']);
      expect(p.message).equals(i18n('errmsg:undefined-procedure')('P'));
      expect(p.on.range.start.row).equals(1);
      expect(p.on.range.start.column).equals(11);
      expect(p.on.range.end.row).equals(1);
      expect(p.on.range.end.column).equals(13);
      expect(p.on.region).equals('');
    });

  });

  describe('Execution', () => {

    it('Infinitely looping program should timeout', () => {
      let api = API();
      api.config.setInfiniteLoopTimeout(100);
      let p = api.parse('program { while (1 == 1) {} }');
      let r = p.program.interpret(emptyBoard(1, 1));
      expect(r.reason.code).equals('timeout');
      expect(r.reason.detail).deep.equals([100]);
    });

    it('Set the internationalization language', () => {
      let api = API();
      api.config.setLanguage('en');
      let p = api.parse('program { return (North) }');
      let r = p.program.interpret(emptyBoard(1, 1));
      expect(r.returnValue.value).equals('North');
    });

    it('Run an empty program - check final board', () => {
      let p = API().parse('program { }');
      let r = p.program.interpret(emptyBoard(3, 2));
      expect(r.finalBoard).deep.equals(
        {
          width: 3,
          height: 2,
          head: {x: 0, y: 0},
          table: [
            [ {}, {}, {} ],
            [ {}, {}, {} ],
          ]
        }
      );
      expect(r.returnValue).equals(null);
    });

    it('Run a simple program - check final board', () => {
      let p = API().parse([
        'program {',
        '  Poner(Azul)',
        '  Mover(Norte)',
        '  Poner(Negro)',
        '  Poner(Negro)',
        '  Mover(Este)',
        '  Poner(Rojo)',
        '  Poner(Rojo)',
        '  Poner(Rojo)',
        '  Mover(Sur)',
        '  Poner(Azul)',
        '  Poner(Negro)',
        '  Poner(Negro)',
        '  Poner(Rojo)',
        '  Poner(Rojo)',
        '  Poner(Rojo)',
        '  Poner(Verde)',
        '  Poner(Verde)',
        '  Poner(Verde)',
        '  Poner(Verde)',
        '}',
      ].join('\n'));
      let r = p.program.interpret(emptyBoard(3, 2));
      expect(r.finalBoard).deep.equals(
        {
          width: 3,
          height: 2,
          head: {x: 1, y: 0},
          table: [
            [ {black: 2}, {red: 3}, {} ],
            [ {blue: 1}, {blue: 1, black: 2, red: 3, green: 4}, {} ],
          ]
        }
      );
      expect(r.returnValue).equals(null);
    });

    it('Number return value', () => {
        let p = API().parse([
          'program {',
          '  return (12)',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        expect(r.returnValue.type).equals('Number');
        expect(r.returnValue.value).equals(12);
        expect(r.actualReturnValue).deep.equals(new ValueInteger(12));
    });

    it('Boolean return value', () => {
        let p = API().parse([
          'program {',
          '  return (True)',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        expect(r.returnValue.type).equals('Bool');
        expect(r.returnValue.value).equals(true);
        expect(r.actualReturnValue).deep.equals(
          new ValueStructure('Bool', 'True', {})
        );
    });

    it('String return value', () => {
        let p = API().parse([
          'program {',
          '  return ("hola")',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        expect(r.returnValue.type).equals('String');
        expect(r.returnValue.value).equals('hola');
        expect(r.actualReturnValue).deep.equals(new ValueString('hola'));
    });

    it('Direction return value', () => {
        let p = API().parse([
          'program {',
          '  return (Norte)',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        expect(r.returnValue.type).equals('Dir');
        expect(r.returnValue.value).equals('Norte');
        expect(r.actualReturnValue).deep.equals(
          new ValueStructure('Dir', 'Norte', {})
        );
    });

    it('Color return value', () => {
        let p = API().parse([
          'program {',
          '  return (Azul)',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        expect(r.returnValue.type).equals('Color');
        expect(r.returnValue.value).equals('Azul');
        expect(r.actualReturnValue).deep.equals(
          new ValueStructure('Color', 'Azul', {})
        );
    });

    it('Tuple return value', () => {
        let p = API().parse([
          'program {',
          '  return (1, "x")',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        expect(r.returnValue.type).equals('Tuple(Number, String)');
        expect(r.returnValue.value).deep.equals([1, 'x']);
        expect(r.actualReturnValue).deep.equals(
          new ValueTuple([
            new ValueInteger(1),
            new ValueString('x'),
          ])
        );
    });

    it('List return value', () => {
        let p = API().parse([
          'program {',
          '  return ([1, 2])',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        expect(r.returnValue.type).equals('List(Number)');
        expect(r.returnValue.value).deep.equals([1, 2]);
        expect(r.actualReturnValue).deep.equals(
          new ValueList([
            new ValueInteger(1),
            new ValueInteger(2),
          ])
        );
    });

    it('Run a program with a runtime error', () => {
      let p = API().parse('program { x := 1 div 0 }');
      let r = p.program.interpret(emptyBoard(1, 1));
      expect(r.reason.code).equals('cannot-divide-by-zero');
      expect(r.reason.detail).deep.equals([]);
      expect(r.on.range.start.row).equals(1);
      expect(r.on.range.start.column).equals(16);
      expect(r.on.range.end.row).equals(1);
      expect(r.on.range.end.column).equals(23);
    });

    it('Run a program with a user-triggered runtime error', () => {
      let p = API().parse('program { BOOM("foo") }');
      let r = p.program.interpret(emptyBoard(1, 1));
      expect(r.reason.code).equals('boom-called');
      expect(r.reason.detail).deep.equals(["foo"]);
      expect(r.message).equals("foo");
    });

    it('Run a program with a runtime error: report dynamic stack', () => {
      let p = API().parse([
        '/*@BEGIN_REGION@C@*/',
        'procedure Q() {',
        '  Sacar(Rojo)',
        '}',
        '/*@END_REGION@*/',
        '/*@BEGIN_REGION@B@*/',
        'procedure P() {',
        '  Q()',
        '}',
        '/*@END_REGION@*/',
        '/*@BEGIN_REGION@A@*/',
        'program {',
        '  P()',
        '}',
        '/*@END_REGION@*/',
      ].join('\n'));
      let r = p.program.interpret(emptyBoard(1, 1));
      expect(r.reason.code).equals('cannot-remove-stone');
      expect(r.on.region).equals('C');
      expect(r.on.regionStack).deep.equals(['A', 'B', 'C']);
    });

  });

  describe('Snapshots', () => {

    it('Take snapshots', () => {
        let p = API().parse([
          'procedure P() {',
          '  Poner(Azul)',
          '  Q()',
          '  Poner(Azul)',
          '}',
          'procedure Q() {',
          '  Poner(Azul)',
          '}',
          'program {',
          '  Poner(Verde)',
          '  P()',
          '  Poner(Verde)',
          '  P()',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        let s = r.snapshots
        expect(s.length).equals(9);

        expect(s[0].contextNames).deep.equals(['program']);
        expect(s[0].board.table[0][0]).deep.equals({});

        expect(s[1].contextNames).deep.equals(['program']);
        expect(s[1].board.table[0][0]).deep.equals({green: 1});

        expect(s[2].contextNames).deep.equals(['program', 'P-1']);
        expect(s[2].board.table[0][0]).deep.equals({green: 1, blue: 1});

        expect(s[3].contextNames).deep.equals(['program', 'P-1', 'Q-2']);
        expect(s[3].board.table[0][0]).deep.equals({green: 1, blue: 2});

        expect(s[4].contextNames).deep.equals(['program', 'P-1']);
        expect(s[4].board.table[0][0]).deep.equals({green: 1, blue: 3});

        expect(s[5].contextNames).deep.equals(['program']);
        expect(s[5].board.table[0][0]).deep.equals({green: 2, blue: 3});

        expect(s[6].contextNames).deep.equals(['program', 'P-3']);
        expect(s[6].board.table[0][0]).deep.equals({green: 2, blue: 4});

        expect(s[7].contextNames).deep.equals(['program', 'P-3', 'Q-4']);
        expect(s[7].board.table[0][0]).deep.equals({green: 2, blue: 5});

        expect(s[8].contextNames).deep.equals(['program', 'P-3']);
        expect(s[8].board.table[0][0]).deep.equals({green: 2, blue: 6});

    });

    it('Take snapshots on failing program', () => {
        let p = API().parse([
          'program {',
          '  Poner(Azul)',
          '  Poner(Azul)',
          '  Poner(Azul)',
          '  BOOM("stop")',
          '  Poner(Rojo)',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        expect(r.reason.code).equals('boom-called');
        let s = r.snapshots;
        expect(s.length).equals(4);
        expect(s[0].board.table[0][0]).deep.equals({});
        expect(s[1].board.table[0][0]).deep.equals({blue: 1});
        expect(s[2].board.table[0][0]).deep.equals({blue: 2});
        expect(s[3].board.table[0][0]).deep.equals({blue: 3});
    });

    it('Ignore snapshots inside an atomic routine', () => {
        let p = API().parse([
          'function f() {',
          '  Poner(Azul)',
          '  Poner(Azul)',
          '  Poner(Azul)',
          '  return (nroBolitas(Azul))',
          '}',
          'program {',
          '  n := f()',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        let s = r.snapshots
        expect(s.length).equals(1);

        expect(s[0].contextNames).deep.equals(['program']);
        expect(s[0].board.table[0][0]).deep.equals({});
    });

    it('Snapshots: report dynamic', () => {
        let p = API().parse([
          'procedure Q() {',
          '  Poner(Rojo)',
          '}',
          '',
          '/*@BEGIN_REGION@B@*/',
          'procedure P() {',
          '  Q()',
          '}',
          '/*@END_REGION@*/',
          '',
          '/*@BEGIN_REGION@A@*/',
          'program {',
          '  P()',
          '}',
          '/*@END_REGION@*/',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        let s = r.snapshots;
        expect(s.length).equals(2);
        expect(s[0].board.table[0][0]).deep.equals({});
        expect(s[1].board.table[0][0]).deep.equals({red: 1});
        expect(s[1].regionStack).deep.equals(['A', 'B', '']);
    });

  });

  describe('Interactive program', () => {

    it('Initialize interactive program without timeout', () => {
        let p = API().parse([
          'interactive program {',
          '  INIT -> {}',
          '  K_ARROW_LEFT -> {}',
          '  K_ENTER -> {}',
          '  _ -> {}',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        expect(r.keys).deep.equals(['K_ARROW_LEFT', 'K_ENTER']);
        expect(r.timeout).equals(null);
    });

    it('Initialize interactive program with timeout', () => {
        let p = API().parse([
          'interactive program {',
          '  K_ENTER -> {}',
          '  TIMEOUT(200) -> {}',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        expect(r.keys).deep.equals(['K_ENTER']);
        expect(r.timeout).equals(200);
    });

    it('Run interactive program without INIT', () => {
        let p = API().parse([
          'interactive program {',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        expect(r.onInit()).deep.equals({
          width: 1, height: 1, head: {x: 0, y: 0}, table: [[{}]]
        });
    });

    it('Run interactive program with INIT', () => {
        let p = API().parse([
          'interactive program {',
          '  INIT -> { Poner(Rojo) }',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        expect(r.onInit()).deep.equals({
          width: 1, height: 1, head: {x: 0, y: 0}, table: [[{red: 1}]]
        });
    });

    it('Run interactive program with INIT: fail', () => {
        let p = API().parse([
          'interactive program {',
          '  INIT -> { Mover(Sur) }',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        let s = r.onInit();
        expect(s.reason.code).equals('cannot-move-to');
        expect(s.reason.detail).deep.equals(['Sur']);
    });

    it('Run interactive program with INIT error: report dynamic stack', () => {
        let p = API().parse([
          '/*@BEGIN_REGION@B@*/',
          'procedure P() {',
          '  Sacar(Rojo)',
          '}',
          '/*@END_REGION@*/',
          '/*@BEGIN_REGION@A@*/',
          'interactive program {',
          '  INIT -> { P() }',
          '}',
          '/*@END_REGION@*/',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        let s = r.onInit();
        expect(s.on.region).equals('B');
        expect(s.on.regionStack).deep.equals(['A', 'B']);
    });

    it('Run interactive program with key events', () => {
        let p = API().parse([
          'interactive program {',
          '  K_A -> { Poner(Azul) }',
          '  K_B -> { Mover(Este) }',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(4, 1));
        expect(r.onKey('K_A')).deep.equals({
          width: 4, height: 1, head: {x: 0, y: 0}, table: [
            [{blue: 1}, {}, {}, {}]
          ]
        });
        expect(r.onKey('K_A')).deep.equals({
          width: 4, height: 1, head: {x: 0, y: 0}, table: [
            [{blue: 2}, {}, {}, {}]
          ]
        });
        expect(r.onKey('K_B')).deep.equals({
          width: 4, height: 1, head: {x: 1, y: 0}, table: [
            [{blue: 2}, {}, {}, {}]
          ]
        });
        expect(r.onKey('K_A')).deep.equals({
          width: 4, height: 1, head: {x: 1, y: 0}, table: [
            [{blue: 2}, {blue: 1}, {}, {}]
          ]
        });
    });

    it('Run interactive program with key events: fail', () => {
        let p = API().parse([
          'interactive program {',
          '  K_A -> { Sacar(Negro) }',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        expect(r.onInit()).deep.equals({
          width: 1, height: 1, head: {x: 0, y: 0}, table: [[{}]]
        });
        let s = r.onKey('K_A');
        expect(s.reason.code).equals('cannot-remove-stone');
        expect(s.reason.detail).deep.equals(['Negro']);
    });

    it(
      'Run interactive program with runtime error: report dynamic stack',
      () => {
        let p = API().parse([
          '/*@BEGIN_REGION@B@*/',
          'procedure P() {',
          '  Poner(Rojo)',
          '}',
          '/*@END_REGION@*/',
          '/*@BEGIN_REGION@C@*/',
          'procedure Q() {',
          '  Mover(Oeste)',
          '}',
          '/*@END_REGION@*/',
          '/*@BEGIN_REGION@A@*/',
          'interactive program {',
          '  K_A -> { P() Q() P() }',
          '}',
          '/*@END_REGION@*/',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        let s = r.onKey('K_A');
        expect(s.on.region).equals('C');
        expect(s.on.regionStack).deep.equals(['A', 'C']);
    });

    it('Run interactive program with default event', () => {
        let p = API().parse([
          'interactive program {',
          '  INIT -> { Poner(Azul) }',
          '  _    -> { Poner(Rojo) }',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        expect(r.onInit()).deep.equals({
          width: 1, height: 1, head: {x: 0, y: 0}, table: [[{blue: 1}]]
        });
        expect(r.onKey('K_A')).deep.equals({
          width: 1, height: 1, head: {x: 0, y: 0}, table: [[{blue: 1, red: 1}]]
        });
        expect(r.onKey('K_B')).deep.equals({
          width: 1, height: 1, head: {x: 0, y: 0}, table: [[{blue: 1, red: 2}]]
        });
    });

    it('Run interactive program without default event: fail', () => {
        let p = API().parse([
          'interactive program {',
          '  K_A -> { Poner(Azul) }',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        expect(r.onKey('K_A')).deep.equals({
          width: 1, height: 1, head: {x: 0, y: 0}, table: [[{blue: 1}]]
        });
        expect(r.onKey('K_B').reason.code).equals('switch-does-not-match');
    });

    it('Run interactive program without timeout', () => {
        let p = API().parse([
          'interactive program {',
          '  _ -> { Poner(Rojo) }',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        expect(r.onInit()).deep.equals({
          width: 1, height: 1, head: {x: 0, y: 0}, table: [[{}]]
        });
        expect(r.onTimeout()).deep.equals({
          width: 1, height: 1, head: {x: 0, y: 0}, table: [[{}]]
        });
        expect(r.onTimeout()).deep.equals({
          width: 1, height: 1, head: {x: 0, y: 0}, table: [[{}]]
        });
    });

    it('Run interactive program with timeout', () => {
        let p = API().parse([
          'interactive program {',
          '  TIMEOUT(100) -> { Poner(Verde) }',
          '  _ -> { Poner(Rojo) }',
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        expect(r.onInit()).deep.equals({
          width: 1, height: 1, head: {x: 0, y: 0}, table: [[{}]]
        });
        expect(r.onTimeout()).deep.equals({
          width: 1, height: 1, head: {x: 0, y: 0}, table: [[{green: 1}]]
        });
        expect(r.onTimeout()).deep.equals({
          width: 1, height: 1, head: {x: 0, y: 0}, table: [[{green: 2}]]
        });
    });

  });

  describe('Board format conversion', () => {

    it('GBB to apiboard', () => {
      let board = API().gbb.read([
        'GBB/1.0',
        'size 6 3',
        'cell 3 1 Rojo 10 Negro 4',
        'cell 5 2 Azul 2',
        'cell 4 2 Azul 1',
        'head 5 2',
      ].join('\n'));
      expect(board).deep.equals({
        width: 6, height: 3,
        head: {x: 5, y: 2},
        table: [
          [{}, {}, {}, {}, {blue: 1}, {blue: 2}],
          [{}, {}, {}, {black: 4, red: 10}, {}, {}],
          [{}, {}, {}, {}, {}, {}],
        ]
      });
    });

    it('GBB to apiboard: allow Window newlines', () => {
        let board = API().gbb.read('GBB/1.0\r\nsize 1 1');
       expect(board).deep.equals({
         width: 1, height: 1,
         head: {x: 0, y: 0},
         table: [[{}]]
       });
    });

    it('GBB to apiboard: wider-than-taller boards', () => {
        let board = API().gbb.read([
          'GBB/1.0',
          'size 2 1',
          'cell 0 0 Azul 1',
          'cell 1 0 Rojo 1',
        ].join('\n'));
       expect(board).deep.equals({
         width: 2, height: 1,
         head: {x: 0, y: 0},
         table: [[{blue: 1}, {red: 1}]]
       });
    });

    it('GBB to apiboard: taller-than-wider boards', () => {
        let board = API().gbb.read([
          'GBB/1.0',
          'size 1 2',
          'cell 0 0 Azul 1',
          'cell 0 1 Rojo 1',
        ].join('\n'));
       expect(board).deep.equals({
         width: 1, height: 2,
         head: {x: 0, y: 0},
         table: [[{red: 1}], [{blue: 1}]]
       });
    });

    it('Apiboard to GBB', () => {
      let apiboard = {
        width: 6, height: 3,
        head: {x: 3, y: 1},
        table: [
          [{red: 3}, {}, {green: 2}, {}, {blue: 3, red: 1}, {}],
          [{}, {red: 2}, {black: 2}, {}, {blue: 2}, {green: 1}],
          [{}, {}, {green: 3}, {}, {black: 3}, {blue: 1}],
        ]
      };
      let api = API();
      expect(api.gbb.read(api.gbb.write(apiboard))).deep.equals(apiboard);
    });

    it('Apiboard to GBB with big board', () => {
      let apiboard = {
        width: 8, height: 8,
        head: {x: 0, y: 0},
        table: [
          [{}, {}, {}, {}, {}, {}, {}, {}],
          [{}, {}, {}, {}, {}, {}, {}, {}],
          [{}, {}, {}, {}, {}, {}, {}, {}],
          [{}, {}, {}, {}, {}, {}, {}, {}],
          [{}, {}, {}, {}, {}, {}, {}, {}],
          [{}, {}, {}, {}, {}, {}, {}, {}],
          [{}, {}, {}, {}, {}, {}, {}, {}],
          [{}, {}, {}, {}, {}, {}, {}, {}],
        ]
      };
      let api = API();
      let p = api.parse('program { Mover(Norte) }');
      let r = p.program.interpret(apiboard);
      expect(r.finalBoard).deep.equals({
          width: 8, height: 8,
          head: {x: 0, y: 1},
          table: [
            [{}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}],
          ]
      });
    });

  });

  describe('Internationalization', () => {

    it('Allow arbitrary names for TYPE:Color', () => {
      let api = API();
      api.config.setLanguage('pt');
      let p = api.parse('program { Colocar(Vermelho) }');
      let r = p.program.interpret(emptyBoard(1, 1));
      expect(r.finalBoard).deep.equals({
          width: 1, height: 1,
          head: {x: 0, y: 0},
          table: [[{red: 1}]]
      });
    });

  });

});

