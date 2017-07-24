import { UnknownPosition } from './reader';

/* Definitions */
export const N_DefProgram = Symbol.for('N_DefProgram');
export const N_DefProcedure = Symbol.for('N_DefProcedure');
export const N_DefFunction = Symbol.for('N_DefFunction');
/* Statements */
export const N_StmtBlock = Symbol.for('N_StmtBlock');
export const N_StmtReturn = Symbol.for('N_StmtReturn');
export const N_StmtIf = Symbol.for('N_StmtIf');
export const N_StmtRepeat = Symbol.for('N_StmtRepeat');
export const N_StmtForeach = Symbol.for('N_StmtForeach');
export const N_StmtWhile = Symbol.for('N_StmtWhile');
export const N_StmtSwitch = Symbol.for('N_StmtSwitch');
export const N_StmtAssignVariable = Symbol.for('N_StmtAssignVariable');
export const N_StmtAssignTuple = Symbol.for('N_StmtAssignTuple');
export const N_StmtProcedureCall = Symbol.for('N_StmtProcedureCall');
/* Patterns */
export const N_PatternWildcard = Symbol.for('N_PatternWildcard');
export const N_PatternConstructor = Symbol.for('N_PatternConstructor');
export const N_PatternTuple = Symbol.for('N_PatternTuple');
/* Expressions */
export const N_ExprVariable = Symbol.for('N_ExprVariable');
export const N_ExprConstantNumber = Symbol.for('N_ExprConstantNumber');
export const N_ExprConstantString = Symbol.for('N_ExprConstantString');
export const N_ExprList = Symbol.for('N_ExprList');
export const N_ExprTuple = Symbol.for('N_ExprTuple');
export const N_ExprConstructor = Symbol.for('N_ExprConstructor');
export const N_ExprConstructorUpdate = Symbol.for('N_ExprConstructorUpdate');
export const N_ExprAnd = Symbol.for('N_ExprAnd');
export const N_ExprOr = Symbol.for('N_ExprOr');
export const N_ExprFunctionCall = Symbol.for('N_ExprFunctionCall');
/* SwitchBranch: pattern -> body */
export const N_SwitchBranch = Symbol.for('N_SwitchBranch');
/* FieldValue: field <- value */
export const N_FieldValue = Symbol.for('N_FieldValue');

/* An instance of ASTNode represents a node of the abstract syntax tree.
 * - tag should be a node tag symbol.
 * - children should be (recursively) a possibly empty array of ASTNode's.
 * - startPos and endPos represent the starting and ending
 *   position of the code fragment in the source code, to aid error
 *   reporting.
 */
export class ASTNode {
  constructor(tag, children) {
    this._tag = tag;
    this._children = children;
    this._startPos = UnknownPosition;
    this._endPos = UnknownPosition;

    // Assert this invariant to protect against a common mistake
    // in the interpreter.
    if (!(children instanceof Array)) {
      throw Error('The children of an ASTNode should be an array.');
    }
  }

  get tag() {
    return this._tag;
  }

  get children() {
    return this._children;
  }

  set startPos(position) {
    this._startPos = position;
  }

  get startPos() {
    return this._startPos;
  }

  set endPos(position) {
    this._endPos = position;
  }

  get endPos() {
    return this._endPos;
  }
}

export class ASTDefProgram extends ASTNode {
  constructor(body) {
    super(N_DefProgram, [body]);
  }

  get body() {
    return this.children[0];
  }
}

export class ASTDefProcedure extends ASTNode {
  constructor(name, parameters, body) {
    super(N_DefProcedure, [name, parameters, body]);
  }

  get body() {
    return this.children[2];
  }
}

export class ASTDefFunction extends ASTNode {
  constructor(name, parameters, body) {
    super(N_DefFunction, [name, parameters, body]);
  }

  get body() {
    return this.children[2];
  }
}

/* Statements */

export class ASTStmtBlock extends ASTNode {
  constructor(statements) {
    super(N_StmtBlock, statements);
  }

