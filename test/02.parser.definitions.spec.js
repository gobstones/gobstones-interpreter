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
  ASTPatternStructure,
  ASTPatternTuple,
  ASTPatternTimeout,
  /* Expressions */
  ASTExprVariable,
  ASTExprConstantNumber,
  ASTExprConstantString,
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

describe('Parser: definitions', () => {

  it('Accept empty source', () => {
    let parser = new Parser('');
    expectAST(parser.parse(), []);
  });

  it('Reject things other than definitions at the toplevel', () => {
    let parser = new Parser('if');
    expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('definition'),
          i18n('T_IF')
        )
    );
  });

  it('Reject non-statement when expecting statement', () => {
    let parser = new Parser('program { + }');
    expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('statement'),
          i18n('T_PLUS')
        )
    );
  });

  describe('Program definition', () => {

    it('Accept empty program definition', () => {
      let parser = new Parser('program {}');
      expectAST(parser.parse(), [
        new ASTDefProgram(
          new ASTStmtBlock([])
        )
      ]);
    });

    it('Fail if missing left brace', () => {
      let parser = new Parser('program');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LBRACE'),
          i18n('T_EOF')
        )
      );
    });

    it('Fail if missing right brace', () => {
      let parser = new Parser('program {'); /*}*/
      expect(() => parser.parse()).throws(
        i18n('errmsg:unmatched-opening-delimiter')('{')
      );
    });

    it('Keep track of positions', () => {
      let parser = new Parser('\n   program {\n\n\n}');
      let ast = parser.parse().definitions;
      expect(ast.length).equals(1);
      expect(ast[0].startPos.line).equals(2);
      expect(ast[0].startPos.column).equals(4);
      expect(ast[0].endPos.line).equals(5);
      expect(ast[0].endPos.column).equals(1);
    });

    it('Register attributes', () => {
      let parser = new Parser([
        '/*@ATTRIBUTE@foo@a@*/',
        '/*@ATTRIBUTE@bar@bcdefg@*/',
        'program {',
        '}',
      ].join('\n'));
      let ast = parser.parse().definitions;
      expect(ast.length).equals(1);
      expect(ast[0].attributes).deep.equals({'foo': 'a', 'bar': 'bcdefg'});
    });

  });

  describe('Interactive program definition', () => {

    it('Accept interactive program', () => {
      let parser = new Parser(
                     'interactive program {\n'
                   + '  INIT -> {}\n'
                   + '  ' + i18n('CONS:TIMEOUT') + '(500) -> {}\n'
                   + '  PRESS(x, y) -> {}\n'
                   + '  _ -> {}\n'
                   + '}\n'
                   );
      expectAST(parser.parse(), [
        new ASTDefInteractiveProgram([
          new ASTSwitchBranch(
            new ASTPatternStructure(tok(T_UPPERID, 'INIT'), []),
            new ASTStmtBlock([])
          ),
          new ASTSwitchBranch(
            new ASTPatternTimeout(tok(T_NUM, '500')),
            new ASTStmtBlock([])
          ),
          new ASTSwitchBranch(
            new ASTPatternStructure(tok(T_UPPERID, 'PRESS'), [
              tok(T_LOWERID, 'x'),
              tok(T_LOWERID, 'y')
            ]),
            new ASTStmtBlock([])
          ),
          new ASTSwitchBranch(
            new ASTPatternWildcard(
              new ASTStmtBlock([])
            ),
            new ASTStmtBlock([])
          )
        ])
      ]);
    });

    it('Register attributes', () => {
      let parser = new Parser([
        '/*@ATTRIBUTE@atomic@true@*/',
        'interactive program {',
        '}',
      ].join('\n'));
      let ast = parser.parse().definitions;
      expect(ast.length).equals(1);
      expect(ast[0].attributes).deep.equals({'atomic': 'true'});
    });

  });

  describe('Procedure definition', () => {

    it('Accept procedure with no parameters', () => {
      let parser = new Parser('procedure P() {}');
      expectAST(parser.parse(), [
        new ASTDefProcedure(
          tok(T_UPPERID, 'P'),
          [],
          new ASTStmtBlock([])
        )
      ]);
    });

    it('Accept procedure with one parameter', () => {
      let parser = new Parser('procedure Poner(color) {}');
      expectAST(parser.parse(), [
        new ASTDefProcedure(
          tok(T_UPPERID, 'Poner'),
          [tok(T_LOWERID, 'color')],
          new ASTStmtBlock([])
        )
      ]);
    });

    it('Accept procedure with two parameters', () => {
      let parser = new Parser('procedure PonerN(n,col) {}');
      expectAST(parser.parse(), [
        new ASTDefProcedure(
          tok(T_UPPERID, 'PonerN'),
          [tok(T_LOWERID, 'n'), tok(T_LOWERID, 'col')],
          new ASTStmtBlock([])
        )
      ]);
    });

    it('Accept procedure with three parameters', () => {
      let parser = new Parser('procedure Q(x ,y, z) {}');
      expectAST(parser.parse(), [
        new ASTDefProcedure(
          tok(T_UPPERID, 'Q'),
          [tok(T_LOWERID, 'x'), tok(T_LOWERID, 'y'), tok(T_LOWERID, 'z')],
          new ASTStmtBlock([])
        )
      ]);
    });

    it('Fail on missing argument list', () => {
      let parser = new Parser('procedure P {}');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LPAREN'),
          i18n('T_LBRACE')
        )
      );
    });

    it('Fail on missing comma', () => {
      let parser = new Parser('procedure P(x y) {}');
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

    it('Reject initial comma', () => {
      let parser = new Parser('procedure P(,x) {}');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LOWERID'),
          i18n('T_COMMA')
        )
      );
    });

    it('Reject trailing comma', () => {
      let parser = new Parser('procedure P(x,y,) {}');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LOWERID'),
          i18n('T_RPAREN')
        )
      );
    });

    it('Fail on invalid (lowercase) name', () => {
      let parser = new Parser('procedure p(x, y) {}');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_UPPERID'),
          i18n('T_LOWERID')
        )
      );
    });

    it('Fail on invalid (uppercase) parameter', () => {
      let parser = new Parser('procedure P(x, Y) {}');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LOWERID'),
          i18n('T_UPPERID')
        )
      );
    });

    it('Fail on invalid block', () => {
      let parser = new Parser('procedure P\n(x, y) }');
      expect(() => parser.parse()).throws(
        i18n('errmsg:unmatched-closing-delimiter')('}')
      );
    });
     
    it('Keep track of positions', () => {
      let parser = new Parser(
          '/*@BEGIN_REGION@A@*//*ignore*/procedure P\n' +
          '/*@BEGIN_REGION@B@*/(x,y){} procedure Q()\n' +
          '{     /*@END_REGION@B@*/            }'
      );
      let ast = parser.parse().definitions;
      expect(ast.length).equals(2);
      expect(ast[0].startPos.line).equals(1);
      expect(ast[0].startPos.column).equals(11);
      expect(ast[0].startPos.region).equals('A');
      expect(ast[0].endPos.line).equals(2);
      expect(ast[0].endPos.column).equals(7);
      expect(ast[0].endPos.region).equals('B');
      expect(ast[1].startPos.line).equals(2);
      expect(ast[1].startPos.column).equals(9);
      expect(ast[1].startPos.region).equals('B');
      expect(ast[1].endPos.line).equals(3);
      expect(ast[1].endPos.column).equals(19);
      expect(ast[1].endPos.region).equals('A');
    });

    it('Register attributes', () => {
      let parser = new Parser([
        '/*@ATTRIBUTE@num@1@*/',
        '/*@ATTRIBUTE@foo@aaa@*/',
        'procedure P() {',
        '}',
        '/*@ATTRIBUTE@foo@bbb@*/',
        '/*@ATTRIBUTE@bar@ccc@*/',
        'procedure Q() {',
        '}',
        '/*@ATTRIBUTE@num@2@*/',
        'program {',
        '}',
      ].join('\n'));
      let ast = parser.parse().definitions;
      expect(ast.length).equals(3);
      expect(ast[0].attributes).deep.equals({'num': '1', 'foo': 'aaa'});
      expect(ast[1].attributes).deep.equals({'foo': 'bbb', 'bar': 'ccc'});
      expect(ast[2].attributes).deep.equals({'num': '2'});
    });

  });

  describe('Function definition', () => {

    it('Accept function with no parameters', () => {
      let parser = new Parser('function f() {}');
      expectAST(parser.parse(), [
        new ASTDefFunction(
          tok(T_LOWERID, 'f'),
          [],
          new ASTStmtBlock([])
        )
      ]);
    });

    it('Accept function with one parameter', () => {
      let parser = new Parser('function nroBolitas(color) {}');
      expectAST(parser.parse(), [
        new ASTDefFunction(
          tok(T_LOWERID, 'nroBolitas'),
          [tok(T_LOWERID, 'color')],
          new ASTStmtBlock([])
        )
      ]);
    });

    it('Accept function with two parameters', () => {
      let parser = new Parser('function nroBolitasAl(c, d) {}');
      expectAST(parser.parse(), [
        new ASTDefFunction(
          tok(T_LOWERID, 'nroBolitasAl'),
          [tok(T_LOWERID, 'c'), tok(T_LOWERID, 'd')],
          new ASTStmtBlock([])
        )
      ]);
    });

    it('Accept function with three parameters', () => {
      let parser = new Parser('function gg(x,yy,zzz) {}');
      expectAST(parser.parse(), [
        new ASTDefFunction(
          tok(T_LOWERID, 'gg'),
          [tok(T_LOWERID, 'x'), tok(T_LOWERID, 'yy'), tok(T_LOWERID, 'zzz')],
          new ASTStmtBlock([])
        )
      ]);
    });

    it('Accept mixed function and procedure definitions', () => {
      let parser = new Parser(
                     'function f(x) {}\n' +
                     'procedure P() {}\n' +
                     'procedure Q(x, y) {}\n' +
                     'program{}'
                   );
      expectAST(parser.parse(), [
        new ASTDefFunction(
          tok(T_LOWERID, 'f'),
          [tok(T_LOWERID, 'x')],
          new ASTStmtBlock([])
        ),
        new ASTDefProcedure(
          tok(T_UPPERID, 'P'),
          [],
          new ASTStmtBlock([])
        ),
        new ASTDefProcedure(
          tok(T_UPPERID, 'Q'),
          [tok(T_LOWERID, 'x'), tok(T_LOWERID, 'y')],
          new ASTStmtBlock([])
        ),
        new ASTDefProgram(
          new ASTStmtBlock([])
        )
      ]);
    });

    it('Register attributes', () => {
      let parser = new Parser([
        '/*@ATTRIBUTE@name@PPP@*/',
        'procedure P() {',
        '}',
        '/*@ATTRIBUTE@name@fff@*/',
        'function f() {',
        '  return (1)',
        '}',
        '/*@ATTRIBUTE@name@ggg@*/',
        'function g() {',
        '  return (1)',
        '}',
        'program {',
        '}',
      ].join('\n'));
      let ast = parser.parse().definitions;
      expect(ast.length).equals(4);
      expect(ast[0].attributes).deep.equals({'name': 'PPP'});
      expect(ast[1].attributes).deep.equals({'name': 'fff'});
      expect(ast[2].attributes).deep.equals({'name': 'ggg'});
      expect(ast[3].attributes).deep.equals({});
    });

  });

  describe('Type definition', () => {

    it('Reject if type name is not an uppercase identifier', () => {
      let parser = new Parser('type a');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_UPPERID'),
          i18n('T_LOWERID')
        )
      );
    });

    it('Reject if missing "is"', () => {
      let parser = new Parser('type A');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_IS'),
          i18n('T_EOF')
        )
      );
    });

    it('Reject if keyword is not "variant" or "record"', () => {
      let parser = new Parser('type A is while');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('<alternative>')([
            i18n('T_RECORD'),
            i18n('T_VARIANT')
          ]),
          i18n('T_WHILE')
        )
      );
    });

    it('Reject if keyword "field" is not used for records', () => {
      let parser = new Parser('type A is record { x }');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('<alternative>')([
            i18n('T_FIELD'),
            i18n('T_RBRACE')
          ]),
          i18n('T_LOWERID')
        )
      );
    });

    it('Reject if field name is not a lowercase identifier', () => {
      let parser = new Parser('type A is record { field Z } ');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_LOWERID'),
          i18n('T_UPPERID')
        )
      );
    });

    it('Reject if keyword "case" is not used for variants', () => {
      let parser = new Parser('type A is variant { x }');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('<alternative>')([
            i18n('T_CASE'),
            i18n('T_RBRACE')
          ]),
          i18n('T_LOWERID')
        )
      );
    });

    it('Reject if constructor name is not an uppercase identifier', () => {
      let parser = new Parser('type A is variant { case b } ');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('T_UPPERID'),
          i18n('T_LOWERID')
        )
      );
    });

    it('Reject if keyword "field" is not used for variant constructors', () => {
      let parser = new Parser('type A is variant { case B { x } }');
      expect(() => parser.parse()).throws(
        i18n('errmsg:expected-but-found')(
          i18n('<alternative>')([
            i18n('T_FIELD'),
            i18n('T_RBRACE')
          ]),
          i18n('T_LOWERID')
        )
      );
    });

    it('Accept definition of record types', () => {
      let parser = new Parser(
                     'type A is record {\n'
                   + '}\n'
                   + 'type B is record {\n'
                   + '  field x\n'
                   + '}\n'
                   + 'type C is record {\n'
                   + '  field x\n'
                   + '  field y\n'
                   + '}\n'
                   );
      expectAST(parser.parse(), [
          new ASTDefType(tok(T_UPPERID, 'A'), [
            new ASTConstructorDeclaration(tok(T_UPPERID, 'A'), [
            ])
          ]),
          new ASTDefType(tok(T_UPPERID, 'B'), [
            new ASTConstructorDeclaration(tok(T_UPPERID, 'B'), [
              tok(T_LOWERID, 'x')
            ])
          ]),
          new ASTDefType(tok(T_UPPERID, 'C'), [
            new ASTConstructorDeclaration(tok(T_UPPERID, 'C'), [
              tok(T_LOWERID, 'x'),
              tok(T_LOWERID, 'y')
            ])
          ])
      ]);
    });

    it('Accept definition of variant types', () => {
      let parser = new Parser(
                     'type A is variant {\n'
                   + '  case A1 {}\n'
                   + '  case A2 {\n'
                   + '    field x\n'
                   + '  }\n'
                   + '  case A3 {\n'
                   + '    field y\n'
                   + '    field z\n'
                   + '  }\n'
                   + '}\n'
                   );
      expectAST(parser.parse(), [
          new ASTDefType(tok(T_UPPERID, 'A'), [
            new ASTConstructorDeclaration(tok(T_UPPERID, 'A1'), [
            ]),
            new ASTConstructorDeclaration(tok(T_UPPERID, 'A2'), [
              tok(T_LOWERID, 'x')
            ]),
            new ASTConstructorDeclaration(tok(T_UPPERID, 'A3'), [
              tok(T_LOWERID, 'y'),
              tok(T_LOWERID, 'z')
            ])
          ])
      ]);
    });

    it('Keep track of positions (records)', () => {
      let parser = new Parser(
                     'type A is record {\n'
                   + '  field x\n'
                   + '  field y\n'
                   + '}\n'
                   );
      let ast = parser.parse().definitions;
      expect(ast[0].startPos.line).equals(1);
      expect(ast[0].startPos.column).equals(1);
      expect(ast[0].endPos.line).equals(4);
      expect(ast[0].endPos.column).equals(1);

      expect(ast[0].constructorDeclarations.length).equals(1);
      expect(ast[0].constructorDeclarations[0].fieldNames.length).equals(2);

      let fx = ast[0].constructorDeclarations[0].fieldNames[0];
      expect(fx.startPos.line).equals(2);
      expect(fx.startPos.column).equals(9);
      expect(fx.endPos.line).equals(2);
      expect(fx.endPos.column).equals(10);

      let fy = ast[0].constructorDeclarations[0].fieldNames[1];
      expect(fy.startPos.line).equals(3);
      expect(fy.startPos.column).equals(9);
      expect(fy.endPos.line).equals(3);
      expect(fy.endPos.column).equals(10);
    });

    it('Keep track of positions (variants)', () => {
      let parser = new Parser(
                     'type A is variant {\n'
                   + '  case A0 {}\n'
                   + '  case A1 {\n'
                   + '    field x\n'
                   + '    field y\n'
                   + '  }\n'
                   + '}\n'
                   );
      let ast = parser.parse().definitions;
      expect(ast[0].startPos.line).equals(1);
      expect(ast[0].startPos.column).equals(1);
      expect(ast[0].endPos.line).equals(7);
      expect(ast[0].endPos.column).equals(1);

      expect(ast[0].constructorDeclarations.length).equals(2);
      expect(ast[0].constructorDeclarations[0].fieldNames.length).equals(0);
      expect(ast[0].constructorDeclarations[1].fieldNames.length).equals(2);

      expect(ast[0].constructorDeclarations[0].startPos.line).equals(2);
      expect(ast[0].constructorDeclarations[0].startPos.column).equals(3);
      expect(ast[0].constructorDeclarations[0].endPos.line).equals(2);
      expect(ast[0].constructorDeclarations[0].endPos.column).equals(12);

      expect(ast[0].constructorDeclarations[1].startPos.line).equals(3);
      expect(ast[0].constructorDeclarations[1].startPos.column).equals(3);
      expect(ast[0].constructorDeclarations[1].endPos.line).equals(6);
      expect(ast[0].constructorDeclarations[1].endPos.column).equals(3);

      let fx = ast[0].constructorDeclarations[1].fieldNames[0]
      expect(fx.startPos.line).equals(4);
      expect(fx.startPos.column).equals(11);
      expect(fx.endPos.line).equals(4);
      expect(fx.endPos.column).equals(12);
    });

    it('Register attributes', () => {
      let parser = new Parser([
        '/*@ATTRIBUTE@a@1@*/',
        '/*@ATTRIBUTE@b@2@*/',
        'program {',
        '}',
        '/*@ATTRIBUTE@c@3@*/',
        'type A is record {',
        '  field a',
        '}',
        '/*@ATTRIBUTE@d@4@*/',
        'type B is variant {',
        '  case BB { field b }',
        '}',
        '/*@ATTRIBUTE@e@5@*/',
        'type C is variant {',
        '  case CC { field c }',
        '}',
      ].join('\n'));
      let ast = parser.parse().definitions;
      expect(ast.length).equals(4);
      expect(ast[0].attributes).deep.equals({'a': '1', 'b': '2'});
      expect(ast[1].attributes).deep.equals({'c': '3'});
      expect(ast[2].attributes).deep.equals({'d': '4'});
      expect(ast[3].attributes).deep.equals({'e': '5'});
    });

  });

  describe('LANGUAGE pragma', () => {

    it('Recognize LANGUAGE option DestructuringForeach', () => {
      let parser = new Parser([
        '/*@LANGUAGE@DestructuringForeach@*/',
        'program {',
        '}'
      ]);
      parser.parse();
      expect(parser.getLanguageOptions()).deep.equals([
        'DestructuringForeach'
      ]);
    });

    it('Fail on unknown LANGUAGE option', () => {
      expect(() => 
          new Parser([
            '/*@LANGUAGE@foobar@*/',
            'program {',
            '}'
          ]).parse()
      ).throws(
        i18n('errmsg:unknown-language-option')('foobar')
      );
    });

  });

});

