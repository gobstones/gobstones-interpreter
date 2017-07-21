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
  T_SEMICOLON, T_RANGE, T_GETS, T_PIPE, T_ASSIGN,
  T_EQ, T_NE, T_LE, T_GE, T_LT, T_GT, T_AND, T_OR, T_CONCAT, T_PLUS,
  T_MINUS, T_TIMES, T_POW
} from './token';
import {
  ASTNode,
  ASTProgramDeclaration,
  ASTProcedureDeclaration,
  ASTFunctionDeclaration,
  /* Statements */
  ASTStmtBlock,
  ASTStmtReturn,
  ASTStmtIf,
  ASTStmtRepeat,
  ASTStmtForeach,
  ASTStmtWhile,
  ASTStmtSwitch,
  ASTStmtSwitchBranch,
  ASTStmtLet,
  ASTStmtProcedureCall,
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
    var declarations = [];
    while (this._currentToken.tag !== T_EOF) {
      declarations.push(this._parseDeclaration());
    }
    if (declarations.length == 0) {
      throw new GbsSyntaxError(
                  this._currentToken.startPos,
                  i18n('errmsg:empty-source')
                );
    } else {
      return declarations;
    }
  }

  _parseDeclaration() {
    switch (this._currentToken.tag) {
      case T_PROGRAM:
        return this._parseProgramDeclaration();
      case T_INTERACTIVE:
        this._nextToken();
        throw Error('TODO');
      case T_PROCEDURE:
        return this._parseProcedureDeclaration();
      case T_FUNCTION:
        return this._parseFunctionDeclaration();
      case T_TYPE:
        this._nextToken();
        throw Error('TODO');
      default:
        throw new GbsSyntaxError(
                    this._currentToken.startPos,
                    i18n('errmsg:expected-but-found')(
                      i18n('declaration'),
                      i18n(Symbol.keyFor(this._currentToken.tag))
                    )
                  );
    }
  }

  _parseProgramDeclaration() {
    var startPos = this._currentToken.startPos;
    this._match(T_PROGRAM);
    var block = this._parseStmtBlock();
    var result = new ASTProgramDeclaration(block);
    result.startPos = startPos;
    result.endPos = block.endPos;
    return result;
  }

  _parseProcedureDeclaration() {
    var startPos = this._currentToken.startPos;
    this._match(T_PROCEDURE);
    var name = this._currentToken;
    this._match(T_UPPERID);
    var parameterList = this._parseParameterList();
    var block = this._parseStmtBlock();
    var result = new ASTProcedureDeclaration(name, parameterList, block);
    result.startPos = startPos;
    result.endPos = block.endPos;
    return result;
  }

  _parseFunctionDeclaration() {
    var startPos = this._currentToken.startPos;
    this._match(T_FUNCTION);
    var name = this._currentToken;
    this._match(T_LOWERID);
    var parameterList = this._parseParameterList();
    var block = this._parseStmtBlock();
    var result = new ASTFunctionDeclaration(name, parameterList, block);
    result.startPos = startPos;
    result.endPos = block.endPos;
    return result;
  }

  /* Generic method to parse a delimited list:
   *   left: token tag for the left delimiter
   *   right: token tag for the right delimiter
   *   separator: token tag for the separator
   *   parseElement: function that parses one element */
  _parseDelimitedList(left, right, separator, parseElement) {
    this._match(left);
    if (this._currentToken.tag === right) {
      this._match(right);
      return []; /* Empty case */
    }
    var list = [parseElement()];
    while (this._currentToken.tag === separator) {
      this._match(separator);
      list.push(parseElement());
    }
    this._matchExpected(right, [separator, right]);
    return list;
  }

  _parseParameter() {
    var parameter = this._currentToken;
    this._match(T_LOWERID);
    return parameter;
  }

  _parseParameterList() {
    let self = this;
    return this._parseDelimitedList(
             T_LPAREN, T_RPAREN, T_COMMA, () => self._parseParameter()
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
        throw Error('TODO');
      case T_LBRACE:
        return this._parseStmtBlock();
      case T_LOWERID:
        // variable assignment
        throw Error('TODO');
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
    this._match(T_LBRACE);
    var branches = _parseStmtSwitchBranches();
    var endPos = this._currentToken.startPos;
    this._match(T_RBRACE);
    var result = new ASTStmtSwitch(subject, branches);
    /// TODO!
  }

  _parseStmtSwitchBranches() {
    /// TODO!
    return null;
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
    var expressionList = this._parseDelimitedList(
                           T_LPAREN, T_RPAREN, T_COMMA,
                           () => self._parseExpression()
                         );
    if (expressionList.length == 1) {
      return expressionList[0];
    }
    var result = new ASTExprTuple(expressionList);
    result.startPos = startPos;
    if (expressionList.length === 0) {
      result.endPos = startPos;
    } else {
      result.endPos = expressionList.slice(-1)[0].endPos;
    }
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