  get statements() {
    return this.children;
  }
}

export class ASTStmtReturn extends ASTNode {
  constructor(result) {
    super(N_StmtReturn, [result]);
  }

  get result() {
    return this.children[0];
  }
}

export class ASTStmtIf extends ASTNode {
  // Note: elseBlock may be null
  constructor(condition, thenBlock, elseBlock) {
    super(N_StmtIf, [condition, thenBlock, elseBlock]);
  }
}

export class ASTStmtRepeat extends ASTNode {
  constructor(times, body) {
    super(N_StmtRepeat, [times, body]);
  }
}

export class ASTStmtForeach extends ASTNode {
  constructor(index, range, body) {
    super(N_StmtForeach, [index, range, body]);
  }
}

export class ASTStmtWhile extends ASTNode {
  constructor(condition, body) {
    super(N_StmtWhile, [condition, body]);
  }
}

export class ASTStmtSwitch extends ASTNode {
  constructor(subject, branches) {
    super(N_StmtSwitch, [subject, branches]);
  }
}

export class ASTSwitchBranch extends ASTNode {
  constructor(pattern, body) {
    super(N_SwitchBranch, [pattern, body]);
  }
}

export class ASTStmtAssignVariable extends ASTNode {
  constructor(variable, value) {
    super(N_StmtAssignVariable, [variable, value]);
  }

  get value() {
    return this._children[1];
  }
}

export class ASTStmtAssignTuple extends ASTNode {
  constructor(variables, value) {
    super(N_StmtAssignTuple, [variables, value]);
  }
}

export class ASTStmtProcedureCall extends ASTNode {
  constructor(procedureName, args) {
    super(N_StmtProcedureCall, [procedureName, args]);
  }
}

/* Patterns */

export class ASTPatternWildcard extends ASTNode {
  constructor() {
    super(N_PatternWildcard, []);
  }
}

export class ASTPatternConstructor extends ASTNode {
  constructor(constructor, parameters) {
    super(N_PatternConstructor, [constructor, parameters]);
  }
}

export class ASTPatternTuple extends ASTNode {
  constructor(parameters) {
    super(N_PatternTuple, parameters);
  }
}

/* Expressions */

export class ASTExprVariable extends ASTNode {
  constructor(variableName) {
    super(N_ExprVariable, [variableName]);
  }

  get variableName() {
    return this._children[0];
  }
}

export class ASTExprConstantNumber extends ASTNode {
  constructor(number) {
    super(N_ExprConstantNumber, [number]);
  }
}

export class ASTExprConstantString extends ASTNode {
  constructor(string) {
    super(N_ExprConstantString, [string]);
  }
}

export class ASTExprList extends ASTNode {
  constructor(expressions) {
    super(N_ExprList, expressions);
  }
}

export class ASTExprTuple extends ASTNode {
  constructor(expressions) {
    super(N_ExprTuple, expressions);
  }

  get expressions() {
    return this.children;
  }
}

export class ASTExprConstructor extends ASTNode {
  constructor(constructorName, fieldValues) {
    super(N_ExprConstructor, [constructorName, fieldValues]);
  }

  get fieldValues() {
    return this._children[1];
  }
}

export class ASTExprConstructorUpdate extends ASTNode {
  constructor(constructorName, original, fieldValues) {
    super(N_ExprConstructorUpdate, [constructorName, original, fieldValues]);
  }
}

export class ASTFieldValue extends ASTNode {
  constructor(fieldName, value) {
    super(N_FieldValue, [fieldName, value]);
  }
}

export class ASTExprAnd extends ASTNode {
  constructor(constructorName, arg1, arg2) {
    super(N_ExprAnd, [arg1, arg2]);
  }
}

export class ASTExprOr extends ASTNode {
  constructor(constructorName, arg1, arg2) {
    super(N_ExprOr, [arg1, arg2]);
  }
}

export class ASTExprFunctionCall extends ASTNode {
  constructor(functionName, args) {
    super(N_ExprFunctionCall, [functionName, args]);
  }
}

