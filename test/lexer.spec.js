import chai from 'chai';

import {
  T_EOF, T_NUM, T_STRING, T_LOWERID, T_UPPERID,
  /* Keywords */
  T_PROGRAM, T_INTERACTIVE, T_PROCEDURE, T_FUNCTION, T_RETURN,
  T_IF, T_THEN, T_ELSE, T_REPEAT, T_FOREACH, T_IN, T_WHILE,
  T_SWITCH, T_TO, T_LET, T_NOT, T_DIV, T_MOD, T_TYPE,
  T_IS, T_RECORD, T_VARIANT, T_CASE, T_FIELD, T_UNDERSCORE,
  T_TIMEOUT,
  /* Symbols */
  T_LPAREN, T_RPAREN, T_LBRACE, T_RBRACE, T_LBRACK, T_RBRACK, T_COMMA,
  T_SEMICOLON, T_RANGE, T_GETS, T_PIPE, T_ARROW, T_ASSIGN,
  T_EQ, T_NE, T_LE, T_GE, T_LT, T_GT, T_AND, T_OR, T_CONCAT, T_PLUS,
  T_MINUS, T_TIMES, T_POW
} from '../src/token';
import {Lexer} from '../src/lexer';
import {i18n} from '../src/i18n';

chai.expect();
const expect = chai.expect;

it('Lexer - Empty source', () => {
  let lexer = new Lexer('');
  let tok = lexer.nextToken();
  expect(tok.tag).equals(T_EOF);
});

it('Lexer - Ignore whitespace', () => {
  let lexer = new Lexer('   \n\t   \r\n  \n\n ');
  let tok = lexer.nextToken();
  expect(tok.tag).equals(T_EOF);
  expect(tok.startPos.line).equals(5);
  expect(tok.startPos.column).equals(2);
});

it('Lexer - Numbers', () => {
  let lexer = new Lexer('1  222\n34567890123');
  let t1 = lexer.nextToken();
  let t2 = lexer.nextToken();
  let t3 = lexer.nextToken();
  let t4 = lexer.nextToken();

  expect(t1.tag).equals(T_NUM);
  expect(t1.value).equals('1');
  expect(t1.startPos.line).equals(1);
  expect(t1.startPos.column).equals(1);
  expect(t1.endPos.line).equals(1);
  expect(t1.endPos.column).equals(2);

  expect(t2.tag).equals(T_NUM);
  expect(t2.value).equals('222');
  expect(t2.startPos.line).equals(1);
  expect(t2.startPos.column).equals(4);
  expect(t2.endPos.line).equals(1);
  expect(t2.endPos.column).equals(7);

  expect(t3.tag).equals(T_NUM);
  expect(t3.value).equals('34567890123');
  expect(t3.startPos.line).equals(2);
  expect(t3.startPos.column).equals(1);
  expect(t3.endPos.line).equals(2);
  expect(t3.endPos.column).equals(12);

  expect(t4.tag).equals(T_EOF);
});

function expectToken(actualToken, expectedType, expectedValue) {
  expect(actualToken.tag).equals(expectedType);
  expect(actualToken.value).equals(expectedValue);
}

function expectTokens(lexer, expected) {
  for (let [expectedType, expectedValue] of expected) {
    let actualToken = lexer.nextToken();
    expectToken(actualToken, expectedType, expectedValue);
  }
}

function expectTokenTypes(lexer, expected) {
  for (let expectedType of expected) {
    let actualToken = lexer.nextToken();
    expect(actualToken.tag).equals(expectedType);
  }
}

it('Lexer - Accept the number zero', () => {
  let lexer = new Lexer('  0  0');
  expectTokens(lexer, [
    [T_NUM, '0'], [T_NUM, '0'], [T_EOF, null]
  ]);
});

it('Lexer - Reject the number zero when written with two digits', () => {
  let lexer = new Lexer('  00 ');
  expect(() => lexer.nextToken()).throws(
    i18n('errmsg:numeric-constant-should-not-have-leading-zeroes')
  );
});

