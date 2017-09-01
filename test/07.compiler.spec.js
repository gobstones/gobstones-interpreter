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

describe('Compiler', () => {

  describe('Basic programs', () => {

    it('Empty source', () => {
      let result = new Runner().run('');
      expect(result).equals(null);
    });

    it('Empty program', () => {
      let result = new Runner().run('program {}');
      expect(result).equals(null);
    });

  });

  describe('Statements: assignment', () => {

    it('Variable assignment', () => {
      let result = new Runner().run([
        'program {',
        '  x := 42',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(42));
    });

  });

  describe('Statements: if', () => {

    it('If without else: true branch', () => {
      let result = new Runner().run([
        'program {',
        '  x := 1',
        '  if (' + i18n('CONS:True') + ') {',
        '    x := 2',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(2));
    });

    it('If without else: false branch', () => {
      let result = new Runner().run([
        'program {',
        '  x := 1',
        '  if (' + i18n('CONS:False') + ') {',
        '    x := 2',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(1));
    });

    it('If without else: reject if not a boolean', () => {
      let result = () => new Runner().run([
        'program {',
        '  x := 1',
        '  if (18) {',
        '    x := 2',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeStructure(i18n('TYPE:Bool'), {}).toString(),
          new TypeInteger().toString(),
        )
      );
    });

    it('If with else: true branch', () => {
      let result = new Runner().run([
        'program {',
        '  t := "true"',
        '  f := "false"',
        '  if (' + i18n('CONS:True') + ') {',
        '    x := t',
        '  } else {',
        '    x := f',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueString("true"));
    });

    it('If with else: false branch', () => {
      let result = new Runner().run([
        'program {',
        '  t := "true"',
        '  f := "false"',
        '  if (' + i18n('CONS:False') + ') {',
        '    x := t',
        '  } else {',
        '    x := f',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueString("false"));
    });

    it('If with else: reject if not a boolean', () => {
      let result = () => new Runner().run([
        'type B is record { field x }',
        'program {',
        '  t := "true"',
        '  f := "false"',
        '  if (B(x <- 1)) {',
        '    x := t',
        '  } else {',
        '    x := f',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeStructure(i18n('TYPE:Bool'), {}).toString(),
          new TypeStructure('B', {'B': {'x': new TypeInteger()}}).toString(),
        )
      );
    });

  });

  describe('Statements: repeat', () => {

    it('Repeat: 0 times', () => {
      let result = new Runner().run([
        'program {',
        '  x := 0',
        '  repeat (0) {',
        '    x := x + 1',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(0));
    });

    it('Repeat: negative times', () => {
      let result = new Runner().run([
        'program {',
        '  x := 0',
        '  repeat (-10) {',
        '    x := x + 1',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(0));
    });

    it('Repeat: positive times', () => {
      let result = new Runner().run([
        'program {',
        '  x := 0',
        '  t := 5',
        '  repeat (t) {',
        '    x := x + 1',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(5));
    });

    it('Repeat: nested', () => {
      let result = new Runner().run([
        'program {',
        '  s := 0',
        '  i := 0',
        '  repeat (5) {',
        '    i := i + 1',
        '    repeat (i) {',
        '      s := s + 1',
        '    }',
        '  }',
        '  return (s)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(15));
    });

    it('Repeat: fail if not a number', () => {
      let result = () => new Runner().run([
        'program {',
        '  repeat ("foo") {',
        '  }',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeInteger(),
          new TypeString(),
        )
      );
    });

  });

  describe('Statements: foreach', () => {

    it('Foreach: empty list', () => {
      let result = new Runner().run([
        'program {',
        '  x := 42',
        '  foreach i in [] {',
        '    x := "foo"',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(42));
    });

    it('Foreach: typical list', () => {
      let result = new Runner().run([
        'program {',
        '  x := 0',
        '  foreach i in [1, 2, 3] {',
        '    x := x + i',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(6));
    });

    it('Foreach: nested', () => {
      let result = new Runner().run([
        'program {',
        '  x := 0',
        '  y := 0',
        '  foreach i in [10, 20] {',
        '    foreach j in [i + 5, i + 6] {',
        '      x := x + i',
        '      y := y + j',
        '    }',
        '  }',
        '  return (x, y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueInteger(60),
          new ValueInteger(82),
        ])
      );
    });

    it('Foreach: disallow using the index outside the scope', () => {
      let result = () => new Runner().run([
        'program {',
        '  foreach i in [1, 2, 3] {',
        '  }',
        '  x := i',
        '}',
      ].join('\n'));
      expect(result).throws(i18n('errmsg:undefined-variable')('i'));
    });

    it('Foreach: the range must be a list', () => {
      let result = () => new Runner().run([
        'program {',
        '  foreach x in "foo" {',
        '  }',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeList(new TypeAny()),
          new TypeString(),
        )
      );
    });

  });

  describe('Statements: while', () => {

    it('While: factorial', () => {
      let result = new Runner().run([
        'program {',
        '  x := 5',
        '  y := 0',
        '  while (x > 1) {',
        '    y := y + x',
        '    x := x - 1',
        '  }',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(14));
    });

    it('While: check that the condition is boolean', () => {
      let result = () => new Runner().run([
        'program {',
        '  x := 5',
        '  while (x) {',
        '  }',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeStructure(i18n('TYPE:Bool'), {}),
          new TypeInteger(),
        )
      );
    });

  });

  describe('Expressions: constants', () => {

    it('Numbers', () => {
      let result = new Runner().run('program { return (42) }');
      expect(result).deep.equals(new ValueInteger(42));
    });
    
    it('Strings', () => {
      let result = new Runner().run('program { return ("foo") }');
      expect(result).deep.equals(new ValueString('foo'));
    });

  });

  describe('Expressions: lists', () => {

    it('List construction (empty)', () => {
      let result = new Runner().run([
        'program {',
        '  x := []',
        '  return (x)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueList([])
      );
    });

    it('List construction (various elements)', () => {
      let result = new Runner().run([
        'program {',
        '  x := [1,2,3]',
        '  return (x)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueList([
          new ValueInteger(1),
          new ValueInteger(2),
          new ValueInteger(3),
        ])
      );
    });

    it('List construction (nested)', () => {
      let result = new Runner().run([
        'program {',
        '  x := [[],[1],[2,3]]',
        '  return (x)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueList([
          new ValueList([]),
          new ValueList([
            new ValueInteger(1),
          ]),
          new ValueList([
            new ValueInteger(2),
            new ValueInteger(3),
          ]),
        ])
      );
    });

    it('List construction (reject if types are incompatible)', () => {
      let result = () => new Runner().run([
        'program {',
        '  x := [["foo"],[],[1]]',
        '  return (x)',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:incompatible-types-on-list-creation')(
          2,
          new TypeList(new TypeString()),
          new TypeList(new TypeInteger()),
        )
      );
    });

  });

  // TODO: rangos!

  describe('Expressions: tuples', () => {

    it('Tuple construction (empty)', () => {
      let result = new Runner().run([
        'program {',
        '  x := ()',
        '  return (x)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([])
      );
    });

    it('Tuple construction (two elements)', () => {
      let result = new Runner().run([
        'program {',
        '  x := (1, "foo")',
        '  return (x)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueInteger(1),
          new ValueString('foo'),
        ])
      );
    });

    it('Tuple construction (nested)', () => {
      let result = new Runner().run([
        'program {',
        '  x := ((1, 2, 3), (4, 5), 6)',
        '  return (x)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueTuple([
            new ValueInteger(1),
            new ValueInteger(2),
            new ValueInteger(3),
          ]),
          new ValueTuple([
            new ValueInteger(4),
            new ValueInteger(5),
          ]),
          new ValueInteger(6),
        ])
      );
    });

    it('Tuple construction (return tuple from main program)', () => {
      let result = new Runner().run([
        'program {',
        '  return (1, 2)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueInteger(1),
          new ValueInteger(2),
        ])
      );
    });

  });

  describe('Expressions: structures', () => {

    it('Structure construction (no arguments)', () => {
      let result = new Runner().run([
        'program {',
        '  return (' + i18n('CONS:True') + ')',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {})
      );
    });

    it('Structure construction (user defined)', () => {
      let result = new Runner().run([
        'type A is variant {',
        '  case B { field x }',
        '  case C {}',
        '}',
        'program {',
        '  return (B(x <- C()))',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueStructure('A', 'B', {'x': new ValueStructure('A', 'C', {})})
      );
    });


    it('Structure construction (with arguments)', () => {
      let result = new Runner().run([
        'type Coord is record {',
        '  field x',
        '  field y',
        '  field z',
        '}',
        'program {',
        '  return (Coord(x <- 1, y <- 2, z <- 3))',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueStructure('Coord', 'Coord', {
          'x': new ValueInteger(1),
          'y': new ValueInteger(2),
          'z': new ValueInteger(3),
        })
      );
    });

    it('Structure construction (with permuted arguments)', () => {
      let result = new Runner().run([
        'type Coord is record {',
        '  field x',
        '  field y',
        '  field z',
        '}',
        'program {',
        '  return (Coord(y <- 2, z <- 3, x <- 1))',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueStructure('Coord', 'Coord', {
          'x': new ValueInteger(1),
          'y': new ValueInteger(2),
          'z': new ValueInteger(3),
        })
      );
    });

  });

  describe('Expressions: function calls', () => {

    it('Calling primitive functions', () => {
      let result = new Runner().run([
        'program {',
        '  return (1 + 1)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(2));
    });

    it('Calling primitive functions: check argument types', () => {
      let result = () => new Runner().run([
        'program {',
        '  return ("a" + 1)',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:primitive-argument-type-mismatch')(
          '+',
          1,
          new TypeInteger(),
          new TypeString(),
        )
      );
    });

    // TODO:
    // - user defined functions
    // - field accessors
    // - && and ||
    // TODO:
    //   probar todos los operadores y funciones built-in
  });

  describe('Primitive functions and operators', () => {

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

});
