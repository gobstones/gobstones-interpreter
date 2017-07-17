import { i18n } from './i18n';
import { Warning, SyntaxError } from './exceptions';
import { MultifileReader } from './reader';
import {
  Token, T_EOF, T_NUM, T_STRING, T_LOWERID, T_UPPERID,
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
} from './token';

function isWhitespace(chr) {
  return chr === ' '
      || chr === '\t'
      || chr === '\r'
      || chr === '\n';
}

function isDigit(chr) {
  return '0' <= chr && chr <= '9';
}

function isUpper(chr) {
  return 'A' <= chr && chr <= 'Z';
}

function isLower(chr) {
  return 'a' <= chr && chr <= 'z';
}

function isAlpha(chr) {
  return isUpper(chr) || isLower(chr);
}

function isIdent(chr) {
  return isAlpha(chr) || isDigit(chr) || chr === '_';
}

const KEYWORDS = {
  'program': T_PROGRAM,
  'interactive': T_INTERACTIVE,
  'procedure': T_PROCEDURE,
  'function': T_FUNCTION,
  'return': T_RETURN,
  /* Control structures */
  'if': T_IF,
  'then': T_THEN,
  'else': T_ELSE,
  'repeat': T_REPEAT,
  'foreach': T_FOREACH,
  'in': T_IN,
  'while': T_WHILE,
  'switch': T_SWITCH,
  'to': T_TO,
  'match': T_MATCH,   /* XXX: Should match/switch be the same token? */
  /* Assignment */
  'let': T_LET,
  /* Operators */
  'not': T_NOT,
  'div': T_DIV,
  'mod': T_MOD,
  /* Records/variants */
  'type': T_TYPE,
  'is': T_IS,
  'record': T_RECORD,
  'variant': T_VARIANT,
  'case': T_CASE,
  'field': T_FIELD,
  /* Default case in a switch/match */
  '_': T_UNDERSCORE,
};

/* Note: the order is relevant so that the 'maximal munch' rule applies. */
const SYMBOLS = [
  /* Various delimiters */
  ['(', T_LPAREN],
  [')', T_RPAREN],
  ['{', T_LBRACE],
  ['}', T_RBRACE],
  ['[', T_LBRACK],    // For lists and ranges
  [']', T_RBRACK],
  [',', T_COMMA],
  [';', T_SEMICOLON],
  /* Range operator */
  ['..', T_RANGE],
  /* Assignment */
  [':=', T_ASSIGN],
  /* Logical operators */
  ['&&', T_AND],
  ['||', T_OR],
  /* Fields */
  ['<-', T_GETS],     // Field initializer, e.g. Coord(x <- 1, y <- 2)
  ['|', T_PIPE],      // Field update, e.g. Coord(c | x <- 2)
  /* Relational operators */
  ['==', T_EQ],
  ['/=', T_NE],
  ['<=', T_LE],
  ['>=', T_GE],
  ['<', T_LT],
  ['>', T_GT],
  /* Functions */
  ['++', T_CONCAT],
  ['+', T_PLUS],
  ['-', T_MINUS],
  ['*', T_TIMES],
  ['^', T_POW]
];

/* Class that recognizes the presence of the obsolete tuple assignment syntax
 *
 *   (x1, ..., xN) := ...
 *
 * in favour of
 *
 *   let (x1, ..., xN) := ...
 *
 * This is done using a simple finite automaton with five states:
 *
 *   1: no information
 *   2: we have read "(x1,...,xN," with N >= 1 or just "(", without "let"
 *   3: we have read "(x1,...,xN"  with N >= 1, without "let"
 *   4: we have read "(x1,...,xN)", without "let"
 *   5: we have read "let
 *
 * If it finds a tuple assignment without let, it throws a SyntaxError.
 */
class ObsoleteTupleAssignmentRecognizer {
  constructor() {
    this._state = 1;
    this._table = {1: {}, 2: {}, 3: {}, 4: {}, 5: {}};
    this._table[1][T_LPAREN] = 2;
    this._table[1][T_LET] = 5;
    this._table[2][T_LPAREN] = 2;
    this._table[2][T_RPAREN] = 4;
    this._table[2][T_LOWERID] = 3;
    this._table[2][T_LET] = 5;
    this._table[3][T_LPAREN] = 2;
    this._table[3][T_RPAREN] = 4;
    this._table[3][T_COMMA] = 2;
    this._table[3][T_LET] = 5;
    this._table[4][T_LPAREN] = 2;
    this._table[4][T_ASSIGN] = 1; /* throws warning */
    this._table[4][T_LET] = 5;
    this._table[5][T_LPAREN] = 1;
    this._table[5][T_LET] = 5;
  }