it('Lexer - Reject the number zero when written with three digits', () => {
  let lexer = new Lexer('  000 ');
  expect(() => lexer.nextToken()).throws(
    i18n('errmsg:numeric-constant-should-not-have-leading-zeroes')
  );
});

it('Lexer - Reject other constants with leading zeroes', () => {
  let lexer = new Lexer('  00007 ');
  expect(() => lexer.nextToken()).throws(
    i18n('errmsg:numeric-constant-should-not-have-leading-zeroes')
  );
});

it('Lexer - C-style single line comments', () => {
  let lexer = new Lexer('// 1 2 3 ñácate\n 4  5 // 6\n 7 // 8 9');
  expectTokens(lexer, [
    [T_NUM, '4'], [T_NUM, '5'], [T_NUM, '7'], [T_EOF, null]
  ]);
});

it('Lexer - Haskell-style single line comments', () => {
  let lexer = new Lexer('10------20\n30-----40');
  expectTokens(lexer, [
    [T_NUM, '10'], [T_NUM, '30'], [T_EOF, null]
  ]);
});

it('Lexer - Shell-style single line comments', () => {
  let lexer = new Lexer('1 2 3 # 4 5 6\n10 20 30 # 40 50 60');
  expectTokens(lexer, [
    [T_NUM, '1'], [T_NUM, '2'], [T_NUM, '3'],
    [T_NUM, '10'], [T_NUM, '20'], [T_NUM, '30'],
    [T_EOF, null]
  ]);
});


it('Lexer - C-style multiline comments', () => {
  let lexer = new Lexer('1 2 /*3 4 \n\n\nññfsdalkfaf\n 5 6*/ 7 8 /*9*/ 10');
  expectTokens(lexer, [
    [T_NUM, '1'], [T_NUM, '2'], [T_NUM, '7'], [T_NUM, '8']
  ]);
  let tok = lexer.nextToken();
  expect(tok.startPos.line).equals(5);
  expect(tok.startPos.column).equals(18);
});

it('Lexer - Haskell-style multiline comments', () => {
  let lexer = new Lexer('{-\n\n\n-}1{--}2{--}3\n4');
  expectTokens(lexer, [[T_NUM, '1'], [T_NUM, '2'], [T_NUM, '3']]);
  let tok = lexer.nextToken();
  expect(tok.startPos.line).equals(5);
  expect(tok.startPos.column).equals(1);
});

it('Lexer - Nested C-style multiline comments', () => {
  let lexer = new Lexer('1 /* 2 /* 3 /*4*/ 5 /*6*/ 7 */ 8 /*9*/ 10//--*/ 11');
  expectTokens(lexer, [
    [T_NUM, '1'], [T_NUM, '11'], [T_EOF, null]
  ]);
});

it('Lexer - Nested Haskell-style multiline comments', () => {
  let lexer = new Lexer('5{-{-{-{-{-4-}-}-}-}-}3{-{-{-{-{-2-}-}-}-}-}1');
  expectTokens(lexer, [
    [T_NUM, '5'], [T_NUM, '3'], [T_NUM, '1'], [T_EOF, null]
  ]);
});

it('Lexer - Unclosed C-style multiline comment', () => {
  let lexer = new Lexer('1 /* /**/');
  expect(lexer.nextToken().tag).equals(T_NUM);
  expect(() => lexer.nextToken()).throws(
                 i18n('errmsg:unclosed-multiline-comment')
               );
});

it('Lexer - Unclosed Haskell-style multiline comment', () => {
  let lexer = new Lexer('  {-\n\n---/***/  ');
  expect(() => lexer.nextToken()).throws(
                 i18n('errmsg:unclosed-multiline-comment')
               );
});

it('Lexer - Reading from many files', () => {
  let lexer = new Lexer({
    'A': '1 22',
    'B': '333',
    'C': '4 5 6',
  });
  expectTokens(lexer, [
    [T_NUM, '1'], [T_NUM, '22'], [T_NUM, '333'],
    [T_NUM, '4'], [T_NUM, '5'], [T_NUM, '6'], [T_EOF, null]
  ]);
});

