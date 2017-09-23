
import chai from 'chai';

import {
  ValueInteger,
  ValueString,
  ValueTuple,
  ValueList,
  ValueStructure,
} from '../src/value';

chai.expect();
const expect = chai.expect;

describe('Showing values', () => {

    describe('Integers', () => {

      it('Zero', () => {
        expect(new ValueInteger('0').show()).equals('0');
      });

      it('Minus zero', () => {
        expect(
          new ValueInteger('0').sub(new ValueInteger('0')).show()
        ).equals('0');
      });

      it('Positive', () => {
        expect(
          new ValueInteger('123456789112233445566778899').show()
        ).equals('123456789112233445566778899');
      });

      it('Negative', () => {
        expect(
          new ValueInteger('-123456789112233445566778899').show()
        ).equals('-123456789112233445566778899');
      });

    });

    describe('Strings', () => {

      it('Empty', () => {
        expect(new ValueString('').show()).equals('""');
      });

      it('Non-empty', () => {
        expect(
          new ValueString(
            'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
          ).show()).equals(
            '"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"'
          );
      });

      it('Unicode', () => {
        expect(
          new ValueString('áéíóúÁÉÍÓÚñÑ').show()
        ).equals('"áéíóúÁÉÍÓÚñÑ"');
      });

      it('Escapes', () => {
        expect(
          new ValueString('\\,\",\u0007,\b,\f,\n,\r,\t,\v').show()
        ).equals(
          '"\\\\,\\\",\\a,\\b,\\f,\\n,\\r,\\t,\\v"'
        );
      });

    });

    describe('Tuples', () => {
      it('Empty', () => {
        expect(new ValueTuple([]).show()).equals('()');
      });

      it('Non-empty', () => {
        expect(
          new ValueTuple([
            new ValueInteger(1),
            new ValueInteger(2),
            new ValueInteger(3),
          ]).show()
        ).equals('(1, 2, 3)');
      });
    });

    describe('Lists', () => {
      it('Empty', () => {
        expect(new ValueList([]).show()).equals('[]');
      });

      it('Singleton', () => {
        expect(
          new ValueList([
            new ValueInteger(1),
          ]).show()
        ).equals('[1]');
      });

      it('Three elements', () => {
        expect(
          new ValueList([
            new ValueInteger(1),
            new ValueInteger(2),
            new ValueInteger(3),
          ]).show()
        ).equals('[1, 2, 3]');
      });
    });

    describe('Structures', () => {

      it('No fields', () => {
        expect(
          new ValueStructure('A', 'B', {}).show()
        ).equals('B');
      });

      it('One field', () => {
        expect(
          new ValueStructure('A', 'B', {'a': new ValueInteger(1)}).show()
        ).equals('B(a <- 1)');
      });

      it('Three fields', () => {
        expect(
          new ValueStructure('A', 'B', {
            'b': new ValueInteger(2),
            'a': new ValueInteger(1),
            'c': new ValueInteger(3),
          }).show()
        ).equals('B(a <- 1, b <- 2, c <- 3)');
      });

    });

});


