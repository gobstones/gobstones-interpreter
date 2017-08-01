import chai from 'chai';

import { Parser } from '../src/parser';
import { Linter } from '../src/linter';
import { SymbolTable } from '../src/symtable';
import { i18n, i18nPosition } from '../src/i18n';

import { ASTDefType, ASTConstructorDeclaration } from '../src/ast';
import { Token, T_UPPERID } from '../src/token';
import { UnknownPosition } from '../src/reader';

chai.expect();
const expect = chai.expect;

function lint(code) {
  return new Linter(new SymbolTable()).lint(new Parser(code).parse());
}

it('Linter - Accept completely empty source', () => {
  let code = '';
  var symtable = lint(code);
  expect(symtable.program === null).equals(true);
});

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
    'function foo() { return (1) }',
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
    'function foo() { return (1) }',
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

it('Linter - Reject source with definitions but without a program', () => {
  let code = 'function foo() { return (1) }';
  expect(() => lint(code)).throws(
    i18n('errmsg:source-should-have-a-program-definition')
  );
});

it('Linter - Reject procedure with return', () => {
  let code = [
    'program {}',
    'procedure P() { }',
    'procedure Q() { return (1) }',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:procedure-should-not-have-return')('Q')
  );
});

it('Linter - Reject function without return', () => {
  let code = [
    'program {}',
    'function f() { return (1) }',
    'function g() { }',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:function-should-have-return')('g')
  );
});

it('Linter - Accept return in program.', () => {
  let code = [
    'program { return (1) }',
  ].join('\n');
  expect(lint(code).program !== null).equals(true);
});

it('Linter - Reject return in the middle of program', () => {
  let code = [
    'program {',
    '  return (1)',
    '  return (2)',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:return-statement-not-allowed-here')
  );
});

it('Linter - Reject return in the middle of function', () => {
  let code = [
    'program {}',
    'function foo() {',
    '  return (1)',
    '  return (2)',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:return-statement-not-allowed-here')
  );
});

it('Linter - Reject return in nested block', () => {
  let code = [
    'program {',
    '  {',
    '    return (1)',
    '  }',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:return-statement-not-allowed-here')
  );
});

it('Linter - Reject repeated parameters in a function', () => {
  let code = [
    'function f(x, y, x) { return (1) }',
    'program {}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:local-name-conflict')(
      'x',
      i18n('LocalParameter'),
      i18n('<position>')('(?)', 1, 12),
      i18n('LocalParameter'),
      i18n('<position>')('(?)', 1, 18),
    )
  );
});

it('Linter - Reject repeated parameters in a procedure', () => {
  let code = [
    'procedure P(bar, foo, foo) {}',
    'program {}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:local-name-conflict')(
      'foo',
      i18n('LocalParameter'),
      i18n('<position>')('(?)', 1, 18),
      i18n('LocalParameter'),
      i18n('<position>')('(?)', 1, 23),
    )
  );
});

it('Linter - Accept repeated parameters in different routines', () => {
  let code = [
    'function f(x,y) { return (1) }',
    'procedure P(x) { }',
    'function g(x,y) { return (2) }',
    'procedure Q(x,y,z) { }',
    'program {}',
  ].join('\n');
  expect(lint(code).functionParameters('f')).deep.equals(['x', 'y']);
  expect(lint(code).functionParameters('g')).deep.equals(['x', 'y']);
  expect(lint(code).procedureParameters('P')).deep.equals(['x']);
  expect(lint(code).procedureParameters('Q')).deep.equals(['x', 'y', 'z']);
});

it("Linter - Reject repeated indices in nested foreach's", () => {
  let code = [
    'program {',
    '  foreach i in [] {',
    '    foreach i in [] {',
    '    }',
    '  }',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:local-name-conflict')(
      'i',
      i18n('LocalIndex'),
      i18n('<position>')('(?)', 2, 11),
      i18n('LocalIndex'),
      i18n('<position>')('(?)', 3, 13),
    )
  );
});

it("Linter - Allow repeated indices in independent foreach's", () => {
  let code = [
    'program {',
    '  foreach i in [] {',
    '  }',
    '  foreach i in [] {',
    '  }',
    '}',
  ].join('\n');
  expect(lint(code).program === null).equals(false);
});

it('Linter - Allow repeated assignments to a local variable', () => {
  let code = [
    'program {',
    '  x := 1',
    '  x := 2',
    '}',
  ].join('\n');
  expect(lint(code).program === null).equals(false);
});

