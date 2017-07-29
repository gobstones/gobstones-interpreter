
import {
  N_Main,
  /* Definitions */
  N_DefProgram,
  N_DefInteractiveProgram,
  N_DefProcedure,
  N_DefFunction,
  N_DefType,
  /* Statements */
  N_StmtBlock,
  N_StmtReturn,
  N_StmtIf,
  N_StmtRepeat,
  N_StmtForeach,
  N_StmtWhile,
  N_StmtSwitch,
  N_StmtAssignVariable,
  N_StmtAssignTuple,
  N_StmtProcedureCall,
  /* Patterns */
  N_PatternWildcard,
  N_PatternConstructor,
  N_PatternTuple,
  N_PatternTimeout,
  /* Expressions */
  N_ExprVariable,
  N_ExprConstantNumber,
  N_ExprConstantString,
  N_ExprList,
  N_ExprRange,
  N_ExprTuple,
  N_ExprConstructor,
  N_ExprConstructorUpdate,
  N_ExprFunctionCall,
  /* SwitchBranch: pattern -> body */
  N_SwitchBranch,
  /* FieldValue: field <- value */
  N_FieldValue,
  /* ConstructorDeclaration */
  N_ConstructorDeclaration,
} from './ast';
import { GbsSyntaxError } from './exceptions';
import { i18n } from './i18n';

function isBlockWithReturn(stmt) {
  return stmt.tag === N_StmtBlock
      && stmt.statements.length > 0
      && stmt.statements.slice(-1)[0].tag === N_StmtReturn;
}

/* A semantic analyzer receives
 *   a symbol table (instance of SymbolTable)
 *   an abstract syntax tree (the output of a parser)
 *
 * Then:
 *
 * - It performs semantic checks (linting) to ensure that the
 *   program is well-formed.
 *
 * - It builds a symbol table with information on global identifiers
 *   such as procedures, functions, types, constructors, and fields.
 *
 * - The semantic analysis is structured as a recursive visit over the
 *   AST.
 *
 * We assume that the AST is the valid output of a parser.
 */
export class Linter {

  constructor(symtable) {
    this._symtable = symtable;
  }

  lint(ast) {
    this._lint(ast);
    return this._symtable;
  }

  _lint(ast) {
    let dispatch = {
      'N_Main': (ast) => this._lintMain(ast),
    };
    let key = Symbol.keyFor(ast.tag);
    if (key in dispatch) {
      dispatch[key](ast);
    } else {
      throw Error('Lint for AST node "' + key + '" not implemented.');
    }
  }

  _lintMain(ast) {
    /* Collect all definitions into the symbol table.
     * This should be done all together, before linting individual
     * definitions, so all the names of types, constructors, fields, etc.
     * are already known when checking statements and expressions. */
    for (let definition of ast.definitions) {
      this._addDefinitionToSymbolTable(definition);
    }

    /* The source should either be empty or have exactly one program */
    if (ast.definitions.length > 0 && this._symtable.program === null) {
      throw new GbsSyntaxError(
        ast.startPos,
        i18n('errmsg:source-should-have-a-program-definition')
      );
    }

    /* Lint individual definitions */
    for (let definition of ast.definitions) {
      this._lintDefinition(definition);
    }
  }

  _addDefinitionToSymbolTable(definition) {
    switch (definition.tag) {
      case N_DefProgram:
        this._symtable.defProgram(definition);
        break;
      case N_DefInteractiveProgram:
        this._symtable.defInteractiveProgram(definition);
        break;
      case N_DefProcedure:
        this._symtable.defProcedure(definition);
        break;
      case N_DefFunction:
        this._symtable.defFunction(definition);
        break;
      case N_DefType:
        this._symtable.defType(definition);
        break;
      default:
        throw Error('Unknown definition: ' + Symbol.keyFor(definition.tag));
    }
  }

  _lintDefinition(definition) {
    switch (definition.tag) {
      case N_DefProgram:
        this._lintDefProgram(definition);
        break;
      case N_DefInteractiveProgram:
        // TODO
        break;
      case N_DefProcedure:
        this._lintDefProcedure(definition);
        break;
      case N_DefFunction:
        this._lintDefFunction(definition);
        break;
      case N_DefType:
        // TODO
        break;
      default:
        throw Error(
                'Linter: Definition not implemented: '
              + Symbol.keyFor(definition.tag)
              );
    }
  }

  _lintDefProgram(definition) {
    this._lintStmtBlock(definition.body, true/*allowReturn*/);
  }
  
  _lintDefProcedure(definition) {
    if (isBlockWithReturn(definition.body)) {
      throw new GbsSyntaxError(
        definition.startPos,
        i18n('errmsg:procedure-should-not-have-return')(definition.name.value)
      );
    }
    this._lintStmtBlock(definition.body, false/*!allowReturn*/);
  }

  _lintDefFunction(definition) {
    if (!isBlockWithReturn(definition.body)) {
      throw new GbsSyntaxError(
        definition.startPos,
        i18n('errmsg:function-should-have-return')(definition.name.value)
      );
    }
    this._lintStmtBlock(definition.body, true/*allowReturn*/);
  }

  _lintStatement(statement) {
    switch (statement.tag) {
      case N_StmtBlock:
        /* Do not allow return in nested blocks */
        this._lintStmtBlock(statement, false/*!allowReturn*/);
        break;
      case N_StmtReturn:
        break;
      case N_StmtIf:
        break;
      case N_StmtRepeat:
        break;
      case N_StmtForeach:
        break;
      case N_StmtWhile:
        break;
      case N_StmtSwitch:
        break;
      case N_StmtAssignVariable:
        break;
      case N_StmtAssignTuple:
        break;
      case N_StmtProcedureCallcase:
        break;
      default:
        throw Error(
                'Linter: Statement not implemented: '
              + Symbol.keyFor(definition.tag)
              );
    }
  }

  _lintStmtBlock(block, allowReturn) {
    var i = 0;
    for (var statement of block.statements) {
      let returnAllowed = allowReturn && i === block.statements.length - 1;
      if (!returnAllowed && statement.tag === N_StmtReturn) {
        throw new GbsSyntaxError(
          statement.startPos,
          i18n('errmsg:return-statement-not-allowed-here')
        );
      }
      this._lintStatement(statement);
      i++;
    }
  }

}

// TODO: 
// - dentro de una función, no se pueden mezclar los roles de
//   + variables
//   + índices
//   + parámetros
//   + campos???
// - el return en una "function" puede devolver varias cosas!!
//   ---es una tupla---
// - el return en un "program" puede devolver varias cosas
// - return en un "interactive program"?
// - en las ramas de un switch / interactive program
//   chequear que:
//   + los patrones sean lineales
//   + haya a lo sumo una ocurrencia de "_" al final de todo

