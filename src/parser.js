import { GbsSyntaxError } from './exceptions';
import { Lexer } from './lexer';
import { i18n } from './i18n';
import {
  Token, T_EOF, T_NUM, T_STRING, T_LOWERID, T_UPPERID,
  /* Keywords */
  T_PROGRAM, T_INTERACTIVE, T_PROCEDURE, T_FUNCTION, T_RETURN,
  T_IF, T_THEN, T_ELSEIF, T_ELSE, T_REPEAT, T_FOREACH, T_IN, T_WHILE,
  T_SWITCH, T_TO, T_LET, T_NOT, T_DIV, T_MOD, T_TYPE,
  T_IS, T_RECORD, T_VARIANT, T_CASE, T_FIELD, T_UNDERSCORE,
  T_TIMEOUT,
  /* Symbols */
  T_LPAREN, T_RPAREN, T_LBRACE, T_RBRACE, T_LBRACK, T_RBRACK, T_COMMA,
  T_SEMICOLON, T_RANGE, T_GETS, T_PIPE, T_ARROW, T_ASSIGN,
  T_EQ, T_NE, T_LE, T_GE, T_LT, T_GT, T_AND, T_OR, T_CONCAT, T_PLUS,
  T_MINUS, T_TIMES, T_POW
} from './token';
import {
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
  ASTPatternNumber,
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
  //
  N_ExprVariable,
} from './ast';

const Infix = Symbol.for('Infix');
const InfixL = Symbol.for('InfixL');
const InfixR = Symbol.for('InfixR');
const Prefix = Symbol.for('Prefix');

class PrecedenceLevel {
  /* Operators should be a dictionary mapping operator tags to
   * their function names */
  constructor(fixity, operators) {
    this._fixity = fixity;
    this._operators = operators;
  }

  get fixity() {
    return this._fixity;
  }

  isOperator(token) {
    return Symbol.keyFor(token.tag) in this._operators;
  }

  functionName(token) {
    return new Token(
      T_LOWERID,
      this._operators[Symbol.keyFor(token.tag)],
      token.startPos,
      token.endPos
    );
  }
}

/* OPERATORS is a list of precedence levels.
 * Precedence levels are ordered from lesser to greater precedence.
 */
const OPERATORS = [
  /* Logical operators */
  new PrecedenceLevel(InfixR, {
    'T_OR': '||',
  }),
  new PrecedenceLevel(InfixR, {
    'T_AND': '&&',
  }),
  new PrecedenceLevel(Prefix, {
    'T_NOT': 'not',
  }),
  /* Relational operators */
  new PrecedenceLevel(Infix, {
    'T_EQ': '==',
    'T_NE': '/=',
    'T_LE': '<=',
    'T_GE': '>=',
    'T_LT': '<',
    'T_GT': '>',
  }),
  /* List concatenation */
  new PrecedenceLevel(InfixL, {
    'T_CONCAT': '++',
  }),
  /* Additive operators */
  new PrecedenceLevel(InfixL, {
    'T_PLUS': '+',
    'T_MINUS': '-',
  }),
  /* Multiplicative operators */
  new PrecedenceLevel(InfixL, {
    'T_TIMES': '*',
  }),
  /* Division operators */
  new PrecedenceLevel(InfixL, {
    'T_DIV': 'div',
    'T_MOD': 'mod',
  }),
  /* Exponential operators */
  new PrecedenceLevel(InfixR, {
    'T_POW': '^'
  }),
  /* Unary minus */
  new PrecedenceLevel(Prefix, {
    'T_MINUS': '-(unary)',
  })
];

function fail(startPos, endPos, reason, args) {
  throw new GbsSyntaxError(startPos, endPos, reason, args);
}

/* Represents a parser for a Gobstones/XGobstones program.
 * It is structured as a straightforward recursive-descent parser.
 *
 * The parameter 'input' may be either a string or a dictionary
 * mapping filenames to strings.
 *
 * All the "parseFoo" methods agree to the following convention:
 * - parseFoo returns an AST for a Foo construction,
 * - parseFoo consumes a fragment of the input by successively requesting
 *   the next token from the lexer,
 * - when calling parseFoo, the current token should already be located
 *   on the first token of the corresponding construction,
 * - when parseFoo returns, the current token is already located on
 *   the following token, after the corresponding construction.
 */
export class Parser {

  constructor(input) {
    this._lexer = new Lexer(input);
    this._nextToken();
  }

  /* Return the AST that results from parsing a full program */
  parse() {
    let definitions = [];
    while (this._currentToken.tag !== T_EOF) {
      definitions.push(this._parseDefinition());
    }
    return new ASTMain(definitions);
  }

  /** Definitions **/

