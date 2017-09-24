
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

describe('Value toString', () => {

    describe('Integers', () => {

      it('Zero', () => {
        expect(new ValueInteger('0').toString()).equals('0');
      });

      it('Minus zero', () => {
        expect(
          new ValueInteger('0').sub(new ValueInteger('0')).toString()
        ).equals('0');
      });

      it('Positive', () => {
        expect(
          new ValueInteger('123456789112233445566778899').toString()
        ).equals('123456789112233445566778899');
      });

      it('Negative', () => {
        expect(
          new ValueInteger('-123456789112233445566778899').toString()
        ).equals('-123456789112233445566778899');
      });

    });

    describe('Strings', () => {

      it('Empty', () => {
        expect(new ValueString('').toString()).equals('""');
      });

      it('Non-empty', () => {
        expect(
          new ValueString(
            'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
          ).toString()).equals(
            '"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"'
          );
      });

      it('Unicode', () => {
        expect(
          new ValueString('áéíóúÁÉÍÓÚñÑ').toString()
        ).equals('"áéíóúÁÉÍÓÚñÑ"');
      });

      it('Escapes', () => {
        expect(
          new ValueString('\\,\",\u0007,\b,\f,\n,\r,\t,\v').toString()
        ).equals(
          '"\\\\,\\\",\\a,\\b,\\f,\\n,\\r,\\t,\\v"'
        );
      });

    });

    describe('Tuples', () => {
      it('Empty', () => {
        expect(new ValueTuple([]).toString()).equals('()');
      });

      it('Non-empty', () => {
        expect(
          new ValueTuple([
            new ValueInteger(1),
            new ValueInteger(2),
            new ValueInteger(3),
          ]).toString()
        ).equals('(1, 2, 3)');
      });
    });

    describe('Lists', () => {
      it('Empty', () => {
        expect(new ValueList([]).toString()).equals('[]');
      });

      it('Singleton', () => {
        expect(
          new ValueList([
            new ValueInteger(1),
          ]).toString()
        ).equals('[1]');
      });

      it('Three elements', () => {
        expect(
          new ValueList([
            new ValueInteger(1),
            new ValueInteger(2),
            new ValueInteger(3),
          ]).toString()
        ).equals('[1, 2, 3]');
      });
    });

    describe('Structures', () => {

      it('No fields', () => {
        expect(
          new ValueStructure('A', 'B', {}).toString()
        ).equals('B');
      });

      it('One field', () => {
        expect(
          new ValueStructure('A', 'B', {'a': new ValueInteger(1)}).toString()
        ).equals('B(a <- 1)');
      });

      it('Three fields', () => {
        expect(
          new ValueStructure('A', 'B', {
            'b': new ValueInteger(2),
            'a': new ValueInteger(1),
            'c': new ValueInteger(3),
          }).toString()
        ).equals('B(a <- 1, b <- 2, c <- 3)');
      });

    });

});


