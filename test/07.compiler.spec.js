import chai from 'chai';

import { typesWithOrder } from '../src/runtime';
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
          new TypeStructure(i18n('TYPE:Bool'), {}),
          new TypeInteger(),
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
          new TypeStructure(i18n('TYPE:Bool'), {}),
          new TypeStructure('B', {'B': {'x': new TypeInteger()}}),
        )
      );
    });

    it('Chain of "elseif"s', () => {
      let result = new Runner().run([
        'function f(x) {',
        '  if (x == 1) {',
        '    y := "a"',
        '  } elseif (x == 2) {',
        '    y := "b"',
        '  } elseif (x == 3) {',
        '    y := "c"',
        '  } else {',
        '    y := "d"',
        '  }',
        '  return (y)',
        '}',
        'function g(x) {',
        '  y := "D"',
        '  if (x == 1) {',
        '    y := "A"',
        '  } elseif (x == 2) {',
        '    y := "B"',
        '  } elseif (x == 3) {',
        '    y := "C"',
        '  }',
        '  return (y)',
        '}',
        'program {',
        '  return (',
        '    (f(1), f(2), f(3), f(4))',
        '  ,',
        '    (g(1), g(2), g(3), g(4))',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueTuple([
            new ValueString("a"),
            new ValueString("b"),
            new ValueString("c"),
            new ValueString("d"),
          ]),
          new ValueTuple([
            new ValueString("A"),
            new ValueString("B"),
            new ValueString("C"),
            new ValueString("D"),
          ]),
        ])
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

    it('Foreach (destructuring): wildcard pattern', () => {
      let result = new Runner().run([
        '/*@LANGUAGE@DestructuringForeach@*/',
        'program {',
        '  x := 0',
        '  foreach _ in [1, 2, 3] {',
        '    x := 2 * x',
        '    foreach _ in [4, 5] {',
        '      x := x + 1',
        '    }',
        '  }',
        '  return (x)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(14));
    });

    it('Foreach (destructuring): numeric pattern', () => {
      let result = new Runner().run([
        '/*@LANGUAGE@DestructuringForeach@*/',
        'program {',
        '  x := 0',
        '  foreach -12 in [2 * -6, -1 * 12, -6 - 6] {',
        '    x := x + 1',
        '  }',
        '  return (x)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(3));
    });

    it('Foreach (destructuring): numeric pattern -- mismatch', () => {
      let result = () => new Runner().run([
        '/*@LANGUAGE@DestructuringForeach@*/',
        'program {',
        '  x := 0',
        '  foreach -12 in [12] {',
        '    x := x + 1',
        '  }',
        '  return (x)',
        '}',
      ].join('\n'));
      expect(result).throws(i18n('errmsg:foreach-pattern-does-not-match'));
    });

    it('Foreach (destructuring): tuple pattern', () => {
      let result = new Runner().run([
        '/*@LANGUAGE@DestructuringForeach@*/',
        'program {',
        '  lx := []',
        '  ly := []',
        '  foreach (x, y) in [(1, "a"), (2, "b"), (3, "c")] {',
        '    lx := lx ++ [x]',
        '    ly := ly ++ [y]',
        '  }',
        '  return (lx, ly)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueList([
            new ValueInteger(1),
            new ValueInteger(2),
            new ValueInteger(3)
          ]),
          new ValueList([
            new ValueString("a"),
            new ValueString("b"),
            new ValueString("c")
          ]),
        ])
      );
    });

    it('Foreach (destructuring): tuple pattern -- type mismatch', () => {
      let result = () => new Runner().run([
        '/*@LANGUAGE@DestructuringForeach@*/',
        'program {',
        '  foreach (x, y) in [()] {',
        '  }',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeTuple([new TypeAny(), new TypeAny()]),
          new TypeTuple([])
        )
      );
    });

    it('Foreach (destructuring): structure pattern', () => {
      let result = new Runner().run([
        '/*@LANGUAGE@DestructuringForeach@*/',
        'type A is record {',
        '  field ax',
        '  field ay',
        '}',
        'program {',
        '  lx := []',
        '  ly := []',
        '  foreach A(x, y) in [',
        '      A(ax <- 1, ay <- "a"),',
        '      A(ax <- 2, ay <- "b"),',
        '      A(ax <- 3, ay <- "c")',
        '  ] {',
        '    lx := lx ++ [x]',
        '    ly := ly ++ [y]',
        '  }',
        '  return (lx, ly)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueList([
            new ValueInteger(1),
            new ValueInteger(2),
            new ValueInteger(3)
          ]),
          new ValueList([
            new ValueString("a"),
            new ValueString("b"),
            new ValueString("c")
          ]),
        ])
      );
    });

    it('Foreach (destructuring): structure pattern --- variant', () => {
      let result = new Runner().run([
        '/*@LANGUAGE@DestructuringForeach@*/',
        'type A is variant {',
        '  case B {',
        '    field x',
        '  }',
        '  case C {',
        '    field x',
        '  }',
        '}',
        'program {',
        '  y := 0',
        '  foreach B(x) in [B(x <- 100), B(x <- 1)] {',
        '    y := y + x',
        '  }',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(101));
    });

    it('Foreach (destructuring): structure pattern --- no match', () => {
      let result = () => new Runner().run([
        '/*@LANGUAGE@DestructuringForeach@*/',
        'type A is variant {',
        '  case B {',
        '    field x',
        '  }',
        '  case C {',
        '    field x',
        '  }',
        '}',
        'program {',
        '  y := 0',
        '  foreach B(x) in [B(x <- 100), C(x <- 1)] {',
        '    y := y + x',
        '  }',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).throws(i18n('errmsg:foreach-pattern-does-not-match'));
    });

    it('Foreach (destructuring): unbind variables -- empty list', () => {
      let result = new Runner().run([
        '/*@LANGUAGE@DestructuringForeach@*/',
        'program {',
        '  z := 0',
        '  foreach (x,y) in [] {',
        '    z := z + x * y',
        '  }',
        '  return (z)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(0));
    });

    it('Foreach (destructuring): unbind variables -- non-empty list', () => {
      let result = () => new Runner().run([
        '/*@LANGUAGE@DestructuringForeach@*/',
        'program {',
        '  z := [1,2,3]',
        '  foreach (x,y) in [] {',
        '    z := z + x * y',
        '  }',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).throws(i18n('errmsg:undefined-variable')('y'));
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

  describe('Statements: switch', () => {

    it('Switch: match with default case', () => {
      let result = new Runner().run([
        'program {',
        '  switch ((1,2,3)) {',
        '    _ -> { x := 42 }',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(42));
    });

    it('Switch: match variable', () => {
      let result = new Runner().run([
        'program {',
        '  switch ((1,2,3)) {',
        '    z -> { x := z }',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueInteger(1),
          new ValueInteger(2),
          new ValueInteger(3)
        ])
      );
    });

    it('Switch: empty switch (no match)', () => {
      let result = () => new Runner().run([
        'program {',
        '  switch ((1,2,3)) {',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).throws(i18n('errmsg:switch-does-not-match'));
    });

    it('Switch: match empty tuple', () => {
      let result = new Runner().run([
        'program {',
        '  switch (()) {',
        '    () -> { x := 42 }',
        '    _  -> { x := z }',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(42));
    });

    it('Switch: match non-empty tuple', () => {
      let result = new Runner().run([
        'program {',
        '  switch ((1, 2, 3)) {',
        '    (a, b, c) -> { x := (c, b, a) }',
        '    _  -> { x := z }',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueInteger(3),
          new ValueInteger(2),
          new ValueInteger(1),
        ])
      );
    });

    it('Switch: check that parameters of tuples are unbound', () => {
      let result = () => new Runner().run([
        'program {',
        '  switch ((1, 2, 3)) {',
        '    (a, b, c) -> { x := (b, c) }',
        '    _  -> { x := z }',
        '  }',
        '  y := a',
        '}',
      ].join('\n'));
      expect(result).throws(i18n('errmsg:undefined-variable')('a'));
    });

    it('Switch: fail if type does not match type of tuple pattern', () => {
      let result = () => new Runner().run([
        'program {',
        '  switch ((1, 2)) {',
        '    (x, y, z) -> { }',
        '  }',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeTuple([
            new TypeAny(),
            new TypeAny(),
            new TypeAny(),
          ]),
          new TypeTuple([
            new TypeInteger(),
            new TypeInteger(),
          ])
        )
      );
    });

    it('Switch: match number', () => {
      let result = new Runner().run([
        'function f(x) {',
        '  switch (- - -x) {',
        '    -1 -> { y := "a" }',
        '     0 -> { y := "b" }',
        '     1 -> { y := "c" }',
        '     123456789123456789123456789 -> { y := "e" }',
        '     -123456789123456789123456789 -> { y := "f" }',
        '     _ -> { y := "d" }',
        '  }',
        '  return (y)',
        '}',
        'program {',
        '  return (',
        '    f(2),',
        '    f(1),',
        '    f(0),',
        '    f(-1),',
        '    f(-2),',
        '    f(123456789123456789123456789),',
        '    f(-123456789123456789123456789)',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueString("d"),
          new ValueString("a"),
          new ValueString("b"),
          new ValueString("c"),
          new ValueString("d"),
          new ValueString("f"),
          new ValueString("e"),
        ])
      );
    });

    it('Switch: match record with no parameters', () => {
      let result = new Runner().run([
        'type A is record {',
        '  field aa',
        '  field bb',
        '  field cc',
        '}',
        'program {',
        '  switch (A(cc <- 3, bb <- 2, aa <- 1)) {',
        '    A -> { x := 42 }',
        '    _ -> { x := z }',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(42));
    });

    it('Switch: match record with parameters', () => {
      let result = new Runner().run([
        'type A is record {',
        '  field aa',
        '  field bb',
        '  field cc',
        '}',
        'program {',
        '  switch (A(cc <- 3, bb <- 2, aa <- 1)) {',
        '    A(a, b, c) -> { x := (b, a, c) }',
        '    _ -> { x := z }',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueInteger(2),
          new ValueInteger(1),
          new ValueInteger(3),
        ])
      );
    });

    it('Switch: match variant with no parameters', () => {
      let result = new Runner().run([
        'type V is variant {',
        '  case A {',
        '    field aa',
        '    field bb',
        '    field cc',
        '  }',
        '  case B {',
        '    field aa',
        '    field bb',
        '    field cc',
        '  }',
        '  case C {',
        '    field aa',
        '    field bb',
        '    field cc',
        '  }',
        '}',
        'program {',
        '  switch (B(cc <- 3, bb <- 2, aa <- 1)) {',
        '    A -> { x := z }',
        '    B -> { x := 42 }',
        '    _ -> { x := z }',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(42));
    });

    it('Switch: match variant with parameters', () => {
      let result = new Runner().run([
        'type V is variant {',
        '  case A {',
        '    field aa',
        '    field bb',
        '    field cc',
        '  }',
        '  case B {',
        '    field aa',
        '    field bb',
        '    field cc',
        '  }',
        '  case C {',
        '    field aa',
        '    field bb',
        '    field cc',
        '  }',
        '}',
        'program {',
        '  switch (B(cc <- 3, bb <- 2, aa <- 1)) {',
        '    A(a, b, c) -> { x := z }',
        '    B(a, b, c) -> { x := (b, c, a) }',
        '    _ -> { x := z }',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueInteger(2),
          new ValueInteger(3),
          new ValueInteger(1),
        ])
      );
    });

    it('Switch: match with default case in variant', () => {
      let result = new Runner().run([
        'type V is variant {',
        '  case A {',
        '    field aa',
        '    field bb',
        '    field cc',
        '  }',
        '  case B {',
        '    field aa',
        '    field bb',
        '    field cc',
        '  }',
        '  case C {',
        '    field aa',
        '    field bb',
        '    field cc',
        '  }',
        '}',
        'program {',
        '  switch (C(cc <- 3, bb <- 2, aa <- 1)) {',
        '    A(a, b, c) -> { x := z }',
        '    B(a, b, c) -> { x := z }',
        '    _ -> { x := 42 }',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(42));
    });


    it('Switch: fail when variant does not match', () => {
      let result = () => new Runner().run([
        'type V is variant {',
        '  case A {',
        '    field aa',
        '    field bb',
        '    field cc',
        '  }',
        '  case B {',
        '    field aa',
        '    field bb',
        '    field cc',
        '  }',
        '  case C {',
        '    field aa',
        '    field bb',
        '    field cc',
        '  }',
        '}',
        'program {',
        '  switch (C(cc <- 3, bb <- 2, aa <- 1)) {',
        '    A(a, b, c) -> { x := z }',
        '    B(a, b, c) -> { x := z }',
        '  }',
        '  y := x',
        '  return (y)',
        '}',
      ].join('\n'));
      expect(result).throws(i18n('errmsg:switch-does-not-match'));
    });

    it('Switch: check that parameters of structures are unbound', () => {
      let result = () => new Runner().run([
        'type A is record {',
        '  field a',
        '  field b',
        '  field c',
        '}',
        'program {',
        '  switch (A(a <- 1, b <- 2, c <- 3)) {',
        '    A(a, b, c) -> { x := (b, c) }',
        '    _  -> { x := z }',
        '  }',
        '  y := a',
        '}',
      ].join('\n'));
      expect(result).throws(i18n('errmsg:undefined-variable')('a'));
    });

    it('Switch: fail if type does not match type of numeric pattern', () => {
      let result = () => new Runner().run([
        'program {',
        '  switch ([1, 2, 3]) {',
        '    10 -> { }',
        '  }',
        '}',
      ]);
      expect(result).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeInteger(),
          new TypeList(new TypeInteger()),
        )
      );
    });

    it('Switch: fail if type does not match type of structure pattern', () => {
      let result = () => new Runner().run([
        'type A is record {',
        '  field aa',
        '}',
        'type B is record {',
        '  field aa',
        '}',
        'program {',
        '  switch (A(aa <- 1)) {',
        '    B -> { }',
        '  }',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeStructure('B', {}),
          new TypeStructure('A', {'A': {'aa': new TypeInteger()}}),
        )
      );
    });

  });

  describe('Statements: tuple assignment', () => {

    it('Tuple assignment: empty tuple', () => {
      let result = new Runner().run([
        'program {',
        '  t := ()',
        '  let () := t',
        '  return (42)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(42));
    });

    it('Tuple assignment: typical tuple assignment', () => {
      let result = new Runner().run([
        'program {',
        '  t := (1, 2, 3)',
        '  let (x, y, z) := t',
        '  return ((z, y, x))',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueInteger(3),
          new ValueInteger(2),
          new ValueInteger(1),
        ])
      );
    });

    it('Tuple assignment: fail if types do not match', () => {
      let result = () => new Runner().run([
        'program {',
        '  t := (1, 2, 3)',
        '  let (x, y) := t',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeTuple([
            new TypeAny(),
            new TypeAny(),
          ]),
          new TypeTuple([
            new TypeInteger(),
            new TypeInteger(),
            new TypeInteger(),
          ]),
        )
      );
    });

  });

  describe('Statements: procedure call', () => {

    it('Calling primitive procedures', () => {
      let result = new Runner().run([
        'program {',
        '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
        '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
        '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
        '  return (',
        '    ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color0') + ')',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(3));
    });

    it('Calling primitive procedures: check argument types', () => {
      let result = () => new Runner().run([
        'program {',
        '  ' + i18n('PRIM:PutStone') + '(1)',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:primitive-argument-type-mismatch')(
          i18n('PRIM:PutStone'),
          1,
          1,
          new TypeStructure(i18n('TYPE:Color'), {}),
          new TypeInteger(),
        )
      );
    });

    it('Calling user-defined procedures', () => {
      let result = new Runner().run([
        'procedure Q() {',
        '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
        '}',
        'procedure P() {',
        '  Q() Q()',
        '}',
        'program {',
        '  P() P() P() P() P()',
        '  return (',
        '    ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color0') + ')',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(10));
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

  describe('Expressions: conditional (choose)', () => {

    describe('Choose: true branch', () => {
      let result = new Runner().run([
        'program {',
        '  x := choose 5 + 5 when (' + i18n('CONS:True') + ')',
        '              20 div 0 otherwise',
        '  return (x)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(10));
    });

    describe('Choose: false branch', () => {
      let result = new Runner().run([
        'program {',
        '  x := choose 10 div 0 when (1 == 2)',
        '              20 otherwise',
        '  return (x)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(20));
    });

    describe('Choose: short-circuiting for nested conditions', () => {
      let result = new Runner().run([
        'program {',
        '  x := choose 10 when (' + i18n('CONS:True') + ')',
        '              20 div 0 when (55 div 0)',
        '              30 div 0 otherwise',
        '  return (x)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(10));
    });

    describe('Choose: nested true branch', () => {
      let result = new Runner().run([
        'program {',
        '  x := choose 10 div 0 when (' + i18n('CONS:False') + ')',
        '              20 when (' + i18n('CONS:True') + ')',
        '              30 div 0 otherwise',
        '  return (x)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(20));
    });

    describe('Choose: nested false branch', () => {
      let result = new Runner().run([
        'program {',
        '  x := choose 10 div 0 when (' + i18n('CONS:False') + ')',
        '              20 div 0 when (' + i18n('CONS:False') + ')',
        '              30 otherwise',
        '  return (x)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueInteger(30));
    });

    describe('Choose: reject if condition not a boolean', () => {
      let result = () => new Runner().run([
        'program {',
        '  x := choose 10 when (55)',
        '              20 otherwise',
        '  return (x)',
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

  describe('Expressions: range (without second element)', () => {

    it('Integer range', () => {
      let result = new Runner().run([
        'program {',
        '  return (',
        '    [1..0],',
        '    [1..1],',
        '    [-2..2]',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueList([]),
          new ValueList([new ValueInteger(1)]),
          new ValueList([
            new ValueInteger(-2),
            new ValueInteger(-1),
            new ValueInteger(0),
            new ValueInteger(1),
            new ValueInteger(2),
          ])
        ])
      );
    });

    it('Boolean range', () => {
      let result = new Runner().run([
        'program {',
        '  return (',
        '      [' + i18n('CONS:False') + '..' + i18n('CONS:False') + '],',
        '      [' + i18n('CONS:False') + '..' + i18n('CONS:True') + '],',
        '      [' + i18n('CONS:True') + '..' + i18n('CONS:False') + '],',
        '      [' + i18n('CONS:True') + '..' + i18n('CONS:True') + ']',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueList([
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {})
          ]),
          new ValueList([
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
          ]),
          new ValueList([
          ]),
          new ValueList([
            new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {})
          ]),
        ])
      );
    });

    it('Color range', () => {
      let result = new Runner().run([
        'program {',
        '  return (',
        '      [' + i18n('CONS:Color0') + '..' + i18n('CONS:Color3') + '],',
        '      [' + i18n('CONS:Color1') + '..' + i18n('CONS:Color2') + '],',
        '      [' + i18n('CONS:Color2') + '..' + i18n('CONS:Color2') + '],',
        '      [' + i18n('CONS:Color3') + '..' + i18n('CONS:Color0') + ']',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueList([
            new ValueStructure(i18n('TYPE:Color'), i18n('CONS:Color0'), {}),
            new ValueStructure(i18n('TYPE:Color'), i18n('CONS:Color1'), {}),
            new ValueStructure(i18n('TYPE:Color'), i18n('CONS:Color2'), {}),
            new ValueStructure(i18n('TYPE:Color'), i18n('CONS:Color3'), {}),
          ]),
          new ValueList([
            new ValueStructure(i18n('TYPE:Color'), i18n('CONS:Color1'), {}),
            new ValueStructure(i18n('TYPE:Color'), i18n('CONS:Color2'), {}),
          ]),
          new ValueList([
            new ValueStructure(i18n('TYPE:Color'), i18n('CONS:Color2'), {}),
          ]),
          new ValueList([
          ]),
        ])
      );
    });

    it('Dir range', () => {
      let result = new Runner().run([
        'program {',
        '  return (',
        '      [' + i18n('CONS:Dir0') + '..' + i18n('CONS:Dir2') + '],',
        '      [' + i18n('CONS:Dir1') + '..' + i18n('CONS:Dir3') + '],',
        '      [' + i18n('CONS:Dir3') + '..' + i18n('CONS:Dir3') + '],',
        '      [' + i18n('CONS:Dir2') + '..' + i18n('CONS:Dir1') + ']',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueList([
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir0'), {}),
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir1'), {}),
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir2'), {}),
          ]),
          new ValueList([
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir1'), {}),
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir2'), {}),
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir3'), {}),
          ]),
          new ValueList([
            new ValueStructure(i18n('TYPE:Dir'), i18n('CONS:Dir3'), {}),
          ]),
          new ValueList([
          ]),
        ])
      );
    });

    it('Fail if types do not match', () => {
      let result = () => new Runner().run([
        'program {',
        '  return ([1..' + i18n('CONS:Color2') + '])',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:expected-values-to-have-compatible-types')(
          new TypeInteger(),
          new ValueStructure(i18n('TYPE:Color'), i18n('CONS:Color2'), {}).type()
        )
      );
    });

    it('Fail for other types', () => {
      let result = () => new Runner().run([
        'program {',
        '  return (["a".."b"])',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:expected-value-of-some-type-but-got')(
          typesWithOrder(),
          new TypeString()
        )
      );
    });

  });

  describe('Expressions: range (with second element)', () => {

    it('Integer range', () => {
      let result = new Runner().run([
        'program {',
        '  return (',
        '    [1,1..10],',
        '    [1,0..10],',
        '    [1,2..10],',
        '    [1,3..10],',
        '    [1,4..10],',
        '    [1,7..10],',
        '    [1,3..0],',
        '    [1,3..1],',
        '    [1,3..2],',
        '    [1,3..3],',
        '    [2,2..5],',
        '    [2,3..5],',
        '    [-1,0..1],',
        '    [-1,1..5]',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueTuple([
          new ValueList([]), /* [1,1..10] */
          new ValueList([]), /* [1,0..10] */
          new ValueList([    /* [1,2..10] */
            new ValueInteger(1),
            new ValueInteger(2),
            new ValueInteger(3),
            new ValueInteger(4),
            new ValueInteger(5),
            new ValueInteger(6),
            new ValueInteger(7),
            new ValueInteger(8),
            new ValueInteger(9),
            new ValueInteger(10),
          ]),
          new ValueList([    /* [1,3..10] */
            new ValueInteger(1),
            new ValueInteger(3),
            new ValueInteger(5),
            new ValueInteger(7),
            new ValueInteger(9),
          ]),
          new ValueList([    /* [1,4..10] */
            new ValueInteger(1),
            new ValueInteger(4),
            new ValueInteger(7),
            new ValueInteger(10),
          ]),
          new ValueList([    /* [1,7..10] */
            new ValueInteger(1), new ValueInteger(7),
          ]),
          new ValueList([    /* [1,3..0] */
          ]),
          new ValueList([    /* [1,3..1] */
            new ValueInteger(1),
          ]),
          new ValueList([    /* [1,3..2] */
            new ValueInteger(1),
          ]),
          new ValueList([    /* [1,3..3] */
            new ValueInteger(1),
            new ValueInteger(3),
          ]),
          new ValueList([    /* [2,2..5] */
          ]),
          new ValueList([    /* [2,3..5] */
            new ValueInteger(2),
            new ValueInteger(3),
            new ValueInteger(4),
            new ValueInteger(5),
          ]),
          new ValueList([    /* [-1,0..1] */
            new ValueInteger(-1),
            new ValueInteger(0),
            new ValueInteger(1),
          ]),
          new ValueList([    /* [-1,1..5] */
            new ValueInteger(-1),
            new ValueInteger(1),
            new ValueInteger(3),
            new ValueInteger(5),
          ]),
        ])
      );
    });

    it('Fail for other types', () => {
      let result = () => new Runner().run([
        'program {',
        '  return (["a","b".."c"])',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:expected-value-of-some-type-but-got')(
          [new TypeInteger()],
          new TypeString()
        )
      );
    });

  });

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

  describe('Expressions: structure construction', () => {

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

  describe('Expressions: structure update', () => {

    it('Record update: no field changes', () => {
      let result = new Runner().run([
        'type A is record {',
        '  field a',
        '  field b',
        '  field c',
        '}',
        'program {',
        '  x := A(a <- 1, b <- 2, c <- 3)',
        '  return (A(x |))',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueStructure('A', 'A', {
          'a': new ValueInteger(1),
          'b': new ValueInteger(2),
          'c': new ValueInteger(3),
        })
      );
    });

    it('Record update: single field', () => {
      let result = new Runner().run([
        'type A is record {',
        '  field a',
        '  field b',
        '  field c',
        '}',
        'program {',
        '  x := A(a <- 1, b <- 2, c <- 3)',
        '  return (A(x | b <- 20))',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueStructure('A', 'A', {
          'a': new ValueInteger(1),
          'b': new ValueInteger(20),
          'c': new ValueInteger(3),
        })
      );
    });

    it('Record update: many fields', () => {
      let result = new Runner().run([
        'type A is record {',
        '  field a',
        '  field b',
        '  field c',
        '}',
        'program {',
        '  x := A(a <- 1, b <- 2, c <- 3)',
        '  return (A(x | c <- 30, b <- 20))',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueStructure('A', 'A', {
          'a': new ValueInteger(1),
          'b': new ValueInteger(20),
          'c': new ValueInteger(30),
        })
      );
    });

    it('Variant update', () => {
      let result = new Runner().run([
        'type A is variant {',
        '  case B {',
        '    field a',
        '    field b',
        '  }',
        '  case C {',
        '    field c',
        '  }',
        '}',
        'program {',
        '  x := B(a <- 1, b <- 2)',
        '  return (B(x | a <- 10, b <- 20))',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueStructure('A', 'B', {
          'a': new ValueInteger(10),
          'b': new ValueInteger(20),
        })
      );
    });

    it('Reject update of invalid field', () => {
      let result = () => new Runner().run([
        'type A is record {',
        '  field a',
        '  field b',
        '}',
        'type C is record {',
        '  field c',
        '}',
        'program {',
        '  x := A(a <- 1, b <- 2)',
        '  return (A(x | c <- 30))',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:structure-construction-invalid-field')('A', 'c')
      );
    });

    it('Reject update of field if types are incompatible', () => {
      let result = () => new Runner().run([
        'type A is record {',
        '  field a',
        '  field b',
        '}',
        'program {',
        '  x := A(a <- 1, b <- 2)',
        '  return (A(x | a <- "a"))',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:incompatible-types-on-structure-update')(
          'a',
          new TypeInteger(),
          new TypeString(),
        )
      );
    });

    it('Reject update of different constructor', () => {
      let result = () => new Runner().run([
        'type A is variant {',
        '  case B {',
        '    field a',
        '    field b',
        '  }',
        '  case C {',
        '    field c',
        '  }',
        '}',
        'program {',
        '  x := B(a <- 1, b <- 2)',
        '  return (C(x |))',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:expected-constructor-but-got')('C', 'B')
      );
    });

    it('Reject update of non-structure', () => {
      let result = () => new Runner().run([
        'type A is variant {',
        '  case B {',
        '    field a',
        '    field b',
        '  }',
        '}',
        'program {',
        '  return (B(18 |))',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:expected-structure-but-got')(
          'B',
          i18n('V_Integer')
        )
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
          2,
          new TypeInteger(),
          new TypeString(),
        )
      );
    });

    it('Calling user-defined functions', () => {
      let result = new Runner().run([
        'function g(x, y) {',
        '  return (x + x + y)',
        '}',
        'function f(x) {',
        '  return (g(x, x), g(x, 1), g(1, x), g(1, 1), g(x + 1, x + 1))',
        '}',
        'program {',
        '  return (f(11 + 2))',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueTuple([
        new ValueInteger(39),
        new ValueInteger(27),
        new ValueInteger(15),
        new ValueInteger(3),
        new ValueInteger(42),
      ]));
    });

    it('Calling user-defined functions: restore state after call', () => {
      let result = new Runner().run([
        'function g() {',
        '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
        '  return (',
        '    ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color0') + ')',
        '  )',
        '}',
        'function f() {',
        '  ' + i18n('PRIM:PutStone') + '(' + i18n('CONS:Color0') + ')',
        '  return (' +
        '    ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color0') + '), ',
        '    g(),',
        '    ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color0') + ') ',
        '  )',
        '}',
        'program {',
        '  a := ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color0') + ')',
        '  let (b, c, d) := f()',
        '  e := ' + i18n('PRIM:numStones') + '(' + i18n('CONS:Color0') + ')',
        '  return (a, b, c, d, e)',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueTuple([
        new ValueInteger(0),
        new ValueInteger(1),
        new ValueInteger(2),
        new ValueInteger(1),
        new ValueInteger(0),
      ]));
    });

    it('Field accessors', () => {
      let result = new Runner().run([
        'type A is variant {',
        '  case A {',
        '    field a',
        '  }',
        '  case B {',
        '    field a',
        '    field b',
        '  }',
        '}',
        'type C is record {',
        '  field a',
        '  field c',
        '}',
        'program {',
        '  x := A(a <- 1)',
        '  y := B(a <- 2, b <- 3)',
        '  z := C(a <- 4, c <- 5)',
        '  return (',
        '    a(x),',
        '    a(y),',
        '    b(y),',
        '    a(z),',
        '    c(z)',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueTuple([
        new ValueInteger(1),
        new ValueInteger(2),
        new ValueInteger(3),
        new ValueInteger(4),
        new ValueInteger(5),
      ]));
    });

    it('Field accessors: fail for invalid accessors', () => {
      let result = () => new Runner().run([
        'type A is variant {',
        '  case A {',
        '    field a',
        '  }',
        '  case B {',
        '    field b',
        '  }',
        '}',
        'program {',
        '  x := A(a <- 1)',
        '  return (b(x))',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:structure-field-not-present')(['a'], 'b')
      );
    });
  });

  describe('Expressions: logical operators (&&, ||)', () => {

    it('Conjunction', () => {
      let result = new Runner().run([
        'program {',
        '  return (',
        '    ' + i18n('CONS:False') + ' && ' + i18n('CONS:False') + ',',
        '    ' + i18n('CONS:False') + ' && ' + i18n('CONS:True') + ',',
        '    ' + i18n('CONS:True') + ' && ' + i18n('CONS:False') + ',',
        '    ' + i18n('CONS:True') + ' && ' + i18n('CONS:True'),
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueTuple([
        new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
        new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
        new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
        new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
      ]));
    });

    it('Conjunction: check type of first argument', () => {
      let result = () => new Runner().run([
        'program {',
        '  return (',
        '    0 && ' + i18n('CONS:False'),
        '  )',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeStructure(i18n('TYPE:Bool'), {}),
          new TypeInteger()
        )
      );
    });

    it('Conjunction: check type of second argument', () => {
      let result = () => new Runner().run([
        'program {',
        '  return (',
        '    ' + i18n('CONS:True') + ' && 0',
        '  )',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeStructure(i18n('TYPE:Bool'), {}),
          new TypeInteger()
        )
      );
    });

    it('Conjunction: check that short circuiting works', () => {
      let result = new Runner().run([
        'program {',
        '  return (',
        '    ' + i18n('CONS:False') + ' && 0',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
      );
    });

    it('Disjunction', () => {
      let result = new Runner().run([
        'program {',
        '  return (',
        '    ' + i18n('CONS:False') + ' || ' + i18n('CONS:False') + ',',
        '    ' + i18n('CONS:False') + ' || ' + i18n('CONS:True') + ',',
        '    ' + i18n('CONS:True') + ' || ' + i18n('CONS:False') + ',',
        '    ' + i18n('CONS:True') + ' || ' + i18n('CONS:True'),
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(new ValueTuple([
        new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {}),
        new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
        new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
        new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
      ]));
    });

    it('Disjunction: check type of first argument', () => {
      let result = () => new Runner().run([
        'program {',
        '  return (',
        '    0 || ' + i18n('CONS:False'),
        '  )',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeStructure(i18n('TYPE:Bool'), {}),
          new TypeInteger()
        )
      );
    });

    it('Disjunction: check type of second argument', () => {
      let result = () => new Runner().run([
        'program {',
        '  return (',
        '    ' + i18n('CONS:False') + ' || 0',
        '  )',
        '}',
      ].join('\n'));
      expect(result).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeStructure(i18n('TYPE:Bool'), {}),
          new TypeInteger()
        )
      );
    });

    it('Disjunction: check that short circuiting works', () => {
      let result = new Runner().run([
        'program {',
        '  return (',
        '    ' + i18n('CONS:True') + ' || 0',
        '  )',
        '}',
      ].join('\n'));
      expect(result).deep.equals(
        new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {}),
      );
    });

  });

});