it('Lexer - Reading from many files: skip empty files', () => {
  let lexer = new Lexer({
    'A': '1 2 \n',
    'B': '    \n\n\n /*  \n */ ',
    'C': '    \n\n\n 3',
  });
  expectTokens(lexer, [
    [T_NUM, '1'], [T_NUM, '2'], [T_NUM, '3'], [T_EOF, null]
  ]);
});

it('Lexer - Reading from many files: skip multiple empty files', () => {
  let lexer = new Lexer({
    'A': '\n',
    'B': '    \n\n\n /*  \n */ ',
    'C': '',
    'D': '\n',
  });
  expectTokens(lexer, [[T_EOF, null]]);
});

it('Lexer - Reading from many files: no files', () => {
  let lexer = new Lexer({});
  expectTokens(lexer, [[T_EOF, null]]);
});

it('Lexer - Reading from many files: check for premature end-of-file', () => {
  let lexer = new Lexer({
    'A': '/*', // Should report premature end-of-file
    'B': '1',  // (Multiline comments cannot span multiple files)
    'C': '*/',
  });
  expect(() => lexer.nextToken()).throws();
});

it('Lexer - Reading from many files: report positions correctly', () => {
  let lexer = new Lexer({
    'A': '1\n 2',
    'B': '3\n 4',
    'C': '5\n 6',
  });
  let tA1 = lexer.nextToken();
  let tA2 = lexer.nextToken();
  let tB3 = lexer.nextToken();
  let tB4 = lexer.nextToken();
  let tC5 = lexer.nextToken();
  let tC6 = lexer.nextToken();

  expect(tA1.startPos.filename).equals('A');
  expect(tA1.startPos.line).equals(1);
  expect(tA1.startPos.column).equals(1);

  expect(tA2.startPos.filename).equals('A');
  expect(tA2.startPos.line).equals(2);
  expect(tA2.startPos.column).equals(2);

  expect(tB3.startPos.filename).equals('B');
  expect(tB3.startPos.line).equals(1);
  expect(tB3.startPos.column).equals(1);

  expect(tB4.startPos.filename).equals('B');
  expect(tB4.startPos.line).equals(2);
  expect(tB4.startPos.column).equals(2);

  expect(tC5.startPos.filename).equals('C');
  expect(tC5.startPos.line).equals(1);
  expect(tC5.startPos.column).equals(1);

  expect(tC6.startPos.filename).equals('C');
  expect(tC6.startPos.line).equals(2);
  expect(tC6.startPos.column).equals(2);
});

it('Lexer - Unclosed pragma', () => {
  let lexer = new Lexer('/*@');
  expect(() => lexer.nextToken()).throws(
                 i18n('errmsg:unclosed-multiline-comment')
               );
});

it('Lexer - Unclosed pragma fragment', () => {
  let lexer = new Lexer('/*@BEGIN_REGION@foo');
  expect(() => lexer.nextToken()).throws(
                 i18n('errmsg:unclosed-multiline-comment')
               );
});

it('Lexer - Empty pragma', () => {
  let lexer = new Lexer('/*@FOO@BAR@*/');
  expectTokens(lexer, [[T_EOF, null]]);

  let w = lexer.warnings();
  expect(w.length).equals(1);
  expect(w[0].message).equals(
    i18n('warning:unknown-pragma')('FOO')
  );
});