  _parseDefinition() {
    switch (this._currentToken.tag) {
      case T_PROGRAM:
        return this._parseDefProgram();
      case T_INTERACTIVE:
        return this._parseDefInteractiveProgram();
      case T_PROCEDURE:
        return this._parseDefProcedure();
      case T_FUNCTION:
        return this._parseDefFunction();
      case T_TYPE:
        return this._parseDefType();
      default:
        return fail(
          this._currentToken.startPos, this._currentToken.endPos,
          'expected-but-found', [
            i18n('definition'),
            i18n(Symbol.keyFor(this._currentToken.tag))
          ]
        );
    }
  }

  _parseDefProgram() {
    let startPos = this._currentToken.startPos;
    this._match(T_PROGRAM);
    let attributes = this._lexer.getPendingAttributes();
    let block = this._parseStmtBlock();
    let result = new ASTDefProgram(block);
    result.startPos = startPos;
    result.endPos = block.endPos;
    result.attributes = attributes;
    return result;
  }

  _parseDefInteractiveProgram() {
    let startPos = this._currentToken.startPos;
    this._match(T_INTERACTIVE);
    this._match(T_PROGRAM);
    let attributes = this._lexer.getPendingAttributes();
    this._match(T_LBRACE);
    let branches = this._parseSwitchBranches();
    let endPos = this._currentToken.startPos;
    this._match(T_RBRACE);
    let result = new ASTDefInteractiveProgram(branches);
    result.startPos = startPos;
    result.endPos = endPos;
    result.attributes = attributes;
    return result;
  }

  _parseDefProcedure() {
    let startPos = this._currentToken.startPos;
    this._match(T_PROCEDURE);
    let name = this._parseUpperid();
    this._match(T_LPAREN);
    let parameters = this._parseLoweridSeq();
    this._match(T_RPAREN);
    let attributes = this._lexer.getPendingAttributes();
    let block = this._parseStmtBlock();
    let result = new ASTDefProcedure(name, parameters, block);
    result.startPos = startPos;
    result.endPos = block.endPos;
    result.attributes = attributes;
    return result;
  }

  _parseDefFunction() {
    let startPos = this._currentToken.startPos;
    this._match(T_FUNCTION);
    let name = this._currentToken;
    this._match(T_LOWERID);
    this._match(T_LPAREN);
    let parameters = this._parseLoweridSeq();
    this._match(T_RPAREN);
    let attributes = this._lexer.getPendingAttributes();
    let block = this._parseStmtBlock();
    let result = new ASTDefFunction(name, parameters, block);
    result.startPos = startPos;
    result.endPos = block.endPos;
    result.attributes = attributes;
    return result;
  }

  _parseDefType() {
    let startPos = this._currentToken.startPos;
    this._match(T_TYPE);
    let typeName = this._parseUpperid();
    this._match(T_IS);
    switch (this._currentToken.tag) {
      case T_RECORD:
        return this._parseDefTypeRecord(startPos, typeName);
      case T_VARIANT:
        return this._parseDefTypeVariant(startPos, typeName);
      default:
        return fail(
          this._currentToken.startPos, this._currentToken.endPos,
          'expected-but-found', [
            i18n('<alternative>')([
              i18n('T_RECORD'),
              i18n('T_VARIANT')
            ]),
            i18n(Symbol.keyFor(this._currentToken.tag))
          ]
        );
    }
  }

  _parseDefTypeRecord(startPos, typeName) {
    this._match(T_RECORD);
    let attributes = this._lexer.getPendingAttributes();
    this._match(T_LBRACE);
    let fieldNames = this._parseFieldNames();
    let endPos = this._currentToken.startPos;
    this._matchExpected(T_RBRACE, [T_FIELD, T_RBRACE]);
    let result = new ASTDefType(typeName, [
                   new ASTConstructorDeclaration(typeName, fieldNames)
                 ]);
    result.startPos = startPos;
    result.endPos = endPos;
    result.attributes = attributes;
    return result;
  }

  _parseDefTypeVariant(startPos, typeName) {
    let constructorDeclarations = [];
    this._match(T_VARIANT);
    let attributes = this._lexer.getPendingAttributes();
    this._match(T_LBRACE);
    while (this._currentToken.tag === T_CASE) {
      constructorDeclarations.push(this._parseConstructorDeclaration());
    }
    let endPos = this._currentToken.startPos;
    this._matchExpected(T_RBRACE, [T_CASE, T_RBRACE]);
    let result = new ASTDefType(typeName, constructorDeclarations);
    result.startPos = startPos;
    result.endPos = endPos;
    result.attributes = attributes;
    return result;
  }

  _parseConstructorDeclaration() {
    let startPos = this._currentToken.startPos;
    this._match(T_CASE);
    let constructorName = this._parseUpperid();
    this._match(T_LBRACE);
    let fieldNames = this._parseFieldNames();
    let endPos = this._currentToken.startPos;
    this._matchExpected(T_RBRACE, [T_FIELD, T_RBRACE]);
    let result = new ASTConstructorDeclaration(constructorName, fieldNames);
    result.startPos = startPos;
    result.endPos = endPos;
    return result;
  }