it('Linter - Reject assignment to parameter', () => {
  let code = [
    'procedure P(x) {',
    '  x := 1',
    '}',
    'program {',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:local-name-conflict')(
      'x',
      i18n('LocalParameter'),
      i18n('<position>')('(?)', 1, 13),
      i18n('LocalVariable'),
      i18n('<position>')('(?)', 2, 3),
    )
  );
});

it('Linter - Reject assignment to index', () => {
  let code = [
    'program {',
    '  foreach i in [] {',
    '    i := i + 1',
    '  }',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:local-name-conflict')(
      'i',
      i18n('LocalIndex'),
      i18n('<position>')('(?)', 2, 11),
      i18n('LocalVariable'),
      i18n('<position>')('(?)', 3, 5),
    )
  );
});

it('Linter - Reject tuple assignment to parameter', () => {
  let code = [
    'function f(x,y) {',
    '  let (y,x) := 1',
    '  return (x)',
    '}',
    'program {',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:local-name-conflict')(
      'y',
      i18n('LocalParameter'),
      i18n('<position>')('(?)', 1, 14),
      i18n('LocalVariable'),
      i18n('<position>')('(?)', 2, 8),
    )
  );
});

it('Linter - Reject tuple assignment to index', () => {
  let code = [
    'program {',
    '  foreach i in [] {',
    '    let (x,i) := 1',
    '  }',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:local-name-conflict')(
      'i',
      i18n('LocalIndex'),
      i18n('<position>')('(?)', 2, 11),
      i18n('LocalVariable'),
      i18n('<position>')('(?)', 3, 12),
    )
  );
});

it('Linter - Reject repeated names in tuple assignment', () => {
  let code = [
    'program {',
    '  let (x,y,x) := 1',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:repeated-variable-in-tuple-assignment')('x')
  );
});

it('Linter - Reject procedure call named as constructor', () => {
  let code = [
    'type A is variant {',
    '  case B {}',
    '}',
    'program {',
    '  B()',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:constructor-used-as-procedure')('B', 'A')
  );
});

it('Linter - Reject undefined procedure call', () => {
  let code = [
    'program {',
    '  P()',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:undefined-procedure')('P')
  );
});

it('Linter - Accept defined procedure call', () => {
  let code = [
    'procedure P() {',
    '}',
    'program {',
    '  P()',
    '}',
  ].join('\n');
  expect(lint(code).program !== null).equals(true);
});

it('Linter - Reject procedure call if arity does not match', () => {
  let code = [
    'procedure P(n) {',
    '}',
    'program {',
    '  P()',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:procedure-arity-mismatch')('P', 1, 0)
  );
});

it('Linter - Switch: reject type used as constructor', () => {
  let code = [
    'type A is variant {',
    '  case A1 {}',
    '  case A2 {}',
    '  case A3 {}',
    '}',
    'program {',
    '  switch (1) {',
    '    A -> {}',
    '  }',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:type-used-as-constructor')('A', ['A1', 'A2', 'A3'])
  );
});

it('Linter - Switch: reject procedure used as constructor', () => {
  let code = [
    'procedure A() {',
    '}',
    'program {',
    '  switch (1) {',
    '    A(x,y) -> {}',
    '  }',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:procedure-used-as-constructor')('A')
  );
});

it('Linter - Switch: reject undeclared constructor', () => {
  let code = [
    'program {',
    '  switch (1) {',
    '    A() -> {}',
    '  }',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:undeclared-constructor')('A')
  );
});

it('Linter - Switch: accept pattern with 0 arguments', () => {
  let code = [
    'type T is variant {',
    '  case A {',
    '    field x',
    '    field y',
    '  }',
    '  case B {',
    '    field x',
    '  }',
    '}',
    'program {',
    '  switch (1) {',
    '    A -> {}',
    '  }',
    '}',
  ].join('\n');
  expect(lint(code).program !== null).equals(true);
});

it('Linter - Switch: reject pattern if arity does not match', () => {
  let code = [
    'type T is variant {',
    '  case A {',
    '    field x',
    '    field y',
    '  }',
    '  case B {',
    '    field x',
    '  }',
    '}',
    'program {',
    '  switch (1) {',
    '    A(x) -> {}',
    '  }',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:constructor-pattern-arity-mismatch')('A', 2, 1)
  );
});

it('Linter - Switch: accept pattern if arity matches', () => {
  let code = [
    'type T is variant {',
    '  case A {',
    '    field x',
    '    field y',
    '  }',
    '  case B {',
    '    field x',
    '  }',
    '}',
    'program {',
    '  switch (1) {',
    '    A(y,x) -> {}',
    '  }',
    '}',
  ].join('\n');
  expect(lint(code).program !== null).equals(true);
});

