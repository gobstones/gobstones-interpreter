
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
    this._lintMain(ast);
    return this._symtable;
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

  /** Definitions **/

  _lintDefinition(definition) {
    switch (definition.tag) {
      case N_DefProgram:
        return this._lintDefProgram(definition);
      case N_DefInteractiveProgram:
        return this._lintDefInteractiveProgram(definition);
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

  _lintDefInteractiveProgram(definition) {
    /* Lint all branches */
    this._lintSwitchBranches(definition.branches, true/*isInteractiveProgram*/);
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
    for (let parameter of definition.parameters) {
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
    for (let parameter of definition.parameters) {
      this._symtable.addNewLocalName(parameter, LocalParameter);
    }

    /* Lint body */
    this._lintStmtBlock(definition.body, true/*allowReturn*/);

    /* Remove all local names */
    this._symtable.exitScope();
  }

  /** Statements **/

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
        return this._lintStmtSwitch(statement);
      case N_StmtAssignVariable:
        return this._lintStmtAssignVariable(statement);
      case N_StmtAssignTuple:
        return this._lintStmtAssignTuple(statement);
      case N_StmtProcedureCall:
        return this._lintStmtProcedureCall(statement);
      default:
        throw Error(
                'Linter: Statement not implemented: '
              + Symbol.keyFor(definition.tag)
              );
    }
  }

  _lintStmtBlock(block, allowReturn) {
    let i = 0;
    for (let statement of block.statements) {
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

  _lintStmtSwitch(statement) {
    this._lintExpression(statement.subject);
    this._lintSwitchBranches(statement.branches, false/*isInteractiveProgram*/);
  }
  
  _lintSwitchBranches(branches, isInteractiveProgram) {
    /* Check that each pattern is well-formed */
    for (let branch of branches) {
      this._lintPattern(branch.pattern);
    }

    this._switchBranchesCheckWildcard(branches);
    this._switchBranchesCheckNoRepeats(branches);
    this._switchBranchesCheckCompatible(branches);
    if (isInteractiveProgram) {
      this._switchBranchesCheckTypeEvent(branches);
    } else {
      this._switchBranchesCheckTypeNotEvent(branches);
    }

    /* Lint recursively each branch */
    for (let branch of branches) {
      this._lintSwitchBranchBody(branch);
    }
  }

  /* Check that there is at most one wildcard at the end */
  _switchBranchesCheckWildcard(branches) {
    let i = 0; 
    const n = branches.length;
    for (let branch of branches) {
      if (branch.pattern.tag === N_PatternWildcard && i !== n - 1) {
        throw new GbsSyntaxError(
          branch.pattern.startPos,
          i18n('errmsg:wildcard-pattern-should-be-last')
        );
      }
      i++;
    }
  }

  /* Check that there are no repeated constructors in a sequence
   * of branches. */
  _switchBranchesCheckNoRepeats(branches) {
    let coveredConstructors = {};
    let coveredTuples = {};
    let coveredTimeout = false;
    for (let branch of branches) {
      switch (branch.pattern.tag) {
        case N_PatternConstructor:
          let constructorName = branch.pattern.constructorName.value;
          if (constructorName in coveredConstructors) {
            throw new GbsSyntaxError(
              branch.pattern.startPos,
              i18n('errmsg:constructor-pattern-repeats-constructor')(
                constructorName
              )
            );
          }
          coveredConstructors[constructorName] = true;
          break;
        case N_PatternTuple:
          let arity = branch.pattern.parameters.length;
          if (arity in coveredTuples) {
            throw new GbsSyntaxError(
              branch.pattern.startPos,
              i18n('errmsg:constructor-pattern-repeats-tuple-arity')(arity)
            );
          }
          coveredTuples[arity] = true;
          break;
        case N_PatternTimeout:
          if (coveredTimeout) {
            throw new GbsSyntaxError(
              branch.pattern.startPos,
              i18n('errmsg:constructor-pattern-repeats-timeout')
            );
          }
          coveredTimeout = true;
          break;
      }
    }
  }

  /* Check that constructors are compatible,
   * i.e. that they belong to the same type */
  _switchBranchesCheckCompatible(branches) {
    let expectedType = null;
    for (let branch of branches) {
      let patternType = this._patternType(branch.pattern);
      if (expectedType === null) {
        expectedType = patternType;
      } else if (patternType !== null && expectedType !== patternType) {
        throw new GbsSyntaxError(
          branch.pattern.startPos,
          i18n('errmsg:pattern-does-not-match-type')(
            i18n('<pattern-type>')(expectedType),
            i18n('<pattern-type>')(patternType)
          )
        );
      }
    }
  }

  /* Check that there are patterns are of type "_EVENT" */
  _switchBranchesCheckTypeEvent(branches) {
    for (let branch of branches) {
      let patternType = this._patternType(branch.pattern);
      if (patternType !== null && patternType !== '_EVENT') {
        throw new GbsSyntaxError(
          branch.pattern.startPos,
          i18n('errmsg:patterns-in-interactive-program-must-be-events')
        );
      }
    }
  }

  /* Check that there are no patterns of type "_EVENT" */
  _switchBranchesCheckTypeNotEvent(branches) {
    for (let branch of branches) {
      let patternType = this._patternType(branch.pattern);
      if (patternType === '_EVENT') {
        throw new GbsSyntaxError(
          branch.pattern.startPos,
          i18n('errmsg:patterns-in-switch-must-not-be-events')
        );
      }
    }
  }

  /* Recursively lint the body of each branch.
   * Locally bind parameters.
   */
  _lintSwitchBranchBody(branch) {
    for (var parameter of branch.pattern.parameters) {
      this._symtable.addNewLocalName(parameter, LocalParameter);
    }
    this._lintStatement(branch.body);
    for (var parameter of branch.pattern.parameters) {
      this._symtable.removeLocalName(parameter);
    }
  }

  /* Return a description of the type of a pattern */
  _patternType(pattern) {
    switch (pattern.tag) {
      case N_PatternWildcard:
        return null;
      case N_PatternConstructor:
        return this._symtable.constructorType(pattern.constructorName.value);
      case N_PatternTuple:
        return '_TUPLE_' + pattern.parameters.length.toString();
      case N_PatternTimeout:
        return '_EVENT';
      default:
        throw Error(
                'Linter: pattern "'
              + Symbol.keyFor(branch.tag)
              + '" not implemented.'
              );
    }
  }

  _lintStmtAssignVariable(statement) {
    this._symtable.setLocalName(statement.variable, LocalVariable);
    this._lintExpression(statement.value);
  }

  _lintStmtAssignTuple(statement) {
    let variables = {};
    for (let variable of statement.variables) {
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

  _lintStmtProcedureCall(statement) {
    let name = statement.procedureName.value;

    /* Check that it is a procedure */
    if (!this._symtable.isProcedure(name)) {
      if (this._symtable.isConstructor(name)) {
        throw new GbsSyntaxError(
          statement.startPos,
          i18n('errmsg:constructor-used-as-procedure')(
            name,
            this._symtable.constructorType(name)
          )
        );
      } else {
        throw new GbsSyntaxError(
          statement.startPos,
          i18n('errmsg:undefined-procedure')(name)
        );
      }
    }

    /* Check that the number of argument coincides */
    let expected = this._symtable.procedureParameters(name).length;
    let received = statement.args.length;
    if (expected !== received) {
      throw new GbsSyntaxError(
        statement.startPos,
        i18n('errmsg:procedure-arity-mismatch')(
          name,
          expected,
          received
        )
      );
    }

    /* Check all the arguments */
    for (let argument of statement.args) {
      this._lintExpression(argument);
    }
  }

  /** Patterns **/

  _lintPattern(pattern) {
    switch (pattern.tag) {
      case N_PatternWildcard:
        return this._lintPatternWildcard(pattern);
      case N_PatternConstructor:
        return this._lintPatternConstructor(pattern);
      case N_PatternTuple:
        return this._lintPatternTuple(pattern);
      case N_PatternTimeout:
        return this._lintPatternTimeout(pattern);
      default:
        throw Error(
                'Linter: pattern "'
               + Symbol.keyFor(branch.tag)
               + '" not implemented.'
              );
    }
  }

  _lintPatternWildcard(pattern) {
    /* No restrictions. */
  }

  _lintPatternConstructor(pattern) {
    let name = pattern.constructorName.value;

    /* Check that the constructor exists */
    if (!this._symtable.isConstructor(name)) {
      if (this._symtable.isType(name)) {
        throw new GbsSyntaxError(
          pattern.startPos,
          i18n('errmsg:type-used-as-constructor')(
            name,
            this._symtable.typeConstructors(name)
          )
        );
      } else if (this._symtable.isProcedure(name)) {
        throw new GbsSyntaxError(
          pattern.startPos,
          i18n('errmsg:procedure-used-as-constructor')(name)
        );
      } else {
        throw new GbsSyntaxError(
          pattern.startPos,
          i18n('errmsg:undeclared-constructor')(name)
        );
      }
    }

    /* Check that the number of parameters match.
     * Note: constructor patterns with 0 arguments are always allowed.
     */
    let expected = this._symtable.constructorFields(name).length;
    let received = pattern.parameters.length;
    if (received > 0 && expected !== received) {
      throw new GbsSyntaxError(
        pattern.startPos,
        i18n('errmsg:constructor-pattern-arity-mismatch')(
          name,
          expected,
          received
        )
      );
    }
  }

  _lintPatternTuple(pattern) {
    /* No restrictions. */
  }

  _lintPatternTimeout(pattern) {
    /* No restrictions. */
  }

  /** Expressions **/

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

