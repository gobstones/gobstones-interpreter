
/* Token types are constant symbols */
export const T_EOF = Symbol.for('T_EOF');         // End of file
export const T_NUM = Symbol.for('T_NUM');         // Number
export const T_UPPERID = Symbol.for('T_UPPERID'); // Uppercase identifier
export const T_LOWERID = Symbol.for('T_LOWERID'); // Lowercase identifier

/* Keywords */
export const T_PROGRAM = Symbol.for('T_PROGRAM');
export const T_INTERACTIVE = Symbol.for('T_INTERACTIVE');
export const T_PROCEDURE = Symbol.for('T_PROCEDURE');
export const T_FUNCTION = Symbol.for('T_FUNCTION');
export const T_RETURN = Symbol.for('T_RETURN');
export const T_IF = Symbol.for('T_IF');
export const T_THEN = Symbol.for('T_THEN');
export const T_ELSE = Symbol.for('T_ELSE');
export const T_REPEAT = Symbol.for('T_REPEAT');
export const T_FOREACH = Symbol.for('T_FOREACH');
export const T_IN = Symbol.for('T_IN');
export const T_WHILE = Symbol.for('T_WHILE');
export const T_SWITCH = Symbol.for('T_SWITCH');
export const T_MATCH = Symbol.for('T_MATCH');
export const T_TO = Symbol.for('T_TO');
export const T_LET = Symbol.for('T_LET');
export const T_NOT = Symbol.for('T_NOT');
export const T_DIV = Symbol.for('T_DIV');
export const T_MOD = Symbol.for('T_MOD');
export const T_TYPE = Symbol.for('T_TYPE');
export const T_IS = Symbol.for('T_IS');
export const T_RECORD = Symbol.for('T_RECORD');
export const T_VARIANT = Symbol.for('T_VARIANT');
export const T_CASE = Symbol.for('T_CASE');
export const T_FIELD = Symbol.for('T_FIELD');
export const T_UNDERSCORE = Symbol.for('T_UNDERSCORE');

/* Symbols */
export const T_LPAREN = Symbol.for('T_LPAREN');
export const T_RPAREN = Symbol.for('T_RPAREN');
export const T_LBRACE = Symbol.for('T_LBRACE');
export const T_RBRACE = Symbol.for('T_RBRACE');
export const T_LBRACK = Symbol.for('T_LBRACK');
export const T_RBRACK = Symbol.for('T_RBRACK');
export const T_COMMA = Symbol.for('T_COMMA');
export const T_SEMICOLON = Symbol.for('T_SEMICOLON');
export const T_RANGE = Symbol.for('T_RANGE');
export const T_GETS = Symbol.for('T_GETS');
export const T_PIPE = Symbol.for('T_PIPE');
export const T_ASSIGN = Symbol.for('T_ASSIGN');
export const T_EQ = Symbol.for('T_EQ');
export const T_NE = Symbol.for('T_NE');
export const T_LE = Symbol.for('T_LE');
export const T_GE = Symbol.for('T_GE');
export const T_LT = Symbol.for('T_LT');
export const T_GT = Symbol.for('T_GT');
export const T_AND = Symbol.for('T_AND');
export const T_OR = Symbol.for('T_OR');
export const T_CONCAT = Symbol.for('T_CONCAT');
export const T_PLUS = Symbol.for('T_PLUS');
export const T_MINUS = Symbol.for('T_MINUS');
export const T_TIMES = Symbol.for('T_TIMES');
export const T_POW = Symbol.for('T_POW');

/* A token is given by:
 * - A token type      (e.g. T_LOWERID, T_NUM).
 * - Possibly, a value (e.g. 'nroBolitas', 8).
 *   When the value is irrelevant, we provide null by convention.
 * - Two positions, representing its location in the source. */
export class Token {
  constructor(type, value, startPos, endPos) {
    this._type = type;
    this._value = value;
    this._startPos = startPos;
    this._endPos = endPos;
  }

  get type() {
    return this._type;
  }

  get value() {
    return this._value;
  }

  get startPos() {
    return this._startPos;
  }

  get endPos() {
    return this._endPos;
  }

}

