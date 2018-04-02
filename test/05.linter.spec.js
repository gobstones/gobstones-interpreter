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

function tok(tag, value) {
  return new Token(tag, value, UnknownPosition, UnknownPosition);
}

describe('Linter', () => {

  it('Accept completely empty source', () => {
    let code = '';
    let symtable = lint(code);
    expect(symtable.program === null).equals(true);
  });

  describe('Program definition', () => {

    it('Accept empty program', () => {
      let code = 'program {}';
      let symtable = lint(code);
      expect(symtable.program !== null).equals(true);
    });

    it('Accept empty interactive program', () => {
      let code = 'interactive program {}';
      let symtable = lint(code);
      expect(symtable.program !== null).equals(true);
    });

    it('Reject two programs', () => {
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

    it('Reject program + interactive program', () => {
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

    it('Reject source with definitions but without a program', () => {
      let code = 'function foo() { return (1) }';
      expect(() => lint(code)).throws(
        i18n('errmsg:source-should-have-a-program-definition')
      );
    });

  });

  describe('Procedure definition', () => {

    it('Accept single procedure definition', () => {
      let code = [
        'procedure P() {}',
        'program {}',
      ].join('\n');
      let symtable = lint(code);
      expect(symtable.program !== null).equals(true);
      expect(symtable.procedureDefinition('P') !== null).equals(true);
    });

    it('Reject procedure defined twice', () => {
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

    it('Accept definitions of two independent procedures', () => {
      let code = [
        'procedure P() {}',
        'procedure Q() {}',
        'program {}',
      ].join('\n');
      let symtable = lint(code);
      expect(symtable.program !== null).equals(true);
      expect(symtable.procedureDefinition('P') !== null).equals(true);
      expect(symtable.procedureDefinition('Q') !== null).equals(true);
    });

  });

  describe('Function definition', () => {

    it('Accept single function definition', () => {
      let code = [
        'function f() { return (1) }',
        'program {}',
      ].join('\n');
      let symtable = lint(code);
      expect(symtable.program !== null).equals(true);
      expect(symtable.functionDefinition('f') !== null).equals(true);
    });

    it('Reject function defined twice', () => {
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

    it('Accept definitions of two independent functions', () => {
      let code = [
        'function f() { return (1) }',
        'function g() { return (2) }',
        'program {}',
      ].join('\n');
      let symtable = lint(code);
      expect(symtable.program !== null).equals(true);
      expect(symtable.functionDefinition('f') !== null).equals(true);
      expect(symtable.functionDefinition('g') !== null).equals(true);
    });

  });

  describe('Type definition', () => {

    it('Accept single type definition', () => {
      let code = [
        'type A is record {}',
        'program {}',
      ].join('\n');
      let symtable = lint(code);
      expect(symtable.program !== null).equals(true);
      expect(symtable.typeDefinition('A') !== null).equals(true);
      expect(symtable.typeConstructors('A')).deep.equals(['A']);
      expect(symtable.constructorDeclaration('A') !== null).equals(true);
      expect(symtable.constructorType('A')).equals('A');
    });

    it('Reject type defined twice', () => {
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

    it('Accept definitions of two independent types', () => {
      let code = [
        'type A is record {}',
        'type B is variant {}',
        'type C is variant { case C1 {} case C2 {} case C3 {} }',
        'program {}',
      ].join('\n');
      let symtable = lint(code);
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

    it('Reject repeated constructors', () => {
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

    it('Accept repeated field names and reflect it on symbol table', () => {
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
      let symtable = lint(code);
      expect(symtable.constructorFields('A')).deep.equals(['x', 'y']);
      expect(symtable.constructorFields('A')).deep.equals(['x', 'y']);
      expect(symtable.constructorFields('B1')).deep.equals(['x', 'z']);
      expect(symtable.constructorFields('B2')).deep.equals(['y', 'z']);
      expect(symtable.constructorFields('C')).deep.equals([]);

      let dx = symtable.fieldDescriptor('x');
      expect(dx.length).equals(2);
      expect(dx[0].typeName).equals('A');
      expect(dx[0].constructorName).equals('A');
      expect(dx[0].index).equals(0);
      expect(dx[1].typeName).equals('B');
      expect(dx[1].constructorName).equals('B1');
      expect(dx[1].index).equals(0);

      let dy = symtable.fieldDescriptor('y');
      expect(dy.length).equals(2);
      expect(dy[0].typeName).equals('A');
      expect(dy[0].constructorName).equals('A');
      expect(dy[0].index).equals(1);
      expect(dy[1].typeName).equals('B');
      expect(dy[1].constructorName).equals('B2');
      expect(dy[1].index).equals(0);

      let dz = symtable.fieldDescriptor('z');
      expect(dz.length).equals(2);
      expect(dz[0].typeName).equals('B');
      expect(dz[0].constructorName).equals('B1');
      expect(dz[0].index).equals(1);
      expect(dz[1].typeName).equals('B');
      expect(dz[1].constructorName).equals('B2');
      expect(dz[1].index).equals(1);
    });

    it('Reject repeated field names for the same constructor', () => {
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

    it('Reject field named as a function', () => {
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

    it('Reject function named as a field', () => {
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

  });

  describe('Return statement', () => {

    it('Reject procedure with return', () => {
      let code = [
        'program {}',
        'procedure P() { }',
        'procedure Q() { return (1) }',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:procedure-should-not-have-return')('Q')
      );
    });

    it('Reject function without return', () => {
      let code = [
        'program {}',
        'function f() { return (1) }',
        'function g() { }',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:function-should-have-return')('g')
      );
    });

    it('Accept return in program.', () => {
      let code = [
        'program { return (1) }',
      ].join('\n');
      expect(lint(code).program !== null).equals(true);
    });

    it('Reject return in the middle of program', () => {
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

    it('Reject return in the middle of function', () => {
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

    it('Reject return in nested block', () => {
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

  });

  describe('Local names', () => {

    it('Reject repeated parameters in a function', () => {
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

    it('Reject repeated parameters in a procedure', () => {
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

    it('Accept repeated parameters in different routines', () => {
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

    it("Reject repeated indices in nested foreach's", () => {
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

    it("Allow repeated indices in independent foreach's", () => {
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

    it('Allow repeated assignments to a local variable', () => {
      let code = [
        'program {',
        '  x := 1',
        '  x := 2',
        '}',
      ].join('\n');
      expect(lint(code).program === null).equals(false);
    });

    it('Reject assignment to parameter', () => {
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

    it('Reject assignment to index', () => {
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

    it('Reject tuple assignment to parameter', () => {
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

    it('Reject tuple assignment to index', () => {
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

    it('Reject repeated names in tuple assignment', () => {
      let code = [
        'program {',
        '  let (x,y,x) := 1',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:repeated-variable-in-tuple-assignment')('x')
      );
    });

    it('Accept repeated local names in variable patterns', () => {
      let code = [
        'program {',
        '  switch (1) {',
        '    z -> {}',
        '  }',
        '  switch (1) {',
        '    z -> {}',
        '  }',
        '}',
      ].join('\n');
      expect(lint(code).program === null).equals(false);
    });

    it('Reject conflicting local names in variable pattern', () => {
      let code = [
        'program {',
        '  z := 1',
        '  switch (1) {',
        '    z -> {}',
        '  }',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:local-name-conflict')(
          'z',
          i18n('LocalVariable'),
          i18n('<position>')('(?)', 2, 3),
          i18n('LocalParameter'),
          i18n('<position>')('(?)', 4, 5),
        )
      );
    });

    it('Reject conflicting local names in nested variable pattern', () => {
      let code = [
        'program {',
        '  switch (1) {',
        '    foo -> {',
        '      switch (2) {',
        '        foo -> {}',
        '      }',
        '    }',
        '  }',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:local-name-conflict')(
          'foo',
          i18n('LocalParameter'),
          i18n('<position>')('(?)', 3, 5),
          i18n('LocalParameter'),
          i18n('<position>')('(?)', 5, 9),
        )
      );
    });

    it('Reject conflicting local names in structure pattern', () => {
      let code = [
        'type A is variant {',
        '  case B { field x }',
        '}',
        'program {',
        '  z := 1',
        '  switch (1) {',
        '    B(z) -> {}',
        '  }',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:local-name-conflict')(
          'z',
          i18n('LocalVariable'),
          i18n('<position>')('(?)', 5, 3),
          i18n('LocalParameter'),
          i18n('<position>')('(?)', 7, 7),
        )
      );
    });

    it('Reject conflicting local names in tuple pattern', () => {
      let code = [
        'program {',
        '  z := 1',
        '  switch (1) {',
        '    (x,y,z) -> {}',
        '  }',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:local-name-conflict')(
          'z',
          i18n('LocalVariable'),
          i18n('<position>')('(?)', 2, 3),
          i18n('LocalParameter'),
          i18n('<position>')('(?)', 4, 10),
        )
      );
    });

  });

  describe('Procedure and function calls', () => {

    it('Reject undefined procedure call (named as constructor)', () => {
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

    it('Reject undefined procedure call', () => {
      let code = [
        'program {',
        '  P()',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-procedure')('P')
      );
    });

    it('Accept defined procedure call', () => {
      let code = [
        'procedure P() {',
        '}',
        'program {',
        '  P()',
        '}',
      ].join('\n');
      expect(lint(code).program !== null).equals(true);
    });

    it('Reject procedure call if arity does not match', () => {
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

    it('Reject undefined function call', () => {
      let code = [
        'program {',
        '  x := f()',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('f')
      );
    });

    it('Reject function call if arity does not match', () => {
      let code = [
        'function f(x,y) { return (x) }',
        'program {',
        '  x := f(1)',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:function-arity-mismatch')('f', 2, 1)
      );
    });

    it('Reject function call if arity does not match (field)', () => {
      let code = [
        'type A is record {',
        '  field foo',
        '  field bar',
        '}',
        'program {',
        '  x := bar(1,2,3)',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:function-arity-mismatch')('bar', 1, 3)
      );
    });

  });

  describe('Pattern matching', () => {

    it('Accept wildcard pattern', () => {
      let code = [
        'program {',
        '  switch (1) {',
        '    _  -> {}',
        '  }',
        '}',
      ].join('\n');
      expect(lint(code).program !== null).equals(true);
    });

    it('Accept variable pattern', () => {
      let code = [
        'program {',
        '  switch (1) {',
        '    x  -> {}',
        '  }',
        '}',
      ].join('\n');
      expect(lint(code).program !== null).equals(true);
    });

    it('Accept numeric pattern', () => {
      let code = [
        'program {',
        '  switch (1) {',
        '    0  -> {}',
        '    1  -> {}',
        '    -1 -> {}',
        '  }',
        '}',
      ].join('\n');
      expect(lint(code).program !== null).equals(true);
    });

    it('Reject type used as structure pattern', () => {
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

    it('Reject procedure used as structure pattern', () => {
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

    it('Reject undeclared structure pattern', () => {
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

    it('Accept structure pattern with 0 arguments', () => {
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

    it('Reject structure pattern if arity does not match', () => {
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
        i18n('errmsg:structure-pattern-arity-mismatch')('A', 2, 1)
      );
    });

    it('Accept structure pattern if arity matches', () => {
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

    it('Reject wildcard pattern not on the last branch', () => {
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

    it('Reject variable pattern not on the last branch', () => {
      let code = [
        'type A is variant {',
        '  case A1 { field x }',
        '  case A2 { field x }',
        '}',
        'program {',
        '  switch (1) {',
        '    A1(x) -> {}',
        '    z    -> {}',
        '    A2(x) -> {}',
        '  }',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:variable-pattern-should-be-last')('z')
      );
    });

    it('Allow wildcard pattern on the last branch, even if unreachable', () => {
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

    it('Allow variable pattern on the last branch, even if unreachable', () => {
      let code = [
        'type A is record {',
        '  field x',
        '}',
        'program {',
        '  switch (1) {',
        '    A(x) -> {}',
        '    z    -> {}',
        '  }',
        '}',
      ].join('\n');
      expect(lint(code).program !== null).equals(true);
    });

    it('Reject repeated number patterns (positive number)', () => {
      let code = [
        'program {',
        '  switch (1) {',
        '    3  -> {}',
        '    2  -> {}',
        '    -3 -> {}',
        '    2  -> {}',
        '  }',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:numeric-pattern-repeats-number')('2')
      );
    });

    it('Reject repeated number patterns (negative number)', () => {
      let code = [
        'program {',
        '  switch (1) {',
        '    -3  -> {}',
        '    2  -> {}',
        '    -3 -> {}',
        '    2  -> {}',
        '  }',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:numeric-pattern-repeats-number')('-3')
      );
    });

    it('Reject repeated structure patterns', () => {
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
        i18n('errmsg:structure-pattern-repeats-constructor')('A2')
      );
    });

    it('Reject repeated tuple patterns', () => {
      let code = [
        'program {',
        '  switch (1) {',
        '    (x,y) -> {}',
        '    (y,z) -> {}',
        '  }',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:structure-pattern-repeats-tuple-arity')(2)
      );
    });

    it('Reject repeated TIMEOUT patterns', () => {
      let code = [
        'interactive program {',
        '  ' + i18n('CONS:TIMEOUT') + '(1) -> {}',
        '  ' + i18n('CONS:TIMEOUT') + '(2) -> {}',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:structure-pattern-repeats-timeout')
      );
    });

    it('Reject numeric pattern vs. structure pattern', () => {
      let code = [
        'type A is record {',
        '}',
        'program {',
        '  switch (1) {',
        '    A -> {}',
        '    -2 -> {}',
        '  }',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:pattern-does-not-match-type')('A', i18n('TYPE:Integer'))
      );
    });

    it('Reject numeric pattern vs. tuple pattern', () => {
      let code = [
        'program {',
        '  switch (1) {',
        '    1233456789 -> {}',
        '    (x, y) -> {}',
        '  }',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:pattern-does-not-match-type')(
          i18n('TYPE:Integer'),
          i18n('<pattern-type>')('_TUPLE_2')
        )
      );
    });

    it('Reject structure patterns of different types', () => {
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

    it('Reject structure pattern vs. tuple pattern', () => {
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

    it('Reject tuple patterns of different lengths', () => {
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

    it('Reject event patterns outside interactive program', () => {
      let code = [
        'program {',
        '  switch (1) {',
        '    ' + i18n('CONS:TIMEOUT') + '(100) -> {}',
        '  }',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:patterns-in-switch-must-not-be-events')
      );
    });

    it('Accept event patterns and wildcards in interactive program', () => {
      let code = [
        'interactive program {',
        '  ' + i18n('CONS:TIMEOUT') + '(100) -> {}',
        '  _            -> {}',
        '}',
      ].join('\n');
      expect(lint(code).program !== null).equals(true);
    });

    it('Reject non-event patterns in interactive program', () => {
      let code = [
        'interactive program {',
        '  (x,y,z) -> {}',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:patterns-in-interactive-program-must-be-events')
      );
    });

    it('Reject repeated parameter names in structure pattern', () => {
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

    it('Reject repeated parameter names in tuple pattern', () => {
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

    it('Accept repeated parameter names in disjoint patterns', () => {
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

  });

  describe('Structure construction and update', () => {

    it('Reject type used as constructor', () => {
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

    it('Reject procedure used as constructor', () => {
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

    it('Accept constructor with no arguments', () => {
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

    it('Reject structure construction with repeated fields', () => {
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
        i18n('errmsg:structure-construction-repeated-field')('A', 'x')
      );
    });

    it('Reject structure construction with invalid fields', () => {
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
        i18n('errmsg:structure-construction-invalid-field')('A', 'z')
      );
    });

    it('Reject structure construction with missing fields', () => {
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
        i18n('errmsg:structure-construction-missing-field')('A', 'y')
      );
    });

    it('Accept typical structure construction', () => {
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

    it('Reject structure construction of an Event', () => {
      let code = [
        'program {',
        '  x := K_ENTER',
        '}',
      ].join('\n');
      let symtable = new SymbolTable();
      symtable.defType(
        new ASTDefType(tok(T_UPPERID, i18n('TYPE:Event')), [
          new ASTConstructorDeclaration(tok(T_UPPERID, 'K_ENTER'), [
          ])
        ])
      );
      expect(
        () => new Linter(symtable).lint(new Parser(code).parse())
      ).throws(
        i18n('errmsg:structure-construction-cannot-be-an-event')('K_ENTER')
      );
    });

    it('Reject structure update with repeated fields', () => {
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
        i18n('errmsg:structure-construction-repeated-field')('A', 'y')
      );
    });

    it('Reject structure update with invalid fields', () => {
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
        i18n('errmsg:structure-construction-invalid-field')('A', 'z')
      );
    });

    it('Accept typical structure update', () => {
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

  });

  describe('Lint recursively', () => {

    it('Recursively lint statements', () => {
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

    it('Recursively lint expressions (return)', () => {
      let code = [
        'program {',
        '  return (foo())',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('foo')
      );
    });

    it('Recursively lint expressions (if)', () => {
      let code = [
        'program {',
        '  if (foo()) {}',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('foo')
      );
    });

    it('Recursively lint expressions (repeat)', () => {
      let code = [
        'program {',
        '  repeat (foo()) {}',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('foo')
      );
    });

    it('Recursively lint expressions (foreach)', () => {
      let code = [
        'program {',
        '  foreach i in foo() {}',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('foo')
      );
    });

    it('Recursively lint expressions (while)', () => {
      let code = [
        'program {',
        '  while (foo()) {}',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('foo')
      );
    });

    it('Recursively lint expressions (switch)', () => {
      let code = [
        'program {',
        '  switch (foo()) {}',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('foo')
      );
    });

    it('Recursively lint expressions (variable assignment)', () => {
      let code = [
        'program {',
        '  x := foo()',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('foo')
      );
    });

    it('Recursively lint expressions (tuple assignment)', () => {
      let code = [
        'program {',
        '  let (x, y) := foo()',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('foo')
      );
    });

    it('Recursively lint expressions (procedure call)', () => {
      let code = [
        'procedure P(x,y) {}',
        'program {',
        '  P(1, foo())',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('foo')
      );
    });

    it('Recursively lint expressions (choose: condition)', () => {
      let code = [
        'program {',
        '  x := choose 1 when (foo())',
        '              2 otherwise',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('foo')
      );
    });

    it('Recursively lint expressions (choose: true branch)', () => {
      let code = [
        'program {',
        '  x := choose foo() when (1)',
        '              2 otherwise',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('foo')
      );
    });

    it('Recursively lint expressions (choose: false branch)', () => {
      let code = [
        'program {',
        '  x := choose 1 when (2)',
        '              foo() otherwise',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('foo')
      );
    });

    it('Recursively lint expressions (choose: nested condition)', () => {
      let code = [
        'program {',
        '  x := choose 1 when (2)',
        '              3 when (foo())',
        '              4 otherwise',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('foo')
      );
    });

    it('Recursively lint expressions (choose: nested true branch)', () => {
      let code = [
        'program {',
        '  x := choose 1 when (2)',
        '              foo() when (3)',
        '              4 otherwise',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('foo')
      );
    });

    it('Recursively lint expressions (range: first)', () => {
      let code = [
        'program {',
        '  x := [foo()..100]',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('foo')
      );
    });

    it('Recursively lint expressions (range: second)', () => {
      let code = [
        'program {',
        '  x := [1,foo()..100]',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('foo')
      );
    });

    it('Recursively lint expressions (range: last)', () => {
      let code = [
        'program {',
        '  x := [1..foo()]',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('foo')
      );
    });

    it('Recursively lint expressions (more expressions)', () => {
      let code = [
        'type A is record { field x field y }',
        'function g(x, y) { return (x) }',
        'program {',
        '  a := A(x <- 1, y <- 2)',
        '  x := [(1,2), (3,4), (5,',
        '    A(x <- 1, y <- A(a | y <- g(1, g(foo(), 2))))',
        '  )]',
        '}',
      ].join('\n');
      expect(() => lint(code)).throws(
        i18n('errmsg:undefined-function')('foo')
      );
    });

  });

});
