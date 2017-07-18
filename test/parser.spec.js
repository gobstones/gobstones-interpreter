import chai from 'chai';

import { i18n } from '../src/i18n';
import {
  ASTNode,
  ASTProgramDeclaration,
  ASTProcedureDeclaration,
  ASTFunctionDeclaration,
  ASTBlock,
} from '../src/ast';
import { UnknownPosition } from '../src/reader';
import {
  Token,
  T_EOF, T_NUM, T_STRING, T_LOWERID, T_UPPERID,
  /* Keywords */
  T_PROGRAM, T_INTERACTIVE, T_PROCEDURE, T_FUNCTION, T_RETURN,
  T_IF, T_THEN, T_ELSE, T_REPEAT, T_FOREACH, T_IN, T_WHILE,
  T_SWITCH, T_MATCH, T_TO, T_LET, T_NOT, T_DIV, T_MOD, T_TYPE,
  T_IS, T_RECORD, T_VARIANT, T_CASE, T_FIELD, T_UNDERSCORE,
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
 * - a token (instance of Token),
 * - a node (instance of ASTNode) whose children are expressions,
 * - a list of expressions. */
function syntacticallyEqual(e1, e2) {
  if (e1 instanceof Token && e2 instanceof Token) {
    return e1.tag === e2.tag
        && e1.value === e2.value;
  } else if (e1 instanceof ASTNode && e2 instanceof ASTNode) {
    return e1.tag === e2.tag
        && syntacticallyEqual(e1.children, e2.children);
  } else if (e1 instanceof Array && e2 instanceof Array) {
    if (e1.length !== e2.length) {
      return false;
    }
    for (var i = 0; i < e1.length; i++) {
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
  return expect(syntacticallyEqual(obtainedAst, expectedAst)).equals(true);
}

it('Parser - Accept empty program declaration', () => {
  var parser = new Parser('program {}');
  expectAST(parser.parse(), [
    new ASTProgramDeclaration(
      new ASTBlock([])
    )
  ]);
});

it('Parser - Reject empty source', () => {
  var parser = new Parser('');
  expect(() => parser.parse()).throws(i18n('errmsg:empty-source'));
});

it('Parser - Reject non-declarations at the toplevel', () => {
  var parser = new Parser('if');
  expect(() => parser.parse()).throws(
      i18n('errmsg:expected-but-found')(
        i18n('declaration'),
        i18n('T_IF')
      )
  );
});

it('Parser - Program declaration: fail on no left brace', () => {
  var parser = new Parser('program');
  expect(() => parser.parse()).throws(
    i18n('errmsg:expected-but-found')(
      i18n('T_LBRACE'),
      i18n('T_EOF')
    )
  );
});

it('Parser - Program declaration: fail on no right brace', () => {
  var parser = new Parser('program {');
  expect(() => parser.parse()).throws(
    i18n('errmsg:expected-but-found')(
      i18n('statement'),
      i18n('T_EOF')
    )
  );
});

it('Parser - Program declaration: keep track of positions', () => {
  var parser = new Parser('\n   program {\n\n\n}');
  var tree = parser.parse();
  expect(tree.length).equals(1);
  expect(tree[0].startPos.line).equals(2);
  expect(tree[0].startPos.column).equals(4);
  expect(tree[0].endPos.line).equals(5);
  expect(tree[0].endPos.column).equals(1);
});

it('Parser - Procedure declaration with no parameters', () => {
  var parser = new Parser('procedure P() {}');
  expectAST(parser.parse(), [
      new ASTProcedureDeclaration(
        tok(T_UPPERID, 'P'),
        [],
        new ASTBlock([])
      )
  ]);
});

it('Parser - Procedure declaration with one parameters', () => {
  var parser = new Parser('procedure Poner(color) {}');
  expectAST(parser.parse(), [
      new ASTProcedureDeclaration(
        tok(T_UPPERID, 'Poner'),
        [tok(T_LOWERID, 'color')],
        new ASTBlock([])
      )
  ]);
});

it('Parser - Procedure declaration with two parameters', () => {
  var parser = new Parser('procedure PonerN(n,col) {}');
  expectAST(parser.parse(), [
      new ASTProcedureDeclaration(
        tok(T_UPPERID, 'PonerN'),
        [tok(T_LOWERID, 'n'), tok(T_LOWERID, 'col')],
        new ASTBlock([])
      )
  ]);
});

it('Parser - Procedure declaration with three parameters', () => {
  var parser = new Parser('procedure Q(x ,y, z) {}');
  expectAST(parser.parse(), [
      new ASTProcedureDeclaration(
        tok(T_UPPERID, 'Q'),
        [tok(T_LOWERID, 'x'), tok(T_LOWERID, 'y'), tok(T_LOWERID, 'z')],
        new ASTBlock([])
      )
  ]);
});

it('Parser - Procedure declaration: fail on missing argument list', () => {
  var parser = new Parser('procedure P {}');
  expect(() => parser.parse()).throws(
    i18n('errmsg:expected-but-found')(
      i18n('T_LPAREN'),
      i18n('T_LBRACE')
    )
  );
});

it('Parser - Procedure declaration: fail on missing comma', () => {
  var parser = new Parser('procedure P(x y) {}');
  expect(() => parser.parse()).throws(
    i18n('errmsg:expected-but-found')(
      i18n('<alternative>')([
        i18n('T_COMMA'),
        i18n('T_RPAREN')
      ]),
      i18n('T_LOWERID')
    )
  );
});

it('Parser - Procedure declaration: reject initial comma', () => {
  var parser = new Parser('procedure P(,x) {}');
  expect(() => parser.parse()).throws(
    i18n('errmsg:expected-but-found')(
      i18n('T_LOWERID'),
      i18n('T_COMMA')
    )
  );
});

it('Parser - Procedure declaration: reject trailing comma', () => {
  var parser = new Parser('procedure P(x,y,) {}');
  expect(() => parser.parse()).throws(
    i18n('errmsg:expected-but-found')(
      i18n('T_LOWERID'),
      i18n('T_RPAREN')
    )
  );
});

it('Parser - Procedure declaration: fail on invalid procedure name', () => {
  var parser = new Parser('procedure p(x, y) {}');
  expect(() => parser.parse()).throws(
    i18n('errmsg:expected-but-found')(
      i18n('T_UPPERID'),
      i18n('T_LOWERID')
    )
  );
});

it('Parser - Procedure declaration: fail on invalid parameter name', () => {
  var parser = new Parser('procedure P(x, Y) {}');
  expect(() => parser.parse()).throws(
    i18n('errmsg:expected-but-found')(
      i18n('T_LOWERID'),
      i18n('T_UPPERID')
    )
  );
});

it('Parser - Procedure declaration: fail on invalid block', () => {
  var parser = new Parser('procedure P\n(x, y) }');
  expect(() => parser.parse()).throws(
    i18n('errmsg:expected-but-found')(
      i18n('T_LBRACE'),
      i18n('T_RBRACE')
    )
  );
});
 
it('Parser - Procedure declarations: keep track of positions', () => {
  var parser = new Parser(
      '/*@BEGIN_REGION@A@*//*ignore*/procedure P\n' +
      '/*@BEGIN_REGION@B@*/(x,y){} procedure Q()\n' +
      '{     /*@END_REGION@B@*/            }'
  );
  var tree = parser.parse();
  expect(tree.length).equals(2);
  expect(tree[0].startPos.line).equals(1);
  expect(tree[0].startPos.column).equals(11);
  expect(tree[0].startPos.region).equals('A');
  expect(tree[0].endPos.line).equals(2);
  expect(tree[0].endPos.column).equals(7);
  expect(tree[0].endPos.region).equals('B');
  expect(tree[1].startPos.line).equals(2);
  expect(tree[1].startPos.column).equals(9);
  expect(tree[1].startPos.region).equals('B');
  expect(tree[1].endPos.line).equals(3);
  expect(tree[1].endPos.column).equals(19);
  expect(tree[1].endPos.region).equals('A');
});

it('Parser - Function declaration with no parameters', () => {
  var parser = new Parser('function f() {}');
  expectAST(parser.parse(), [
      new ASTProcedureDeclaration(
        tok(T_LOWERID, 'f'),
        [],
        new ASTBlock([])
      )
  ]);
});

it('Parser - Function declaration with one parameter', () => {
  var parser = new Parser('function nroBolitas(color) {}');
  expectAST(parser.parse(), [
      new ASTProcedureDeclaration(
        tok(T_LOWERID, 'nroBolitas'),
        [tok(T_LOWERID, 'color')],
        new ASTBlock([])
      )
  ]);
});

it('Parser - Function declaration with two parameters', () => {
  var parser = new Parser('function nroBolitasAl(c, d) {}');
  expectAST(parser.parse(), [
      new ASTProcedureDeclaration(
        tok(T_LOWERID, 'nroBolitasAl'),
        [tok(T_LOWERID, 'c'), tok(T_LOWERID, 'd')],
        new ASTBlock([])
      )
  ]);
});

it('Parser - Function declaration with three parameters', () => {
  var parser = new Parser('function gg(x,yy,zzz) {}');
  expectAST(parser.parse(), [
      new ASTProcedureDeclaration(
        tok(T_LOWERID, 'gg'),
        [tok(T_LOWERID, 'x'), tok(T_LOWERID, 'yy'), tok(T_LOWERID, 'zzz')],
        new ASTBlock([])
      )
  ]);
});

it('Parser - Mixed function and procedure declarations', () => {
  var parser = new Parser(
                 'function f(x) {}\n' +
                 'procedure P() {}\n' +
                 'procedure Q(x, y) {}\n' +
                 'program{}'
               );
  expectAST(parser.parse(), [
      new ASTFunctionDeclaration(
        tok(T_LOWERID, 'f'),
        [tok(T_LOWERID, 'x')],
        new ASTBlock([])
      ),
      new ASTProcedureDeclaration(
        tok(T_UPPERID, 'P'),
        [],
        new ASTBlock([])
      ),
      new ASTProcedureDeclaration(
        tok(T_UPPERID, 'Q'),
        [tok(T_LOWERID, 'x'), tok(T_LOWERID, 'y')],
        new ASTBlock([])
      ),
      new ASTProgramDeclaration(
        new ASTBlock([])
      )
  ]);
});

it('Parser - Reject non-statement', () => {
  var parser = new Parser('program { + }');
  expect(() => parser.parse()).throws(
      i18n('errmsg:expected-but-found')(
        i18n('statement'),
        i18n('T_PLUS')
      )
  );
});