  _parseFieldNames() {
    let fieldNames = [];
    while (this._currentToken.tag === T_FIELD) {
      this._match(T_FIELD);
      fieldNames.push(this._parseLowerid());
    }
    return fieldNames;
  }

  /** Statements **/

  /* Statement, optionally followed by semicolon */
  _parseStatement() {
    let statement = this._parsePureStatement();
    if (this._currentToken.tag === T_SEMICOLON) {
      this._match(T_SEMICOLON);
    }
    return statement;
  }

  /* Statement (not followed by semicolon) */
  _parsePureStatement() {
    switch (this._currentToken.tag) {
      case T_RETURN:
        return this._parseStmtReturn();
      case T_IF:
        return this._parseStmtIf(true /* expectInitialIf */);
      case T_REPEAT:
        return this._parseStmtRepeat();
      case T_FOREACH:
        return this._parseStmtForeach();
      case T_WHILE:
        return this._parseStmtWhile();
      case T_SWITCH:
        return this._parseStmtSwitch();
      case T_LET:
        return this._parseStmtLet();
      case T_LBRACE:
        return this._parseStmtBlock();
      case T_LOWERID:
        return this._parseStmtAssignVariable();
      case T_UPPERID:
        return this._parseStmtProcedureCall();
      case T_LPAREN:
        /* Special error for rejecting tuple assignments
         *   (x1, ..., xN) := expression
         * in favour of
         *   let (x1, ..., xN) := expression
         */
        return fail(
          this._currentToken.startPos, this._currentToken.endPos,
          'obsolete-tuple-assignment', []
        );
      default:
        return fail(
          this._currentToken.startPos, this._currentToken.endPos,
          'expected-but-found', [
            i18n('statement'),
            i18n(Symbol.keyFor(this._currentToken.tag))
          ]
        );
    }
  }

  _parseStmtBlock() {
    let startPos = this._currentToken.startPos;
    let statements = [];
    this._match(T_LBRACE);
    while (this._currentToken.tag !== T_RBRACE) {
      statements.push(this._parseStatement());
      if (this._currentToken === T_SEMICOLON) {
        this._match(T_SEMICOLON);
      }
    }
    let endPos = this._currentToken.startPos;
    this._match(T_RBRACE);
    let result = new ASTStmtBlock(statements);
    result.startPos = startPos;
    result.endPos = endPos;
    return result;
  }

  _parseStmtReturn() {
    let startPos = this._currentToken.startPos;
    this._match(T_RETURN);
    let tuple = this._parseExprTuple();
    let result = new ASTStmtReturn(tuple);
    result.startPos = startPos;
    result.endPos = tuple.endPos;
    return result;
  }


  _parseStmtIf(expectInitialIf) {
    let startPos = this._currentToken.startPos;
    if (expectInitialIf) {
      this._match(T_IF);
    }

    this._match(T_LPAREN);
    let condition = this._parseExpression();
    this._match(T_RPAREN);
    /* Optional 'then' */
    if (this._currentToken.tag === T_THEN) {
      this._match(T_THEN);
    }
    let thenBlock = this._parseStmtBlock();

    let endPos;
    let elseBlock;
    if (this._currentToken.tag === T_ELSEIF) {
      this._match(T_ELSEIF);
      elseBlock = this._parseStmtIf(false /* expectInitialIf */);
      endPos = elseBlock.endPos;
    } else if (this._currentToken.tag === T_ELSE) {
      this._match(T_ELSE);
      elseBlock = this._parseStmtBlock();
      endPos = elseBlock.endPos;
    } else {
      elseBlock = null;
      endPos = thenBlock.endPos;
    }
    let result = new ASTStmtIf(condition, thenBlock, elseBlock);
    result.startPos = startPos;
    result.endPos = endPos;
    return result;
  }

  _parseStmtRepeat() {
    let startPos = this._currentToken.startPos;
    this._match(T_REPEAT);
    this._match(T_LPAREN);
    let times = this._parseExpression();
    this._match(T_RPAREN);
    let body = this._parseStmtBlock();
    let result = new ASTStmtRepeat(times, body);
    result.startPos = startPos;
    result.endPos = body.endPos;
    return result;
  }

  _parseStmtForeach() {
    let startPos = this._currentToken.startPos;
    this._match(T_FOREACH);
    let index = this._parseLowerid();
    this._match(T_IN);
    let range = this._parseExpression();
    let body = this._parseStmtBlock();
    let result = new ASTStmtForeach(index, range, body);
    result.startPos = startPos;
    result.endPos = body.endPos;
    return result;
  }

