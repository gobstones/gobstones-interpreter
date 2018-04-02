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
  ASTPatternVariable,
  ASTPatternStructure,
  ASTPatternTuple,
  ASTPatternTimeout,
  /* Expressions */
  ASTExprVariable,
  ASTExprConstantNumber,
  ASTExprConstantString,
  ASTExprChoose,
  ASTExprList,
  ASTExprRange,
  ASTExprTuple,
  ASTExprStructure,
  ASTExprStructureUpdate,
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

describe('Parser: expressions', () => {

  describe('Function call expression', () => {

    it('Accept function calls', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  a1 := f()\n' +
                     '  a2 := g(x)\n' +
                     '  a3 := h(x, y)\n' +
                     '  a4 := i(x, y, z)\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'a1'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'f'), [])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'a2'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'g'), [
                new ASTExprVariable(tok(T_LOWERID, 'x'))
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'a3'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'h'), [
                new ASTExprVariable(tok(T_LOWERID, 'x')),
                new ASTExprVariable(tok(T_LOWERID, 'y')),
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'a4'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'i'), [
                new ASTExprVariable(tok(T_LOWERID, 'x')),
                new ASTExprVariable(tok(T_LOWERID, 'y')),
                new ASTExprVariable(tok(T_LOWERID, 'z'))
              ])
            ),
          ])
        )
      ]);
    });

    it('Accept function calls in various constructions', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  if (f1()) {}\n' +
                     '  repeat (f2()) {}\n' +
                     '  foreach i in f3() {}\n' +
                     '  while (f4()) {}\n' +
                     '  switch (f5()) {}\n' +
                     '  x := f6()\n' +
                     '  let (x, y) := f7()\n' +
                     '  P(f8(), f9())\n' +
                     '  return (f10())\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtIf(
              new ASTExprFunctionCall(tok(T_LOWERID, 'f1'), []),
              new ASTStmtBlock([]),
              null
            ),
            new ASTStmtRepeat(
              new ASTExprFunctionCall(tok(T_LOWERID, 'f2'), []),
              new ASTStmtBlock([]),
            ),
            new ASTStmtForeach(
              new ASTPatternVariable(tok(T_LOWERID, 'i')),
              new ASTExprFunctionCall(tok(T_LOWERID, 'f3'), []),
              new ASTStmtBlock([]),
            ),
            new ASTStmtWhile(
              new ASTExprFunctionCall(tok(T_LOWERID, 'f4'), []),
              new ASTStmtBlock([]),
            ),
            new ASTStmtSwitch(
              new ASTExprFunctionCall(tok(T_LOWERID, 'f5'), []),
              [],
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'f6'), [])
            ),
            new ASTStmtAssignTuple(
              [tok(T_LOWERID, 'x'), tok(T_LOWERID, 'y')],
              new ASTExprFunctionCall(tok(T_LOWERID, 'f7'), [])
            ),
            new ASTStmtProcedureCall(
              tok(T_UPPERID, 'P'),
              [
                new ASTExprFunctionCall(tok(T_LOWERID, 'f8'), []),
                new ASTExprFunctionCall(tok(T_LOWERID, 'f9'), [])
              ]
            ),
            new ASTStmtReturn(
              new ASTExprFunctionCall(tok(T_LOWERID, 'f10'), []),
            )
          ])
        )
      ]);
    });

    it('Accept nested function calls', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := f(g(h(a),i(b,c)),j(k(),l()),d)\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'f'), [
                new ASTExprFunctionCall(tok(T_LOWERID, 'g'), [
                  new ASTExprFunctionCall(tok(T_LOWERID, 'h'), [
                    new ASTExprVariable(tok(T_LOWERID, 'a'))
                  ]),
                  new ASTExprFunctionCall(tok(T_LOWERID, 'i'), [
                    new ASTExprVariable(tok(T_LOWERID, 'b')),
                    new ASTExprVariable(tok(T_LOWERID, 'c'))
                  ]),
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, 'j'), [
                  new ASTExprFunctionCall(tok(T_LOWERID, 'k'), [
                  ]),
                  new ASTExprFunctionCall(tok(T_LOWERID, 'l'), [
                  ])
                ]),
                new ASTExprVariable(tok(T_LOWERID, 'd'))
              ])
            )
          ])
        )
      ]);
    });

    it('Keep track of positions', () => {
      let parser = new Parser(
                     '\nprogram {\n' +
                     '  x := f(/*)*/)\n' +
                     '}'
                   );
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements[0].value.startPos.line).equals(3);
      expect(ast[0].body.statements[0].value.startPos.column).equals(8);
      expect(ast[0].body.statements[0].value.endPos.line).equals(3);
      expect(ast[0].body.statements[0].value.endPos.column).equals(15);
    });

  });

  describe('Constant number expression', () => {

    it('Accept number constants', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x1 := 0\n' +
                     '  x2 := 11\n' +
                     '  x3 := 123\n' +
                     '  x4 := 11223344556677889900998877665544332211\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x1'),
              new ASTExprConstantNumber(tok(T_NUM, '0'))
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x2'),
              new ASTExprConstantNumber(tok(T_NUM, '11'))
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x3'),
              new ASTExprConstantNumber(tok(T_NUM, '123'))
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x4'),
              new ASTExprConstantNumber(
                tok(T_NUM, '11223344556677889900998877665544332211')
              )
            ),
          ])
        )
      ]);
    });

    it('Keep track of positions', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := 0\n' +
                     '  y := 123\n' +
                     '}'
                   );
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements[0].value.startPos.line).equals(2);
      expect(ast[0].body.statements[0].value.startPos.column).equals(8);
      expect(ast[0].body.statements[0].value.endPos.line).equals(2);
      expect(ast[0].body.statements[0].value.endPos.column).equals(9);
      expect(ast[0].body.statements[1].value.startPos.line).equals(3);
      expect(ast[0].body.statements[1].value.startPos.column).equals(8);
      expect(ast[0].body.statements[1].value.endPos.line).equals(3);
      expect(ast[0].body.statements[1].value.endPos.column).equals(11);
    });

  });

  describe('Constant string expression', () => {

    it('Accept string constants', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x1 := ""\n' +
                     '  x2 := "a"\n' +
                     '  x3 := "abc"\n' +
                     '  x4 := "hola /**/ \\\"mundo\\\"\\n"\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x1'),
              new ASTExprConstantString(tok(T_STRING, ''))
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x2'),
              new ASTExprConstantString(tok(T_STRING, 'a'))
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x3'),
              new ASTExprConstantString(tok(T_STRING, 'abc'))
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x4'),
              new ASTExprConstantString(tok(T_STRING, 'hola /**/ \"mundo\"\n'))
            ),
          ])
        )
      ]);
    });

    it('Keep track of positions', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := "...\\n..."\n' +
                     '}'
                   );
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements.length).equals(1);
      expect(ast[0].body.statements[0].value.startPos.line).equals(2);
      expect(ast[0].body.statements[0].value.startPos.column).equals(8);
      expect(ast[0].body.statements[0].value.endPos.line).equals(2);
      expect(ast[0].body.statements[0].value.endPos.column).equals(18);
    });

  });

  describe('Choose expression', () => {

    it('Empty choose', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := choose 1 otherwise' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprConstantNumber(tok(T_NUM, '1'))
            ),
          ])
        )
      ]);
    });

    it('Choose with a single branch', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := choose 1 when (y)' +
                     '              2 otherwise' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprChoose(
                new ASTExprVariable(tok(T_LOWERID, 'y')),
                new ASTExprConstantNumber(tok(T_NUM, '1')),
                new ASTExprConstantNumber(tok(T_NUM, '2'))
              )
            ),
          ])
        )
      ]);
    });

    it('Choose with many branches', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := choose 1 when (y1)' +
                     '              2 when (y2)' +
                     '              3 when (y3)' +
                     '              4 otherwise' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprChoose(
                new ASTExprVariable(tok(T_LOWERID, 'y1')),
                new ASTExprConstantNumber(tok(T_NUM, '1')),
                new ASTExprChoose(
                  new ASTExprVariable(tok(T_LOWERID, 'y2')),
                  new ASTExprConstantNumber(tok(T_NUM, '2')),
                  new ASTExprChoose(
                    new ASTExprVariable(tok(T_LOWERID, 'y3')),
                    new ASTExprConstantNumber(tok(T_NUM, '3')),
                    new ASTExprConstantNumber(tok(T_NUM, '4')),
                  )
                )
              )
            ),
          ])
        )
      ]);
    });

    it('Nested choose', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := choose ' +
                     '         choose 1 when (y1) 2 otherwise' +
                     '           when (y2)' +
                     '         choose 3 when (y3) 4 otherwise' +
                     '           otherwise' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprChoose(
                new ASTExprVariable(tok(T_LOWERID, 'y2')),
                new ASTExprChoose(
                  new ASTExprVariable(tok(T_LOWERID, 'y1')),
                  new ASTExprConstantNumber(tok(T_NUM, '1')),
                  new ASTExprConstantNumber(tok(T_NUM, '2')),
                ),
                new ASTExprChoose(
                  new ASTExprVariable(tok(T_LOWERID, 'y3')),
                  new ASTExprConstantNumber(tok(T_NUM, '3')),
                  new ASTExprConstantNumber(tok(T_NUM, '4')),
                ),
              )
            ),
          ])
        )
      ]);
    });

    it('Keep track of positions', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := choose 1 when (y)\n' +
                     '              2 otherwise' +
                     '}'
                   );
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements.length).equals(1);
      expect(ast[0].body.statements[0].value.startPos.line).equals(2);
      expect(ast[0].body.statements[0].value.startPos.column).equals(8);
      expect(ast[0].body.statements[0].value.endPos.line).equals(3);
      expect(ast[0].body.statements[0].value.endPos.column).equals(26);
    });

  });

  describe('Structure creation expression', () => {

    it('Accept constructor with no arguments, no parentheses', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := Norte\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprStructure(tok(T_UPPERID, 'Norte'), [])
            )
          ])
        )
      ]);
    });

    it('Accept constructor with no arguments, parentheses', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := Norte()\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprStructure(tok(T_UPPERID, 'Norte'), [])
            )
          ])
        )
      ]);
    });

    it('Fail if it seems a procedure call: "C(e)"', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := P(1)\n' +
                     '}'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('expression'),
          i18n('procedure call')
        )
      );
    });

    it('Fail if it seems a procedure call: "C(e1, e2)"', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := P(1, 2)\n' +
                     '}'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('expression'),
          i18n('procedure call')
        )
      );
    });

    it('Fail if field name is followed by an invalid symbol', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := Coord(x -> 2)\n' +
                     '}'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('<alternative>')([
            i18n('T_GETS'),
            i18n('T_PIPE')
          ]),
          i18n('T_ARROW')
        )
      );
    });

    it('Fail if expression is followed by invalid symbol', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := Coord(foo() -> 2)\n' +
                     '}'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_PIPE'),
          i18n('T_ARROW')
        )
      );
    });

    it('Fail if expression is followed by "<-"', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := Coord(foo() <- 3)\n' +
                     '}'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_PIPE'),
          i18n('T_GETS')
        )
      );
    });

    it('Accept constructor of one field', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  c := Coord(x <- 1)\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'c'),
              new ASTExprStructure(tok(T_UPPERID, 'Coord'), [
                new ASTFieldBinding(
                  tok(T_LOWERID, 'x'),
                  new ASTExprConstantNumber(tok(T_NUM, '1'))
                )
              ])
            )
          ])
        )
      ]);
    });

    it('Accept constructor of two fields', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  c := Coord(x <- 1, y <- 2)\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'c'),
              new ASTExprStructure(tok(T_UPPERID, 'Coord'), [
                new ASTFieldBinding(
                  tok(T_LOWERID, 'x'),
                  new ASTExprConstantNumber(tok(T_NUM, '1'))
                ),
                new ASTFieldBinding(
                  tok(T_LOWERID, 'y'),
                  new ASTExprConstantNumber(tok(T_NUM, '2'))
                )
              ])
            )
          ])
        )
      ]);
    });

    it('Accept constructor of three fields', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  c := Coord(x<-1,y<-2,z<-3)\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'c'),
              new ASTExprStructure(tok(T_UPPERID, 'Coord'), [
                new ASTFieldBinding(
                  tok(T_LOWERID, 'x'),
                  new ASTExprConstantNumber(tok(T_NUM, '1'))
                ),
                new ASTFieldBinding(
                  tok(T_LOWERID, 'y'),
                  new ASTExprConstantNumber(tok(T_NUM, '2'))
                ),
                new ASTFieldBinding(
                  tok(T_LOWERID, 'z'),
                  new ASTExprConstantNumber(tok(T_NUM, '3'))
                )
              ])
            )
          ])
        )
      ]);
    });

    it('Reject dangling comma after one argument', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  c := Coord(x<-1,)\n' +
                     '}'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LOWERID'),
          i18n('T_RPAREN')
        )
      );
    });

    it('Reject dangling comma after two arguments', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  c := Coord(x<-1,y<-2,)\n' +
                     '}'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LOWERID'),
          i18n('T_RPAREN')
        )
      );
    });

    it('Accept nested constructors', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  c := Box(left<-Coord(x<-10,y<-20),\n' +
                     '           right<-Coord(x<-11,y<-22))\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'c'),
              new ASTExprStructure(tok(T_UPPERID, 'Box'), [
                new ASTFieldBinding(
                  tok(T_LOWERID, 'left'),
                  new ASTExprStructure(tok(T_UPPERID, 'Coord'), [
                    new ASTFieldBinding(
                      tok(T_LOWERID, 'x'),
                      new ASTExprConstantNumber(tok(T_NUM, '10'))
                    ),
                    new ASTFieldBinding(
                      tok(T_LOWERID, 'y'),
                      new ASTExprConstantNumber(tok(T_NUM, '20'))
                    )
                  ])
                ),
                new ASTFieldBinding(
                  tok(T_LOWERID, 'right'),
                  new ASTExprStructure(tok(T_UPPERID, 'Coord'), [
                    new ASTFieldBinding(
                      tok(T_LOWERID, 'x'),
                      new ASTExprConstantNumber(tok(T_NUM, '11'))
                    ),
                    new ASTFieldBinding(
                      tok(T_LOWERID, 'y'),
                      new ASTExprConstantNumber(tok(T_NUM, '22'))
                    )
                  ])
                )
              ])
            )
          ])
        )
      ]);
    });

    it('Keep track of positions', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  c0 := A\n' +
                     '  c0 := B()\n' +
                     '  c1 := C(x <- 10)\n' +
                     '  c2 := D(y <- 20, z <- 30)\n' +
                     '}'
                   );
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements.length).equals(4);

      /* A */
      expect(ast[0].body.statements[0].value.startPos.line).equals(2);
      expect(ast[0].body.statements[0].value.startPos.column).equals(9);
      expect(ast[0].body.statements[0].value.endPos.line).equals(2);
      expect(ast[0].body.statements[0].value.endPos.column).equals(10);

      /* B() */
      expect(ast[0].body.statements[1].value.startPos.line).equals(3);
      expect(ast[0].body.statements[1].value.startPos.column).equals(9);
      expect(ast[0].body.statements[1].value.endPos.line).equals(3);
      expect(ast[0].body.statements[1].value.endPos.column).equals(11);

      /* C(x <- 10) */
      expect(ast[0].body.statements[2].value.startPos.line).equals(4);
      expect(ast[0].body.statements[2].value.startPos.column).equals(9);
      expect(ast[0].body.statements[2].value.endPos.line).equals(4);
      expect(ast[0].body.statements[2].value.endPos.column).equals(18);

      /* x <- 10 */
      let fvx = ast[0].body.statements[2].value.fieldBindings[0];
      expect(fvx.startPos.line).equals(4);
      expect(fvx.startPos.column).equals(11);
      expect(fvx.endPos.line).equals(4);
      expect(fvx.endPos.column).equals(18);

      /* D(y <- 20, z <- 30) */
      expect(ast[0].body.statements[3].value.startPos.line).equals(5);
      expect(ast[0].body.statements[3].value.startPos.column).equals(9);
      expect(ast[0].body.statements[3].value.endPos.line).equals(5);
      expect(ast[0].body.statements[3].value.endPos.column).equals(27);

      /* y <- 20 */
      let fvy = ast[0].body.statements[3].value.fieldBindings[0];
      expect(fvy.startPos.line).equals(5);
      expect(fvy.startPos.column).equals(11);
      expect(fvy.endPos.line).equals(5);
      expect(fvy.endPos.column).equals(18);

      /* z <- 30 */
      let fvz = ast[0].body.statements[3].value.fieldBindings[1];
      expect(fvz.startPos.line).equals(5);
      expect(fvz.startPos.column).equals(20);
      expect(fvz.endPos.line).equals(5);
      expect(fvz.endPos.column).equals(27);
    });

  });

  describe('Structure update expression', () => {

    it('Accept constructor update', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  c1 := Coord(c0 | x <- 10)\n' +
                     '  c2 := Coord(c1 | x <- 10, y <- 20)\n' +
                     '  c3 := Coord(c2 | )\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'c1'),
              new ASTExprStructureUpdate(
                tok(T_UPPERID, 'Coord'),
                new ASTExprVariable(tok(T_LOWERID, 'c0')),
                [
                  new ASTFieldBinding(
                    tok(T_LOWERID, 'x'),
                    new ASTExprConstantNumber(tok(T_NUM, '10'))
                  )
                ]
              )
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'c2'),
              new ASTExprStructureUpdate(
                tok(T_UPPERID, 'Coord'),
                new ASTExprVariable(tok(T_LOWERID, 'c1')),
                [
                  new ASTFieldBinding(
                    tok(T_LOWERID, 'x'),
                    new ASTExprConstantNumber(tok(T_NUM, '10'))
                  ),
                  new ASTFieldBinding(
                    tok(T_LOWERID, 'y'),
                    new ASTExprConstantNumber(tok(T_NUM, '20'))
                  ),
                ]
              )
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'c3'),
              new ASTExprStructureUpdate(
                tok(T_UPPERID, 'Coord'),
                new ASTExprVariable(tok(T_LOWERID, 'c2')),
                [
                ]
              )
            ),
          ])
        )
      ]);
    });

    it('Keep track of positions', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  c1 := Coord(c0 |\n' +
                     '              x <- 12000)\n' +
                     '}'
                   );
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements[0].value.startPos.line).equals(2);
      expect(ast[0].body.statements[0].value.startPos.column).equals(9);
      expect(ast[0].body.statements[0].value.endPos.line).equals(3);
      expect(ast[0].body.statements[0].value.endPos.column).equals(25);
    });

  });

  describe('List expression', () => {

    it('Accept empty list', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := []' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprList([])
            )
          ])
        )
      ]);
    });

    it('Accept singleton list', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := [a]' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprList([
                new ASTExprVariable(tok(T_LOWERID, 'a'))
              ])
            )
          ])
        )
      ]);
    });

    it('Accept typical list', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := [foo, bar]' +
                     '  y := [1, 2, 3]' +
                     '  z := [1, 2, 3, 4, 5, 6]' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprList([
                new ASTExprVariable(tok(T_LOWERID, 'foo')),
                new ASTExprVariable(tok(T_LOWERID, 'bar'))
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'y'),
              new ASTExprList([
                new ASTExprConstantNumber(tok(T_NUM, '1')),
                new ASTExprConstantNumber(tok(T_NUM, '2')),
                new ASTExprConstantNumber(tok(T_NUM, '3'))
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'z'),
              new ASTExprList([
                new ASTExprConstantNumber(tok(T_NUM, '1')),
                new ASTExprConstantNumber(tok(T_NUM, '2')),
                new ASTExprConstantNumber(tok(T_NUM, '3')),
                new ASTExprConstantNumber(tok(T_NUM, '4')),
                new ASTExprConstantNumber(tok(T_NUM, '5')),
                new ASTExprConstantNumber(tok(T_NUM, '6'))
              ])
            ),
          ])
        )
      ]);
    });

    it('Accept nested lists', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := [[], [1], [1, 2], [1, 2, 3]]' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprList([
                new ASTExprList([]),
                new ASTExprList([
                  new ASTExprConstantNumber(tok(T_NUM, '1'))
                ]),
                new ASTExprList([
                  new ASTExprConstantNumber(tok(T_NUM, '1')),
                  new ASTExprConstantNumber(tok(T_NUM, '2'))
                ]),
                new ASTExprList([
                  new ASTExprConstantNumber(tok(T_NUM, '1')),
                  new ASTExprConstantNumber(tok(T_NUM, '2')),
                  new ASTExprConstantNumber(tok(T_NUM, '3'))
                ])
              ])
            )
          ])
        )
      ]);
    });

    it('Fail if list ends prematurely (empty list)', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := [\n' +
                     '  ;\n'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('expression'),
          i18n('T_SEMICOLON')
        )
      );
    });

    it('Fail if list ends prematurely (singleton)', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := [1,;\n'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('expression'),
          i18n('T_SEMICOLON')
        )
      );
    });

    it('Fail if list ends prematurely (typical list)', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := [1,2, ;\n'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('expression'),
          i18n('T_SEMICOLON')
        )
      );
    });

    it('Keep track of positions (empty list)', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := [\n' +
                     '  ]' +
                     '}'
                   );
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements[0].value.startPos.line).equals(2);
      expect(ast[0].body.statements[0].value.startPos.column).equals(8);
      expect(ast[0].body.statements[0].value.endPos.line).equals(3);
      expect(ast[0].body.statements[0].value.endPos.column).equals(3);
    });

    it('Keep track of positions (singleton)', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := [\n' +
                     '    1\n' +
                     '  ]' +
                     '}'
                   );
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements[0].value.startPos.line).equals(2);
      expect(ast[0].body.statements[0].value.startPos.column).equals(8);
      expect(ast[0].body.statements[0].value.endPos.line).equals(4);
      expect(ast[0].body.statements[0].value.endPos.column).equals(3);
    });

    it('Keep track of positions (typical list)', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := [\n' +
                     '    1,\n' +
                     '    2,\n' +
                     '    3\n' +
                     '  ]' +
                     '}'
                   );
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements[0].value.startPos.line).equals(2);
      expect(ast[0].body.statements[0].value.startPos.column).equals(8);
      expect(ast[0].body.statements[0].value.endPos.line).equals(6);
      expect(ast[0].body.statements[0].value.endPos.column).equals(3);
    });

  });

  describe('Range expression', () => {

    it('Accept range without second element', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := [first..last]' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprRange(
                new ASTExprVariable(tok(T_LOWERID, 'first')),
                null,
                new ASTExprVariable(tok(T_LOWERID, 'last'))
              )
            )
          ])
        )
      ]);
    });

    it('Accept range with second element', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := [first,second..last]' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprRange(
                new ASTExprVariable(tok(T_LOWERID, 'first')),
                new ASTExprVariable(tok(T_LOWERID, 'second')),
                new ASTExprVariable(tok(T_LOWERID, 'last'))
              )
            )
          ])
        )
      ]);
    });

    it('Keep track of positions', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := [1..100]\n' +
                     '  y := [2,4..100]' +
                     '}'
                   );
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements[0].value.startPos.line).equals(2);
      expect(ast[0].body.statements[0].value.startPos.column).equals(8);
      expect(ast[0].body.statements[0].value.endPos.line).equals(2);
      expect(ast[0].body.statements[0].value.endPos.column).equals(15);
      expect(ast[0].body.statements[1].value.startPos.line).equals(3);
      expect(ast[0].body.statements[1].value.startPos.column).equals(8);
      expect(ast[0].body.statements[1].value.endPos.line).equals(3);
      expect(ast[0].body.statements[1].value.endPos.column).equals(17);
    });

    it('Fail if range ends prematurely', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := [1..;\n'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('expression'),
          i18n('T_SEMICOLON')
        )
      );
    });

    it('Fail if range ends prematurely (with second element)', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := [1,2..;\n'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('expression'),
          i18n('T_SEMICOLON')
        )
      );
    });


    it('Fail on invalid symbol after first element of list/range', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := [1; 2]\n' +
                     '}'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('<alternative>')([
            i18n('T_COMMA'),
            i18n('T_RANGE'),
            i18n('T_RBRACK')
          ]),
          i18n('T_SEMICOLON')
        )
      );
    });

    it('Fail on invalid symbol after second element of list/range', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := [1, 2; 3]\n' +
                     '}'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('<alternative>')([
            i18n('T_COMMA'),
            i18n('T_RANGE'),
            i18n('T_RBRACK')
          ]),
          i18n('T_SEMICOLON')
        )
      );
    });

  });

  describe('Tuples and parenthesized expressions', () => {

    it('Accept tuples and parenthesized expressions', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := ()\n' +
                     '  x := (1)\n' +
                     '  x := (2,3)\n' +
                     '  x := (4,5,6)\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprTuple([])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprConstantNumber(tok(T_NUM, '1'))
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprTuple([
                new ASTExprConstantNumber(tok(T_NUM, '2')),
                new ASTExprConstantNumber(tok(T_NUM, '3'))
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprTuple([
                new ASTExprConstantNumber(tok(T_NUM, '4')),
                new ASTExprConstantNumber(tok(T_NUM, '5')),
                new ASTExprConstantNumber(tok(T_NUM, '6'))
              ])
            )
          ])
        )
      ]);
    });

  });

  describe('Non-associative operators (infix)', () => {

    it('Accept non-associative operators (infix)', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := 1 == 2\n' +
                     '  x := 3 /= 4\n' +
                     '  x := 5 >= 6\n' +
                     '  x := 7 <= 8\n' +
                     '  x := 9 > 10\n' +
                     '  x := 11 < 12\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(
                tok(T_LOWERID, '=='),
                [
                  new ASTExprConstantNumber(tok(T_NUM, '1')),
                  new ASTExprConstantNumber(tok(T_NUM, '2'))
                ]
              )
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(
                tok(T_LOWERID, '/='),
                [
                  new ASTExprConstantNumber(tok(T_NUM, '3')),
                  new ASTExprConstantNumber(tok(T_NUM, '4'))
                ]
              )
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(
                tok(T_LOWERID, '>='),
                [
                  new ASTExprConstantNumber(tok(T_NUM, '5')),
                  new ASTExprConstantNumber(tok(T_NUM, '6'))
                ]
              )
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(
                tok(T_LOWERID, '<='),
                [
                  new ASTExprConstantNumber(tok(T_NUM, '7')),
                  new ASTExprConstantNumber(tok(T_NUM, '8'))
                ]
              )
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(
                tok(T_LOWERID, '>'),
                [
                  new ASTExprConstantNumber(tok(T_NUM, '9')),
                  new ASTExprConstantNumber(tok(T_NUM, '10'))
                ]
              )
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(
                tok(T_LOWERID, '<'),
                [
                  new ASTExprConstantNumber(tok(T_NUM, '11')),
                  new ASTExprConstantNumber(tok(T_NUM, '12'))
                ]
              )
            )
          ])
        )
      ]);
    });

    it('Reject associating non-associative operators (1/3)', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := foo == bar /= baz\n' +
                     '}'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:operators-are-not-associative')(
          i18n('T_EQ'),
          i18n('T_NE')
        )
      );
    });

    it('Reject associating non-associative operators (2/3)', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := foo >= bar <= baz\n' +
                     '}'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:operators-are-not-associative')(
          i18n('T_GE'),
          i18n('T_LE')
        )
      );
    });

    it('Reject associating non-associative operators (3/3)', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := foo > bar < baz\n' +
                     '}'
                   );
      expect(() => parser.parse()).throws(
        i18n('errmsg:operators-are-not-associative')(
          i18n('T_GT'),
          i18n('T_LT')
        )
      );
    });

    it('Keep track of positions', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := foo == bar\n' +
                     '  x := foo < bar\n' +
                     '}'
                   );
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements[0].value.startPos.line).equals(2);
      expect(ast[0].body.statements[0].value.startPos.column).equals(8);
      expect(ast[0].body.statements[0].value.endPos.line).equals(2);
      expect(ast[0].body.statements[0].value.endPos.column).equals(18);
      expect(ast[0].body.statements[1].value.startPos.line).equals(3);
      expect(ast[0].body.statements[1].value.startPos.column).equals(8);
      expect(ast[0].body.statements[1].value.endPos.line).equals(3);
      expect(ast[0].body.statements[1].value.endPos.column).equals(17);
    });

  });

  describe('Left-associative operators (infixl)', () => {

    it('Accept left-associative operators', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := 1 ++ 2\n' +
                     '  x := 3 + 4\n' +
                     '  x := 5 - 6\n' +
                     '  x := 7 * 8\n' +
                     '  x := 9 div 10\n' +
                     '  x := 11 mod 12\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(
                tok(T_LOWERID, '++'),
                [
                  new ASTExprConstantNumber(tok(T_NUM, '1')),
                  new ASTExprConstantNumber(tok(T_NUM, '2'))
                ]
              )
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(
                tok(T_LOWERID, '+'),
                [
                  new ASTExprConstantNumber(tok(T_NUM, '3')),
                  new ASTExprConstantNumber(tok(T_NUM, '4'))
                ]
              )
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(
                tok(T_LOWERID, '-'),
                [
                  new ASTExprConstantNumber(tok(T_NUM, '5')),
                  new ASTExprConstantNumber(tok(T_NUM, '6'))
                ]
              )
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(
                tok(T_LOWERID, '*'),
                [
                  new ASTExprConstantNumber(tok(T_NUM, '7')),
                  new ASTExprConstantNumber(tok(T_NUM, '8'))
                ]
              )
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(
                tok(T_LOWERID, 'div'),
                [
                  new ASTExprConstantNumber(tok(T_NUM, '9')),
                  new ASTExprConstantNumber(tok(T_NUM, '10'))
                ]
              )
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(
                tok(T_LOWERID, 'mod'),
                [
                  new ASTExprConstantNumber(tok(T_NUM, '11')),
                  new ASTExprConstantNumber(tok(T_NUM, '12'))
                ]
              )
            )
          ])
        )
      ]);
    });

    it('Respect associativity of left-associative operators', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := 1 ++ 2 ++ 3\n' +
                     '  x := 4 + 5 + 6\n' +
                     '  x := 7 - 8 - 9\n' +
                     '  x := 10 + 11 - 12 + 13 - 14\n' +
                     '  x := 15 * 16 * 17\n' +
                     '  x := 18 div 19 div 20\n' +
                     '  x := 21 mod 22 mod 23\n' +
                     '  x := 24 mod 25 div 26 mod 27 div 28\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([

            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '++'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '++'), [
                  new ASTExprConstantNumber(tok(T_NUM, '1')),
                  new ASTExprConstantNumber(tok(T_NUM, '2'))
                ]),
                new ASTExprConstantNumber(tok(T_NUM, '3'))
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '+'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '+'), [
                  new ASTExprConstantNumber(tok(T_NUM, '4')),
                  new ASTExprConstantNumber(tok(T_NUM, '5'))
                ]),
                new ASTExprConstantNumber(tok(T_NUM, '6'))
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '-'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '-'), [
                  new ASTExprConstantNumber(tok(T_NUM, '7')),
                  new ASTExprConstantNumber(tok(T_NUM, '8'))
                ]),
                new ASTExprConstantNumber(tok(T_NUM, '9'))
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '-'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '+'), [
                  new ASTExprFunctionCall(tok(T_LOWERID, '-'), [
                    new ASTExprFunctionCall(tok(T_LOWERID, '+'), [
                      new ASTExprConstantNumber(tok(T_NUM, '10')),
                      new ASTExprConstantNumber(tok(T_NUM, '11'))
                    ]),
                    new ASTExprConstantNumber(tok(T_NUM, '12')),
                  ]),
                  new ASTExprConstantNumber(tok(T_NUM, '13'))
                ]),
                new ASTExprConstantNumber(tok(T_NUM, '14'))
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '*'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '*'), [
                  new ASTExprConstantNumber(tok(T_NUM, '15')),
                  new ASTExprConstantNumber(tok(T_NUM, '16'))
                ]),
                new ASTExprConstantNumber(tok(T_NUM, '17'))
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'div'), [
                new ASTExprFunctionCall(tok(T_LOWERID, 'div'), [
                  new ASTExprConstantNumber(tok(T_NUM, '18')),
                  new ASTExprConstantNumber(tok(T_NUM, '19'))
                ]),
                new ASTExprConstantNumber(tok(T_NUM, '20'))
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'mod'), [
                new ASTExprFunctionCall(tok(T_LOWERID, 'mod'), [
                  new ASTExprConstantNumber(tok(T_NUM, '21')),
                  new ASTExprConstantNumber(tok(T_NUM, '22'))
                ]),
                new ASTExprConstantNumber(tok(T_NUM, '23'))
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'div'), [
                new ASTExprFunctionCall(tok(T_LOWERID, 'mod'), [
                  new ASTExprFunctionCall(tok(T_LOWERID, 'div'), [
                    new ASTExprFunctionCall(tok(T_LOWERID, 'mod'), [
                      new ASTExprConstantNumber(tok(T_NUM, '24')),
                      new ASTExprConstantNumber(tok(T_NUM, '25'))
                    ]),
                    new ASTExprConstantNumber(tok(T_NUM, '26')),
                  ]),
                  new ASTExprConstantNumber(tok(T_NUM, '27'))
                ]),
                new ASTExprConstantNumber(tok(T_NUM, '28'))
              ])
            ),
          ])
        )
      ]);
    });

    it('Keep track of positions', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := foo + bar - x\n' +
                     '  x := foo div bar mod x\n' +
                     '}'
                   );
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements[0].value.startPos.line).equals(2);
      expect(ast[0].body.statements[0].value.startPos.column).equals(8);
      expect(ast[0].body.statements[0].value.endPos.line).equals(2);
      expect(ast[0].body.statements[0].value.endPos.column).equals(21);
      expect(ast[0].body.statements[1].value.startPos.line).equals(3);
      expect(ast[0].body.statements[1].value.startPos.column).equals(8);
      expect(ast[0].body.statements[1].value.endPos.line).equals(3);
      expect(ast[0].body.statements[1].value.endPos.column).equals(25);
    });
  });

  describe('Right-associative operators (infixr)', () => {

    it('Accept right-associative operators', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := 1 || 2\n' +
                     '  x := 3 && 4\n' +
                     '  x := 5 ^ 6\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(
                tok(T_LOWERID, '||'),
                [
                  new ASTExprConstantNumber(tok(T_NUM, '1')),
                  new ASTExprConstantNumber(tok(T_NUM, '2'))
                ]
              )
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(
                tok(T_LOWERID, '&&'),
                [
                  new ASTExprConstantNumber(tok(T_NUM, '3')),
                  new ASTExprConstantNumber(tok(T_NUM, '4'))
                ]
              )
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(
                tok(T_LOWERID, '^'),
                [
                  new ASTExprConstantNumber(tok(T_NUM, '5')),
                  new ASTExprConstantNumber(tok(T_NUM, '6'))
                ]
              )
            )
          ])
        )
      ]);
    });

    it('Respect associativity of right-associative operators', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := 1 || 2 || 3\n' +
                     '  x := 4 && 5 && 6\n' +
                     '  x := 7 ^ 8 ^ 9\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([

            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '||'), [
                new ASTExprConstantNumber(tok(T_NUM, '1')),
                new ASTExprFunctionCall(tok(T_LOWERID, '||'), [
                  new ASTExprConstantNumber(tok(T_NUM, '2')),
                  new ASTExprConstantNumber(tok(T_NUM, '3'))
                ])
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '&&'), [
                new ASTExprConstantNumber(tok(T_NUM, '4')),
                new ASTExprFunctionCall(tok(T_LOWERID, '&&'), [
                  new ASTExprConstantNumber(tok(T_NUM, '5')),
                  new ASTExprConstantNumber(tok(T_NUM, '6'))
                ])
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '^'), [
                new ASTExprConstantNumber(tok(T_NUM, '7')),
                new ASTExprFunctionCall(tok(T_LOWERID, '^'), [
                  new ASTExprConstantNumber(tok(T_NUM, '8')),
                  new ASTExprConstantNumber(tok(T_NUM, '9'))
                ])
              ])
            )
          ])
        )
      ]);
    });

  });

  describe('Unary operators (prefix)', () => {

    it('Accept unary operators', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := not 1\n' +
                     '  x := -2\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'not'), [
                new ASTExprConstantNumber(tok(T_NUM, '1'))
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '-(unary)'), [
                new ASTExprConstantNumber(tok(T_NUM, '2'))
              ])
            )
          ])
        )
      ]);
    });

    it('Accept iterating unary operators', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := not not 1\n' +
                     '  x := - -2\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'not'), [
                new ASTExprFunctionCall(tok(T_LOWERID, 'not'), [
                  new ASTExprConstantNumber(tok(T_NUM, '1'))
                ])
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '-(unary)'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '-(unary)'), [
                  new ASTExprConstantNumber(tok(T_NUM, '2'))
                ])
              ])
            )
          ])
        )
      ]);
    });

    it('Keep track of positions', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := not foo\n' +
                     '  x := -\nfoo\n' +
                     '}'
                   );
      let ast = parser.parse().definitions;
      expect(ast[0].body.statements[0].value.startPos.line).equals(2);
      expect(ast[0].body.statements[0].value.startPos.column).equals(8);
      expect(ast[0].body.statements[0].value.endPos.line).equals(2);
      expect(ast[0].body.statements[0].value.endPos.column).equals(15);
      expect(ast[0].body.statements[1].value.startPos.line).equals(3);
      expect(ast[0].body.statements[1].value.startPos.column).equals(8);
      expect(ast[0].body.statements[1].value.endPos.line).equals(4);
      expect(ast[0].body.statements[1].value.endPos.column).equals(4);
    });

  });

  describe('Operator precedence', () => {

    it('&& vs. ||', () => {

      let parser = new Parser(
                     'program {\n' +
                     '  x := a && b || c && d\n' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '||'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '&&'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, '&&'), [
                  new ASTExprVariable(tok(T_LOWERID, 'c')),
                  new ASTExprVariable(tok(T_LOWERID, 'd'))
                ])
              ])
            )
          ])
        )
      ]);
    });

    it('&& vs. not', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := not a && not b' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '&&'), [
                new ASTExprFunctionCall(tok(T_LOWERID, 'not'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a'))
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, 'not'), [
                  new ASTExprVariable(tok(T_LOWERID, 'b')),
                ])
              ])
            )
          ])
        )
      ]);
    });

    it('not vs. relational operators', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := not a == b' +
                     '  x := not a /= b' +
                     '  x := not a >= b' +
                     '  x := not a <= b' +
                     '  x := not a > b' +
                     '  x := not a < b' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'not'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '=='), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ])
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'not'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '/='), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ])
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'not'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '>='), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ])
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'not'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '<='), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ])
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'not'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '>'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ])
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'not'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '<'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ])
              ])
            )
          ])
        )
      ]);
    });

    it('relational operators vs. ++', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := a ++ b == c ++ d' +
                     '  x := a ++ b /= c ++ d' +
                     '  x := a ++ b >= c ++ d' +
                     '  x := a ++ b <= c ++ d' +
                     '  x := a ++ b > c ++ d' +
                     '  x := a ++ b < c ++ d' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '=='), [
                new ASTExprFunctionCall(tok(T_LOWERID, '++'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, '++'), [
                  new ASTExprVariable(tok(T_LOWERID, 'c')),
                  new ASTExprVariable(tok(T_LOWERID, 'd'))
                ])
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '/='), [
                new ASTExprFunctionCall(tok(T_LOWERID, '++'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, '++'), [
                  new ASTExprVariable(tok(T_LOWERID, 'c')),
                  new ASTExprVariable(tok(T_LOWERID, 'd'))
                ])
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '>='), [
                new ASTExprFunctionCall(tok(T_LOWERID, '++'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, '++'), [
                  new ASTExprVariable(tok(T_LOWERID, 'c')),
                  new ASTExprVariable(tok(T_LOWERID, 'd'))
                ])
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '<='), [
                new ASTExprFunctionCall(tok(T_LOWERID, '++'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, '++'), [
                  new ASTExprVariable(tok(T_LOWERID, 'c')),
                  new ASTExprVariable(tok(T_LOWERID, 'd'))
                ])
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '>'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '++'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, '++'), [
                  new ASTExprVariable(tok(T_LOWERID, 'c')),
                  new ASTExprVariable(tok(T_LOWERID, 'd'))
                ])
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '<'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '++'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, '++'), [
                  new ASTExprVariable(tok(T_LOWERID, 'c')),
                  new ASTExprVariable(tok(T_LOWERID, 'd'))
                ])
              ])
            )
          ])
        )
      ]);
    });

    it('++ vs. additive operators', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := a - b ++ c + d' +
                     '  x := a + b ++ c - d' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '++'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '-'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, '+'), [
                  new ASTExprVariable(tok(T_LOWERID, 'c')),
                  new ASTExprVariable(tok(T_LOWERID, 'd'))
                ])
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '++'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '+'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, '-'), [
                  new ASTExprVariable(tok(T_LOWERID, 'c')),
                  new ASTExprVariable(tok(T_LOWERID, 'd'))
                ])
              ])
            )
          ])
        )
      ]);
    });

    it('additive operators vs. multiplicative operators', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := a * b + c * d' +
                     '  x := a * b - c * d' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '+'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '*'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, '*'), [
                  new ASTExprVariable(tok(T_LOWERID, 'c')),
                  new ASTExprVariable(tok(T_LOWERID, 'd'))
                ])
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '-'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '*'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, '*'), [
                  new ASTExprVariable(tok(T_LOWERID, 'c')),
                  new ASTExprVariable(tok(T_LOWERID, 'd'))
                ])
              ])
            )
          ])
        )
      ]);
    });

    it('multiplicative operators vs. division operators', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := a div b * c mod d' +
                     '  x := a mod b * c div d' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '*'), [
                new ASTExprFunctionCall(tok(T_LOWERID, 'div'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, 'mod'), [
                  new ASTExprVariable(tok(T_LOWERID, 'c')),
                  new ASTExprVariable(tok(T_LOWERID, 'd'))
                ])
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '*'), [
                new ASTExprFunctionCall(tok(T_LOWERID, 'mod'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, 'div'), [
                  new ASTExprVariable(tok(T_LOWERID, 'c')),
                  new ASTExprVariable(tok(T_LOWERID, 'd'))
                ])
              ])
            )
          ])
        )
      ]);
    });

    it('division operators vs. pow', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := a ^ b div c ^ d' +
                     '  x := a ^ b mod c ^ d' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'div'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '^'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, '^'), [
                  new ASTExprVariable(tok(T_LOWERID, 'c')),
                  new ASTExprVariable(tok(T_LOWERID, 'd'))
                ])
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, 'mod'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '^'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, '^'), [
                  new ASTExprVariable(tok(T_LOWERID, 'c')),
                  new ASTExprVariable(tok(T_LOWERID, 'd'))
                ])
              ])
            )
          ])
        )
      ]);
    });

    it('pow vs. unary minus', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := -a ^ -b' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '^'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '-(unary)'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a'))
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, '-(unary)'), [
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ])
              ])
            )
          ])
        )
      ]);
    });

    it('Allow overriding precedence with parentheses', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := -(a || b)' +
                     '  x := (a + b) * (c - d)' +
                     '}'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '-(unary)'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '||'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ])
              ])
            ),
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(tok(T_LOWERID, '*'), [
                new ASTExprFunctionCall(tok(T_LOWERID, '+'), [
                  new ASTExprVariable(tok(T_LOWERID, 'a')),
                  new ASTExprVariable(tok(T_LOWERID, 'b'))
                ]),
                new ASTExprFunctionCall(tok(T_LOWERID, '-'), [
                  new ASTExprVariable(tok(T_LOWERID, 'c')),
                  new ASTExprVariable(tok(T_LOWERID, 'd'))
                ])
              ])
            )
          ])
        )
      ]);
    });

  });

  describe('Ellipsis expression', () => {

    it('Parse ellipsis expression and macroexpand to boom', () => {
      let parser = new Parser(
                     'program {\n' +
                     '  x := ...\n' +
                     '}\n'
                   );
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([
            new ASTStmtAssignVariable(
              tok(T_LOWERID, 'x'),
              new ASTExprFunctionCall(
                tok(T_LOWERID, i18n('PRIM:boom')), [
                  new ASTExprConstantString(
                    tok(T_STRING, i18n('errmsg:ellipsis'))
                  )
                ]
              )
            )
          ])
        )
      ]);
    });

  });

});