it('Linter - Switch: reject wildcard not at the end', () => {
  let code = [
    'type A is variant {',
    '  case A1 { field x }',
    '  case A2 { field x }',
    '}',
    'program {',
    '  switch (1) {',
    '    A1(x) -> {}',
    '    _    -> {}',
    '    A2(x) -> {}',
    '  }',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:wildcard-pattern-should-be-last')
  );
});

it('Linter - Switch: allow wildcard at the end, even if unreachable', () => {
  let code = [
    'type A is record {',
    '  field x',
    '}',
    'program {',
    '  switch (1) {',
    '    A(x) -> {}',
    '    _    -> {}',
    '  }',
    '}',
  ].join('\n');
  expect(lint(code).program !== null).equals(true);
});

it('Linter - Switch: reject repeated constructor patterns', () => {
  let code = [
    'type A is variant {',
    '  case A1 { field x }',
    '  case A2 { field x }',
    '}',
    'program {',
    '  switch (1) {',
    '    A2(y) -> {}',
    '    A1    -> {}',
    '    A2    -> {}',
    '    _     -> {}',
    '  }',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:constructor-pattern-repeats-constructor')('A2')
  );
});

it('Linter - Switch: reject repeated tuple patterns', () => {
  let code = [
    'program {',
    '  switch (1) {',
    '    (x,y) -> {}',
    '    (y,z) -> {}',
    '  }',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:constructor-pattern-repeats-tuple-arity')(2)
  );
});

it('Linter - Switch: reject repeated TIMEOUT patterns', () => {
  let code = [
    'interactive program {',
    '  TIMEOUT(1) -> {}',
    '  TIMEOUT(2) -> {}',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:constructor-pattern-repeats-timeout')
  );
});


it('Linter - Switch: reject constructor patterns of different types', () => {
  let code = [
    'type A is record {',
    '}',
    'type B is record {',
    '}',
    'program {',
    '  switch (1) {',
    '    A -> {}',
    '    B -> {}',
    '  }',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:pattern-does-not-match-type')('A', 'B')
  );
});

it('Linter - Switch: reject constructor pattern vs. tuple pattern', () => {
  let code = [
    'type A is record {',
    '}',
    'program {',
    '  switch (1) {',
    '    A  -> {}',
    '    () -> {}',
    '  }',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:pattern-does-not-match-type')(
      'A',
      i18n('<pattern-type>')('_TUPLE_0')
    )
  );
});

it('Linter - Switch: reject tuple patterns of different lengths', () => {
  let code = [
    'type A is record {',
    '}',
    'program {',
    '  switch (1) {',
    '    (x,y)   -> {}',
    '    (x,y,z) -> {}',
    '  }',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:pattern-does-not-match-type')(
      i18n('<pattern-type>')('_TUPLE_2'),
      i18n('<pattern-type>')('_TUPLE_3')
    )
  );
});

it('Linter - Switch: reject events outside interactive program', () => {
  let code = [
    'program {',
    '  switch (1) {',
    '    TIMEOUT(100) -> {}',
    '  }',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:patterns-in-switch-must-not-be-events')
  );
});

it('Linter - Switch: accept events and wildcards in interactive program', () => {
  let code = [
    'interactive program {',
    '  TIMEOUT(100) -> {}',
    '  _            -> {}',
    '}',
  ].join('\n');
  expect(lint(code).program !== null).equals(true);
});

it('Linter - Switch: reject non-events in interactive program', () => {
  let code = [
    'interactive program {',
    '  (x,y,z) -> {}',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:patterns-in-interactive-program-must-be-events')
  );
});

it('Linter - Switch: reject repeated names in constructor pattern', () => {
  let code = [
    'type A is record {',
    '  field x',
    '  field y',
    '}',
    'program {',
    '  switch (1) {',
    '    A(x, x) -> {}',
    '  }',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:local-name-conflict')(
      'x',
      i18n('LocalParameter'),
      i18n('<position>')('(?)', 7, 7),
      i18n('LocalParameter'),
      i18n('<position>')('(?)', 7, 10),
    )
  );
});

it('Linter - Switch: reject repeated names in tuple pattern', () => {
  let code = [
    'program {',
    '  switch (1) {',
    '    (foo, foo) -> {}',
    '  }',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:local-name-conflict')(
      'foo',
      i18n('LocalParameter'),
      i18n('<position>')('(?)', 3, 6),
      i18n('LocalParameter'),
      i18n('<position>')('(?)', 3, 11),
    )
  );
});

