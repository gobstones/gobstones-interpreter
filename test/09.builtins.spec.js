import chai from 'chai';

import {
  TYPES_WITH_ORDER,
  TYPES_WITH_OPPOSITE,
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
            TYPES_WITH_ORDER,
            new TypeString()
          )
        );
      });

      it('Fail if types do not match', () => {
        let result = () => new Runner().run(compareMismatch('<='));
        expect(result).throws(
          i18n('errmsg:expected-values-to-have-compatible-types')(
            new TypeInteger(),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True')).type()
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
            TYPES_WITH_ORDER,
            new TypeString()
          )
        );
      });

      it('Fail if types do not match', () => {
        let result = () => new Runner().run(compareMismatch('>='));
        expect(result).throws(
          i18n('errmsg:expected-values-to-have-compatible-types')(
            new TypeInteger(),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True')).type()
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
            TYPES_WITH_ORDER,
            new TypeString()
          )
        );
      });

      it('Fail if types do not match', () => {
        let result = () => new Runner().run(compareMismatch('<'));
        expect(result).throws(
          i18n('errmsg:expected-values-to-have-compatible-types')(
            new TypeInteger(),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True')).type()
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
            TYPES_WITH_ORDER,
            new TypeString()
          )
        );
      });

      it('Fail if types do not match', () => {
        let result = () => new Runner().run(compareMismatch('>'));
        expect(result).throws(
          i18n('errmsg:expected-values-to-have-compatible-types')(
            new TypeInteger(),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True')).type()
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
            TYPES_WITH_ORDER,
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
            TYPES_WITH_ORDER,
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
            TYPES_WITH_OPPOSITE,
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

  describe('Arithmetic operators', () => {

    it('Addition', () => {
      let result = new Runner().run([
        'program {',
        '  return (',
        '    839708017193356897142867 + 1248806268977307630139540',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueInteger('2088514286170664527282407')
      );
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
        '    839708017193356897142867 - 1248806268977307630139540',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueInteger('409098251783950732996673').negate()
      );
    });

    it('Multiplication', () => {
      let result = new Runner().run([
        'program {',
        '  return (',
        '    839708017193356897142867 * 1248806268977307630139540',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueInteger('1048632635981568913405455338700366140602525661180')
      );
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

});

