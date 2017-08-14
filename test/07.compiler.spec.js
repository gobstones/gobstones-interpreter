import chai from 'chai';

import { Runner } from '../src/runner';
import { i18n } from '../src/i18n';

import {
  ValueInteger,
  ValueString,
  ValueTuple,
  ValueList,
  ValueStructure,
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

  describe('Assignment', () => {

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

  describe('Conditional (if)', () => {

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

  });

  describe('Constants', () => {

    it('Numbers', () => {
      let result = new Runner().run('program { return (42) }');
      expect(result).deep.equals(new ValueInteger(42));
    });
    
    it('Strings', () => {
      let result = new Runner().run('program { return ("foo") }');
      expect(result).deep.equals(new ValueString('foo'));
    });

  });

  describe('Structure', () => {

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


});