  feed(pos, tokenType) {
    if (this._state === 4 && tokenType === T_ASSIGN) {
      throw new SyntaxError(pos, i18n('errmsg:obsolete-tuple-assignment'));
    }
    if (tokenType in this._table[this._state]) {
      this._state = this._table[this._state][tokenType];
    } else {
      this._state = 1;
    }
  }
}

/* An instance of Lexer scans source code for tokens.
 * Example:
 *
 *     var tok = new Lexer('if (a)');
 *     tok.nextToken(); // ~~> new Token(T_IF, null, ...)
 *     tok.nextToken(); // ~~> new Token(T_LPAREN, null, ...)
 *     tok.nextToken(); // ~~> new Token(T_LOWERID, 'a', ...)
 *     tok.nextToken(); // ~~> new Token(T_RPAREN, null, ...)
 *     tok.nextToken(); // ~~> new Token(T_EOF, null, ...)
 *
 * The 'input' parameter is either a string or a mapping
 * from filenames to strings.
 */
export class Lexer {

  constructor(input) {
    this._multifileReader = new MultifileReader(input);
    this._reader = this._multifileReader.readCurrentFile();
    this._warnings = [];
    this._obsoleteTupleAssignmentRecognizer = new ObsoleteTupleAssignmentRecognizer();
  }

  /* Return the next token from the input, checking for warnings */
  nextToken() {
    var startPos = this._reader;
    var tok = this._nextToken();
    this._obsoleteTupleAssignmentRecognizer.feed(startPos, tok.type);
    return tok;
  }

  /* When tokenization is done, this function returns the list of all
   * the warnings collected during tokenization */
  warnings() {
    return this._warnings;
  }

  /* Actually read and return the next token from the input */
  _nextToken() {
    if (!this._findNextToken()) {
      return new Token(T_EOF, null, this._reader, this._reader);
    }
    if (isDigit(this._reader.peek())) {
      let startPos = this._reader;
      let value = this._readStringWhile(isDigit);
      let endPos = this._reader;
      return new Token(T_NUM, value, startPos, endPos);
    } else if (isIdent(this._reader.peek())) {
      let startPos = this._reader;
      let value = this._readStringWhile(isIdent);
      let endPos = this._reader;
      if (value in KEYWORDS) {
        return new Token(KEYWORDS[value], value, startPos, endPos);
      } else if (isUpper(value[0])) {
        return new Token(T_UPPERID, value, startPos, endPos);
      } else {
        return new Token(T_LOWERID, value, startPos, endPos);
      }
    } else if (this._reader.peek() === '"') {
      return this._readStringConstant();
    } else {
      return this._readSymbol();
    }
  }

  /* Skip whitespace and advance through files until the start of the next
   * token is found. Return false if EOF is found. */
  _findNextToken() {
    for (;;) {
      this._ignoreWhitespaceAndComments();
      if (!this._reader.eof()) {
        break;
      }
      if (this._multifileReader.moreFiles()) {
        this._multifileReader.nextFile();
        this._reader = this._multifileReader.readCurrentFile();
      } else {
        return false;
      }
    }
    return true;
  }

  /* Read a string while the given condition holds for the current
   * character */
  _readStringWhile(condition) {
    var result = [];
    while (!this._reader.eof()) {
      if (!condition(this._reader.peek())) {
        break;
      }
      result.push(this._reader.peek());
      this._reader = this._reader.consumeCharacter();
    }
    return result.join('');
  }

  /* Reads a quote-delimited string constant.
   * Escapes are recognized. */
  _readStringConstant() {
    var startPos = this._reader;
    var result = [];
    this._reader = this._reader.consumeCharacter();
    while (!this._reader.eof()) {
      let c = this._reader.peek();
      if (c === '"') {
        this._reader = this._reader.consumeCharacter();
        return new Token(T_STRING, result.join('', startPos, this._reader));
      } else if (c === '\\') {
        this._reader = this._reader.consumeCharacter();
        if (this._reader.eof()) {
          break;
        }
        let c2 = this._reader.peek();
        this._reader = this._reader.consumeCharacter();
        switch (c2) {
          case 't':
            result.push('\t');
            break;
          case 'n':
            result.push('\n');
            break;
          case 'r':
            result.push('\r');
            break;
          default:
            result.push(c2);
            break;
        }
      } else {
        result.push(c);
        this._reader = this._reader.consumeCharacter();
      }
    }
    throw new SyntaxError(
                startPos,
                i18n('errmsg:unclosed-string-constant')
              );
  }

