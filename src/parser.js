import { GbsWarning, GbsSyntaxError } from './exceptions';
import { Lexer } from './lexer';
import { i18n } from './i18n';
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
import {
  ASTNode,
  ASTProgramDeclaration,
  ASTProcedureDeclaration,
  ASTFunctionDeclaration,
  ASTBlock,
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
    var block = this._parseBlock();
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
    var block = this._parseBlock();
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
    var block = this._parseBlock();
    var result = new ASTFunctionDeclaration(name, parameterList, block);
    result.startPos = startPos;
    result.endPos = block.endPos;
    return result;
  }

  _parseBlock() {
    var startPos = this._currentToken.startPos;
    var statements = [];
    this._match(T_LBRACE);
    while (this._currentToken.tag !== T_RBRACE) {
      statements.push(this._parseStatement());
      if (this._currentToken === T_SEMICOLON) {
        this._nextToken();
      }
    }
    var endPos = this._currentToken.startPos; 
    this._match(T_RBRACE);
    var result = new ASTBlock(statements);
    result.startPos = startPos;
    result.endPos = endPos;
    return result;
  }

  _parseParameterList() {
    this._match(T_LPAREN);
    if (this._currentToken.tag === T_RPAREN) {
      this._match(T_RPAREN);
      return []; /* Empty case */
    }
    var parameterList = [this._currentToken];
    this._match(T_LOWERID);
    while (this._currentToken.tag === T_COMMA) {
      this._match(T_COMMA);
      parameterList.push(this._currentToken);
      this._match(T_LOWERID);
    }
    this._matchExpected(T_RPAREN, [T_COMMA, T_RPAREN]);
    return parameterList;
  }

  /* Statement, optionally followed by semicolon */
  _parseStatement() {
    var statement = this._parsePureStatement();
    if (this._currentToken.tag === T_SEMICOLON) {
      this._match(T_SEMICOLON);
    }
    return statement;
  }

  /* Statement (not followed by semicolon) */
  _parseStatement() {
    switch (this._currentToken) {
      case T_RETURN:
        throw Error('TODO');
      case T_IF:
        throw Error('TODO');
      case T_REPEAT:
        throw Error('TODO');
      case T_FOREACH:
        throw Error('TODO');
      case T_WHILE:
        throw Error('TODO');
      case T_SWITCH:
        throw Error('TODO');
      case T_MATCH:
        throw Error('TODO');
      case T_LET:
        throw Error('TODO');
      case T_LBRACE:
        // nested block
        throw Error('TODO');
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

  /* Advance to the next token */
  _nextToken() {
    this._currentToken = this._lexer.nextToken();
  }

  /* Check that the current token has the right tag.
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

  /* Check that the current token has the right tag.
   * Then advance to the next token.
   * Otherwise report that any of the alternatives in the tagList was expected.
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