  _parseStmtWhile() {
    let startPos = this._currentToken.startPos;
    this._match(T_WHILE);
    this._match(T_LPAREN);
    let condition = this._parseExpression();
    this._match(T_RPAREN);
    let body = this._parseStmtBlock();
    let result = new ASTStmtWhile(condition, body);
    result.startPos = startPos;
    result.endPos = body.endPos;
    return result;
  }

  _parseStmtSwitch() {
    let startPos = this._currentToken.startPos;
    this._match(T_SWITCH);
    this._match(T_LPAREN);
    let subject = this._parseExpression();
    this._match(T_RPAREN);
    if (this._currentToken.tag === T_TO) {
      this._match(T_TO);
    }
    this._match(T_LBRACE);
    let branches = this._parseSwitchBranches();
    let endPos = this._currentToken.startPos;
    this._match(T_RBRACE);
    let result = new ASTStmtSwitch(subject, branches);
    result.startPos = startPos;
    result.endPos = endPos;
    return result;
  }

  _parseStmtLet() {
    let startPos = this._currentToken.startPos;
    this._match(T_LET);
    let result;
    if (this._currentToken.tag === T_LOWERID) {
      result = this._parseStmtAssignVariable();
    } else if (this._currentToken.tag === T_LPAREN) {
      result = this._parseStmtAssignTuple();
    } else {
      fail(
        this._currentToken.startPos, this._currentToken.endPos,
        'expected-but-found', [
          i18n('<alternative>')(
            i18n('T_LOWERID'),
            i18n('T_LPAREN')
          ),
          i18n(Symbol.keyfor(this._currentToken.tag))
        ]
      );
    }
    result.startPos = startPos;
    return result;
  }

  _parseStmtAssignVariable() {
    let variable = this._parseLowerid();
    this._match(T_ASSIGN);
    let value = this._parseExpression();
    let result = new ASTStmtAssignVariable(variable, value);
    result.startPos = variable.startPos;
    result.endPos = value.endPos;
    return result;
  }

  _parseStmtAssignTuple() {
    let startPos = this._currentToken.startPos;
    this._match(T_LPAREN);
    let variables = this._parseLoweridSeq();
    if (variables.length === 1) {
      fail(
        startPos, this._currentToken.endPos,
        'assignment-tuple-cannot-be-singleton', []
      );
    }
    this._match(T_RPAREN);
    this._match(T_ASSIGN);
    let value = this._parseExpression();
    let result = new ASTStmtAssignTuple(variables, value);
    result.startPos = startPos;
    result.endPos = value.endPos;
    return result;
  }

  _parseStmtProcedureCall() {
    let procedureName = this._parseUpperid();
    this._match(T_LPAREN);
    let args = this._parseDelimitedSeq(
                 T_RPAREN, T_COMMA,
                 () => this._parseExpression()
               );
    let endPos = this._currentToken.startPos;
    this._match(T_RPAREN);
    let result = new ASTStmtProcedureCall(procedureName, args);
    result.startPos = procedureName.startPos;
    result.endPos = endPos;
    return result;
  }

  /** Patterns **/

  _parsePattern() {
    switch (this._currentToken.tag) {
      case T_UNDERSCORE:
        return this._parsePatternWildcard();
      case T_NUM: case T_MINUS:
        return this._parsePatternNumber();
      case T_UPPERID:
        return this._parsePatternStructure();
      case T_LPAREN:
        return this._parsePatternTuple();
      case T_TIMEOUT:
        return this._parsePatternTimeout();
      default:
        return fail(
          this._currentToken.startPos, this._currentToken.endPos,
          'expected-but-found', [
            i18n('pattern'),
            i18n(Symbol.keyFor(this._currentToken.tag))
          ]
        );
    }
  }

  _parsePatternWildcard() {
    let startPos = this._currentToken.startPos;
    this._match(T_UNDERSCORE);
    let result = new ASTPatternWildcard();
    let endPos = startPos;
    result.startPos = startPos;
    result.endPos = endPos;
    return result;
  }

  _parsePatternNumber() {
    let startPos = this._currentToken.startPos;
    let sign = '';
    if (this._currentToken.tag === T_MINUS) {
      this._match(T_MINUS);
      sign = '-';
    }
    let number = this._currentToken;
    this._match(T_NUM);
    let value = sign + number.value;
    if (value === '-0') {
      fail(
        startPos, number.endPos,
        'pattern-number-cannot-be-negative-zero', []
      );
    }
    number = new Token(T_NUM, value, number.startPos, number.endPos);
    let result = new ASTPatternNumber(number);
    result.startPos = startPos;
    result.endPos = number.endPos;
    return result;
  }

