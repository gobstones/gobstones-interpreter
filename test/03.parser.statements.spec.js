import chai from 'chai';

import { i18n } from '../src/i18n';
import {
  ASTNode,
  /* Main */
  ASTMain,
  /* Definitions */
  ASTDefProgram,
  ASTDefInteractiveProgram,
  ASTDefProcedure,
  ASTDefFunction,
  ASTDefType,
  /* Statements */
  ASTStmtBlock,
  ASTStmtReturn,
  ASTStmtIf,
  ASTStmtRepeat,
  ASTStmtForeach,
  ASTStmtWhile,
  ASTStmtSwitch,
  ASTStmtAssignVariable,
  ASTStmtAssignTuple,
  ASTStmtProcedureCall,
  /* Patterns */
  ASTPatternWildcard,
  ASTPatternConstructor,
  ASTPatternTuple,
  ASTPatternTimeout,
  /* Expressions */
  ASTExprVariable,
  ASTExprConstantNumber,
  ASTExprConstantString,
  ASTExprList,
  ASTExprRange,
  ASTExprTuple,
  ASTExprConstructor,
  ASTExprConstructorUpdate,
  ASTExprFunctionCall,
  /* SwitchBranch */
  ASTSwitchBranch,
  /* FieldBinding */
  ASTFieldBinding,
  /* ConstructorDeclaration */
  ASTConstructorDeclaration,
} from '../src/ast';
import { UnknownPosition } from '../src/reader';
import {
  Token,
  T_EOF, T_NUM, T_STRING, T_LOWERID, T_UPPERID,
  /* Keywords */
  T_PROGRAM, T_INTERACTIVE, T_PROCEDURE, T_FUNCTION, T_RETURN,
  T_IF, T_THEN, T_ELSE, T_REPEAT, T_FOREACH, T_IN, T_WHILE,
  T_SWITCH, T_TO, T_LET, T_NOT, T_DIV, T_MOD, T_TYPE,
  T_IS, T_RECORD, T_VARIANT, T_CASE, T_FIELD, T_UNDERSCORE,
  T_TIMEOUT,
  /* Symbols */
  T_LPAREN, T_RPAREN, T_LBRACE, T_RBRACE, T_LBRACK, T_RBRACK, T_COMMA,
  T_SEMICOLON, T_RANGE, T_GETS, T_PIPE, T_ASSIGN,
  T_EQ, T_NE, T_LE, T_GE, T_LT, T_GT, T_AND, T_OR, T_CONCAT, T_PLUS,
  T_MINUS, T_TIMES, T_POW
} from '../src/token';
import { Parser } from '../src/parser';

chai.expect();
const expect = chai.expect;

/* Return true iff the expressions are syntactically equal.
 * An expression might be:
 * - null,
 * - a token (instance of Token),
 * - a node (instance of ASTNode) whose children are expressions,
 * - a list of expressions. */
