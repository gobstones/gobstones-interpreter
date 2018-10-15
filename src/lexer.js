import { i18n } from './i18n';
import { GbsWarning, GbsSyntaxError } from './exceptions';
import { MultifileReader } from './reader';
import {
  Token, T_EOF, T_NUM, T_STRING, T_LOWERID, T_UPPERID,
  /* Keywords */
  T_PROGRAM, T_INTERACTIVE, T_PROCEDURE, T_FUNCTION, T_RETURN,
  T_IF, T_THEN, T_ELSEIF, T_ELSE,
  T_CHOOSE, T_WHEN, T_OTHERWISE,
  T_MATCHING, T_SELECT, T_ON,
  T_REPEAT, T_FOREACH, T_IN, T_WHILE,
  T_SWITCH, T_TO, T_LET, T_NOT, T_DIV, T_MOD, T_TYPE,
  T_IS, T_RECORD, T_VARIANT, T_CASE, T_FIELD, T_UNDERSCORE,
  T_TIMEOUT,
  /* Symbols */
  T_LPAREN, T_RPAREN, T_LBRACE, T_RBRACE, T_LBRACK, T_RBRACK, T_COMMA,
  T_SEMICOLON, T_ELLIPSIS, T_RANGE, T_GETS, T_PIPE, T_ARROW, T_ASSIGN,
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

/* We define a character to be alphabetic if it has two distinct forms:
 * an uppercase form and a lowercase form.
 *
 * This accepts alphabetic Unicode characters but rejects numbers and symbols.
 */
function isAlpha(chr) {
  return chr.toUpperCase(chr) !== chr.toLowerCase();
}

/* An uppercase character is an alphabetic character that coincides with
 * its uppercase form */
function isUpper(chr) {
  return isAlpha(chr) && chr.toUpperCase() === chr;
}

/* A lowercase character is an alphabetic character that coincides with
 * its lowercase form */
function isLower(chr) {
  return isAlpha(chr) && chr.toLowerCase() === chr;
}

function isIdent(chr) {
  return isAlpha(chr) || isDigit(chr) || chr === '_' || chr === "'";
}

let KEYWORDS = {
  'program': T_PROGRAM,
  'interactive': T_INTERACTIVE,
  'procedure': T_PROCEDURE,
  'function': T_FUNCTION,
  'return': T_RETURN,
  /* Control structures */
  'if': T_IF,
  'then': T_THEN,
  'elseif': T_ELSEIF,
  'else': T_ELSE,
  'choose': T_CHOOSE,
  'when': T_WHEN,
  'otherwise': T_OTHERWISE,
  'repeat': T_REPEAT,
  'foreach': T_FOREACH,
  'in': T_IN,
  'while': T_WHILE,
  'switch': T_SWITCH,
  'to': T_TO,
  'matching': T_MATCHING,
  'select': T_SELECT,
  'on': T_ON,
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

/* Pattern for timeouts in an interactive program */
KEYWORDS[i18n('CONS:TIMEOUT')] = T_TIMEOUT;

/* Note: the order is relevant so that the 'maximal munch' rule applies. */
const SYMBOLS = [
  /* Various delimiters */
  ['(', T_LPAREN],
  [')', T_RPAREN],
  ['{', T_LBRACE],
  ['}', T_RBRACE],
  ['[', T_LBRACK],     // For lists and ranges
  [']', T_RBRACK],
  [',', T_COMMA],
  [';', T_SEMICOLON],
  ['...', T_ELLIPSIS], // For intentionally incomplete programs
  /* Range operator */
  ['..', T_RANGE],
  /* Assignment */
  [':=', T_ASSIGN],
  /* Logical operators */
  ['&&', T_AND],
  ['||', T_OR],
  /* Fields */
  ['<-', T_GETS],      // Field initializer, e.g. Coord(x <- 1, y <- 2)
  ['|', T_PIPE],       // Field update, e.g. Coord(c | x <- 2)
  /* Pattern matching */
  ['->', T_ARROW],     // For the branches of a switch
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

/* Valid language options accepted by the LANGUAGE pragma */
const LANGUAGE_OPTIONS = [
  'DestructuringForeach',
  'AllowRecursion',
];

function leadingZeroes(string) {
  return string.length >= 0 && string[0] === '0';
}

function fail(startPos, endPos, reason, args) {
  throw new GbsSyntaxError(startPos, endPos, reason, args);
}

const CLOSING_DELIMITERS = {
  '(': ')',
  '[': ']',
  '{': '}',
};

/* An instance of Lexer scans source code for tokens.
 * Example:
 *
 *     let tok = new Lexer('if (a)');
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

    /* A stack of tokens '(', '[' and '{', to provide more helpful
     * error reporting if delimiters are not balanced. */
    this._delimiterStack = [];

    /* A dictionary of pending attributes, set by the ATTRIBUTE pragma.
     * Pending attributes are used by the parser to decorate any procedure
     * or function definition. */
    this._pendingAttributes = {};

    /* A list of language options, enabled by the LANGUAGE pragma.
     * Language options are interpreted by the runner to initialize.
     * the remaining modules (linter, compiler, runtime, ...)
     * accordingly. */
    this._languageOptions = [];
  }

  /* Return the next token from the input */
  nextToken() {
    if (!this._findNextToken()) {
      let token = new Token(T_EOF, null, this._reader, this._reader);
      this._checkBalancedDelimiters(token);
      return token;
    }
    if (isDigit(this._reader.peek())) {
      let startPos = this._reader;
      let value = this._readStringWhile(isDigit);
      let endPos = this._reader;
      if (leadingZeroes(value) && value.length > 1) {
        return fail(
          startPos, endPos,
          'numeric-constant-should-not-have-leading-zeroes', []
        );
      }
      return new Token(T_NUM, value, startPos, endPos);
    } else if (isIdent(this._reader.peek())) {
      let startPos = this._reader;
      let value = this._readStringWhile(isIdent);
      let endPos = this._reader;
      if (value in KEYWORDS) {
        return new Token(KEYWORDS[value], value, startPos, endPos);
      } else if (isUpper(value[0])) {
        return new Token(T_UPPERID, value, startPos, endPos);
      } else if (isLower(value[0])) {
        return new Token(T_LOWERID, value, startPos, endPos);
      } else {
        return fail(
          startPos, endPos,
          'identifier-must-start-with-alphabetic-character', []
        );
      }
    } else if (this._reader.peek() === '"') {
      return this._readStringConstant();
    } else {
      return this._readSymbol();
    }
  }

  /* When tokenization is done, this function returns the list of all
   * the warnings collected during tokenization */
  warnings() {
    return this._warnings;
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
    let result = [];
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
    let startPos = this._reader;
    let result = [];
    this._reader = this._reader.consumeCharacter();
    while (!this._reader.eof()) {
      let c = this._reader.peek();
      if (c === '"') {
        this._reader = this._reader.consumeCharacter();
        return new Token(T_STRING, result.join(''), startPos, this._reader);
      } else if (c === '\\') {
        this._reader = this._reader.consumeCharacter();
        if (this._reader.eof()) {
          break;
        }
        let c2 = this._reader.peek();
        this._reader = this._reader.consumeCharacter();
        switch (c2) {
          case 'a':
            result.push('\u0007');
            break;
          case 'b':
            result.push('\u0008');
            break;
          case 'f':
            result.push('\u000c');
            break;
          case 'n':
            result.push('\u000a');
            break;
          case 'r':
            result.push('\u000d');
            break;
          case 't':
            result.push('\u0009');
            break;
          case 'v':
            result.push('\u000b');
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
    return fail(startPos, this._reader, 'unclosed-string-constant', []);
  }

  /* Read a symbol */
  _readSymbol() {
    for (let [symbol, tag] of SYMBOLS) {
      if (this._reader.startsWith(symbol)) {
        let startPos = this._reader;
        this._reader = this._reader.consumeString(symbol);
        let endPos = this._reader;
        let token = new Token(tag, symbol, startPos, endPos);
        this._checkBalancedDelimiters(token);
        return token;
      }
    }
    return fail(
      this._reader, this._reader,
      'unknown-token', [this._reader.peek()]
    );
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
      let startPos = this._reader;
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
        || this._reader.startsWith('//')
        || this._reader.startsWith('#');
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
    let nesting = 0;
    let startPos = this._reader;
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
    fail(
      startPos, this._reader,
      'unclosed-multiline-comment', []
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
    let pragma = [];
    let startPos = this._reader;
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
    return fail(
      startPos, this._reader,
      'unclosed-multiline-comment', []
    );
  }

  /* Read an invisible string until the given delimiter is found */
  _readInvisibleStringUntilDelimiter(delimiter) {
    let startPos = this._reader;
    let result = [];
    while (!this._reader.eof()) {
      if (this._reader.peek() === delimiter) {
        return result.join('');
      }
      result.push(this._reader.peek());
      this._reader = this._reader.consumeInvisibleCharacter();
    }
    return fail(
      startPos, this._reader,
      'unclosed-multiline-comment', []
    );
  }

  _evaluatePragma(startPos, pragma) {
    if (pragma.length === 0) {
      this._emitWarning(startPos, this._reader, 'empty-pragma', []);
    } else if (pragma[0] === 'BEGIN_REGION') {
      let region = pragma[1];
      this._reader = this._reader.beginRegion(region);
    } else if (pragma[0] === 'END_REGION') {
      this._reader = this._reader.endRegion();
    } else if (pragma[0] === 'ATTRIBUTE' && pragma.length >= 2) {
      let key = pragma[1];
      let value = pragma.slice(2, pragma.length).join('@');
      this.setAttribute(key, value);
    } else if (pragma[0] === 'LANGUAGE' && pragma.length === 2) {
      let languageOption = pragma[1];
      this.addLanguageOption(languageOption);
    } else {
      this._emitWarning(startPos, this._reader, 'unknown-pragma', [pragma[0]]);
    }
  }

  _emitWarning(startPos, endPos, reason, args) {
    this._warnings.push(new GbsWarning(startPos, endPos, reason, args));
  }

  /* Check that reading a delimiter keeps the delimiter stack balanced. */
  _checkBalancedDelimiters(token) {
    if (token.tag === T_EOF && this._delimiterStack.length > 0) {
      let openingDelimiter = this._delimiterStack.pop();
      fail(
        openingDelimiter.startPos, openingDelimiter.endPos,
        'unmatched-opening-delimiter',
        [openingDelimiter.value]
      );
    } else if (token.tag === T_LPAREN
            || token.tag === T_LBRACE
            || token.tag === T_LBRACK) {
      this._delimiterStack.push(token);
    } else if (token.tag === T_RPAREN
            || token.tag === T_RBRACE
            || token.tag === T_RBRACK) {
      if (this._delimiterStack.length === 0) {
        fail(
          token.startPos, token.endPos,
          'unmatched-closing-delimiter',
          [token.value]
        );
      }
      let openingDelimiter = this._delimiterStack.pop();
      if (CLOSING_DELIMITERS[openingDelimiter.value] !== token.value) {
        fail(
          openingDelimiter.startPos, openingDelimiter.endPos,
          'unmatched-opening-delimiter',
          [openingDelimiter.value]
        );
      }
    }
  }

  /*
   * Interface for handling attributes.
   *
   * The pragma ATTRIBUTE@key@value
   * establishes the attribute given by <key> to <value>.
   *
   * Whenever the parser finds a definition of the following kinds:
   *   procedure
   *   function
   *   program
   *   interactive program
   *   type
   * it gets decorated with the pending attributes.
   */
  getPendingAttributes() {
    let a = this._pendingAttributes;
    this._pendingAttributes = {};
    return a;
  }

  setAttribute(key, value) {
    this._pendingAttributes[key] = value;
  }

  /*
   * Interface for handling language options.
   *
   * The pragma LANGUAGE@option sets the given option.
   *
   * The runner module reads these options to initialize the
   * linter/compiler/runtime.
   */
  getLanguageOptions() {
    return this._languageOptions;
  }

  addLanguageOption(option) {
    if (LANGUAGE_OPTIONS.indexOf(option) !== -1) {
      this._languageOptions.push(option);
    } else {
      fail(this._reader, this._reader, 'unknown-language-option', [option]);
    }
  }

}