  _parsePatternStructure() {
    let startPos = this._currentToken.startPos;
    let endPos = this._currentToken.startPos;
    let constructor = this._parseUpperid();
    let parameters;
    if (this._currentToken.tag === T_LPAREN) {
      this._match(T_LPAREN);
      parameters = this._parseLoweridSeq();
      endPos = this._currentToken.startPos;
      this._match(T_RPAREN);
    } else {
      parameters = [];
    }
    let result = new ASTPatternStructure(constructor, parameters);
    result.startPos = startPos;
    result.endPos = endPos;
    return result;
  }

  _parsePatternTuple() {
    let startPos = this._currentToken.startPos;
    this._match(T_LPAREN);
    let parameters = this._parseLoweridSeq();
    if (parameters.length === 1) {
      fail(
        startPos, this._currentToken.endPos,
        'pattern-tuple-cannot-be-singleton', []
      );
    }
    let endPos = this._currentToken.startPos;
    this._match(T_RPAREN);
    let result = new ASTPatternTuple(parameters);
    result.startPos = startPos;
    result.endPos = endPos;
    return result;
  }

  _parsePatternTimeout() {
    let startPos = this._currentToken.startPos;
    this._match(T_TIMEOUT);
    this._match(T_LPAREN);
    let timeout = this._currentToken;
    this._match(T_NUM);
    let endPos = this._currentToken.startPos;
    this._match(T_RPAREN);
    let result = new ASTPatternTimeout(timeout);
    result.startPos = startPos;
    result.endPos = endPos;
    return result;
  }

  /** Expressions **/

  _parseExpression() {
    return this._parseExprOperator(0);
  }

  /* Read an expression of the given level.
   *
   * If the list OPERATORS of precedence levels has N elements, then:
   * - Expressions of level 0 are arbitrary expressions.
   * - Expressions of level N are atomic expressions.
   * - In general, expressions of level I involve operators
   *   of levels I, I+1, ..., N-1,
   *   and they can only include operators of the lower levels
   *   by surrounding them in parentheses.
   */
  _parseExprOperator(level) {
    if (level === OPERATORS.length) {
      return this._parseExprAtom();
    }
    switch (OPERATORS[level].fixity) {
      case Infix:
        return this._parseExprOperatorInfix(level);
      case InfixL:
        return this._parseExprOperatorInfixL(level);
      case InfixR:
        return this._parseExprOperatorInfixR(level);
      case Prefix:
        return this._parseExprOperatorPrefix(level);
      default:
        throw Error('Invalid operator.');
    }
  }

  _parseExprOperatorInfix(level) {
    let left = this._parseExprOperator(level + 1);
    if (OPERATORS[level].isOperator(this._currentToken)) {
      let op = this._currentToken;
      this._nextToken();
      let right = this._parseExprOperator(level + 1);

      /* Check that it is not used associatively */
      if (OPERATORS[level].isOperator(this._currentToken)) {
        fail(
          this._currentToken.startPos, this._currentToken.endPos,
          'operators-are-not-associative', [
            i18n(Symbol.keyFor(op.tag)),
            i18n(Symbol.keyFor(this._currentToken.tag))
          ]
        );
      }

      let result = new ASTExprFunctionCall(
                     OPERATORS[level].functionName(op), [left, right]
                   );
      result.startPos = left.startPos;
      result.endPos = right.endPos;
      return result;
    } else {
      return left;
    }
  }

  _parseExprOperatorInfixL(level) {
    let result = this._parseExprOperator(level + 1);
    while (OPERATORS[level].isOperator(this._currentToken)) {
      let op = this._currentToken;
      this._nextToken();
      let right = this._parseExprOperator(level + 1);
      let result2 = new ASTExprFunctionCall(
                      OPERATORS[level].functionName(op), [result, right]
                    );
      result2.startPos = result.startPos;
      result2.endPos = right.endPos;
      result = result2;
    }
    return result;
  }

  _parseExprOperatorInfixR(level) {
    let left = this._parseExprOperator(level + 1);
    if (OPERATORS[level].isOperator(this._currentToken)) {
      let op = this._currentToken;
      this._nextToken();
      let right = this._parseExprOperator(level); /* same level */
      let result = new ASTExprFunctionCall(
                      OPERATORS[level].functionName(op), [left, right]
                    );
      result.startPos = left.startPos;
      result.endPos = right.endPos;
      return result;
    } else {
      return left;
    }
  }

  _parseExprOperatorPrefix(level) {
    if (OPERATORS[level].isOperator(this._currentToken)) {
      let op = this._currentToken;
      this._nextToken();
      let inner = this._parseExprOperator(level); /* same level */
      let result = new ASTExprFunctionCall(
                      OPERATORS[level].functionName(op), [inner]
                    );
      result.startPos = op.startPos;
      result.endPos = inner.endPos;
      return result;
    } else {
      return this._parseExprOperator(level + 1);
    }
  }

