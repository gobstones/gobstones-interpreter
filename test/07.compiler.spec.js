import chai from 'chai';

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

  describe('Expressions: tuples', () => {

    it('Tuple construction (empty)', () => {
      let result = new Runner().run([
        'program {',
        '  x := ()',
        '  return (x)',
        '}',
      ]);
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
      ]);
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
      ]);
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
      ]);
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
      ]);
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
      ]);
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
      ]);
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
      ]);
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
      ]);
      expect(result).deep.equals(new ValueInteger(2));
    });

    it('Calling primitive functions: check argument types', () => {
      let result = () => new Runner().run([
        'program {',
        '  return ("a" + 1)',
        '}',
      ]);
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

    it('Unary minus (Integer)', () => {
      let result = new Runner().run([
        'program {',
        '  a := -42',
        '  b := 0',
        '  c := 42',
        '  return (-a, -b, -c)',
        '}',
      ]);
      expect(result).deep.equals(
        new ValueTuple([
          new ValueInteger(42),
          new ValueInteger(0),
          new ValueInteger(-42),
        ])
      );
    });

    it('Unary minus (Bool)', () => {
      let result = new Runner().run([
        'program {',
        '  a := ' + i18n('CONS:True'),
        '  b := ' + i18n('CONS:False'),
        '  return (-a, -b)',
        '}',
      ]);
      expect(result).deep.equals(
        new ValueTuple([
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
          new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
        ])
      );
    });

    it('Unary minus (Dir)', () => {
      let result = new Runner().run([
        'program {',
        '  a := ' + i18n('CONS:Dir0'),
        '  b := ' + i18n('CONS:Dir1'),
        '  c := ' + i18n('CONS:Dir2'),
        '  d := ' + i18n('CONS:Dir3'),
        '  return (-a, -b, -c, -d)',
        '}',
      ]);
      expect(result).deep.equals(
        new ValueTuple([
          new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir2'), {}),
          new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir3'), {}),
          new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir0'), {}),
          new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir1'), {}),
        ])
      );
    });

    it('Unary minus (fail for other types)', () => {
      let result = () => new Runner().run([
        'program {',
        '  return (-())',
        '}',
      ]);
      expect(result).throws(
        i18n('errmsg:expected-value-of-some-type-but-got')(
          [
            new TypeInteger(),
            new TypeStructure(i18n('TYPE:Bool')),
            new TypeStructure(i18n('TYPE:Dir'))
          ],
          new TypeTuple([])
        )
      );
    });

  });

});