it('Lexer - Pragma BEGIN_REGION .. END_REGION', () => {
  let lexer = new Lexer(
      '/*@BEGIN_REGION@region A@*/' +
      '1' +
      '/*@BEGIN_REGION@region B@*/' +
      '2' +
      '/*@END_REGION@*/' +
      '3' +
      '/*@BEGIN_REGION@region C@*/' +
      '4' +
      '/*@END_REGION@*/' +
      '5' +
      '/*@END_REGION@*/'
  );
  let t1 = lexer.nextToken();
  let t2 = lexer.nextToken();
  let t3 = lexer.nextToken();
  let t4 = lexer.nextToken();
  let t5 = lexer.nextToken();
  let t6 = lexer.nextToken();
  expectToken(t1, T_NUM, '1');
  expect(t1.startPos.region).equals('region A');
  expectToken(t2, T_NUM, '2');
  expect(t2.startPos.region).equals('region B');
  expectToken(t3, T_NUM, '3');
  expect(t3.startPos.region).equals('region A');
  expectToken(t4, T_NUM, '4');
  expect(t4.startPos.region).equals('region C');
  expectToken(t5, T_NUM, '5');
  expect(t5.startPos.region).equals('region A');
  expect(t5.startPos.column).equals(5);
  expectToken(t6, T_EOF, null);
});

it('Lexer - Identifiers', () => {
  let lexer = new Lexer(
                "x x' x42 Poner Poner' PonerN Mover nroBolitas Rojo a_b_c"
              );
  expectTokens(lexer, [
    [T_LOWERID, 'x'],
    [T_LOWERID, "x'"],
    [T_LOWERID, 'x42'],
    [T_UPPERID, 'Poner'],
    [T_UPPERID, "Poner'"],
    [T_UPPERID, 'PonerN'],
    [T_UPPERID, 'Mover'],
    [T_LOWERID, 'nroBolitas'],
    [T_UPPERID, 'Rojo'],
    [T_LOWERID, 'a_b_c'],
    [T_EOF, null]
  ]);
});

it('Lexer - Reject identifier started with single quote', () => {
  let lexer = new Lexer("'hola");
  expect(() => lexer.nextToken()).throws(
    i18n('errmsg:identifier-must-start-with-alphabetic-character')
  );
});

it('Lexer - Keywords', () => {
  let words = [
    'program',
    'interactive',
    'procedure',
    'function',
    'return',
    'if',
    'then',
    'else',
    'repeat',
    'foreach',
    'in',
    'while',
    'switch',
    'match',
    'to',
    'let',
    'not',
    'div',
    'mod',
    'type',
    'is',
    'record',
    'variant',
    'case',
    'field',
    '_',
    'TIMEOUT',
  ];
  let lexer = new Lexer(words.join(' '));
  expectTokenTypes(lexer, [
    T_PROGRAM,
    T_INTERACTIVE,
    T_PROCEDURE,
    T_FUNCTION,
    T_RETURN,
    T_IF,
    T_THEN,
    T_ELSE,
    T_REPEAT,
    T_FOREACH,
    T_IN,
    T_WHILE,
    T_SWITCH,
    T_SWITCH,
    T_TO,
    T_LET,
    T_NOT,
    T_DIV,
    T_MOD,
    T_TYPE,
    T_IS,
    T_RECORD,
    T_VARIANT,
    T_CASE,
    T_FIELD,
    T_UNDERSCORE,
    T_TIMEOUT,
    T_EOF
  ]);
});

it('Lexer - Symbols', () => {
  let words = [
    '(',
    ')',
    '{',
    '}',
    '[',
    ']',
    ',',
    ';',
    '..',
    '<-',
    '|',
    '->',
    ':=',
    '==',
    '/=',
    '<=',
    '>=',
    '<',
    '>',
    '&&',
    '||',
    '++',
    '+',
    '-',
    '*',
    '^'
  ];
  let lexer = new Lexer(words.join(' '));
  expectTokenTypes(lexer, [
    T_LPAREN,
    T_RPAREN,
    T_LBRACE,
    T_RBRACE,
    T_LBRACK,
    T_RBRACK,
    T_COMMA,
    T_SEMICOLON,
    T_RANGE,
    T_GETS,
    T_PIPE,
    T_ARROW,
    T_ASSIGN,
    T_EQ,
    T_NE,
    T_LE,
    T_GE,
    T_LT,
    T_GT,
    T_AND,
    T_OR,
    T_CONCAT,
    T_PLUS,
    T_MINUS,
    T_TIMES,
    T_POW
  ]);
});