  /* Parse an atomic expression.
   * I.e. all the operators must be surrounded by parentheses */
  _parseExprAtom() {
    switch (this._currentToken.tag) {
      case T_LOWERID:
        return this._parseExprVariableOrFunctionCall();
      case T_NUM:
        return this._parseExprConstantNumber();
      case T_STRING:
        return this._parseExprConstantString();
      case T_UPPERID:
        return this._parseExprStructureOrStructureUpdate();
      case T_LPAREN:
        return this._parseExprTuple();
      case T_LBRACK:
        return this._parseExprListOrRange();
      default:
        return fail(
          this._currentToken.startPos, this._currentToken.endPos,
          'expected-but-found', [
            i18n('expression'),
            i18n(Symbol.keyFor(this._currentToken.tag))
          ]
        );
    }
  }

  _parseExprVariableOrFunctionCall() {
    let id = this._parseLowerid();
    let result;
    let endPos;
    if (this._currentToken.tag === T_LPAREN) {
      this._match(T_LPAREN);
      let args = this._parseExpressionSeq(T_RPAREN);
      result = new ASTExprFunctionCall(id, args);
      endPos = this._currentToken.startPos;
      this._match(T_RPAREN);
    } else {
      result = new ASTExprVariable(id);
      endPos = id.endPos;
    }
    result.startPos = id.startPos;
    result.endPos = endPos;
    return result;
  }

  _parseExprConstantNumber() {
    let number = this._currentToken;
    this._match(T_NUM);
    let result = new ASTExprConstantNumber(number);
    result.startPos = number.startPos;
    result.endPos = number.endPos;
    return result;
  }

  _parseExprConstantString() {
    let string = this._currentToken;
    this._match(T_STRING);
    let result = new ASTExprConstantString(string);
    result.startPos = string.startPos;
    result.endPos = string.endPos;
    return result;
  }

  /*
   * Parse any of the following constructions:
   * (1) Structure with no arguments: "Norte"
   * (2) Structure with no arguments and explicit parentheses: "Nil()"
   * (3) Structure with arguments: "Coord(x <- 1, y <- 2)"
   * (4) Update structure with arguments: "Coord(expression | x <- 2)"
   *
   * Deciding between (3) and (4) unfortunately cannot be done with one
   * token of lookahead, so after reading the constructor and a left
   * parenthesis we resort to the following workaround:
   *
   * - Parse an expression.
   * - If the next token is GETS ("<-") we are in case (3).
   *   We must then ensure that the expression is just a variable
   *   and recover its name.
   * - If the next token is PIPE ("|") we are in case (4), and we go on.
   */
  _parseExprStructureOrStructureUpdate() {
    let constructorName = this._parseUpperid();
    if (this._currentToken.tag !== T_LPAREN) {
      /* Structure with no arguments, e.g. "Norte" */
      let result = new ASTExprStructure(constructorName, []);
      result.startPos = constructorName.startPos;
      result.endPos = constructorName.endPos;
      return result;
    }
    this._match(T_LPAREN);
    if (this._currentToken.tag === T_RPAREN) {
      /* Structure with no arguments with explicit parentheses,
       * e.g. "Nil()" */
      let result = new ASTExprStructure(constructorName, []);
      let endPos = this._currentToken.startPos;
      this._match(T_RPAREN);
      result.startPos = constructorName.startPos;
      result.endPos = endPos;
      return result;
    }
    let subject = this._parseExpression();
    switch (this._currentToken.tag) {
      case T_GETS:
        if (subject.tag !== N_ExprVariable) {
          fail(
            this._currentToken.startPos, this._currentToken.endPos,
            'expected-but-found', [
              i18n('T_PIPE'),
              i18n('T_GETS')
            ]
          );
        }
        return this._parseStructure(constructorName, subject.variableName);
      case T_PIPE:
        return this._parseStructureUpdate(constructorName, subject);
      case T_COMMA: case T_RPAREN:
        /* Issue a specific error message to deal with a common
         * programming error, namely calling a procedure name
         * where an expression is expected. */
        return fail(
          constructorName.startPos, constructorName.endPos,
          'expected-but-found', [
            i18n('expression'),
            i18n('procedure call')
          ]
        );
      default:
        let expected;
        if (subject.tag === N_ExprVariable) {
          expected = i18n('<alternative>')([
                       i18n('T_GETS'),
                       i18n('T_PIPE')
                     ]);
        } else {
          expected = i18n('T_PIPE');
        }
        return fail(
          constructorName.startPos, constructorName.endPos,
          'expected-but-found', [
            expected,
            i18n(Symbol.keyFor(this._currentToken.tag))
          ]
        );
    }
  }

