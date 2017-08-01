
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
        return this._lintDefType(definition);
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

  _lintDefType(definition) {
    /* No restrictions */
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
              + Symbol.keyFor(statement.tag)
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
    /* No restrictions */
  }

  _lintPatternConstructor(pattern) {
    let name = pattern.constructorName.value;

    /* Check that the constructor exists */
    if (!this._symtable.isConstructor(name)) {
      this._failExpectedConstructorButGot(pattern.startPos, name); // throws
      return;
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
    /* No restrictions */
  }

  _lintPatternTimeout(pattern) {
    /* No restrictions */
  }

  /** Expressions **/

  _lintExpression(expression) {
    switch (expression.tag) {
      case N_ExprVariable:
        return this._lintExprVariable(expression);
      case N_ExprConstantNumber:
        return this._lintExprConstantNumber(expression);
      case N_ExprConstantString:
        return this._lintExprConstantString(expression);
      case N_ExprList:
        return this._lintExprList(expression);
      case N_ExprRange:
        return this._lintExprRange(expression);
      case N_ExprTuple:
        return this._lintExprTuple(expression);
      case N_ExprConstructor:
        return this._lintExprConstructor(expression);
      case N_ExprConstructorUpdate:
        return this._lintExprConstructorUpdate(expression);
      case N_ExprFunctionCall:
        // TODO
        // NOTE: it might be a field!
        break;
      default:
        throw Error(
                'Linter: Expression not implemented: '
              + Symbol.keyFor(expression.tag)
              );
    }
  }

  _lintExprVariable(expression) {
    /* No restrictions.
     * Note: the restriction that a variable is defined before it is used
     * is a dynamic constraint . */
  }

  _lintExprConstantNumber(expression) {
    /* No restrictions */
  }

  _lintExprConstantString(expression) {
    /* No restrictions */
  }

  _lintExprList(expression) {
    for (let element of expression.elements) {
      this._lintExpression(element);
    }
  }

  _lintExprRange(expression) {
    this._lintExpression(expression.first);
    if (expression.second !== null) {
      this._lintExpression(expression.second);
    }
    this._lintExpression(expression.last);
  }

  _lintExprTuple(expression) {
    for (let element of expression.elements) {
      this._lintExpression(element);
    }
  }

  _lintExprConstructor(expression) {
    this._lintExprConstructorOrUpdate(expression, null);
  }

  _lintExprConstructorUpdate(expression) {
    this._lintExprConstructorOrUpdate(expression, expression.original);
  }

  /* Check a fresh constructor instantiation: C(x1 <- e1, ..., xN <- eN)
   * or a constructor update: C(original | x1 <- e1, ..., xN <- eN).
   *
   * If original is null, it is a fresh instantiation.
   * If original is not null, it is the updated expression.
   * */
  _lintExprConstructorOrUpdate(expression, original) {
    /* Check that constructor exists */
    let constructorName = expression.constructorName.value;
    if (!this._symtable.isConstructor(constructorName)) {
      this._failExpectedConstructorButGot(    // throws
        expression.startPos, constructorName
      );
      return;
    }

    this._checkConstructorTypeNotEvent(constructorName, expression);
    this._checkConstructorNoRepeatedFields(constructorName, expression);
    this._checkConstructorBindingsCorrect(constructorName, expression);

    /* If it is a fresh instantiation, check that the fields are complete */
    if (original === null) {
      this._checkConstructorBindingsComplete(constructorName, expression);
    }

    /* If it is an update, recursively check the original expression */
    if (original !== null) {
      this._lintExpression(original);
    }

    /* Recursively check expressions in field bindings */
    for (let fieldBinding of expression.fieldBindings) {
      this._lintExpression(fieldBinding.value);
    }
  }

  /* Check that there are no repeated fields in a constructor
   * instantiation/update */
  _checkConstructorNoRepeatedFields(constructorName, expression) {
    let declaredFields = expression.fieldNames();
    let seen = {};
    for (let fieldName of declaredFields) {
      if (fieldName in seen) {
        throw new GbsSyntaxError(
          expression.startPos,
          i18n('errmsg:constructor-instantiation-repeated-field')(
           constructorName,
           fieldName
          )
        );
      }
      seen[fieldName] = true;
    }
  }

  /* Check that all bindings in a constructor instantiation/update
   * correspond to existing fields */
  _checkConstructorBindingsCorrect(constructorName, expression) {
    let declaredFields = expression.fieldNames();
    let constructorFields = this._symtable.constructorFields(constructorName);
    for (let fieldName of declaredFields) {
      if (constructorFields.indexOf(fieldName) == -1) {
        throw new GbsSyntaxError(
          expression.startPos,
          i18n('errmsg:constructor-instantiation-invalid-field')(
           constructorName,
           fieldName
          )
        );
      }
    }
  }

  /* Check that bindings in a constructor instantiation/update
   * cover all existing fields */
  _checkConstructorBindingsComplete(constructorName, expression) {
    let declaredFields = expression.fieldNames();
    let constructorFields = this._symtable.constructorFields(constructorName);
    for (let fieldName of constructorFields) {
      if (declaredFields.indexOf(fieldName) == -1) {
        throw new GbsSyntaxError(
          expression.startPos,
          i18n('errmsg:constructor-instantiation-missing-field')(
           constructorName,
           fieldName
          )
        );
      }
    }
  }

  /* Check that a constructor instantiation/update does not involve
   * constructors of the _EVENT type, which should only be
   * handled implicitly in an interactive program. */
  _checkConstructorTypeNotEvent(constructorName, expression) {
    if (this._symtable.constructorType(constructorName) === '_EVENT') {
      throw new GbsSyntaxError(
        expression.startPos,
        i18n('errmsg:constructor-instantiation-cannot-be-an-event')(
         constructorName
        )
      );
    }
  }

  /* Throw a syntax error indicating that we expected the name of a
   * constructor, but we got a name which is not a constructor.
   *
   * If the name is a type or a procedure, provide a more helpful
   * error message. (Coinciding constructor and procedure names are
   * not forbidden, but it is probably a mistake). */
  _failExpectedConstructorButGot(startPos, name) {
    if (this._symtable.isType(name)) {
      throw new GbsSyntaxError(
        startPos,
        i18n('errmsg:type-used-as-constructor')(
          name,
          this._symtable.typeConstructors(name)
        )
      );
    } else if (this._symtable.isProcedure(name)) {
      throw new GbsSyntaxError(
        startPos,
        i18n('errmsg:procedure-used-as-constructor')(name)
      );
    } else {
      throw new GbsSyntaxError(
        startPos,
        i18n('errmsg:undeclared-constructor')(name)
      );
    }
  }

}