  /* Read a symbol */
  _readSymbol() {
    for (var [symbol, type] of SYMBOLS) {
      if (this._reader.startsWith(symbol)) {
        let startPos = this._reader;
        this._reader = this._reader.consumeString(symbol);
        let endPos = this._reader;
        return new Token(type, symbol, startPos, endPos);
      }
    }
    throw new SyntaxError(this._reader, i18n('errmsg:unknown-token'));
  }

  _ignoreWhitespaceAndComments() {
    while (this._ignoreWhitespace() || this._ignoreComments()) {
      /* continue */
    }
  }

  _ignoreWhitespace() {
    if (!this._reader.eof() && isWhitespace(this._reader.peek())) {
      this._reader = this._reader.consumeCharacter();
      return true;
    } else {
      return false;
    }
  }

  /* Skips comments and pragmas, returns false if there are no comments */
  _ignoreComments() {
    if (this._startSingleLineComment()) {
      this._ignoreSingleLineComment();
      return true;
    } else if (this._reader.startsWith('/*@')) {
      var startPos = this._reader;
      this._evaluatePragma(startPos,
                           this._readInvisiblePragma('/*', '*/', '@'));
      return true;
    } else if (this._reader.startsWith('{-')) {
      this._ignoreMultilineComment('{-', '-}');
      return true;
    } else if (this._reader.startsWith('/*')) {
      this._ignoreMultilineComment('/*', '*/');
      return true;
    } else {
      return false;
    }
  }

  /* Returns true if a single-line comment starts here */
  _startSingleLineComment() {
    return this._reader.startsWith('--')
        || this._reader.startsWith('//');
  }

  /* Skips a single-line comment */
  _ignoreSingleLineComment() {
    while (!this._reader.eof()) {
      this._reader = this._reader.consumeCharacter();
      if (this._reader.peek() === '\n') {
        break;
      }
    }
  }

  /* Skips a multiline comment with the given left/right delimiters.
   * Multi-line comments may be nested. */
  _ignoreMultilineComment(left, right) {
    var nesting = 0;
    var startPos = this._reader;
    while (!this._reader.eof()) {
      if (this._reader.startsWith(left)) {
        this._reader = this._reader.consumeString(left);
        nesting++;
      } else if (this._reader.startsWith(right)) {
        this._reader = this._reader.consumeString(right);
        nesting--;
        if (nesting === 0) {
          return;
        }
      } else {
        this._reader = this._reader.consumeCharacter();
      }
    }
    throw new SyntaxError(
                startPos,
                i18n('errmsg:unclosed-multiline-comment')
              );
  }

  /* Read a pragma. A pragma is a comment delimited by the
   * given left   / *
   * and right    * /
   * comment delimiters.
   * It has N >= 0 parts delimited by the pragma delimiter   @
   *   @part1@part2@...@partN@
   */
  _readInvisiblePragma(left, right, pragmaDelim) {
    var pragma = [];
    var startPos = this._reader;
    this._reader = this._reader.consumeInvisibleString(left);
    this._reader = this._reader.consumeInvisibleString(pragmaDelim);
    while (!this._reader.eof()) {
      pragma.push(this._readInvisibleStringUntilDelimiter(pragmaDelim));
      this._reader = this._reader.consumeInvisibleString(pragmaDelim);
      if (this._reader.startsWith(right)) {
        this._reader = this._reader.consumeInvisibleString(right);
        return pragma;
      }
    }
    throw new SyntaxError(
                startPos,
                i18n('errmsg:unclosed-multiline-comment')
              );
  }

  /* Read an invisible string until the given delimiter is found */
  _readInvisibleStringUntilDelimiter(delimiter) {
    var startPos = this._reader;
    var result = [];
    while (!this._reader.eof()) {
      if (this._reader.peek() === delimiter) {
        return result.join('');
      }
      result.push(this._reader.peek());
      this._reader = this._reader.consumeInvisibleCharacter();
    }
    throw new SyntaxError(
                startPos,
                i18n('errmsg:unclosed-multiline-comment')
              );
  }

  _evaluatePragma(startPos, pragma) {
    if (pragma.length === 0) {
      this._emitWarning(startPos, i18n('warning:empty-pragma'));
    } else if (pragma[0] === 'BEGIN_REGION') {
      var region = pragma[1];
      this._reader = this._reader.beginRegion(region);
    } else if (pragma[0] === 'END_REGION') {
      this._reader = this._reader.endRegion();
    } else {
      this._emitWarning(startPos, i18n('warning:unknown-pragma'));
    }
  }

  _emitWarning(position, message) {
    this._warnings.push(new Warning(position, message));
  }

}

