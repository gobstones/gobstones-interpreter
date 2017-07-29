
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
import { LocalParameter, LocalIndex, LocalVariable } from './symtable';
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
        return this._symtable.defProgram(definition);
      case N_DefInteractiveProgram:
        return this._symtable.defInteractiveProgram(definition);
      case N_DefProcedure:
        return this._symtable.defProcedure(definition);
      case N_DefFunction:
        return this._symtable.defFunction(definition);
      case N_DefType:
        return this._symtable.defType(definition);
      default:
        throw Error('Unknown definition: ' + Symbol.keyFor(definition.tag));
    }
  }

  _lintDefinition(definition) {
    switch (definition.tag) {
      case N_DefProgram:
        return this._lintDefProgram(definition);
      case N_DefInteractiveProgram:
        // TODO
        break;
      case N_DefProcedure:
        return this._lintDefProcedure(definition);
      case N_DefFunction:
        return this._lintDefFunction(definition);
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
    /* Lint body */
    this._lintStmtBlock(definition.body, true/*allowReturn*/);

    /* Remove all local names */
    this._symtable.exitScope();
  }
  
  _lintDefProcedure(definition) {
    /* Check that it does not have a return statement */
    if (isBlockWithReturn(definition.body)) {
      throw new GbsSyntaxError(
        definition.startPos,
        i18n('errmsg:procedure-should-not-have-return')(definition.name.value)
      );
    }

    /* Add parameters as local names */
    for (var parameter of definition.parameters) {
      this._symtable.addNewLocalName(parameter, LocalParameter);
    }

    /* Lint body */
    this._lintStmtBlock(definition.body, false/*!allowReturn*/);

    /* Remove all local names */
    this._symtable.exitScope();
  }

  _lintDefFunction(definition) {
    /* Check that it has a return statement */
    if (!isBlockWithReturn(definition.body)) {
      throw new GbsSyntaxError(
        definition.startPos,
        i18n('errmsg:function-should-have-return')(definition.name.value)
      );
    }

    /* Add parameters as local names */
    for (var parameter of definition.parameters) {
      this._symtable.addNewLocalName(parameter, LocalParameter);
    }

    /* Lint body */
    this._lintStmtBlock(definition.body, true/*allowReturn*/);

    /* Remove all local names */
    this._symtable.exitScope();
  }

  _lintStatement(statement) {
    switch (statement.tag) {
      case N_StmtBlock:
        /* Do not allow return in nested blocks */
        return this._lintStmtBlock(statement, false/*!allowReturn*/);
      case N_StmtReturn:
        return this._lintStmtReturn(statement);
      case N_StmtIf:
        return this._lintStmtIf(statement);
      case N_StmtRepeat:
        return this._lintStmtRepeat(statement);
      case N_StmtForeach:
        return this._lintStmtForeach(statement);
      case N_StmtWhile:
        return this._lintStmtWhile(statement);
      case N_StmtSwitch:
        // TODO
        break;
      case N_StmtAssignVariable:
        return this._lintStmtAssignVariable(statement);
      case N_StmtAssignTuple:
        return this._lintStmtAssignTuple(statement);
      case N_StmtProcedureCall:
        // TODO
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

  _lintStmtReturn(statement) {
    this._lintExpression(statement.result);
  }

  _lintStmtIf(statement) {
    this._lintExpression(statement.condition);
    this._lintStatement(statement.thenBlock);
    if (statement.elseBlock !== null) {
      this._lintStatement(statement.elseBlock);
    }
  }

  _lintStmtRepeat(statement) {
    this._lintExpression(statement.times);
    this._lintStatement(statement.body);
  }

  _lintStmtForeach(statement) {
    this._lintExpression(statement.range);
    this._symtable.addNewLocalName(statement.index, LocalIndex);
    this._lintStatement(statement.body);
    this._symtable.removeLocalName(statement.index);
  }

  _lintStmtWhile(statement) {
    this._lintExpression(statement.condition);
    this._lintStatement(statement.body);
  }

  // _lintStmtSwitch : TODO

  _lintStmtAssignVariable(statement) {
    this._symtable.setLocalName(statement.variable, LocalVariable);
    this._lintExpression(statement.value);
  }

  _lintStmtAssignTuple(statement) {
    let variables = {};
    for (var variable of statement.variables) {
      this._symtable.setLocalName(variable, LocalVariable);
      if (variable.value in variables) {
        throw new GbsSyntaxError(
          variable.startPos,
          i18n('errmsg:repeated-variable-in-tuple-assignment')(variable.value)
        );
      }
      variables[variable.value] = true;
    }
    this._lintExpression(statement.value);
  }

  _lintExpression(expression) {
    // TODO
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