  /* Parse a structure   A(x1 <- expr1, ..., xN <- exprN)
   * where N >= 1,
   * assuming that  "A(x1" has already been read.
   *
   * - constructorName and fieldName1 correspond to "A" and "x1"
   *   respectively.
   */
  _parseStructure(constructorName, fieldName1) {
    /* Read "<- expr1" */
    this._match(T_GETS);
    let value1 = this._parseExpression();
    let fieldBinding1 = new ASTFieldBinding(fieldName1, value1);
    fieldBinding1.startPos = fieldName1.startPos;
    fieldBinding1.endPos = value1.endPos;
    /* Read "x2 <- expr2, ..., xN <- exprN" (this might be empty) */
    let fieldBindings = this._parseNonEmptyDelimitedSeq(
                          T_RPAREN, T_COMMA, [fieldBinding1],
                          () => this._parseFieldBinding()
                        );
    /* Read ")" */
    let endPos = this._currentToken.startPos;
    this._match(T_RPAREN);
    /* Return an ExprStructure node */
    let result = new ASTExprStructure(constructorName, fieldBindings);
    result.startPos = constructorName.startPos;
    result.endPos = endPos;
    return result;
  }

  /* Parse a structure update  A(e | x1 <- expr1, ..., xN <- exprN)
   * where N >= 1,
   * assuming that "A(e" has already been read.
   *
   * constructorName and original correspond to "A" and "e"
   * respectively.
   */
  _parseStructureUpdate(constructorName, original) {
    /* Read "|" */
    this._match(T_PIPE);
    /* Read "x2 <- expr2, ..., xN <- exprN" (this might be empty) */
    let fieldBindings = this._parseDelimitedSeq(
                          T_RPAREN, T_COMMA,
                          () => this._parseFieldBinding()
                        );
    /* Read ")" */
    let endPos = this._currentToken.startPos;
    this._match(T_RPAREN);
    /* Return an ExprStructureUpdate node */
    let result = new ASTExprStructureUpdate(
                      constructorName, original, fieldBindings
                 );
    result.startPos = constructorName.startPos;
    result.endPos = endPos;
    return result;
  }

  /* Read a list
   *   [expr1, ..., exprN]
   * a range expression
   *   [first .. last]
   * or a range expression with step
   *   [first, second .. last]
   */
  _parseExprListOrRange() {
    let startPos = this._currentToken.startPos;
    this._match(T_LBRACK);
    if (this._currentToken.tag === T_RBRACK) {
      return this._parseExprListRemainder(startPos, []);
    }
    let first = this._parseExpression();
    switch (this._currentToken.tag) {
      case T_RBRACK:
        return this._parseExprListRemainder(startPos, [first]);
      case T_RANGE:
        return this._parseExprRange(startPos, first, null);
      case T_COMMA:
        this._match(T_COMMA);
        let second = this._parseExpression();
        switch (this._currentToken.tag) {
          case T_RBRACK:
          case T_COMMA:
            return this._parseExprListRemainder(startPos, [first, second]);
          case T_RANGE:
            return this._parseExprRange(startPos, first, second);
          default:
            return fail(
              this._currentToken.startPos, this._currentToken.endPos,
              'expected-but-found', [
                i18n('<alternative>')([
                  i18n('T_COMMA'),
                  i18n('T_RANGE'),
                  i18n('T_RBRACK')
                ]),
                i18n(Symbol.keyFor(this._currentToken.tag))
              ]
            );
        }
      default:
        return fail(
          this._currentToken.startPos, this._currentToken.endPos,
          'expected-but-found', [
            i18n('<alternative>')([
              i18n('T_COMMA'),
              i18n('T_RANGE'),
              i18n('T_RBRACK')
            ]),
            i18n(Symbol.keyFor(this._currentToken.tag))
          ]
        );
    }
  }

  /* Read the end of a list "[expr1, ..., exprN]" assumming we have
   * already read "[expr1, ..., exprK" up to some point K >= 1.
   * - startPos is the position of "["
   * - prefix is the list of elements we have already read
   */
  _parseExprListRemainder(startPos, prefix) {
    let elements = this._parseNonEmptyDelimitedSeq(
                     T_RBRACK, T_COMMA, prefix,
                     () => this._parseExpression()
                   );
    let endPos = this._currentToken.startPos;
    this._match(T_RBRACK);
    let result = new ASTExprList(elements);
    result.startPos = startPos;
    result.endPos = endPos;
    return result;
  }

  /* Read a range "[first..last]" or "[first,second..last]"
   * assumming we are left to read "..last]"
   * - startPos is the position of "[".
   * - second may be null */
  _parseExprRange(startPos, first, second) {
    this._match(T_RANGE);
    let last = this._parseExpression();
    let endPos = this._currentToken.startPos;
    this._match(T_RBRACK);
    let result = new ASTExprRange(first, second, last);
    result.startPos = startPos;
    result.endPos = endPos;
    return result;
  }

