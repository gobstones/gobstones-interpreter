import chai from 'chai';

import { Parser } from '../src/parser';
import { Linter } from '../src/linter';
import { SymbolTable } from '../src/symtable';
import { i18n, i18nPosition } from '../src/i18n';

chai.expect();
const expect = chai.expect;

function lint(code) {
  return new Linter(new SymbolTable()).lint(new Parser(code).parse());
}

it('Linter - Accept empty program', () => {
  let code = 'program {}';
  var symtable = lint(code);
  expect(symtable.program !== null).equals(true);
});

it('Linter - Accept empty interactive program', () => {
  let code = 'interactive program {}';
  var symtable = lint(code);
  expect(symtable.program !== null).equals(true);
});

it('Linter - Reject two programs', () => {
  let code = [
    'program {}',
    'program {}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:program-already-defined')(
      i18n('<position>')('(?)', 1, 1),
      i18n('<position>')('(?)', 2, 1)
    )
  )
});

it('Linter - Reject program + interactive program', () => {
  let code = [
    'program {}',
    'interactive program {}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:program-already-defined')(
      i18n('<position>')('(?)', 1, 1),
      i18n('<position>')('(?)', 2, 1)
    )
  )
});

it('Linter - Accept single procedure definition', () => {
  let code = [
    'procedure P() {}',
    'program {}',
  ].join('\n');
  var symtable = lint(code);
  expect(symtable.program !== null).equals(true);
  expect(symtable.procedureDefinition('P') !== null).equals(true);
});

it('Linter - Reject procedure defined twice', () => {
  let code = [
    'procedure P() {}',
    'procedure P() {}',
    'program {}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:procedure-already-defined')(
      'P',
      i18n('<position>')('(?)', 1, 1),
      i18n('<position>')('(?)', 2, 1)
    )
  );
});

it('Linter - Accept definitions of two independent procedures', () => {
  let code = [
    'procedure P() {}',
    'procedure Q() {}',
    'program {}',
  ].join('\n');
  var symtable = lint(code);
  expect(symtable.program !== null).equals(true);
  expect(symtable.procedureDefinition('P') !== null).equals(true);
  expect(symtable.procedureDefinition('Q') !== null).equals(true);
});

it('Linter - Accept single function definition', () => {
  let code = [
    'function f() { return (1) }',
    'program {}',
  ].join('\n');
  var symtable = lint(code);
  expect(symtable.program !== null).equals(true);
  expect(symtable.functionDefinition('f') !== null).equals(true);
});

it('Linter - Reject function defined twice', () => {
  let code = [
    'function f() { return (1) }',
    'function f() { return (2) }',
    'program {}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:function-already-defined')(
      'f',
      i18n('<position>')('(?)', 1, 1),
      i18n('<position>')('(?)', 2, 1)
    )
  );
});

it('Linter - Accept definitions of two independent functions', () => {
  let code = [
    'function f() { return (1) }',
    'function g() { return (2) }',
    'program {}',
  ].join('\n');
  var symtable = lint(code);
  expect(symtable.program !== null).equals(true);
  expect(symtable.functionDefinition('f') !== null).equals(true);
  expect(symtable.functionDefinition('g') !== null).equals(true);
});

it('Linter - Accept single type definition', () => {
  let code = [
    'type A is record {}',
    'program {}',
  ].join('\n');
  var symtable = lint(code);
  expect(symtable.program !== null).equals(true);
  expect(symtable.typeDefinition('A') !== null).equals(true);
  expect(symtable.typeConstructors('A')).deep.equals(['A']);
  expect(symtable.constructorDeclaration('A') !== null).equals(true);
  expect(symtable.constructorType('A')).equals('A');
});

it('Linter - Reject type defined twice', () => {
  let code = [
    'type A is record {}',
    'type A is variant { case A1 {} }',
    'program {}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:type-already-defined')(
      'A',
      i18n('<position>')('(?)', 1, 1),
      i18n('<position>')('(?)', 2, 1)
    )
  );
});

