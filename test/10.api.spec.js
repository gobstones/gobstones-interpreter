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
        expect(r.returnValue.value).equals('(1, "x")');
        expect(r.actualReturnValue).deep.equals(
          new ValueTuple([
            new ValueInteger(1),
            new ValueString('x'),
          ])
        );
    });

  });

  describe('Snapshots', () => {

    it('Snapshots', () => {
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
          '}',
        ].join('\n'));
        let r = p.program.interpret(emptyBoard(1, 1));
        let s = r.snapshots
        expect(s.length).equals(7);

        expect(s[0].contextNames).deep.equals(['program']);
        expect(s[0].board.table[0][0]).deep.equals({});

        expect(s[1].contextNames).deep.equals(['program']);
        expect(s[1].board.table[0][0]).deep.equals({green: 1});

        expect(s[2].contextNames).deep.equals(['program', 'P-1']);
        expect(s[2].board.table[0][0]).deep.equals({green: 1, blue: 1});

        expect(s[3].contextNames).deep.equals(['program', 'P-2', 'Q-3']);
        expect(s[3].board.table[0][0]).deep.equals({green: 1, blue: 2});

        expect(s[4].contextNames).deep.equals(['program', 'P-4']);
        expect(s[4].board.table[0][0]).deep.equals({green: 1, blue: 3});

        expect(s[5].contextNames).deep.equals(['program']);
        expect(s[5].board.table[0][0]).deep.equals({green: 2, blue: 3});

        expect(s[6].contextNames).deep.equals(['program']);
        expect(s[6].board.table[0][0]).deep.equals({green: 2, blue: 3});
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
        expect(s.length).equals(2);

        expect(s[0].contextNames).deep.equals(['program']);
        expect(s[0].board.table[0][0]).deep.equals({});

        expect(s[1].contextNames).deep.equals(['program']);
        expect(s[1].board.table[0][0]).deep.equals({});
    });

  });

});