  /* Read a list of expressions separated by commas and delimited
   * by parentheses. If there is a single expression, return the
   * expression itself. If there are 0 or >=2 expressions, return
   * a tuple.
   */
  _parseExprTuple() {
    let startPos = this._currentToken.startPos;
    this._match(T_LPAREN);
    let expressionList = this._parseExpressionSeq(T_RPAREN);
    let endPos = this._currentToken.startPos;
    this._match(T_RPAREN);

    let result;
    if (expressionList.length === 1) {
      result = expressionList[0];
    } else {
      result = new ASTExprTuple(expressionList);
    }
    result.startPos = startPos;
    result.endPos = endPos;
    return result;
  }

  /** SwitchBranch **/

  _parseSwitchBranches() {
    let branches = [];
    while (this._currentToken.tag !== T_RBRACE) {
      branches.push(this._parseSwitchBranch());
    }
    return branches;
  }

  _parseSwitchBranch() {
    let pattern = this._parsePattern();
    this._match(T_ARROW);
    let body = this._parseStmtBlock();
    let result = new ASTSwitchBranch(pattern, body);
    result.startPos = pattern.startPos;
    result.endPos = body.endPos;
    return result;
  }

  /** FieldBinding **/

  _parseFieldBinding() {
    let fieldName = this._parseLowerid();
    this._match(T_GETS);
    let value = this._parseExpression();
    let result = new ASTFieldBinding(fieldName, value);
    result.startPos = fieldName.startPos;
    result.endPos = value.endPos;
    return result;
  }

  /** Helpers **/

  /* Advance to the next token */
  _nextToken() {
    this._currentToken = this._lexer.nextToken();
  }

  /* Check that the current token has the expected tag.
   * Then advance to the next token. */
  _match(tokenTag) {
    if (this._currentToken.tag !== tokenTag) {
      fail(
        this._currentToken.startPos, this._currentToken.endPos,
        'expected-but-found', [
          i18n(Symbol.keyFor(tokenTag)),
          i18n(Symbol.keyFor(this._currentToken.tag))
        ]
      );
    }
    this._nextToken();
  }

  /* Check that the current token has the expected tag.
   * Then advance to the next token.
   * Otherwise report that any of the alternatives in the tagList
   * was expected.
   */
  _matchExpected(tokenTag, tagList) {
    if (this._currentToken.tag !== tokenTag) {
      fail(
        this._currentToken.startPos, this._currentToken.endPos,
        'expected-but-found', [
          i18n('<alternative>')(
            tagList.map(tag => i18n(Symbol.keyFor(tag)))
          ),
          i18n(Symbol.keyFor(this._currentToken.tag))
        ]
      );
    }
    this._nextToken();
  }

  /* Parse a delimited list:
   *   rightDelimiter: token tag for the right delimiter
   *   separator: token tag for the separator
   *   parseElement: function that parses one element */
  _parseDelimitedSeq(rightDelimiter, separator, parseElement) {
    if (this._currentToken.tag === rightDelimiter) {
      return []; /* Empty case */
    }
    let first = parseElement();
    return this._parseNonEmptyDelimitedSeq(
             rightDelimiter, separator, [first], parseElement
           );
  }

  /* Parse a delimited list, assuming the first elements are already given.
   *   rightDelimiter: token tag for the right delimiter
   *   separator: token tag for the separator
   *   prefix: non-empty list of all the first elements (already given)
   *   parseElement: function that parses one element */
  _parseNonEmptyDelimitedSeq(rightDelimiter, separator, prefix, parseElement) {
    let list = prefix;
    while (this._currentToken.tag === separator) {
      this._match(separator);
      list.push(parseElement());
    }
    if (this._currentToken.tag !== rightDelimiter) {
      fail(
        this._currentToken.startPos, this._currentToken.endPos,
        'expected-but-found', [
          i18n('<alternative>')([
            i18n(Symbol.keyFor(separator)),
            i18n(Symbol.keyFor(rightDelimiter))
          ]),
          i18n(Symbol.keyFor(this._currentToken.tag))
        ]
      );
    }
    return list;
  }

  _parseLowerid() {
    let lowerid = this._currentToken;
    this._match(T_LOWERID);
    return lowerid;
  }

  _parseUpperid() {
    let upperid = this._currentToken;
    this._match(T_UPPERID);
    return upperid;
  }

  _parseLoweridSeq() {
    return this._parseDelimitedSeq(
             T_RPAREN, T_COMMA, () => this._parseLowerid()
           );
  }

  /* Parse a list of expressions delimited by the given right delimiter
   * e.g. T_RPAREN or T_RBRACK, without consuming the delimiter. */
  _parseExpressionSeq(rightDelimiter) {
    return this._parseDelimitedSeq(
             rightDelimiter, T_COMMA, () => this._parseExpression()
           );
  }

}

