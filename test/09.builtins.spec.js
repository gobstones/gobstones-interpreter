import chai from 'chai';

import {
  typesWithOrder,
  typesWithOpposite,
} from '../src/runtime';
import { Runner } from '../src/runner';
import { i18n } from '../src/i18n';

import {
  ValueInteger,
  ValueString,
  ValueTuple,
  ValueList,
  ValueStructure,
  TypeAny,
  TypeInteger,
  TypeString,
  TypeTuple,
  TypeList,
  TypeStructure,
} from '../src/value';
chai.expect();
const expect = chai.expect;

describe('Primitive functions, procedures and operators', () => {

  function compareInteger(op) {
    return [
      'program {',
      '  return (',
      '     0 ' + op + ' 1,',
      '    19 ' + op + ' 20,',
      '    15 ' + op + ' 15,',
      '    -1 ' + op + ' -1,',
      '     0 ' + op + ' -1,',
      '    20 ' + op + ' 10',
      '  )',
      '}',
    ].join('\n');
  }

  function compareBool(op) {
    return [
      'program {',
      '  return (',
      '    ' + i18n('CONS:False') + op + i18n('CONS:True') + ',',
      '    ' + i18n('CONS:False') + op + i18n('CONS:True') + ',',
      '    ' + i18n('CONS:False') + op + i18n('CONS:False') + ',',
      '    ' + i18n('CONS:True') + op + i18n('CONS:True') + ',',
      '    ' + i18n('CONS:True') + op + i18n('CONS:False') + ',',
      '    ' + i18n('CONS:True') + op + i18n('CONS:False'),
      '  )',
      '}',
    ].join('\n');
  }

  function compareColor(op) {
    return [
      'program {',
      '  return (',
      '    ' + i18n('CONS:Color0') + op + i18n('CONS:Color1') + ',',
      '    ' + i18n('CONS:Color2') + op + i18n('CONS:Color3') + ',',
      '    ' + i18n('CONS:Color0') + op + i18n('CONS:Color0') + ',',
      '    ' + i18n('CONS:Color1') + op + i18n('CONS:Color1') + ',',
      '    ' + i18n('CONS:Color2') + op + i18n('CONS:Color1') + ',',
      '    ' + i18n('CONS:Color3') + op + i18n('CONS:Color0'),
      '  )',
      '}',
    ].join('\n');
  }

  function compareDir(op) {
    return [
      'program {',
      '  return (',
      '    ' + i18n('CONS:Dir0') + op + i18n('CONS:Dir2') + ',',
      '    ' + i18n('CONS:Dir1') + op + i18n('CONS:Dir3') + ',',
      '    ' + i18n('CONS:Dir2') + op + i18n('CONS:Dir2') + ',',
      '    ' + i18n('CONS:Dir3') + op + i18n('CONS:Dir3') + ',',
      '    ' + i18n('CONS:Dir1') + op + i18n('CONS:Dir0') + ',',
      '    ' + i18n('CONS:Dir3') + op + i18n('CONS:Dir1'),
      '  )',
      '}',
    ].join('\n');
  }

  function compareFail(op) {
    return [
      'program {',
      '  return ("foo" ' + op + ' "bar")',
      '}',
    ].join('\n');
  }

  function compareMismatch(op) {
    return [
      'program {',
      '  return (1 ' + op + i18n('CONS:True') + ')',
      '}',
    ].join('\n');
  }

  const comparisonResultLE =
    new ValueTuple([
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
    ]);

  const comparisonResultGE =
    new ValueTuple([
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
    ]);

  const comparisonResultLT =
    new ValueTuple([
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
    ]);

  const comparisonResultGT =
    new ValueTuple([
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
      new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
    ]);

  describe('Relational operators', () => {

    describe('Equality (==)', () => {

      it('Integer', () => {
        let result = new Runner().run([
          'program {',
          '  return (' +
          '    0 == (0),',
          '    0 == 1,',
          '    0 == -1,',
          '    1 == 0,',
          '    1 == 1,',
          '    1 == -1,',
          '    -1 == 0,',
          '    -1 == 1,',
          '    -1 == -1,',
          '    -0 == -0,',
          '    1000000000000000000000 - 1 == 999999999999999999999,',
          '    1000000000000000000000 == 999999999999999999999',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(new ValueTuple([
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
        ]));
      });

      it('String', () => {
        let result = new Runner().run([
          'program {',
          '  return (' +
          '    "" == "",',
          '    "" == "foo",',
          '    "" == "bar",',
          '    "foo" == "",',
          '    "foo" == "foo",',
          '    "foo" == "bar",',
          '    "bar" == "",',
          '    "bar" == "foo",',
          '    "bar" == "bar",',
          '    "\\a" == "\\a"',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(new ValueTuple([
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
        ]));
      });

      it('String', () => {
        let result = new Runner().run([
          'program {',
          '  return (' +
          '    "" == "",',
          '    "" == "foo",',
          '    "" == "bar",',
          '    "foo" == "",',
          '    "foo" == "foo",',
          '    "foo" == "bar",',
          '    "bar" == "",',
          '    "bar" == "foo",',
          '    "bar" == "bar",',
          '    "\\a" == "\\a"',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(new ValueTuple([
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
        ]));
      });

      it('Tuple', () => {
        let result = new Runner().run([
          'program {',
          '  return (' +
          '    () == (),',
          '    (1,2) == (1,2),',
          '    (1,2) == (2,1),',
          '    (1,2,3) == (1,2,3),',
          '    (1,2,3) == (2,2,3),',
          '    (1,2,3) == (1,3,4),',
          '    (1,2,3) == (1,2,4),',
          '    (1,2,"foo") == (1,2,"foo"),',
          '    (1,2,"foo") == (1,2,"bar")',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(new ValueTuple([
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
        ]));
      });

      it('List', () => {
        let result = new Runner().run([
          'program {',
          '  return (' +
          '    [] == [],',
          '    [] == [1],',
          '    [] == [1,2,3],',
          '    [] == [1,3,2],',
          '    [1] == [],',
          '    [1] == [1],',
          '    [1] == [1,2,3],',
          '    [1] == [1,3,2],',
          '    [1,2,3] == [],',
          '    [1,2,3] == [1],',
          '    [1,2,3] == [1,2,3],',
          '    [1,2,3] == [1,3,2],',
          '    [1,3,2] == [],',
          '    [1,3,2] == [1],',
          '    [1,3,2] == [1,2,3],',
          '    [1,3,2] == [1,3,2]',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(new ValueTuple([
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
        ]));
      });

      it('Structure', () => {
        let result = new Runner().run([
          'type A is variant {',
          '  case B {',
          '    field a',
          '    field b',
          '  }',
          '  case C {',
          '    field a',
          '    field b',
          '  }',
          '  case D {',
          '  }',
          '}',
          'program {',
          '  return (',
          '    D == D,',
          '    D == D(),',
          '    B(a <- 1, b <- 2) == B(a <- 1, b <- 2),',
          '    B(a <- 1, b <- 2) == B(b <- 2, a <- 1),',
          '    B(a <- 1, b <- 2) == B(a <- 1, b <- 3),',
          '    B(a <- 1, b <- 2) == B(a <- 2, b <- 1),',
          '    B(a <- 1, b <- 2) == C(a <- 1, b <- 2),',
          '    B(a <- 1, b <- 2) == D',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(new ValueTuple([
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
        ]));
      });

      it('Fail if types do not match', () => {
        let result = () => new Runner().run([
          'type A is record {',
          '}',
          'type B is record {',
          '}',
          'program {',
          '  return (A == B)',
          '}',
        ].join('\n'));
        expect(result).throws(
          i18n('errmsg:expected-values-to-have-compatible-types')(
            new ValueStructure('A', 'A', {}).type(),
            new ValueStructure('B', 'B', {}).type(),
          )
        );
      });

    });

    describe('Disequality (/=)', () => {

      it('Disequality for values', () => {
        let result = new Runner().run([
          'type A is record {',
          '  field a',
          '}',
          'program {',
          '  return (',
          '    0 /= 0,',
          '    0 /= 1,',
          '    "foo" /= "foo",',
          '    "foo" /= "bar",',
          '    () /= (),',
          '    (1,2,3) /= (1,3,2),',
          '    [1,2,3] /= [1,2,3],',
          '    [1,2,3] /= [],',
          '    A(a <- 1) /= A(a <- 1),',
          '    A(a <- 1) /= A(a <- 2)',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(
          new ValueTuple([
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          ])
        );
      });

      it('Fail if types do not match', () => {
        let result = () => new Runner().run([
          'program {',
          '  return (() /= (1,2,3))',
          '}',
        ].join('\n'));
        expect(result).throws(
          i18n('errmsg:expected-values-to-have-compatible-types')(
            new TypeTuple([]),
            new TypeTuple([
              new TypeInteger(),
              new TypeInteger(),
              new TypeInteger(),
            ]),
          )
        );
      });

    });

    describe('Lesser or equal than (<=)', () => {

      it('Integer', () => {
        let result = new Runner().run(compareInteger('<='));
        expect(result).deep.equals(comparisonResultLE);
      });

      it('Bool', () => {
        let result = new Runner().run(compareBool('<='));
        expect(result).deep.equals(comparisonResultLE);
      });

      it('Color', () => {
        let result = new Runner().run(compareColor('<='));
        expect(result).deep.equals(comparisonResultLE);
      });

      it('Dir', () => {
        let result = new Runner().run(compareDir('<='));
        expect(result).deep.equals(comparisonResultLE);
      });

      it('Fail for other types', () => {
        let result = () => new Runner().run(compareFail('<='));
        expect(result).throws(
          i18n('errmsg:expected-value-of-some-type-but-got')(
            typesWithOrder(),
            new TypeString()
          )
        );
      });

      it('Fail if types do not match', () => {
        let result = () => new Runner().run(compareMismatch('<='));
        expect(result).throws(
          i18n('errmsg:expected-values-to-have-compatible-types')(
            new TypeInteger(),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}).type()
          )
        );
      });

    });

    describe('Greater or equal than (>=)', () => {

      it('Integer', () => {
        let result = new Runner().run(compareInteger('>='));
        expect(result).deep.equals(comparisonResultGE);
      });

      it('Bool', () => {
        let result = new Runner().run(compareBool('>='));
        expect(result).deep.equals(comparisonResultGE);
      });

      it('Color', () => {
        let result = new Runner().run(compareColor('>='));
        expect(result).deep.equals(comparisonResultGE);
      });

      it('Dir', () => {
        let result = new Runner().run(compareDir('>='));
        expect(result).deep.equals(comparisonResultGE);
      });

      it('Fail for other types', () => {
        let result = () => new Runner().run(compareFail('>='));
        expect(result).throws(
          i18n('errmsg:expected-value-of-some-type-but-got')(
            typesWithOrder(),
            new TypeString()
          )
        );
      });

      it('Fail if types do not match', () => {
        let result = () => new Runner().run(compareMismatch('>='));
        expect(result).throws(
          i18n('errmsg:expected-values-to-have-compatible-types')(
            new TypeInteger(),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}).type()
          )
        );
      });

    });

    describe('Lesser than (<)', () => {

      it('Integer', () => {
        let result = new Runner().run(compareInteger('<'));
        expect(result).deep.equals(comparisonResultLT);
      });

      it('Bool', () => {
        let result = new Runner().run(compareBool('<'));
        expect(result).deep.equals(comparisonResultLT);
      });

      it('Color', () => {
        let result = new Runner().run(compareColor('<'));
        expect(result).deep.equals(comparisonResultLT);
      });

      it('Dir', () => {
        let result = new Runner().run(compareDir('<'));
        expect(result).deep.equals(comparisonResultLT);
      });

      it('Fail for other types', () => {
        let result = () => new Runner().run(compareFail('<'));
        expect(result).throws(
          i18n('errmsg:expected-value-of-some-type-but-got')(
            typesWithOrder(),
            new TypeString()
          )
        );
      });

      it('Fail if types do not match', () => {
        let result = () => new Runner().run(compareMismatch('<'));
        expect(result).throws(
          i18n('errmsg:expected-values-to-have-compatible-types')(
            new TypeInteger(),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}).type()
          )
        );
      });

    });

    describe('Greater than (>)', () => {

      it('Integer', () => {
        let result = new Runner().run(compareInteger('>'));
        expect(result).deep.equals(comparisonResultGT);
      });

      it('Bool', () => {
        let result = new Runner().run(compareBool('>'));
        expect(result).deep.equals(comparisonResultGT);
      });

      it('Color', () => {
        let result = new Runner().run(compareColor('>'));
        expect(result).deep.equals(comparisonResultGT);
      });

      it('Dir', () => {
        let result = new Runner().run(compareDir('>'));
        expect(result).deep.equals(comparisonResultGT);
      });

      it('Fail for other types', () => {
        let result = () => new Runner().run(compareFail('>'));
        expect(result).throws(
          i18n('errmsg:expected-value-of-some-type-but-got')(
            typesWithOrder(),
            new TypeString()
          )
        );
      });

      it('Fail if types do not match', () => {
        let result = () => new Runner().run(compareMismatch('>'));
        expect(result).throws(
          i18n('errmsg:expected-values-to-have-compatible-types')(
            new TypeInteger(),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}).type()
          )
        );
      });

    });

  });

  describe('Built-in polymorphic functions', () => {

    describe('Next', () => {

      it('Integer', () => {
        let result = new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:next') + '(-3),',
          '    ' + i18n('PRIM:next') + '(-2),',
          '    ' + i18n('PRIM:next') + '(-1),',
          '    ' + i18n('PRIM:next') + '(0),',
          '    ' + i18n('PRIM:next') + '(1),',
          '    ' + i18n('PRIM:next') + '(2),',
          '    ' + i18n('PRIM:next') + '(3)',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(
          new ValueTuple([
            new ValueInteger(-2),
            new ValueInteger(-1),
            new ValueInteger(0),
            new ValueInteger(1),
            new ValueInteger(2),
            new ValueInteger(3),
            new ValueInteger(4),
          ])
        );
      });

      it('Bool', () => {
        let result = new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:next') + '(' + i18n('CONS:False') + '),',
          '    ' + i18n('PRIM:next') + '(' + i18n('CONS:True') + ')',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(
          new ValueTuple([
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          ])
        );
      });

      it('Color', () => {
        let result = new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:next') + '(' + i18n('CONS:Color0') + '),',
          '    ' + i18n('PRIM:next') + '(' + i18n('CONS:Color1') + '),',
          '    ' + i18n('PRIM:next') + '(' + i18n('CONS:Color2') + '),',
          '    ' + i18n('PRIM:next') + '(' + i18n('CONS:Color3') + ')',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(
          new ValueTuple([
            new ValueStructure(i18n('TYPE:Color'), i18n('CONS:Color1'), {}),
            new ValueStructure(i18n('TYPE:Color'), i18n('CONS:Color2'), {}),
            new ValueStructure(i18n('TYPE:Color'), i18n('CONS:Color3'), {}),
            new ValueStructure(i18n('TYPE:Color'), i18n('CONS:Color0'), {}),
          ])
        );
      });

      it('Dir', () => {
        let result = new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:next') + '(' + i18n('CONS:Dir0') + '),',
          '    ' + i18n('PRIM:next') + '(' + i18n('CONS:Dir1') + '),',
          '    ' + i18n('PRIM:next') + '(' + i18n('CONS:Dir2') + '),',
          '    ' + i18n('PRIM:next') + '(' + i18n('CONS:Dir3') + ')',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(
          new ValueTuple([
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir1'), {}),
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir2'), {}),
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir3'), {}),
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir0'), {}),
          ])
        );
      });

      it('Fail for other types', () => {
        let result = () => new Runner().run([
          'program {',
          '  return (' + i18n('PRIM:next') + '([]))',
          '}',
        ].join('\n'));
        expect(result).throws(
          i18n('errmsg:expected-value-of-some-type-but-got')(
            typesWithOrder(),
            new TypeList(new TypeAny())
          )
        );
      });

    });

    describe('Prev', () => {

      it('Integer', () => {
        let result = new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:prev') + '(-3),',
          '    ' + i18n('PRIM:prev') + '(-2),',
          '    ' + i18n('PRIM:prev') + '(-1),',
          '    ' + i18n('PRIM:prev') + '(0),',
          '    ' + i18n('PRIM:prev') + '(1),',
          '    ' + i18n('PRIM:prev') + '(2),',
          '    ' + i18n('PRIM:prev') + '(3)',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(
          new ValueTuple([
            new ValueInteger(-4),
            new ValueInteger(-3),
            new ValueInteger(-2),
            new ValueInteger(-1),
            new ValueInteger(0),
            new ValueInteger(1),
            new ValueInteger(2),
          ])
        );
      });

      it('Bool', () => {
        let result = new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:prev') + '(' + i18n('CONS:False') + '),',
          '    ' + i18n('PRIM:prev') + '(' + i18n('CONS:True') + ')',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(
          new ValueTuple([
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          ])
        );
      });

      it('Color', () => {
        let result = new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:prev') + '(' + i18n('CONS:Color0') + '),',
          '    ' + i18n('PRIM:prev') + '(' + i18n('CONS:Color1') + '),',
          '    ' + i18n('PRIM:prev') + '(' + i18n('CONS:Color2') + '),',
          '    ' + i18n('PRIM:prev') + '(' + i18n('CONS:Color3') + ')',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(
          new ValueTuple([
            new ValueStructure(i18n('TYPE:Color'), i18n('CONS:Color3'), {}),
            new ValueStructure(i18n('TYPE:Color'), i18n('CONS:Color0'), {}),
            new ValueStructure(i18n('TYPE:Color'), i18n('CONS:Color1'), {}),
            new ValueStructure(i18n('TYPE:Color'), i18n('CONS:Color2'), {}),
          ])
        );
      });

      it('Dir', () => {
        let result = new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:prev') + '(' + i18n('CONS:Dir0') + '),',
          '    ' + i18n('PRIM:prev') + '(' + i18n('CONS:Dir1') + '),',
          '    ' + i18n('PRIM:prev') + '(' + i18n('CONS:Dir2') + '),',
          '    ' + i18n('PRIM:prev') + '(' + i18n('CONS:Dir3') + ')',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(
          new ValueTuple([
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir3'), {}),
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir0'), {}),
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir1'), {}),
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir2'), {}),
          ])
        );
      });

      it('Fail for other types', () => {
        let result = () => new Runner().run([
          'program {',
          '  return (' + i18n('PRIM:prev') + '([]))',
          '}',
        ].join('\n'));
        expect(result).throws(
          i18n('errmsg:expected-value-of-some-type-but-got')(
            typesWithOrder(),
            new TypeList(new TypeAny())
          )
        );
      });

    });

    describe('Opposite', () => {

      it('Integer', () => {
        let result = new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:opposite') + '(-3),',
          '    ' + i18n('PRIM:opposite') + '(-2),',
          '    ' + i18n('PRIM:opposite') + '(-1),',
          '    ' + i18n('PRIM:opposite') + '(0),',
          '    ' + i18n('PRIM:opposite') + '(1),',
          '    ' + i18n('PRIM:opposite') + '(2),',
          '    ' + i18n('PRIM:opposite') + '(3)',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(
          new ValueTuple([
            new ValueInteger(3),
            new ValueInteger(2),
            new ValueInteger(1),
            new ValueInteger(0),
            new ValueInteger(-1),
            new ValueInteger(-2),
            new ValueInteger(-3),
          ])
        );
      });

      it('Bool', () => {
        let result = new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:opposite') + '(' + i18n('CONS:False') + '),',
          '    ' + i18n('PRIM:opposite') + '(' + i18n('CONS:True') + ')',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(
          new ValueTuple([
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          ])
        );
      });

      it('Dir', () => {
        let result = new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:opposite') + '(' + i18n('CONS:Dir0') + '),',
          '    ' + i18n('PRIM:opposite') + '(' + i18n('CONS:Dir1') + '),',
          '    ' + i18n('PRIM:opposite') + '(' + i18n('CONS:Dir2') + '),',
          '    ' + i18n('PRIM:opposite') + '(' + i18n('CONS:Dir3') + ')',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(
          new ValueTuple([
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir2'), {}),
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir3'), {}),
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir0'), {}),
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir1'), {}),
          ])
        );
      });

      it('Fail for other types', () => {
        let result = () => new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:opposite') + '(' + i18n('CONS:Color0') + ')',
          '  )',
          '}',
        ].join('\n'));
        expect(result).throws();
      });

    });

    describe('Unary minus', () => {

      it('Integer', () => {
        let result = new Runner().run([
          'program {',
          '  a := -42',
          '  b := 0',
          '  c := 42',
          '  return (-a, -b, -c)',
          '}',
        ].join('\n'));
        expect(result).deep.equals(
          new ValueTuple([
            new ValueInteger(42),
            new ValueInteger(0),
            new ValueInteger(-42),
          ])
        );
      });

      it('Bool', () => {
        let result = new Runner().run([
          'program {',
          '  a := ' + i18n('CONS:True'),
          '  b := ' + i18n('CONS:False'),
          '  return (-a, -b)',
          '}',
        ].join('\n'));
        expect(result).deep.equals(
          new ValueTuple([
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          ])
        );
      });

      it('Dir', () => {
        let result = new Runner().run([
          'program {',
          '  a := ' + i18n('CONS:Dir0'),
          '  b := ' + i18n('CONS:Dir1'),
          '  c := ' + i18n('CONS:Dir2'),
          '  d := ' + i18n('CONS:Dir3'),
          '  return (-a, -b, -c, -d)',
          '}',
        ].join('\n'));
        expect(result).deep.equals(
          new ValueTuple([
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir2'), {}),
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir3'), {}),
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir0'), {}),
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir1'), {}),
          ])
        );
      });

      it('Fail for other types', () => {
        let result = () => new Runner().run([
          'program {',
          '  return (-())',
          '}',
        ].join('\n'));
        expect(result).throws(
          i18n('errmsg:expected-value-of-some-type-but-got')(
            typesWithOpposite(),
            new TypeTuple([])
          )
        );
      });

    });

  });

  describe('max/min Bool/Dir/Color', () => {

    it('max/min Bool/Dir/Color', () => {
      let result = new Runner().run([
        'program {',
        '  return (',
        '    ' + i18n('PRIM:minBool') + '(),',
        '    ' + i18n('PRIM:maxBool') + '(),',
        '    ' + i18n('PRIM:minColor') + '(),',
        '    ' + i18n('PRIM:maxColor') + '(),',
        '    ' + i18n('PRIM:minDir') + '(),',
        '    ' + i18n('PRIM:maxDir') + '()',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Color'), i18n('CONS:Color0'), {}),
          new ValueStructure(i18n('TYPE:Color'), i18n('CONS:Color3'), {}),
          new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir0'), {}),
          new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir3'), {}),
        ])
      );
    });
  });
    
  describe('Logical operators', () => {
    /* Note: conjunction and disjunction are checked in 07.compiler.spec.js
     * since they are treated distinctly, for they are short-circuiting.
     */
    it('Negation', () => {
      let result = new Runner().run([
        'program {',
        '  return (',
        '    not ' + i18n('CONS:False') + ',',
        '    not ' + i18n('CONS:True') + ',',
        '    not not ' + i18n('CONS:False') + ',',
        '    not not ' + i18n('CONS:True'),
        '  )',
        '}',
      ].join('\n'));

      expect(result).deep.equals(
        new ValueTuple([
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
        ])
      );

    });

    it('Negation: check type', () => {
      let result = () => new Runner().run([
        'program {',
        '  return (not 1)',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:primitive-argument-type-mismatch')(
          'not',
          1,
          1,
          new TypeStructure(i18n('TYPE:Bool'), {}),
          new TypeInteger(),
        )
      );
    });

  });

  describe('Arithmetic operators', () => {

    it('Addition', () => {
      let result = new Runner().run([
        'program {',
        '  return (',
        '    0 + 0,',
        '    0 + 1,',
        '    0 + 2,',
        '    1 + 1,',
        '    3 + 2,',
        '    2 + 3,',
        '    1 + -3,',
        '    -3 + -1,',
        '    839708017193356897142867 + 1248806268977307630139540',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueTuple([
        new ValueInteger('0'),
        new ValueInteger('1'),
        new ValueInteger('2'),
        new ValueInteger('2'),
        new ValueInteger('5'),
        new ValueInteger('5'),
        new ValueInteger('2').negate(),
        new ValueInteger('4').negate(),
        new ValueInteger('2088514286170664527282407')
      ]));
    });

    it('Addition: check types of arguments', () => {
      let result = () => new Runner().run([
        'program {',
        '  return (1 + "")',
        '}',
      ].join('\n'));
      expect(result).throws();
    });

    it('Subtraction', () => {
      let result = new Runner().run([
        'program {',
        '  return (',
        '    0 - 0,',
        '    0 - 1,',
        '    0 - 2,',
        '    2 - 0,',
        '    2 - 1,',
        '    2 - 3,',
        '    0 - -1,',
        '    0 - -2,',
        '    -2 - 1,',
        '    -2 - -1,',
        '    839708017193356897142867 - 1248806268977307630139540',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueTuple([
        new ValueInteger('0'),
        new ValueInteger('1').negate(),
        new ValueInteger('2').negate(),
        new ValueInteger('2'),
        new ValueInteger('1'),
        new ValueInteger('1').negate(),
        new ValueInteger('1'),
        new ValueInteger('2'),
        new ValueInteger('3').negate(),
        new ValueInteger('1').negate(),
        new ValueInteger('409098251783950732996673').negate()
      ]));
    });

    it('Multiplication', () => {
      let result = new Runner().run([
        'program {',
        '  return (',
        '    1 * 1,',
        '    2 * 2,',
        '    2 * -3,',
        '    -2 * 3,',
        '    -2 * -3,',
        '    0 * 0,',
        '    0 * 1,',
        '    0 * -1,',
        '    9 * 4,',
        '    4 * 9,',
        '    839708017193356897142867 * 1248806268977307630139540',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueTuple([
        new ValueInteger('1'),
        new ValueInteger('4'),
        new ValueInteger('6').negate(),
        new ValueInteger('6').negate(),
        new ValueInteger('6'),
        new ValueInteger('0'),
        new ValueInteger('0'),
        new ValueInteger('0'),
        new ValueInteger('36'),
        new ValueInteger('36'),
        new ValueInteger('1048632635981568913405455338700366140602525661180'),
      ]));
    });

    it('Division', () => {
      let result = new Runner().run([
        'program {',
        '  return (',
        '    0 div 1,',
        '    0 div 2,',
        /* Positive / positive */
        '    10 div 1, 10 div 2, 10 div 3, 10 div 4, 10 div 5,',
        '    10 div 6, 10 div 7, 10 div 8, 10 div 9, 10 div 10,',
        '    10 div 11,',
        /* Positive / negative */
        '    10 div -1, 10 div -2, 10 div -3, 10 div -4, 10 div -5,',
        '    10 div -6, 10 div -7, 10 div -8, 10 div -9, 10 div -10,',
        '    10 div -11,',
        /* Negative / positive */
        '    -10 div 1, -10 div 2, -10 div 3, -10 div 4, -10 div 5,',
        '    -10 div 6, -10 div 7, -10 div 8, -10 div 9, -10 div 10,',
        '    -10 div 11,',
        /* Negative / negative */
        '    -10 div -1, -10 div -2, -10 div -3, -10 div -4, -10 div -5,',
        '    -10 div -6, -10 div -7, -10 div -8, -10 div -9, -10 div -10,',
        '    -10 div -11,',
        /* Big */
        '    1248806268977307630139540 div 831719335689717',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueTuple([
        new ValueInteger('0'),
        new ValueInteger('0'),
        /* Positive / positive */
        new ValueInteger('10'), new ValueInteger('5'),
        new ValueInteger('3'), new ValueInteger('2'),
        new ValueInteger('2'), new ValueInteger('1'),
        new ValueInteger('1'), new ValueInteger('1'),
        new ValueInteger('1'), new ValueInteger('1'),
        new ValueInteger('0'),
        /* Positive / negative */
        new ValueInteger('-10'), new ValueInteger('-5'),
        new ValueInteger('-4'), new ValueInteger('-3'),
        new ValueInteger('-2'), new ValueInteger('-2'),
        new ValueInteger('-2'), new ValueInteger('-2'),
        new ValueInteger('-2'), new ValueInteger('-1'),
        new ValueInteger('-1'),
        /* Negative / positive */
        new ValueInteger('-10'), new ValueInteger('-5'),
        new ValueInteger('-4'), new ValueInteger('-3'),
        new ValueInteger('-2'), new ValueInteger('-2'),
        new ValueInteger('-2'), new ValueInteger('-2'),
        new ValueInteger('-2'), new ValueInteger('-1'),
        new ValueInteger('-1'),
        /* Negative / negative */
        new ValueInteger('10'), new ValueInteger('5'),
        new ValueInteger('3'), new ValueInteger('2'),
        new ValueInteger('2'), new ValueInteger('1'),
        new ValueInteger('1'), new ValueInteger('1'),
        new ValueInteger('1'), new ValueInteger('1'),
        new ValueInteger('0'),
        /* Big */
        new ValueInteger('1501475576'),
      ]));
    });

    it('Fail on zero division for div', () => {
      let result = () => new Runner().run([
        'program {',
        '  return (1 div 0)',
        '}'
      ].join('\n'));
      expect(result).throws(i18n('errmsg:cannot-divide-by-zero'));
    });

    it('Modulo', () => {
      let result = new Runner().run([
        'program {',
        '  return (',
        '    0 mod 1,',
        '    0 mod 2,',
        /* Positive / positive */
        '    10 mod 1, 10 mod 2, 10 mod 3, 10 mod 4, 10 mod 5,',
        '    10 mod 6, 10 mod 7, 10 mod 8, 10 mod 9, 10 mod 10,',
        '    10 mod 11,',
        /* Positive / negative */
        '    10 mod -1, 10 mod -2, 10 mod -3, 10 mod -4, 10 mod -5,',
        '    10 mod -6, 10 mod -7, 10 mod -8, 10 mod -9, 10 mod -10,',
        '    10 mod -11,',
        /* Negative / positive */
        '    -10 mod 1, -10 mod 2, -10 mod 3, -10 mod 4, -10 mod 5,',
        '    -10 mod 6, -10 mod 7, -10 mod 8, -10 mod 9, -10 mod 10,',
        '    -10 mod 11,',
        /* Negative / negative */
        '    -10 mod -1, -10 mod -2, -10 mod -3, -10 mod -4, -10 mod -5,',
        '    -10 mod -6, -10 mod -7, -10 mod -8, -10 mod -9, -10 mod -10,',
        '    -10 mod -11,',
        /* Big */
        '    1248806268977307630139540 mod 831719335689717',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueTuple([
        new ValueInteger('0'),
        new ValueInteger('0'),
        /* Positive / positive */
        new ValueInteger('0'), new ValueInteger('0'),
        new ValueInteger('1'), new ValueInteger('2'),
        new ValueInteger('0'), new ValueInteger('4'),
        new ValueInteger('3'), new ValueInteger('2'),
        new ValueInteger('1'), new ValueInteger('0'),
        new ValueInteger('10'),
        /* Positive / negative */
        new ValueInteger('0'), new ValueInteger('0'),
        new ValueInteger('-2'), new ValueInteger('-2'),
        new ValueInteger('0'), new ValueInteger('-2'),
        new ValueInteger('-4'), new ValueInteger('-6'),
        new ValueInteger('-8'), new ValueInteger('0'),
        new ValueInteger('-1'),
        /* Negative / positive */
        new ValueInteger('0'), new ValueInteger('0'),
        new ValueInteger('2'), new ValueInteger('2'),
        new ValueInteger('0'), new ValueInteger('2'),
        new ValueInteger('4'), new ValueInteger('6'),
        new ValueInteger('8'), new ValueInteger('0'),
        new ValueInteger('1'),
        /* Negative / negative */
        new ValueInteger('0'), new ValueInteger('0'),
        new ValueInteger('-1'), new ValueInteger('-2'),
        new ValueInteger('0'), new ValueInteger('-4'),
        new ValueInteger('-3'), new ValueInteger('-2'),
        new ValueInteger('-1'), new ValueInteger('0'),
        new ValueInteger('-10'),
        /* Big */
        new ValueInteger('352252440287548'),
      ]));
    });

    it('Fail on zero division for mod', () => {
      let result = () => new Runner().run([
        'program {',
        '  return (1 mod 0)',
        '}'
      ].join('\n'));
      expect(result).throws(i18n('errmsg:cannot-divide-by-zero'));
    });

  });

  describe('User-triggered failure (BOOM and boom)', () => {

    it('"BOOM" procedure should fail', () => {
      let result = () => new Runner().run([
        'program {',
        '  ' + i18n('PRIM:BOOM') + '("foo")',
        '}'
      ].join('\n'));
      expect(result).throws("foo");
    });

    it('"boom" function should fail', () => {
      let result = () => new Runner().run([
        'program {',
        '  x := ' + i18n('PRIM:boom') + '("foo")',
        '}'
      ].join('\n'));
      expect(result).throws("foo");
    });

  });

  describe('Gobstones board operations', () => {

    function runState(code) {
      let runner = new Runner();
      runner.run(code);
      return runner.globalState.dump();
    }

    function runResult(code) {
      let runner = new Runner();
      runner.run(code);
      return runner.result.toString();
    }

    describe('Put stones', () => {

      it('PutStone', () => {
        let result = runState([
          'program {',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color1') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color1') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color2') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color2') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color2') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color3') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color3') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color3') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color3') + ')',
          '}',
        ].join('\n'));
        expect(result.board[0][0].a).equals(1);
        expect(result.board[0][0].n).equals(2);
        expect(result.board[0][0].r).equals(3);
        expect(result.board[0][0].v).equals(4);
      });

      it('Check type of argument', () => {
        let result = () => runState([
          'program {',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Dir1') + ')',
          '}',
        ].join('\n'));
        expect(result).throws();
      });

    });

    describe('Move head', () => {

      it('Move North', () => {
        let result = runState([
          'program {',
          '  ' + i18n('PRIM:Move') + '(' + i18n('CONS:Dir0') + ')',
          '  ' + i18n('PRIM:Move') + '(' + i18n('CONS:Dir0') + ')',
          '  ' + i18n('PRIM:Move') + '(' + i18n('CONS:Dir0') + ')',
          '}',
        ].join('\n'));
        expect(result.head[0]).equals(0);
        expect(result.head[1]).equals(3);
      });

      it('Move East', () => {
        let result = runState([
          'program {',
          '  ' + i18n('PRIM:Move') + '(' + i18n('CONS:Dir1') + ')',
          '  ' + i18n('PRIM:Move') + '(' + i18n('CONS:Dir1') + ')',
          '  ' + i18n('PRIM:Move') + '(' + i18n('CONS:Dir1') + ')',
          '}',
        ].join('\n'));
        expect(result.head[0]).equals(3);
        expect(result.head[1]).equals(0);
      });

      it('Move South', () => {
        let result = runState([
          'program {',
          '  ' + i18n('PRIM:Move') + '(' + i18n('CONS:Dir0') + ')',
          '  ' + i18n('PRIM:Move') + '(' + i18n('CONS:Dir0') + ')',
          '  ' + i18n('PRIM:Move') + '(' + i18n('CONS:Dir0') + ')',
          '  ' + i18n('PRIM:Move') + '(' + i18n('CONS:Dir2') + ')',
          '}',
        ].join('\n'));
        expect(result.head[0]).equals(0);
        expect(result.head[1]).equals(2);
      });

      it('Move West', () => {
        let result = runState([
          'program {',
          '  ' + i18n('PRIM:Move') + '(' + i18n('CONS:Dir1') + ')',
          '  ' + i18n('PRIM:Move') + '(' + i18n('CONS:Dir1') + ')',
          '  ' + i18n('PRIM:Move') + '(' + i18n('CONS:Dir1') + ')',
          '  ' + i18n('PRIM:Move') + '(' + i18n('CONS:Dir3') + ')',
          '}',
        ].join('\n'));
        expect(result.head[0]).equals(2);
        expect(result.head[1]).equals(0);
      });

      it('Fall outside of the board', () => {
        let result = () => runState([
          'program {',
          '  ' + i18n('PRIM:Move') + '(' + i18n('CONS:Dir2') + ')',
          '}',
        ].join('\n'));
        expect(result).throws(
          i18n('errmsg:cannot-move-to')(i18n('CONS:Dir2'))
        );
      });

      it('Check type of argument', () => {
        let result = () => runState([
          'program {',
          '  ' + i18n('PRIM:Move') + '("")',
          '}',
        ].join('\n'));
        expect(result).throws();
      });

    });

    describe('Remove stones', () => {

      it('RemoveStone', () => {
        let result = runResult([
          'program {',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
          '  ' + i18n('PRIM:RemoveStone') + '(' + i18n('CONS:Color0') + ')',
          '  ' + i18n('PRIM:RemoveStone') + '(' + i18n('CONS:Color0') + ')',
          '  ' + i18n('PRIM:RemoveStone') + '(' + i18n('CONS:Color0') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color1') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color1') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color1') + ')',
          '  ' + i18n('PRIM:RemoveStone') + '(' + i18n('CONS:Color1') + ')',
          '  ' + i18n('PRIM:RemoveStone') + '(' + i18n('CONS:Color1') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color2') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color2') + ')',
          '  ' + i18n('PRIM:RemoveStone') + '(' + i18n('CONS:Color2') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color3') + ')',
          '  ' + i18n('PRIM:RemoveStone') + '(' + i18n('CONS:Color3') + ')',
          '  return (',
          '  ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color0') + '),',
          '  ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color1') + '),',
          '  ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color2') + '),',
          '  ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color3') + ')',
          '  )',
          '}',
        ].join('\n'));
        expect(result).equals('(1, 1, 1, 0)');
      });

      it('Fail if no stones', () => {
        let result = () => runState([
          'program {',
          '  ' + i18n('PRIM:RemoveStone') + '(' + i18n('CONS:Color2') + ')',
          '}',
        ].join('\n'));
        expect(result).throws(
          i18n('errmsg:cannot-remove-stone')(i18n('CONS:Color2'))
        );
      });

      it('Check type of argument', () => {
        let result = () => runState([
          'program {',
          '  ' + i18n('PRIM:RemoveStone') + '([])',
          '}',
        ].join('\n'));
        expect(result).throws();
      });

    });

    describe('Go to the edge of the board', () => {

      it('GoToEdge North', () => {
        let result = runState([
          'program {',
          '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir0') + ')',
          '}',
        ].join('\n'));
        expect(result.head[0]).equals(0);
        expect(result.head[1]).equals(result.height - 1);
      });

      it('GoToEdge East', () => {
        let result = runState([
          'program {',
          '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir1') + ')',
          '}',
        ].join('\n'));
        expect(result.head[0]).equals(result.width - 1);
        expect(result.head[1]).equals(0);
      });

      it('GoToEdge South', () => {
        let result = runState([
          'program {',
          '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir0') + ')',
          '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir1') + ')',
          '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir2') + ')',
          '}',
        ].join('\n'));
        expect(result.head[0]).equals(result.width - 1);
        expect(result.head[1]).equals(0);
      });

      it('GoToEdge West', () => {
        let result = runState([
          'program {',
          '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir0') + ')',
          '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir1') + ')',
          '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir2') + ')',
          '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir3') + ')',
          '}',
        ].join('\n'));
        expect(result.head[0]).equals(0);
        expect(result.head[1]).equals(0);
      });

      it('Check type of argument', () => {
        let result = () => runState([
          'program {',
          '  ' + i18n('PRIM:GoToEdge') + '(1)',
          '}',
        ].join('\n'));
        expect(result).throws();
      });

    });

    describe('Empty board contents', () => {
      it('EmptyBoardContents', () => {
        let result = runResult([
          'function nn() {',
          '  return (',
          '    ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color0') + ')',
          '  + ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color1') + ')',
          '  + ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color2') + ')',
          '  + ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color3') + ')',
          '  )',
          '}',
          'function count() {',
          '  r := 0',
          '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir0') + ')',
          '  r := r + nn()',
          '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir1') + ')',
          '  r := r + nn()',
          '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir2') + ')',
          '  r := r + nn()',
          '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir3') + ')',
          '  r := r + nn()',
          '  return (r)',
          '}',
          'program {',
          '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir0') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
          '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir1') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color1') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color1') + ')',
          '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir2') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color2') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color2') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color2') + ')',
          '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir3') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color3') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color3') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color3') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color3') + ')',
          '  x := count()',
          '  ' + i18n('PRIM:EmptyBoardContents') + '()',
          '  y := count()',
          '  return (x, y)',
          '}',
        ].join('\n'));
        expect(result).equals('(10, 0)');
      });
    });

    describe('Number of stones', () => {

      it('numStones', () => {
        let result = runResult([
          'program {',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color1') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color1') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color1') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color2') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color2') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color3') + ')',
          '  return (',
          '  ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color0') + '),',
          '  ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color1') + '),',
          '  ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color2') + '),',
          '  ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color3') + ')',
          '  )',
          '}',
        ].join('\n'));
        expect(result).equals('(4, 3, 2, 1)');
      });

      it('Check type of argument', () => {
        let result = () => runState([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:numStones') + '(1)',
          '  )',
          '}',
        ].join('\n'));
        expect(result).throws();
      });

    });

    describe('Check if any stones present', () => {

      it('anyStones', () => {
        let result = runResult([
          'program {',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color2') + ')',
          '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color2') + ')',
          '  return (',
          '  ' + i18n('PRIM:anyStones') + '(' + i18n('CONS:Color0') + '),',
          '  ' + i18n('PRIM:anyStones') + '(' + i18n('CONS:Color1') + '),',
          '  ' + i18n('PRIM:anyStones') + '(' + i18n('CONS:Color2') + '),',
          '  ' + i18n('PRIM:anyStones') + '(' + i18n('CONS:Color3') + ')',
          '  )',
          '}',
        ].join('\n'));
        expect(result).equals(
          '(' + i18n('CONS:True') +
          ', ' + i18n('CONS:False') +
          ', ' + i18n('CONS:True') +
          ', ' + i18n('CONS:False') +
          ')'
        );
      });

      it('Check type of argument', () => {
        let result = () => runState([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:anyStones') + '(1)',
          '  )',
          '}',
        ].join('\n'));
        expect(result).throws();
      });

    });

    describe('Check if we can move', () => {

        it('canMove', () => {
          let result = runResult([
            'function cm(dir) {',
            '  if (' + i18n('PRIM:canMove') + '(dir)) {',
            '    res := 1',
            '  } else {',
            '    res := 0',
            '  }',
            '  return (res)',
            '}',
            'function cm4() {',
            '  return (',
            '    cm(' + i18n('CONS:Dir0') + '),',
            '    cm(' + i18n('CONS:Dir1') + '),',
            '    cm(' + i18n('CONS:Dir2') + '),',
            '    cm(' + i18n('CONS:Dir3') + ')',
            '  )',
            '}',
            'program {',
            '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir0') + ')',
            '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir1') + ')',
            '  a := cm4()',
            '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir0') + ')',
            '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir3') + ')',
            '  b := cm4()',
            '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir2') + ')',
            '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir1') + ')',
            '  c := cm4()',
            '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir2') + ')',
            '  ' + i18n('PRIM:GoToEdge') + '(' + i18n('CONS:Dir3') + ')',
            '  d := cm4()',
            '  return (a, b, c, d)',
            '}',
          ].join('\n'));
          expect(result).equals(
            '((0, 0, 1, 1), (0, 1, 1, 0), (1, 0, 0, 1), (1, 1, 0, 0))'
          );
        });

        it('Check type of argument', () => {
          let result = () => runState([
            'program {',
            '  return (',
            '    ' + i18n('PRIM:canMove') + '(1)',
            '  )',
            '}',
          ].join('\n'));
          expect(result).throws();
        });

    });

  });

  describe('List operations', () => {

    describe('Append (++)', () => {

      it('Append lists', () => {
        let result = new Runner().run([
          'program {',
          '  return (',
          '    [] ++ [],',
          '    [1,2,3] ++ [4,5],',
          '    [[]] ++ [[], []]',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(new ValueTuple([
           new ValueList([]),
           new ValueList([
             new ValueInteger(1),
             new ValueInteger(2),
             new ValueInteger(3),
             new ValueInteger(4),
             new ValueInteger(5),
           ]),
           new ValueList([
             new ValueList([]),
             new ValueList([]),
             new ValueList([]),
           ]),
        ]));
      });

      it('Fail if types are not compatible', () => {
        let result = () => new Runner().run([
          'program {',
          '  return (',
          '    [[],["a"],[]] ++ [[],[1],[]]',
          '  )',
          '}',
        ].join('\n'));
        expect(result).throws(
          i18n('errmsg:expected-values-to-have-compatible-types')(
            new TypeList(new TypeList(new TypeString())),
            new TypeList(new TypeList(new TypeInteger())),
          )
        );
      });

    });

    describe('Head', () => {

      it('Head', () => {
        let result = new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:head') + '([1,2,3])',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(new ValueInteger(1));
      });

      it('Fail on empty list', () => {
        let result = () => new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:head') + '([])',
          '  )',
          '}',
        ].join('\n'));
        expect(result).throws(i18n('errmsg:list-cannot-be-empty'));
      });

      it('Fail if not a list', () => {
        let result = () => new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:head') + '(1)',
          '  )',
          '}',
        ].join('\n'));
        expect(result).throws();
      });

    });

    describe('Tail', () => {

      it('Tail', () => {
        let result = new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:tail') + '([1,2,3])',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(
          new ValueList([
            new ValueInteger(2),
            new ValueInteger(3),
          ])
        );
      });

      it('Fail on empty list', () => {
        let result = () => new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:tail') + '([])',
          '  )',
          '}',
        ].join('\n'));
        expect(result).throws(i18n('errmsg:list-cannot-be-empty'));
      });

      it('Fail if not a list', () => {
        let result = () => new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:tail') + '("foo")',
          '  )',
          '}',
        ].join('\n'));
        expect(result).throws();
      });

    });

    describe('Init', () => {

      it('Init', () => {
        let result = new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:init') + '([1,2,3])',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(
          new ValueList([
            new ValueInteger(1),
            new ValueInteger(2),
          ])
        );
      });

      it('Fail on empty list', () => {
        let result = () => new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:init') + '([])',
          '  )',
          '}',
        ].join('\n'));
        expect(result).throws(i18n('errmsg:list-cannot-be-empty'));
      });

      it('Fail if not a list', () => {
        let result = () => new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:init') + '((1,2,3))',
          '  )',
          '}',
        ].join('\n'));
        expect(result).throws();
      });

    });

    describe('Last', () => {

      it('Last', () => {
        let result = new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:last') + '([1,2,3])',
          '  )',
          '}',
        ].join('\n'));
        expect(result).deep.equals(new ValueInteger(3));
      });

      it('Fail on empty list', () => {
        let result = () => new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:last') + '([])',
          '  )',
          '}',
        ].join('\n'));
        expect(result).throws(i18n('errmsg:list-cannot-be-empty'));
      });

      it('Fail if not a list', () => {
        let result = () => new Runner().run([
          'program {',
          '  return (',
          '    ' + i18n('PRIM:last') + '(' + i18n('CONS:True') + ')',
          '  )',
          '}',
        ].join('\n'));
        expect(result).throws();
      });

    });

  });

});

