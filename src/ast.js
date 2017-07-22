import { UnknownPosition } from './reader';

/* AST node tags are constant symbols */
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
export const N_StmtSwitchBranch = Symbol.for('N_StmtSwitchBranch');
export const N_StmtLet = Symbol.for('N_StmtLet');
export const N_StmtProcedureCall = Symbol.for('N_StmtProcedureCall');
/* Expressions */
export const N_ExprVariable = Symbol.for('N_ExprVariable');
export const N_ExprTuple = Symbol.for('N_ExprTuple');

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
  constructor(name, parameterList, body) {
    super(N_DefProcedure, [name, parameterList, body]);
  }

  get body() {
    return this.children[2];
  }
}

export class ASTDefFunction extends ASTNode {
  constructor(name, parameterList, body) {
    super(N_DefFunction, [name, parameterList, body]);
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

export class ASTStmtSwitchBranch extends ASTNode {
  constructor(pattern, body) {
    super(N_StmtSwitchBranch, [pattern, body]);
  }
}

export class ASTStmtLet extends ASTNode {
  constructor(lhs, condition) {
    super(N_StmtLet, [lhs, expression]);
  }
}

export class ASTStmtProcedureCall extends ASTNode {
  constructor(procedureName, args) {
    super(N_StmtProcedureCall, [procedureName, args]);
  }
}

/* Expressions */

export class ASTExprVariable extends ASTNode {
  constructor(variableName) {
    super(N_ExprVariable, [variableName]);
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