it('Lexer - Unknown token', () => {
  let lexer = new Lexer('%');
  expect(() => lexer.nextToken()).throws(i18n('errmsg:unknown-token')('%'));
});

it('Lexer - Basic string constants', () => {
  let lexer = new Lexer('"" "a" "hola""chau"');
  expectTokens(lexer, [
      [T_STRING, ''],
      [T_STRING, 'a'],
      [T_STRING, 'hola'],
      [T_STRING, 'chau'],
      [T_EOF, null]
  ]);
});

it('Lexer - String constants with escapes', () => {
  let lexer = new Lexer(
                '"","\\"","\\\\","\\a","\\b","\\f","\\n","\\r","\\t","\\v"'
              );
  expectTokens(lexer, [
      [T_STRING, ''],
      [T_COMMA, ','],
      [T_STRING, '"'],
      [T_COMMA, ','],
      [T_STRING, '\\'],
      [T_COMMA, ','],
      [T_STRING, '\a'],
      [T_COMMA, ','],
      [T_STRING, '\b'],
      [T_COMMA, ','],
      [T_STRING, '\f'],
      [T_COMMA, ','],
      [T_STRING, '\n'],
      [T_COMMA, ','],
      [T_STRING, '\r'],
      [T_COMMA, ','],
      [T_STRING, '\t'],
      [T_COMMA, ','],
      [T_STRING, '\v'],
      [T_EOF, null]
  ]);
});

it('Lexer - Unclosed string constant', () => {
  let lexer = new Lexer(' "hola \n ');
  expect(() => lexer.nextToken()).throws(
    i18n('errmsg:unclosed-string-constant')
  );
});

it('Lexer - Unclosed string constant after escape', () => {
  let lexer = new Lexer(' "hola \\');
  expect(() => lexer.nextToken()).throws(
    i18n('errmsg:unclosed-string-constant')
  );
});

it('Lexer - Reject obsolete tuple assignment: empty tuple', () => {
  let lexer = new Lexer('() :=');
  lexer.nextToken();
  lexer.nextToken();
  expect(() => lexer.nextToken()).throws(
    i18n('errmsg:obsolete-tuple-assignment')
  );
});

it('Lexer - Reject obsolete tuple assignment: singleton', () => {
  let lexer = new Lexer('(x) :=');
  for (let i = 0; i < 3; i++) {
    lexer.nextToken();
  }
  expect(() => lexer.nextToken()).throws(
    i18n('errmsg:obsolete-tuple-assignment')
  );
});

it('Lexer - Reject obsolete tuple assignment: proper tuple', () => {
  let lexer = new Lexer('(x,y,z) :=');
  for (let i = 0; i < 7; i++) {
    lexer.nextToken();
  }
  expect(() => lexer.nextToken()).throws(
    i18n('errmsg:obsolete-tuple-assignment')
  );
});

it('Lexer - Accept tuple assignment with let: empty tuple', () => {
  let lexer = new Lexer('let () :=');
  expectTokenTypes(lexer, [T_LET, T_LPAREN, T_RPAREN, T_ASSIGN, T_EOF]);
});

it('Lexer - Accept tuple assignment with let: singleton', () => {
  let lexer = new Lexer('let (x) :=');
  expectTokenTypes(lexer, [T_LET, T_LPAREN, T_LOWERID, T_RPAREN, T_ASSIGN, T_EOF]);
});

it('Lexer - Accept tuple assignment with let: proper tuple', () => {
  let lexer = new Lexer('let (x,y,z) :=');
  expectTokenTypes(lexer, [
      T_LET, T_LPAREN, T_LOWERID, T_COMMA, T_LOWERID, T_COMMA, T_LOWERID,
      T_RPAREN, T_ASSIGN, T_EOF
  ]);
});