function syntacticallyEqual(e1, e2) {
  /*** May be useful for debugging:
  if (e1 === '?' || e2 === '?') {
    return true;
  }
  */
  if (e1 === null && e2 === null) {
    return true;
  } else if (e1 instanceof Token && e2 instanceof Token) {
    return e1.tag === e2.tag
        && e1.value === e2.value;
  } else if (e1 instanceof ASTNode && e2 instanceof ASTNode) {
    return e1.tag === e2.tag
        && syntacticallyEqual(e1.children, e2.children);
  } else if (e1 instanceof Array && e2 instanceof Array) {
    if (e1.length !== e2.length) {
      return false;
    }
    for (let i = 0; i < e1.length; i++) {
      if (!syntacticallyEqual(e1[i], e2[i])) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
}

function tok(tag, value) {
  return new Token(tag, value, UnknownPosition, UnknownPosition);
}

function expectAST(obtainedAst, expectedAst) {
  return expect(
           syntacticallyEqual(
             obtainedAst,
             new ASTMain(expectedAst)
           )
         ).equals(true);
}

describe('Parser: statements', () => {

  it('Allow semicolon as statement separator', () => {
    let parser = new Parser(
                   'program {\n' +
                   '  P();Q();R();S()\n' +
                   '}'
                 );
    expectAST(parser.parse(), [
      new ASTDefProgram(
        new ASTStmtBlock([
          new ASTStmtProcedureCall(tok(T_UPPERID, 'P'), []),
          new ASTStmtProcedureCall(tok(T_UPPERID, 'Q'), []),
          new ASTStmtProcedureCall(tok(T_UPPERID, 'R'), []),
          new ASTStmtProcedureCall(tok(T_UPPERID, 'S'), [])
        ])
      )
    ]);
  });

  describe('Return statement', () => {

    it('Accept return of empty tuple', () => {
      let parser = new Parser('program { return () }');
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtReturn(
              new ASTExprTuple([])
            )
          ])
        )
      ]);
    });

    it('Accept return of single return value', () => {
      let parser = new Parser('function f() { return (x) }');
      expectAST(parser.parse(), [
        new ASTDefFunction(tok(T_LOWERID, 'f'), [],
              new ASTStmtBlock([
                new ASTStmtReturn(
                  new ASTExprVariable(tok(T_LOWERID, 'x'))
                )
              ])
            )
      ]);
    });

    it('Accept return of two-component tuple', () => {
      let parser = new Parser('program { return (z1,z2) }');
      expectAST(parser.parse(), [
        new ASTDefProgram(
              new ASTStmtBlock([
                new ASTStmtReturn(
                  new ASTExprTuple([
                    new ASTExprVariable(tok(T_LOWERID, 'z1')),
                    new ASTExprVariable(tok(T_LOWERID, 'z2')),
                  ])
                )
              ])
            )
      ]);
    });

    it('Keep track of positions (empty tuple)', () => {
      let parser = new Parser('program {\n\n\n return\n() }');
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements[0].result.elements.length).equals(0);
      expect(ast[0].body.statements[0].startPos.line).equals(4);
      expect(ast[0].body.statements[0].startPos.column).equals(2);
      expect(ast[0].body.statements[0].endPos.line).equals(5);
      expect(ast[0].body.statements[0].endPos.column).equals(2);
    });

    it('Keep track of positions (single return value)', () => {
      let parser = new Parser('program {\n\n\n return\n(col) }');
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements[0].startPos.line).equals(4);
      expect(ast[0].body.statements[0].startPos.column).equals(2);
      expect(ast[0].body.statements[0].endPos.line).equals(5);
      expect(ast[0].body.statements[0].endPos.column).equals(5);
    });

    it('Keep track of positions (two-component tuple)', () => {
      let parser = new Parser('program {\n\n\n return\n(col,dir) }');
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements[0].result.elements.length).equals(2);
      expect(ast[0].body.statements[0].startPos.line).equals(4);
      expect(ast[0].body.statements[0].startPos.column).equals(2);
      expect(ast[0].body.statements[0].endPos.line).equals(5);
      expect(ast[0].body.statements[0].endPos.column).equals(9);
    });

  });

  describe('Block statement', () => {

    it('Accept nested blocks', () => {
      let parser = new Parser('program { { { {} } {} } { {} } {} }');
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtBlock([
              new ASTStmtBlock([
                new ASTStmtBlock([
                ])
              ]),
              new ASTStmtBlock([
              ])
            ]),
            new ASTStmtBlock([
              new ASTStmtBlock([
              ])
            ]),
            new ASTStmtBlock([
            ])
          ])
        )
      ]);
    });

  });

  describe('If statement', () => {

    it('Accept "if" without "else"', () => {
      let parser = new Parser('program { if (a) {} }');
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtIf(
              new ASTExprVariable(tok(T_LOWERID, 'a')),
              new ASTStmtBlock([]),
              null
            )
          ])
        )
      ]);
    });

    it('Accept "if" with optional "then" keyword', () => {
      let parser = new Parser('program { if (cond) then {} }');
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtIf(
              new ASTExprVariable(tok(T_LOWERID, 'cond')),
              new ASTStmtBlock([]),
              null
            )
          ])
        )
      ]);
    });

    it('Accept "if" with "else"', () => {
      let parser = new Parser('program { if (xxx) {} else {} }');
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtIf(
              new ASTExprVariable(tok(T_LOWERID, 'xxx')),
              new ASTStmtBlock([]),
              new ASTStmtBlock([])
            )
          ])
        )
      ]);
    });

    it('Accept nested "if"s', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  if (a) {\n' +
                     '    if (b) then {\n' +
                     '      if (c) {\n' +
                     '      }\n' +
                     '      if (d) {\n' +
                     '      }\n' +
                     '    } else {\n' +
                     '      if (e) then {\n' +
                     '      }\n' +
                     '    }\n' +
                     '    if (f) then {\n' +
                     '    }\n' +
                     '  } else {\n' +
                     '    if (e) {\n' +
                     '    }\n' +
                     '    if (f) then {\n' +
                     '      if (g) then {\n' +
                     '      }\n' +
                     '    } else {\n' +
                     '      if (h) then {\n' +
                     '      }\n' +
                     '      if (i) then {\n' +
                     '      }\n' +
                     '    }\n' +
                     '  }\n' +
                     '}'
                   );

      function ifthen(c, t) {
        return new ASTStmtIf(
                 new ASTExprVariable(tok(T_LOWERID, c)),
                 new ASTStmtBlock(t),
                 null);
      }

      function ifthenelse(c, t, e) {
        return new ASTStmtIf(
                 new ASTExprVariable(tok(T_LOWERID, c)),
                 new ASTStmtBlock(t),
                 new ASTStmtBlock(e));
      }

      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            ifthenelse('a', [
              ifthenelse('b', [
                ifthen('c', []),
                ifthen('d', [])
              ], [
                ifthen('e', [])
              ]),
              ifthen('f', [
              ]),
            ], [
              ifthen('e', [
              ]),
              ifthenelse('f', [
                ifthen('g', [])
              ], [
                ifthen('h', []),
                ifthen('i', [])
              ]),
            ])
          ])
        )
      ]);
    });

    it('Fail if missing left parenthesis', () => {
      let parser = new Parser('program { if xxx) {} else {} }');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LPAREN'),
          i18n('T_LOWERID')
       )
      );
    });

    it('Fail if missing right parenthesis', () => {
      let parser = new Parser('program { if (xxx {} else {} }');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_RPAREN'),
          i18n('T_LBRACE')
       )
      );
    });

    it('Fail if missing "then" block', () => {
      let parser = new Parser('program { if(xxx)');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LBRACE'),
          i18n('T_EOF')
       )
      );
    });

    it('Fail if missing "else" block', () => {
      let parser = new Parser('program { if(xxx) {} else');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LBRACE'),
          i18n('T_EOF')
       )
      );
    });


    it('Keep track of positions', () => {
      let parser = new Parser('program {\n  if (xxx) {\n  } else {\n  }\n}');
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements.length).equals(1);
      expect(ast[0].body.statements[0].startPos.line).equals(2);
      expect(ast[0].body.statements[0].startPos.column).equals(3);
      expect(ast[0].body.statements[0].endPos.line).equals(4);
      expect(ast[0].body.statements[0].endPos.column).equals(3);
    });

  });

  describe('Repeat statement', () => {

    it('Accept "repeat"', () => {
      let parser = new Parser('program { repeat (n) {} }');
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtRepeat(
              new ASTExprVariable(tok(T_LOWERID, 'n')),
              new ASTStmtBlock([])
            )
          ])
        )
      ]);
    });

    it('Accept nested "repeat"s', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  repeat (nro1) {\n' +
                     '    repeat (nro2) {}\n' +
                     '  }\n' +
                     '  repeat (nro3) {\n' +
                     '  }\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtRepeat(
              new ASTExprVariable(tok(T_LOWERID, 'nro1')),
              new ASTStmtBlock([
                new ASTStmtRepeat(
                  new ASTExprVariable(tok(T_LOWERID, 'nro2')),
                  new ASTStmtBlock([
                  ])
                )
              ])
            ),
            new ASTStmtRepeat(
              new ASTExprVariable(tok(T_LOWERID, 'nro3')),
              new ASTStmtBlock([
              ])
            )
          ])
        )
      ]);
    });


    it('Fail if missing left parenthesis', () => {
      let parser = new Parser('program { repeat n) {} }');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LPAREN'),
          i18n('T_LOWERID')
       )
      );
    });

    it('Fail if missing right parenthesis', () => {
      let parser = new Parser('program { repeat (n');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_RPAREN'),
          i18n('T_EOF')
       )
      );
    });

    it('Keep track of positions', () => {
      let parser = new Parser('program { repeat (n) { } repeat(m) { } }');
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements.length).equals(2);
      expect(ast[0].body.statements[0].startPos.line).equals(1);
      expect(ast[0].body.statements[0].startPos.column).equals(11);
      expect(ast[0].body.statements[0].endPos.line).equals(1);
      expect(ast[0].body.statements[0].endPos.column).equals(24);
      expect(ast[0].body.statements[1].startPos.line).equals(1);
      expect(ast[0].body.statements[1].startPos.column).equals(26);
      expect(ast[0].body.statements[1].endPos.line).equals(1);
      expect(ast[0].body.statements[1].endPos.column).equals(38);
    });

  });

  describe('Foreach statement', () => {

    it('Accept "foreach"', () => {
      let parser = new Parser('program { foreach i in expr {} }');
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtForeach(
              tok(T_LOWERID, 'i'),
              new ASTExprVariable(tok(T_LOWERID, 'expr')),
              new ASTStmtBlock([])
            )
          ])
        )
      ]);
    });

    it('Accept nested "foreach"s', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  foreach dir in lista1 {\n' +
                     '    foreach col in lista2 {\n' +
                     '    }\n' +
                     '    foreach col in lista3 {\n' +
                     '    }\n' +
                     '  }\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtForeach(
              tok(T_LOWERID, 'dir'),
              new ASTExprVariable(tok(T_LOWERID, 'lista1')),
              new ASTStmtBlock([
                new ASTStmtForeach(
                  tok(T_LOWERID, 'col'),
                  new ASTExprVariable(tok(T_LOWERID, 'lista2')),
                  new ASTStmtBlock([])
                ),
                new ASTStmtForeach(
                  tok(T_LOWERID, 'col'),
                  new ASTExprVariable(tok(T_LOWERID, 'lista3')),
                  new ASTStmtBlock([])
                )
              ])
            )
          ])
        )
      ]);
    });

    it('Fail if wrong (uppercase) index name', () => {
      let parser = new Parser('program { foreach I in expr {} }');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LOWERID'),
          i18n('T_UPPERID')
        )
      );
    });

    it('Fail if missing "in"', () => {
      let parser = new Parser('program { foreach i ( expr ) {} }');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_IN'),
          i18n('T_LPAREN')
        )
      );
    });

    it('Fail if missing block', () => {
      let parser = new Parser('program { foreach i in expr }');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LBRACE'),
          i18n('T_RBRACE')
        )
      );
    });

    it('Keep track of positions', () => {
      let parser = new Parser('program {\nforeach\ni\nin\nexpr\n{\n}\n}');
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements.length).equals(1);
      expect(ast[0].body.statements[0].startPos.line).equals(2);
      expect(ast[0].body.statements[0].startPos.column).equals(1);
      expect(ast[0].body.statements[0].endPos.line).equals(7);
      expect(ast[0].body.statements[0].endPos.column).equals(1);
    });

  });

  describe('While statement', () => {

    it('Accept "while"', () => {
      let parser = new Parser('program { while (cond) {} }');
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtWhile(
              new ASTExprVariable(tok(T_LOWERID, 'cond')),
              new ASTStmtBlock([])
            )
          ])
        )
      ]);
    });

    it('Accept nested "while"s', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  while (cond1) {\n' +
                     '    while (cond2) {\n' +
                     '    }\n' +
                     '  }\n' +
                     '  while (cond3) {\n' +
                     '  }\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtWhile(
              new ASTExprVariable(tok(T_LOWERID, 'cond1')),
              new ASTStmtBlock([
                new ASTStmtWhile(
                  new ASTExprVariable(tok(T_LOWERID, 'cond2')),
                  new ASTStmtBlock([])
                )
              ])
            ),
            new ASTStmtWhile(
              new ASTExprVariable(tok(T_LOWERID, 'cond3')),
              new ASTStmtBlock([])
            )
          ])
        )
      ]);
    });

    it('Fail if missing left parenthesis', () => {
      let parser = new Parser('program { while cond {} }');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LPAREN'),
          i18n('T_LOWERID')
        )
      );
    });

    it('Fail if missing right parenthesis', () => {
      let parser = new Parser('program { while (cond while {} }');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_RPAREN'),
          i18n('T_WHILE')
        )
      );
    });

    it('Fail if missing block', () => {
      let parser = new Parser('program { while (cond) /*{}*/ }');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LBRACE'),
          i18n('T_RBRACE')
        )
      );
    });

  });

  describe('Switch statement', () => {

    it('Accept empty "switch" (no branches)', () => {
      let parser = new Parser(
                     'program {' +
                     '  switch (a) {' +
                     '  }' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtSwitch(
              new ASTExprVariable(tok(T_LOWERID, 'a')),
              []
            )
          ])
        )
      ]);
    });

    it('Accept "switch" with optional keyword "to"', () => {
      let parser = new Parser(
                     'program {' +
                     '  switch (foo) to {' +
                     '  }' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtSwitch(
              new ASTExprVariable(tok(T_LOWERID, 'foo')),
              []
            )
          ])
        )
      ]);
    });

    it('Accept alternative keyword "match"', () => {
      let parser = new Parser(
                     'program {' +
                     '  match (bar) to {' +
                     '  }' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtSwitch(
              new ASTExprVariable(tok(T_LOWERID, 'bar')),
              []
            )
          ])
        )
      ]);
    });

    it('Accept wildcard pattern (_)', () => {
      let parser = new Parser(
                     'program {' +
                     '  switch (foo) {' +
                     '    _ -> {' +
                     '      if (bar) {}' +
                     '    }' +
                     '  }' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtSwitch(
              new ASTExprVariable(tok(T_LOWERID, 'foo')),
              [
                new ASTSwitchBranch(
                  new ASTPatternWildcard(),
                  new ASTStmtBlock([
                    new ASTStmtIf(
                      new ASTExprVariable(tok(T_LOWERID, 'bar')),
                      new ASTStmtBlock([]),
                      null
                    )
                  ])
                )
              ]
            )
          ])
        )
      ]);
    });

    it('Accept constructor pattern without arguments', () => {
      let parser = new Parser(
                     'program {' +
                     '  switch (foo) {' +
                     '    Norte -> {}' +
                     '    Este -> {}' +
                     '    Sur -> {}' +
                     '    _ -> {}' +
                     '  }' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtSwitch(
              new ASTExprVariable(tok(T_LOWERID, 'foo')),
              [
                new ASTSwitchBranch(
                  new ASTPatternConstructor(
                    tok(T_UPPERID, 'Norte'),
                    []
                  ),
                  new ASTStmtBlock([])
                ),
                new ASTSwitchBranch(
                  new ASTPatternConstructor(
                    tok(T_UPPERID, 'Este'),
                    []
                  ),
                  new ASTStmtBlock([])
                ),
                new ASTSwitchBranch(
                  new ASTPatternConstructor(
                    tok(T_UPPERID, 'Sur'),
                    []
                  ),
                  new ASTStmtBlock([])
                ),
                new ASTSwitchBranch(
                  new ASTPatternWildcard(),
                  new ASTStmtBlock([])
                )
              ]
            )
          ])
        )
      ]);
    });

    it('Accept constructor pattern with arguments', () => {
      let parser = new Parser(
                     'program {' +
                     '  switch (foo) {' +
                     '    INIT()           -> {}' +
                     '    Leaf(x)          -> {}' +
                     '    Norte            -> {}' +
                     '    Cons(x, xs)      -> {}' +
                     '    A(foo, bar, baz) -> {}' +
                     '  }' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtSwitch(
              new ASTExprVariable(tok(T_LOWERID, 'foo')),
              [
                new ASTSwitchBranch(
                  new ASTPatternConstructor(
                    tok(T_UPPERID, 'INIT'),
                    []
                  ),
                  new ASTStmtBlock([])
                ),
                new ASTSwitchBranch(
                  new ASTPatternConstructor(
                    tok(T_UPPERID, 'Leaf'),
                    [tok(T_LOWERID, 'x')]
                  ),
                  new ASTStmtBlock([])
                ),
                new ASTSwitchBranch(
                  new ASTPatternConstructor(
                    tok(T_UPPERID, 'Norte'),
                    []
                  ),
                  new ASTStmtBlock([])
                ),
                new ASTSwitchBranch(
                  new ASTPatternConstructor(
                    tok(T_UPPERID, 'Cons'),
                    [tok(T_LOWERID, 'x'), tok(T_LOWERID, 'xs')]
                  ),
                  new ASTStmtBlock([])
                ),
                new ASTSwitchBranch(
                  new ASTPatternConstructor(
                    tok(T_UPPERID, 'A'),
                    [
                      tok(T_LOWERID, 'foo'),
                      tok(T_LOWERID, 'bar'),
                      tok(T_LOWERID, 'baz')
                    ]
                  ),
                  new ASTStmtBlock([])
                ),
              ]
            )
          ])
        )
      ]);
    });

    it('Accept tuple pattern', () => {
      let parser = new Parser(
                     'program {' +
                     '  switch (foo) {' +
                     '    ()    -> {}' +
                     '    (x,y) -> {}' +
                     '    (foo, bar, baz) -> {}' +
                     '    _ -> {}' +
                     '  }' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtSwitch(
              new ASTExprVariable(tok(T_LOWERID, 'foo')),
              [
                new ASTSwitchBranch(
                  new ASTPatternTuple([]),
                  new ASTStmtBlock([])
                ),
                new ASTSwitchBranch(
                  new ASTPatternTuple([
                    tok(T_LOWERID, 'x'),
                    tok(T_LOWERID, 'y'),
                  ]),
                  new ASTStmtBlock([])
                ),
                new ASTSwitchBranch(
                  new ASTPatternTuple([
                    tok(T_LOWERID, 'foo'),
                    tok(T_LOWERID, 'bar'),
                    tok(T_LOWERID, 'baz'),
                  ]),
                  new ASTStmtBlock([])
                ),
                new ASTSwitchBranch(
                  new ASTPatternWildcard(),
                  new ASTStmtBlock([])
                )
              ]
            )
          ])
        )
      ]);
    });

    it('Reject singleton tuple pattern', () => {
      let parser = new Parser(
                     'program {' +
                     '  switch (foo) {' +
                     '    (x)    -> {}' +
                     '  }' +
                     '}'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:pattern-tuple-cannot-be-singleton')
      );
    });

    it('Reject missing braces', () => {
      let parser = new Parser(
                     'program {' +
                     '  switch (foo)' +
                     '    _ -> {}' +
                     '}'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LBRACE'),
          i18n('T_UNDERSCORE')
        )
      );
    });

    it('Reject malformed pattern (single variable)', () => {
      let parser = new Parser(
                     'program {' +
                     '  switch (foo) {' +
                     '    x -> {}' +
                     '  }' +
                     '}'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('pattern'),
          i18n('T_LOWERID')
        )
      );
    });

    it('Reject malformed pattern (nested tuples)', () => {
      let parser = new Parser(
                     'program {' +
                     '  switch (foo) {' +
                     '    ((x,y),z) -> {}' +
                     '  }' +
                     '}'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LOWERID'),
          i18n('T_LPAREN')
        )
      );
    });

    it('Keep track of positions', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  switch (foo) {\n' +
                     '    A(b) -> {}\n' +
                     '  }\n' +
                     '}\n'
                   );
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements[0].startPos.line).equals(2);
      expect(ast[0].body.statements[0].startPos.column).equals(3);
      expect(ast[0].body.statements[0].endPos.line).equals(4);
      expect(ast[0].body.statements[0].endPos.column).equals(3);
    });

  });

  describe('Let statement', () => {

    it('Accept "let" (variable assignment)', () => {
      let parser = new Parser(
                     'program {' +
                     '  let foo := bar' +
                     '  let bar := baz' +
                     '}\n'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'foo'),
              new ASTExprVariable(tok(T_LOWERID, 'bar')),
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'bar'),
              new ASTExprVariable(tok(T_LOWERID, 'baz')),
            )
          ])
        )
      ]);
    });

    it('Accept "let" (nullary tuple assignment)', () => {
      let parser = new Parser(
                     'program {' +
                     '  let () := bar' +
                     '}\n'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignTuple(
              [],
              new ASTExprVariable(tok(T_LOWERID, 'bar')),
            )
          ])
        )
      ]);
    });

    it('Accept "let" (generic tuple assignment)', () => {
      let parser = new Parser(
                     'program {' +
                     '  let (x,y) := bar2' +
                     '  let (x,y,z) := bar3' +
                     '  let (x1,x2,x3,x4) := bar4' +
                     '}\n'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignTuple(
              [
                tok(T_LOWERID, 'x'),
                tok(T_LOWERID, 'y'),
              ],
              new ASTExprVariable(tok(T_LOWERID, 'bar2')),
            ),
            new ASTStmtAssignTuple(
              [
                tok(T_LOWERID, 'x'),
                tok(T_LOWERID, 'y'),
                tok(T_LOWERID, 'z')
              ],
              new ASTExprVariable(tok(T_LOWERID, 'bar3')),
            ),
            new ASTStmtAssignTuple(
              [
                tok(T_LOWERID, 'x1'),
                tok(T_LOWERID, 'x2'),
                tok(T_LOWERID, 'x3'),
                tok(T_LOWERID, 'x4')
              ],
              new ASTExprVariable(tok(T_LOWERID, 'bar4')),
            )
          ])
        )
      ]);
    });

    it('Reject singleton tuple assignment', () => {
      let parser = new Parser(
                     'program {' +
                     '  let (foo) := bar' +
                     '}'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:assignment-tuple-cannot-be-singleton')
      );
    });

    it('Keep track of positions', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  let foo := bar\n' +
                     '  let (foo, bar) := baz\n' +
                     '}\n'
                   );
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements.length).equals(2);
      expect(ast[0].body.statements[0].startPos.line).equals(2);
      expect(ast[0].body.statements[0].startPos.column).equals(3);
      expect(ast[0].body.statements[0].endPos.line).equals(2);
      expect(ast[0].body.statements[0].endPos.column).equals(17);
      expect(ast[0].body.statements[1].startPos.line).equals(3);
      expect(ast[0].body.statements[1].startPos.column).equals(3);
      expect(ast[0].body.statements[1].endPos.line).equals(3);
      expect(ast[0].body.statements[1].endPos.column).equals(24);
    });

  });

  describe('Variable assignment', () => {

    it('Accept variable assignment', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  a := b\n' +
                     '  b := c\n' +
                     '  c := d\n' +
                     '}\n'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'a'), new ASTExprVariable(tok(T_LOWERID, 'b'))
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'b'), new ASTExprVariable(tok(T_LOWERID, 'c'))
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'c'), new ASTExprVariable(tok(T_LOWERID, 'd'))
            )
          ])
        )
      ]);
    });

    it('Keep track of positions', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  /**/\n' +
                     '  /**/foo\n' +
                     '  := bar/**/\n' +
                     '  /**/\n' +
                     '}\n'
                   );
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements.length).equals(1);
      expect(ast[0].body.statements[0].startPos.line).equals(3);
      expect(ast[0].body.statements[0].startPos.column).equals(7);
      expect(ast[0].body.statements[0].endPos.line).equals(4);
      expect(ast[0].body.statements[0].endPos.column).equals(9);
    });

    it('Reject obsolete tuple assignment', () => {
      let parser = new Parser('program { (x, y) := 1 }');
      expect(() => parser.parse()).throws(
        i18n('errmsg:obsolete-tuple-assignment')
      );
    });

  });

  describe('Procedure call statement', () => {

    it('Accept procedure calls', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  VaciarTablero()\n' +
                     '  Mover(dir)\n' +
                     '  PonerN(n, col)\n' +
                     '  Q (a,b,c,d)\n' +
                     '}\n'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtProcedureCall(tok(T_UPPERID, 'VaciarTablero'), []),
            new ASTStmtProcedureCall(tok(T_UPPERID, 'Mover'), [
              new ASTExprVariable(tok(T_LOWERID, 'dir'))
            ]),
            new ASTStmtProcedureCall(tok(T_UPPERID, 'PonerN'), [
              new ASTExprVariable(tok(T_LOWERID, 'n')),
              new ASTExprVariable(tok(T_LOWERID, 'col'))
            ]),
            new ASTStmtProcedureCall(tok(T_UPPERID, 'Q'), [
              new ASTExprVariable(tok(T_LOWERID, 'a')),
              new ASTExprVariable(tok(T_LOWERID, 'b')),
              new ASTExprVariable(tok(T_LOWERID, 'c')),
              new ASTExprVariable(tok(T_LOWERID, 'd'))
            ])
          ])
        )
      ]);
    });

    it('Reject if missing left parenthesis', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  P\n' +
                     '}\n'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LPAREN'),
          i18n('T_RBRACE')
        )
      );
    });

    it('Reject if missing right parenthesis', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  P(\n' +
                     '}\n'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('expression'),
          i18n('T_RBRACE')
        )
      );
    });

    it('Keep track of positions', () => {
      let parser = new Parser('program{P(a,a,a)}');
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements.length).equals(1);
      expect(ast[0].body.statements[0].startPos.line).equals(1);
      expect(ast[0].body.statements[0].startPos.column).equals(9);
      expect(ast[0].body.statements[0].endPos.line).equals(1);
      expect(ast[0].body.statements[0].endPos.column).equals(16);
    });

  });

});
