import { UnknownPosition } from './reader';

/* AST node tags are constant symbols */
export const N_ProgramDeclaration = Symbol.for('N_ProgramDeclaration');
export const N_ProcedureDeclaration = Symbol.for('N_ProcedureDeclaration');
export const N_Block = Symbol.for('N_Block');

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

export class ASTProgramDeclaration extends ASTNode {
  constructor(block) {
    super(N_ProgramDeclaration, [block]);
  }
}

export class ASTProcedureDeclaration extends ASTNode {
  constructor(name, parameterList, block) {
    super(N_ProcedureDeclaration, [name, parameterList, block]);
  }
}

export class ASTFunctionDeclaration extends ASTNode {
  constructor(name, parameterList, block) {
    super(N_ProcedureDeclaration, [name, parameterList, block]);
  }
}

export class ASTBlock extends ASTNode {
  constructor(statements) {
    super(N_Block, statements);
  }
}