it('Linter - Accept definitions of two independent types', () => {
  let code = [
    'type A is record {}',
    'type B is variant {}',
    'type C is variant { case C1 {} case C2 {} case C3 {} }',
    'program {}',
  ].join('\n');
  var symtable = lint(code);
  expect(symtable.program !== null).equals(true);
  expect(symtable.typeDefinition('A') !== null).equals(true);
  expect(symtable.typeDefinition('B') !== null).equals(true);
  expect(symtable.typeDefinition('C') !== null).equals(true);
  expect(symtable.typeConstructors('A')).deep.equals(['A']);
  expect(symtable.typeConstructors('B')).deep.equals([]);
  expect(symtable.typeConstructors('C')).deep.equals(['C1', 'C2', 'C3']);

  expect(symtable.constructorDeclaration('C1') !== null).equals(true);
  expect(symtable.constructorDeclaration('C2') !== null).equals(true);
  expect(symtable.constructorDeclaration('C3') !== null).equals(true);
  expect(symtable.constructorType('C1')).equals('C');
  expect(symtable.constructorType('C2')).equals('C');
  expect(symtable.constructorType('C3')).equals('C');
});

it('Linter - Reject repeated constructors', () => {
  let code = [
    'type A is variant {',
    '  case B {}',
    '  case B {}',
    '}',
    'program {}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:constructor-already-defined')(
      'B',
      i18n('<position>')('(?)', 2, 3),
      i18n('<position>')('(?)', 3, 3)
    )
  );
});

it('Linter - Field names', () => {
  let code = [
    'type A is record {',
    '  field x',
    '  field y',
    '}',
    'type B is variant {',
    '  case B1 {',
    '    field x',
    '    field z',
    '  }',
    '  case B2 {',
    '    field y',
    '    field z',
    '  }',
    '}',
    'type C is record {',
    '}',
    'program {}',
  ].join('\n');
  var symtable = lint(code);
  expect(symtable.constructorFields('A')).deep.equals(['x', 'y']);
  expect(symtable.constructorFields('A')).deep.equals(['x', 'y']);
  expect(symtable.constructorFields('B1')).deep.equals(['x', 'z']);
  expect(symtable.constructorFields('B2')).deep.equals(['y', 'z']);
  expect(symtable.constructorFields('C')).deep.equals([]);

  var dx = symtable.fieldDescriptor('x');
  expect(dx.length).equals(2);
  expect(dx[0].typeName).equals('A');
  expect(dx[0].constructorName).equals('A');
  expect(dx[0].index).equals(0);
  expect(dx[1].typeName).equals('B');
  expect(dx[1].constructorName).equals('B1');
  expect(dx[1].index).equals(0);

  var dy = symtable.fieldDescriptor('y');
  expect(dy.length).equals(2);
  expect(dy[0].typeName).equals('A');
  expect(dy[0].constructorName).equals('A');
  expect(dy[0].index).equals(1);
  expect(dy[1].typeName).equals('B');
  expect(dy[1].constructorName).equals('B2');
  expect(dy[1].index).equals(0);

  var dz = symtable.fieldDescriptor('z');
  expect(dz.length).equals(2);
  expect(dz[0].typeName).equals('B');
  expect(dz[0].constructorName).equals('B1');
  expect(dz[0].index).equals(1);
  expect(dz[1].typeName).equals('B');
  expect(dz[1].constructorName).equals('B2');
  expect(dz[1].index).equals(1);
});

it('Linter - Reject repeated field names for the same constructor', () => {
  let code = [
    'type A is variant {',
    '  case B {',
    '    field x',
    '    field x',
    '  }',
    '}',
    'program {}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:repeated-field-name')('B', 'x')
  );
});

it('Linter - Reject field named as a function', () => {
  let code = [
    'function foo() {}',
    'type A is record {',
    '  field foo',
    '}',
    'program {}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:function-and-field-cannot-have-the-same-name')(
      'foo',
      i18n('<position>')('(?)', 1, 1),
      i18n('<position>')('(?)', 3, 9)
    )
  );
});

it('Linter - Reject function named as a field', () => {
  let code = [
    'type A is record {',
    '  field foo',
    '}',
    'function foo() {}',
    'program {}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:function-and-field-cannot-have-the-same-name')(
      'foo',
      i18n('<position>')('(?)', 4, 1),
      i18n('<position>')('(?)', 1, 1)
    )
  );
});

