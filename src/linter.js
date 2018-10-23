
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
  N_PatternVariable,
  N_PatternNumber,
  N_PatternStructure,
  N_PatternTuple,
  N_PatternTimeout,
  /* Expressions */
  N_ExprVariable,
  N_ExprConstantNumber,
  N_ExprConstantString,
  N_ExprChoose,
  N_ExprMatching,
  N_ExprList,
  N_ExprRange,
  N_ExprTuple,
  N_ExprStructure,
  N_ExprStructureUpdate,
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
import { RecursionChecker } from './recursion_checker';

function isBlockWithReturn(stmt) {
  return stmt.tag === N_StmtBlock
      && stmt.statements.length > 0
      && stmt.statements.slice(-1)[0].tag === N_StmtReturn;
}

function fail(startPos, endPos, reason, args) {
  throw new GbsSyntaxError(startPos, endPos, reason, args);
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

    /* All checks performed by the linter have an entry in this dictionary.
     * The value of a check indicates whether it is enabled (true) or
     * disabled (false).
     *
     * If a check is disabled, it does not produce a syntax error.
     */
    this._enabledLinterChecks = {
      // Linter options
      'source-should-have-a-program-definition': true,
      'procedure-should-not-have-return': true,
      'function-should-have-return': true,
      'return-statement-not-allowed-here': true,
      'wildcard-pattern-should-be-last': true,
      'variable-pattern-should-be-last': true,
      'structure-pattern-repeats-constructor': true,
      'structure-pattern-repeats-tuple-arity': true,
      'structure-pattern-repeats-timeout': true,
      'pattern-does-not-match-type': true,
      'patterns-in-interactive-program-must-be-events': true,
      'patterns-in-interactive-program-cannot-be-variables': true,
      'patterns-in-switch-must-not-be-events': true,
      'patterns-in-foreach-must-not-be-events': true,
      'repeated-variable-in-tuple-assignment': true,
      'constructor-used-as-procedure': true,
      'undefined-procedure': true,
      'procedure-arity-mismatch': true,
      'numeric-pattern-repeats-number': true,
      'structure-pattern-arity-mismatch': true,
      'structure-construction-repeated-field': true,
      'structure-construction-invalid-field': true,
      'structure-construction-missing-field': true,
      'structure-construction-cannot-be-an-event': true,
      'undefined-function': true,
      'function-arity-mismatch': true,
      'type-used-as-constructor': true,
      'procedure-used-as-constructor': true,
      'undeclared-constructor': true,
      // Extensions
      'forbidden-extension-destructuring-foreach': true,
      'forbidden-extension-allow-recursion': true,
    };
  }

  lint(ast) {
    this._lintMain(ast);
    return this._symtable;
  }

  _ensureLintCheckExists(linterCheckId) {
    if (!(linterCheckId in this._enabledLinterChecks)) {
      throw Error('Linter check "' + linterCheckId + '" does not exist.');
    }
  }

  enableCheck(linterCheckId, enabled) {
    this._ensureLintCheckExists(linterCheckId);
    this._enabledLinterChecks[linterCheckId] = enabled;
  }

  _lintCheck(startPos, endPos, reason, args) {
    this._ensureLintCheckExists(reason);
    if (this._enabledLinterChecks[reason]) {
      fail(startPos, endPos, reason, args);
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
      this._lintCheck(
        ast.startPos, ast.endPos,
        'source-should-have-a-program-definition', []
      );
    }

    /* Lint individual definitions */
    for (let definition of ast.definitions) {
      this._lintDefinition(definition);
    }

    /* Disable recursion */
    this._disableRecursion(ast);
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
    this._lintStmtBlock(definition.body, true /* allowReturn */);

    /* Remove all local names */
    this._symtable.exitScope();
  }

  _lintDefInteractiveProgram(definition) {
    /* Lint all branches */
    this._lintSwitchBranches(
      definition.branches,
      true /* isInteractiveProgram */
    );
  }

  _lintDefProcedure(definition) {
    /* Check that it does not have a return statement */
    if (isBlockWithReturn(definition.body)) {
      this._lintCheck(
        definition.startPos, definition.endPos,
        'procedure-should-not-have-return', [definition.name.value]
      );
    }

    /* Add parameters as local names */
    for (let parameter of definition.parameters) {
      this._symtable.addNewLocalName(parameter, LocalParameter);
    }

    /* Lint body */
    this._lintStmtBlock(definition.body, false /* !allowReturn */);

    /* Remove all local names */
    this._symtable.exitScope();
  }

  _lintDefFunction(definition) {
    /* Check that it has a return statement */
    if (!isBlockWithReturn(definition.body)) {
      this._lintCheck(
        definition.startPos, definition.endPos,
        'function-should-have-return', [definition.name.value]
      );
    }

    /* Add parameters as local names */
    for (let parameter of definition.parameters) {
      this._symtable.addNewLocalName(parameter, LocalParameter);
    }

    /* Lint body */
    this._lintStmtBlock(definition.body, true /* allowReturn */);

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
        return this._lintStmtBlock(statement, false /* !allowReturn */);
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
        this._lintCheck(
          statement.startPos, statement.endPos,
          'return-statement-not-allowed-here', []
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
    this._lintStmtForeachPattern(statement.pattern);
    this._lintExpression(statement.range);
    for (let variable of statement.pattern.boundVariables) {
      this._symtable.addNewLocalName(variable, LocalIndex);
    }
    this._lintStatement(statement.body);
    for (let variable of statement.pattern.boundVariables) {
      this._symtable.removeLocalName(variable);
    }
  }

  _lintStmtForeachPattern(pattern) {
    /* If "DestructuringForeach" is disabled, forbid complex patterns.
     * Allow only variable patterns (indices). */
    if (pattern.tag !== N_PatternVariable) {
      this._lintCheck(
        pattern.startPos, pattern.endPos,
        'forbidden-extension-destructuring-foreach', []
      );
    }

    /* Check that the pattern itself is well-formed */
    this._lintPattern(pattern);

    /* The pattern in a foreach cannot be an event */
    let patternType = this._patternType(pattern);
    if (patternType === i18n('TYPE:Event')) {
      this._lintCheck(
        pattern.startPos, pattern.endPos,
        'patterns-in-foreach-must-not-be-events', []
      );
    }
  }

  _lintStmtWhile(statement) {
    this._lintExpression(statement.condition);
    this._lintStatement(statement.body);
  }

  _lintStmtSwitch(statement) {
    this._lintExpression(statement.subject);
    this._lintSwitchBranches(
      statement.branches,
      false /* !isInteractiveProgram */
    );
  }

  _lintSwitchBranches(branches, isInteractiveProgram) {
    this._lintBranches(branches, isInteractiveProgram, false /* isMatching */);
  }

  _lintBranches(branches, isInteractiveProgram, isMatching) {
    /* Check that each pattern is well-formed */
    for (let branch of branches) {
      this._lintPattern(branch.pattern);
    }

    this._branchesCheckWildcardAndVariable(branches);
    this._branchesCheckNoRepeats(branches);
    this._branchesCheckCompatible(branches);
    if (isInteractiveProgram) {
      this._branchesCheckTypeEvent(branches);
    } else {
      this._branchesCheckTypeNotEvent(branches);
    }

    /* Lint recursively each branch */
    for (let branch of branches) {
      this._lintBranchBody(branch, isMatching);
    }
  }

  /* Check that there is at most one wildcard/variable pattern at the end */
  _branchesCheckWildcardAndVariable(branches) {
    let i = 0;
    const n = branches.length;
    for (let branch of branches) {
      if (branch.pattern.tag === N_PatternWildcard && i !== n - 1) {
        this._lintCheck(
          branch.pattern.startPos, branch.pattern.endPos,
          'wildcard-pattern-should-be-last', []
        );
      }
      if (branch.pattern.tag === N_PatternVariable && i !== n - 1) {
        this._lintCheck(
          branch.pattern.startPos, branch.pattern.endPos,
          'variable-pattern-should-be-last', [branch.pattern.variableName.value]
        );
      }
      i++;
    }
  }

  /* Check that there are no repeated constructors in a sequence
   * of branches. */
  _branchesCheckNoRepeats(branches) {
    let coveredNumbers = {};
    let coveredConstructors = {};
    let coveredTuples = {};
    let coveredTimeout = false;
    for (let branch of branches) {
      switch (branch.pattern.tag) {
        case N_PatternWildcard: case N_PatternVariable:
          /* Already checked in _switchBranchesCheckWildcardAndVariable */
          break;
        case N_PatternNumber:
          let number = branch.pattern.number.value;
          if (number in coveredNumbers) {
            this._lintCheck(
              branch.pattern.startPos, branch.pattern.endPos,
              'numeric-pattern-repeats-number', [number]
            );
          }
          coveredNumbers[number] = true;
          break;
        case N_PatternStructure:
          let constructorName = branch.pattern.constructorName.value;
          if (constructorName in coveredConstructors) {
            this._lintCheck(
              branch.pattern.startPos, branch.pattern.endPos,
              'structure-pattern-repeats-constructor', [constructorName]
            );
          }
          coveredConstructors[constructorName] = true;
          break;
        case N_PatternTuple:
          let arity = branch.pattern.boundVariables.length;
          if (arity in coveredTuples) {
            this._lintCheck(
              branch.pattern.startPos, branch.pattern.endPos,
              'structure-pattern-repeats-tuple-arity', [arity]
            );
          }
          coveredTuples[arity] = true;
          break;
        case N_PatternTimeout:
          if (coveredTimeout) {
            this._lintCheck(
              branch.pattern.startPos, branch.pattern.endPos,
              'structure-pattern-repeats-timeout', []
            );
          }
          coveredTimeout = true;
          break;
        default:
          throw Error(
                  'Linter: pattern "'
                + Symbol.keyFor(branch.pattern.tag)
                + '" not implemented.'
                );
      }
    }
  }

  /* Check that constructors are compatible,
   * i.e. that they belong to the same type */
  _branchesCheckCompatible(branches) {
    let expectedType = null;
    for (let branch of branches) {
      let patternType = this._patternType(branch.pattern);
      if (expectedType === null) {
        expectedType = patternType;
      } else if (patternType !== null && expectedType !== patternType) {
        this._lintCheck(
          branch.pattern.startPos, branch.pattern.endPos,
          'pattern-does-not-match-type', [
            i18n('<pattern-type>')(expectedType),
            i18n('<pattern-type>')(patternType)
          ]
        );
      }
    }
  }

  /* Check that there are patterns are of type Event */
  _branchesCheckTypeEvent(branches) {
    for (let branch of branches) {
      let patternType = this._patternType(branch.pattern);
      if (patternType !== null && patternType !== i18n('TYPE:Event')) {
        this._lintCheck(
          branch.pattern.startPos, branch.pattern.endPos,
          'patterns-in-interactive-program-must-be-events', []
        );
      }
      if (branch.pattern.tag === N_PatternVariable) {
        this._lintCheck(
          branch.pattern.startPos, branch.pattern.endPos,
          'patterns-in-interactive-program-cannot-be-variables', []
        );
      }
    }
  }

  /* Check that there are no patterns of type Event */
  _branchesCheckTypeNotEvent(branches) {
    for (let branch of branches) {
      let patternType = this._patternType(branch.pattern);
      if (patternType === i18n('TYPE:Event')) {
        this._lintCheck(
          branch.pattern.startPos, branch.pattern.endPos,
          'patterns-in-switch-must-not-be-events', []
        );
      }
    }
  }

  /* Recursively lint the body of each branch. Locally bind variables. */
  _lintBranchBody(branch, isMatching) {
    for (let variable of branch.pattern.boundVariables) {
      this._symtable.addNewLocalName(variable, LocalParameter);
    }
    if (isMatching) {
      this._lintExpression(branch.body);
    } else {
      this._lintStatement(branch.body);
    }
    for (let variable of branch.pattern.boundVariables) {
      this._symtable.removeLocalName(variable);
    }
  }

  /* Return a description of the type of a pattern */
  _patternType(pattern) {
    switch (pattern.tag) {
      case N_PatternWildcard: case N_PatternVariable:
        return null;
      case N_PatternNumber:
        return i18n('TYPE:Integer');
      case N_PatternStructure:
        return this._symtable.constructorType(pattern.constructorName.value);
      case N_PatternTuple:
        return '_TUPLE_' + pattern.boundVariables.length.toString();
      case N_PatternTimeout:
        return i18n('TYPE:Event');
      default:
        throw Error(
                'Linter: pattern "'
              + Symbol.keyFor(pattern.tag)
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
        this._lintCheck(
          variable.startPos, variable.endPos,
          'repeated-variable-in-tuple-assignment', [variable.value]
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
        this._lintCheck(
          statement.startPos, statement.endPos,
          'constructor-used-as-procedure', [
            name,
            this._symtable.constructorType(name)
          ]
        );
      } else {
        this._lintCheck(
          statement.startPos, statement.endPos,
          'undefined-procedure', [name]
        );
      }
    }

    /* Check that the number of argument coincides */
    let expected = this._symtable.procedureParameters(name).length;
    let received = statement.args.length;
    if (expected !== received) {
      this._lintCheck(
        statement.startPos, statement.endPos,
        'procedure-arity-mismatch', [
          name,
          expected,
          received
        ]
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
      case N_PatternVariable:
        return this._lintPatternVariable(pattern);
      case N_PatternNumber:
        return this._lintPatternNumber(pattern);
      case N_PatternStructure:
        return this._lintPatternStructure(pattern);
      case N_PatternTuple:
        return this._lintPatternTuple(pattern);
      case N_PatternTimeout:
        return this._lintPatternTimeout(pattern);
      default:
        throw Error(
                'Linter: pattern "'
               + Symbol.keyFor(pattern.tag)
               + '" not implemented.'
              );
    }
  }

  _lintPatternWildcard(pattern) {
    /* No restrictions */
  }

  _lintPatternVariable(pattern) {
    /* No restrictions */
  }

  _lintPatternNumber(pattern) {
    /* No restrictions */
  }

  _lintPatternStructure(pattern) {
    let name = pattern.constructorName.value;

    /* Check that the constructor exists */
    if (!this._symtable.isConstructor(name)) {
      this._failExpectedConstructorButGot(    // throws
          pattern.startPos, pattern.endPos, name
      );
      return;
    }

    /* Check that the number of parameters match.
     * Note: constructor patterns with 0 arguments are always allowed.
     */
    let expected = this._symtable.constructorFields(name).length;
    let received = pattern.boundVariables.length;
    if (received > 0 && expected !== received) {
      this._lintCheck(
        pattern.startPos, pattern.endPos,
        'structure-pattern-arity-mismatch', [
          name,
          expected,
          received
        ]
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
      case N_ExprChoose:
        return this._lintExprChoose(expression);
      case N_ExprMatching:
        return this._lintExprMatching(expression);
      case N_ExprList:
        return this._lintExprList(expression);
      case N_ExprRange:
        return this._lintExprRange(expression);
      case N_ExprTuple:
        return this._lintExprTuple(expression);
      case N_ExprStructure:
        return this._lintExprStructure(expression);
      case N_ExprStructureUpdate:
        return this._lintExprStructureUpdate(expression);
      case N_ExprFunctionCall:
        return this._lintExprFunctionCall(expression);
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

  _lintExprChoose(expression) {
    this._lintExpression(expression.condition);
    this._lintExpression(expression.trueExpr);
    this._lintExpression(expression.falseExpr);
  }

  _lintExprMatching(expression) {
    this._lintExpression(expression.subject);
    this._lintMatchingBranches(expression.branches);
  }

  _lintMatchingBranches(branches) {
    this._lintBranches(
      branches,
      false /* !isInteractiveProgram */,
      true /* isMatching */
    );
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

  _lintExprStructure(expression) {
    this._lintExprStructureOrUpdate(expression, null);
  }

  _lintExprStructureUpdate(expression) {
    this._lintExprStructureOrUpdate(expression, expression.original);
  }

  /* Check a structure construction: C(x1 <- e1, ..., xN <- eN)
   * or a structure update: C(original | x1 <- e1, ..., xN <- eN).
   *
   * If original is null, it is a structure construction.
   * If original is not null, it is the updated expression.
   * */
  _lintExprStructureOrUpdate(expression, original) {
    /* Check that constructor exists */
    let constructorName = expression.constructorName.value;
    if (!this._symtable.isConstructor(constructorName)) {
      this._failExpectedConstructorButGot(    // throws
        expression.startPos, expression.endPos, constructorName
      );
      return;
    }

    this._checkStructureTypeNotEvent(constructorName, expression);
    this._checkStructureNoRepeatedFields(constructorName, expression);
    this._checkStructureBindingsCorrect(constructorName, expression);

    /* If it is a structure construction, check that the fields are complete */
    if (original === null) {
      this._checkStructureBindingsComplete(constructorName, expression);
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

  /* Check that there are no repeated fields in a structure
   * construction/update */
  _checkStructureNoRepeatedFields(constructorName, expression) {
    let declaredFields = expression.fieldNames();
    let seen = {};
    for (let fieldName of declaredFields) {
      if (fieldName in seen) {
        this._lintCheck(
          expression.startPos, expression.endPos,
          'structure-construction-repeated-field', [
           constructorName,
           fieldName
          ]
        );
      }
      seen[fieldName] = true;
    }
  }

  /* Check that all bindings in a structure construction/update
   * correspond to existing fields */
  _checkStructureBindingsCorrect(constructorName, expression) {
    let declaredFields = expression.fieldNames();
    let constructorFields = this._symtable.constructorFields(constructorName);
    for (let fieldName of declaredFields) {
      if (constructorFields.indexOf(fieldName) === -1) {
        this._lintCheck(
          expression.startPos, expression.endPos,
          'structure-construction-invalid-field', [
           constructorName,
           fieldName
          ]
        );
      }
    }
  }

  /* Check that bindings in a structure construction/update
   * cover all existing fields */
  _checkStructureBindingsComplete(constructorName, expression) {
    let declaredFields = expression.fieldNames();
    let constructorFields = this._symtable.constructorFields(constructorName);
    for (let fieldName of constructorFields) {
      if (declaredFields.indexOf(fieldName) === -1) {
        this._lintCheck(
          expression.startPos, expression.endPos,
          'structure-construction-missing-field', [
           constructorName,
           fieldName
          ]
        );
      }
    }
  }

  /* Check that a structure construction/update does not involve
   * constructors of the Event type, which should only be
   * handled implicitly in an interactive program. */
  _checkStructureTypeNotEvent(constructorName, expression) {
    let constructorType = this._symtable.constructorType(constructorName);
    if (constructorType === i18n('TYPE:Event')) {
      this._lintCheck(
        expression.startPos, expression.endPos,
        'structure-construction-cannot-be-an-event', [constructorName]
      );
    }
  }

  _lintExprFunctionCall(expression) {
    /* Check that it is a function or a field */
    let name = expression.functionName.value;
    if (!this._symtable.isFunction(name) && !this._symtable.isField(name)) {
      this._lintCheck(
        expression.startPos, expression.endPos,
        'undefined-function', [name]
      );
    }

    /* Check that the number of argument coincides */
    let expected;
    if (this._symtable.isFunction(name)) {
      expected = this._symtable.functionParameters(name).length;
    } else {
      /* Fields always have exactly one parameter */
      expected = 1;
    }
    let received = expression.args.length;
    if (expected !== received) {
      this._lintCheck(
        expression.startPos, expression.endPos,
        'function-arity-mismatch', [
          name,
          expected,
          received
        ]
      );
    }

    /* Recursively check arguments */
    for (let argument of expression.args) {
      this._lintExpression(argument);
    }
  }

  _disableRecursion(ast) {
    if (this._enabledLinterChecks['forbidden-extension-allow-recursion']) {
      let cycle = new RecursionChecker().callCycle(ast);
      if (cycle !== null) {
        this._lintCheck(
          cycle[0].location.startPos, cycle[0].location.endPos,
          'forbidden-extension-allow-recursion', [cycle]
        );
      }
    }
  }

  /* Throw a syntax error indicating that we expected the name of a
   * constructor, but we got a name which is not a constructor.
   *
   * If the name is a type or a procedure, provide a more helpful
   * error message. (Coinciding constructor and procedure names are
   * not forbidden, but it is probably a mistake). */
  _failExpectedConstructorButGot(startPos, endPos, name) {
    if (this._symtable.isType(name)) {
      this._lintCheck(
        startPos, endPos,
        'type-used-as-constructor', [
          name,
          this._symtable.typeConstructors(name)
        ]
      );
    } else if (this._symtable.isProcedure(name)) {
      this._lintCheck(
        startPos, endPos,
        'procedure-used-as-constructor', [name]
      );
    } else {
      this._lintCheck(
        startPos, endPos,
        'undeclared-constructor', [name]
      );
    }
  }

}

