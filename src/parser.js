import { GbsWarning, GbsSyntaxError } from './exceptions';
import { Lexer } from './lexer';
import { i18n } from './i18n';
import {
  Token, T_EOF, T_NUM, T_STRING, T_LOWERID, T_UPPERID,
  /* Keywords */
  T_PROGRAM, T_INTERACTIVE, T_PROCEDURE, T_FUNCTION, T_RETURN,
  T_IF, T_THEN, T_ELSE, T_REPEAT, T_FOREACH, T_IN, T_WHILE,
  T_SWITCH, T_TO, T_LET, T_NOT, T_DIV, T_MOD, T_TYPE,
  T_IS, T_RECORD, T_VARIANT, T_CASE, T_FIELD, T_UNDERSCORE,
  /* Symbols */
  T_LPAREN, T_RPAREN, T_LBRACE, T_RBRACE, T_LBRACK, T_RBRACK, T_COMMA,
  T_SEMICOLON, T_RANGE, T_GETS, T_PIPE, T_ARROW, T_ASSIGN,
  T_EQ, T_NE, T_LE, T_GE, T_LT, T_GT, T_AND, T_OR, T_CONCAT, T_PLUS,
  T_MINUS, T_TIMES, T_POW
} from './token';
import {
  ASTNode,
  /* Definitions */
  ASTDefProgram,
  ASTDefProcedure,
  ASTDefFunction,
  /* Statements */
  ASTStmtBlock,
  ASTStmtReturn,
  ASTStmtIf,
  ASTStmtRepeat,
  ASTStmtForeach,
  ASTStmtWhile,
  ASTStmtSwitch, ASTStmtSwitchBranch,
  ASTStmtAssignVariable,
  ASTStmtAssignTuple,
  ASTStmtProcedureCall,
  /* Patterns */
  ASTPatternWildcard,
  ASTPatternConstructor,
  ASTPatternTuple,
  /* Expressions */
  ASTExprVariable,
  ASTExprTuple,
} from './ast';

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
    var definitions = [];
    while (this._currentToken.tag !== T_EOF) {
      definitions.push(this._parseDefinition());
    }
    if (definitions.length == 0) {
      throw new GbsSyntaxError(
                  this._currentToken.startPos,
                  i18n('errmsg:empty-source')
                );
    } else {
      return definitions;
    }
  }

  _parseDefinition() {
    switch (this._currentToken.tag) {
      case T_PROGRAM:
        return this._parseDefProgram();
      case T_INTERACTIVE:
        this._nextToken();
        throw Error('TODO');
      case T_PROCEDURE:
        return this._parseDefProcedure();
      case T_FUNCTION:
        return this._parseDefFunction();
      case T_TYPE:
        this._nextToken();
        throw Error('TODO');
      default:
        throw new GbsSyntaxError(
                    this._currentToken.startPos,
                    i18n('errmsg:expected-but-found')(
                      i18n('definition'),
                      i18n(Symbol.keyFor(this._currentToken.tag))
                    )
                  );
    }
  }

  _parseDefProgram() {
    var startPos = this._currentToken.startPos;
    this._match(T_PROGRAM);
    var block = this._parseStmtBlock();
    var result = new ASTDefProgram(block);
    result.startPos = startPos;
    result.endPos = block.endPos;
    return result;
  }

  _parseDefProcedure() {
    var startPos = this._currentToken.startPos;
    this._match(T_PROCEDURE);
    var name = this._currentToken;
    this._match(T_UPPERID);
    this._match(T_LPAREN);
    var parameters = this._parseLoweridList();
    this._match(T_RPAREN);
    var block = this._parseStmtBlock();
    var result = new ASTDefProcedure(name, parameters, block);
    result.startPos = startPos;
    result.endPos = block.endPos;
    return result;
  }

  _parseDefFunction() {
    var startPos = this._currentToken.startPos;
    this._match(T_FUNCTION);
    var name = this._currentToken;
    this._match(T_LOWERID);
    this._match(T_LPAREN);
    var parameters = this._parseLoweridList();
    this._match(T_RPAREN);
    var block = this._parseStmtBlock();
    var result = new ASTDefFunction(name, parameters, block);
    result.startPos = startPos;
    result.endPos = block.endPos;
    return result;
  }

  /* Generic method to parse a delimited list:
   *   rightDelimiter: token tag for the right delimiter
   *   separator: token tag for the separator
   *   parseElement: function that parses one element */
  _parseDelimitedList(rightDelimiter, separator, parseElement) {
    if (this._currentToken.tag === rightDelimiter) {
      return []; /* Empty case */
    }
    var list = [parseElement()];
    while (this._currentToken.tag === separator) {
      this._match(separator);
      list.push(parseElement());
    }
    if (this._currentToken.tag !== rightDelimiter) {
      throw new GbsSyntaxError(
                  this._currentToken.startPos,
                  i18n('errmsg:expected-but-found')(
                    i18n('<alternative>')([
                      i18n(Symbol.keyFor(separator)),
                      i18n(Symbol.keyFor(rightDelimiter))
                    ]),
                    i18n(Symbol.keyFor(this._currentToken.tag))
                  )
                );
    }
    return list;
  }

  _parseLowerid() {
    var lowerid = this._currentToken;
    this._match(T_LOWERID);
    return lowerid;
  }

  _parseLoweridList() {
    let self = this;
    return this._parseDelimitedList(
             T_RPAREN, T_COMMA, () => self._parseLowerid()
           );
  }

  /** Statements **/

  /* Statement, optionally followed by semicolon */
  _parseStatement() {
    var statement = this._parsePureStatement();
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
        return this._parseStmtIf();
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
        // procedure call
        throw Error('TODO');
      default:
        throw new GbsSyntaxError(
                    this._currentToken.startPos,
                    i18n('errmsg:expected-but-found')(
                      i18n('statement'),
                      i18n(Symbol.keyFor(this._currentToken.tag))
                    )
                  );
    }
  }

  _parseStmtBlock() {
    var startPos = this._currentToken.startPos;
    var statements = [];
    this._match(T_LBRACE);
    while (this._currentToken.tag !== T_RBRACE) {
      statements.push(this._parseStatement());
      if (this._currentToken === T_SEMICOLON) {
        this._match(T_SEMICOLON);
      }
    }
    var endPos = this._currentToken.startPos; 
    this._match(T_RBRACE);
    var result = new ASTStmtBlock(statements);
    result.startPos = startPos;
    result.endPos = endPos;
    return result;
  }

  _parseStmtReturn() {
    var startPos = this._currentToken.startPos;
    this._match(T_RETURN);
    var tuple = this._parseExprTuple();
    var result = new ASTStmtReturn(tuple);
    result.startPos = startPos;
    result.endPos = tuple.endPos;
    return result;
  }

  _parseStmtIf() {
    var startPos = this._currentToken.startPos;
    this._match(T_IF);
    this._match(T_LPAREN);
    var condition = this._parseExpression();
    this._match(T_RPAREN);
    /* Optional 'then' */
    if (this._currentToken.tag === T_THEN) {
      this._match(T_THEN);
    }
    var thenBlock = this._parseStmtBlock();
    var endPos;
    var elseBlock;
    if (this._currentToken.tag === T_ELSE) {
      this._match(T_ELSE);
      elseBlock = this._parseStmtBlock();
      endPos = elseBlock.endPos
    } else {
      elseBlock = null;
      endPos = thenBlock.endPos;
    }
    var result = new ASTStmtIf(condition, thenBlock, elseBlock);
    result.startPos = startPos;
    result.endPos = endPos;
    return result;
  }

  _parseStmtRepeat() {
    var startPos = this._currentToken.startPos;
    this._match(T_REPEAT);
    this._match(T_LPAREN);
    var times = this._parseExpression();
    this._match(T_RPAREN);
    var body = this._parseStmtBlock();
    var result = new ASTStmtRepeat(times, body);
    result.startPos = startPos;
    result.endPos = body.endPos
    return result;
  }

  _parseStmtForeach() {
    var startPos = this._currentToken.startPos;
    this._match(T_FOREACH);
    var index = this._currentToken;
    this._match(T_LOWERID);
    this._match(T_IN);
    var range = this._parseExpression();
    var body = this._parseStmtBlock();
    var result = new ASTStmtForeach(index, range, body);
    result.startPos = startPos;
    result.endPos = body.endPos
    return result;
  }

  _parseStmtWhile() {
    var startPos = this._currentToken.startPos;
    this._match(T_WHILE);
    this._match(T_LPAREN);
    var condition = this._parseExpression();
    this._match(T_RPAREN);
    var body = this._parseStmtBlock();
    var result = new ASTStmtWhile(condition, body);
    result.startPos = startPos;
    result.endPos = body.endPos
    return result;
  }

  _parseStmtSwitch() {
    var startPos = this._currentToken.startPos;
    this._match(T_SWITCH);
    this._match(T_LPAREN);
    var subject = this._parseExpression();
    this._match(T_RPAREN);
    if (this._currentToken.tag === T_TO) {
      this._match(T_TO);
    }
    this._match(T_LBRACE);
    var branches = this._parseStmtSwitchBranches();
    var endPos = this._currentToken.startPos;
    this._match(T_RBRACE);
    var result = new ASTStmtSwitch(subject, branches);
    result.startPos = startPos;
    result.endPos = endPos;
    return result;
  }

  _parseStmtSwitchBranches() {
    var branches = []
    while (this._currentToken.tag !== T_RBRACE) {
      branches.push(this._parseStmtSwitchBranch());
    }
    return branches;
  }

  _parseStmtSwitchBranch() {
    var pattern = this._parsePattern();
    this._match(T_ARROW);
    var body = this._parseStmtBlock();
    var result = new ASTStmtSwitchBranch(pattern, body);
    result.startPos = pattern.startPos;
    result.endPos = body.endPos;
    return result;
  }

  _parseStmtLet() {
    var startPos = this._currentToken.startPos;
    this._match(T_LET);
    var result;
    if (this._currentToken.tag == T_LOWERID) {
      result = this._parseStmtAssignVariable();
    } else if (this._currentToken.tag == T_LPAREN) {
      result = this._parseStmtAssignTuple();
    } else {
      throw new GbsSyntaxError(
        this._currentToken.startPos,
        i18n('errmsg:expected-but-found')(
          i18n('<alternative>')(
            i18n('T_LOWERID'),
            i18n('T_LPAREN')
          ),
          i18n(Symbol.keyfor(this._currentToken.tag))
        )
      );
    }
    result.startPos = startPos;
    return result;
  }

  _parseStmtAssignVariable() {
    var startPos = this._currentToken.startPos;
    var variable = this._currentToken;
    this._match(T_LOWERID);
    this._match(T_ASSIGN);
    var expression = this._parseExpression();
    let result = new ASTStmtAssignVariable(variable, expression);
    result.startPos = startPos;
    result.endPos = expression.endPos;
    return result;
  }

  _parseStmtAssignTuple() {
    var startPos = this._currentToken.startPos;
    this._match(T_LPAREN);
    var variables = this._parseLoweridList();
    if (variables.length === 1) {
      throw new GbsSyntaxError(
        this._currentToken.startPos,
        i18n('errmsg:assignment-tuple-cannot-be-singleton')
      );
    }
    this._match(T_RPAREN);
    this._match(T_ASSIGN);
    var expression = this._parseExpression();
    let result = new ASTStmtAssignTuple(variables, expression);
    result.startPos = startPos;
    result.endPos = expression.endPos;
    return result;
  }

  /** Patterns **/

  _parsePattern() {
    if (this._currentToken.tag === T_UNDERSCORE) {
      return this._parsePatternWildcard();
    } else if (this._currentToken.tag === T_UPPERID) {
      return this._parsePatternConstructor();
    } else if (this._currentToken.tag === T_LPAREN) {
      return this._parsePatternTuple();
    } else {
      throw new GbsSyntaxError(
        this._currentToken.startPos,
        i18n('errmsg:expected-but-found')(
          i18n('pattern'),
          i18n(Symbol.keyFor(this._currentToken.tag))
        )
      );
    }
  }

  _parsePatternWildcard() {
    var startPos = this._currentToken.startPos;
    this._match(T_UNDERSCORE);
    var result = new ASTPatternWildcard();
    var endPos = startPos;
    result.startPos = startPos;
    result.endPos = endPos;
    return result;
  }

  _parsePatternConstructor() {
    var startPos = this._currentToken.startPos;
    var endPos = this._currentToken.startPos;
    var constructor = this._currentToken;
    this._match(T_UPPERID);
    var parameters;
    if (this._currentToken.tag === T_LPAREN) {
      this._match(T_LPAREN);
      parameters = this._parseLoweridList();
      endPos = this._currentToken.startPos;
      this._match(T_RPAREN);
    } else {
      parameters = [];
    }
    var result = new ASTPatternConstructor(constructor, parameters);
    result.startPos = startPos;
    result.endPos = endPos;
    return result;
  }

  _parsePatternTuple() {
    var startPos = this._currentToken.startPos;
    this._match(T_LPAREN);
    var parameters = this._parseLoweridList();
    if (parameters.length === 1) {
      throw new GbsSyntaxError(
        this._currentToken.startPos,
        i18n('errmsg:pattern-tuple-cannot-be-singleton')
      );
    }
    var endPos = this._currentToken.startPos;
    this._match(T_RPAREN);
    var result = new ASTPatternTuple(parameters);
    result.startPos = startPos;
    result.endPos = endPos;
    return result;
  }

  /** Expressions **/

  _parseExpression() {
    // TODO: extend to other expressions
    var expression = this._currentToken;
    this._match(T_LOWERID);
    var result = new ASTExprVariable(expression);
    result.startPos = expression.startPos;
    result.endPos = expression.endPos;
    return result;
  }

  /* Read a list of expressions separated by commas and delimited
   * by parentheses. If there is a single expression, return the
   * expression itself. If there are 0 or >=2 expressions, return
   * a tuple.
   */
  _parseExprTuple() {
    var startPos = this._currentToken.startPos;
    let self = this;
    this._match(T_LPAREN);
    var expressionList = this._parseDelimitedList(
                           T_RPAREN, T_COMMA,
                           () => self._parseExpression()
                         );
    var endPos = this._currentToken.startPos;
    this._match(T_RPAREN);

    var result;
    if (expressionList.length == 1) {
      result = expressionList[0];
    } else {
      result = new ASTExprTuple(expressionList);
    }
    result.startPos = startPos;
    result.endPos = endPos;
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
      throw new GbsSyntaxError(
                  this._currentToken.startPos,
                  i18n('errmsg:expected-but-found')(
                    i18n(Symbol.keyFor(tokenTag)),
                    i18n(Symbol.keyFor(this._currentToken.tag))
                  )
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
      throw new GbsSyntaxError(
                  this._currentToken.startPos,
                  i18n('errmsg:expected-but-found')(
                    i18n('<alternative>')(
                      tagList.map(tag => i18n(Symbol.keyFor(tag)))
                    ),
                    i18n(Symbol.keyFor(this._currentToken.tag))
                  )
                );
    }
    this._nextToken();
  }

}