it('Linter - Switch: accept repeated names in disjoint patterns', () => {
  let code = [
    'type A is variant {',
    '  case B { field x }',
    '  case C { field x }',
    '}',
    'program {',
    '  switch (1) {',
    '    B(x) -> {}',
    '    C(x) -> {}',
    '  }',
    '}',
  ].join('\n');
  expect(lint(code).program !== null).equals(true);
});

it('Linter - Recursively lint statements', () => {
  let code = [
    'program {',
    '  {',
    '    if (1) {',
    '      if (2) {',
    '      } else {',
    '        repeat (1) {',
    '          foreach x in [1] {',
    '            while (1) {',
    '              switch (1) {',
    '                _ -> {',
    '                  P()',
    '                }',
    '              }',
    '            }',
    '          }',
    '        }',
    '      }',
    '    }',
    '  }',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:undefined-procedure')('P')
  );
});

it('Linter - Reject type used as constructor', () => {
  let code = [
    'type A is variant {',
    '  case B {}',
    '}',
    'program {',
    '  x := A()',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:type-used-as-constructor')('A', ['B'])
  );
});

it('Linter - Reject procedure used as constructor', () => {
  let code = [
    'procedure P() {',
    '}',
    'program {',
    '  x := P()',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:procedure-used-as-constructor')('P')
  );
});

it('Linter - Accept constructor with no arguments', () => {
  let code = [
    'procedure A() {',
    '}',
    'type A is record {',
    '}',
    'program {',
    '  x := A()',
    '}',
  ].join('\n');
  expect(lint(code).program !== null).equals(true);
});

it('Linter - Reject constructor instantiation with repeated fields', () => {
  let code = [
    'type A is record {',
    '  field x',
    '  field y',
    '}',
    'program {',
    '  x := A(x <- 1, y <- 2, x <- 1)',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:constructor-instantiation-repeated-field')('A', 'x')
  );
});

it('Linter - Reject constructor instantiation with invalid fields', () => {
  let code = [
    'type A is record {',
    '  field x',
    '  field y',
    '}',
    'program {',
    '  x := A(x <- 1, y <- 2, z <- 3)',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:constructor-instantiation-invalid-field')('A', 'z')
  );
});

it('Linter - Reject constructor instantiation with missing fields', () => {
  let code = [
    'type A is record {',
    '  field x',
    '  field y',
    '  field z',
    '}',
    'program {',
    '  x := A(x <- 1, z <- 3)',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:constructor-instantiation-missing-field')('A', 'y')
  );
});

it('Linter - Accept typical constructor instantiation', () => {
  let code = [
    'type A is record {',
    '  field x',
    '  field y',
    '  field z',
    '}',
    'program {',
    '  x := A(z <- 3, x <- 1, y <- 2)',
    '}',
  ].join('\n');
  expect(lint(code).program !== null).equals(true);
});

function tok(tag, value) {
  return new Token(tag, value, UnknownPosition, UnknownPosition);
}

it('Linter - Reject constructor instantiation of an _EVENT', () => {
  let code = [
    'program {',
    '  x := K_ENTER',
    '}',
  ].join('\n');
  let symtable = new SymbolTable();
  symtable.defType(
    new ASTDefType(tok(T_UPPERID, '_EVENT'), [
      new ASTConstructorDeclaration(tok(T_UPPERID, 'K_ENTER'), [
      ])
    ])
  );
  expect(
    () => new Linter(symtable).lint(new Parser(code).parse())
  ).throws(
    i18n('errmsg:constructor-instantiation-cannot-be-an-event')('K_ENTER')
  );
});

it('Linter - Reject constructor update with repeated fields', () => {
  let code = [
    'type A is record {',
    '  field x',
    '  field y',
    '}',
    'program {',
    '  x := A(x <- 1, y <- 2)',
    '  x := A(x | y <- 3, y <- 4)',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:constructor-instantiation-repeated-field')('A', 'y')
  );
});

it('Linter - Reject constructor update with invalid fields', () => {
  let code = [
    'type A is record {',
    '  field x',
    '  field y',
    '}',
    'program {',
    '  x := A(x <- 1, y <- 2)',
    '  x := A(x | z <- 3)',
    '}',
  ].join('\n');
  expect(() => lint(code)).throws(
    i18n('errmsg:constructor-instantiation-invalid-field')('A', 'z')
  );
});

it('Linter - Accept typical constructor update', () => {
  let code = [
    'type A is record {',
    '  field x',
    '  field y',
    '}',
    'program {',
    '  x := A(x <- 1, y <- 2)',
    '  x := A(x | y <- 3)',
    '}',
  ].join('\n');
  expect(lint(code).program !== null).equals(true);
});

