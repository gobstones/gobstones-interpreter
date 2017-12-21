import { UnknownPosition } from './reader';
import { Token } from './token';

export const N_Main = Symbol.for('N_Main');
/* Definitions */
export const N_DefProgram = Symbol.for('N_DefProgram');
export const N_DefInteractiveProgram = Symbol.for('N_DefInteractiveProgram');
export const N_DefProcedure = Symbol.for('N_DefProcedure');
export const N_DefFunction = Symbol.for('N_DefFunction');
export const N_DefType = Symbol.for('N_DefType');
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
export const N_PatternNumber = Symbol.for('N_PatternNumber');
export const N_PatternStructure = Symbol.for('N_PatternStructure');
export const N_PatternTuple = Symbol.for('N_PatternTuple');
export const N_PatternTimeout = Symbol.for('N_PatternTimeout');
/* Expressions */
export const N_ExprVariable = Symbol.for('N_ExprVariable');
export const N_ExprConstantNumber = Symbol.for('N_ExprConstantNumber');
export const N_ExprConstantString = Symbol.for('N_ExprConstantString');
export const N_ExprList = Symbol.for('N_ExprList');
export const N_ExprRange = Symbol.for('N_ExprRange');
export const N_ExprTuple = Symbol.for('N_ExprTuple');
export const N_ExprStructure = Symbol.for('N_ExprStructure');
export const N_ExprStructureUpdate = Symbol.for('N_ExprStructureUpdate');
export const N_ExprFunctionCall = Symbol.for('N_ExprFunctionCall');
/* SwitchBranch: pattern -> body */
export const N_SwitchBranch = Symbol.for('N_SwitchBranch');
/* FieldBinding: fieldName <- value */
export const N_FieldBinding = Symbol.for('N_FieldBinding');
/* ConstructorDeclaration */
export const N_ConstructorDeclaration = Symbol.for('N_ConstructorDeclaration');

/* Helper functions for the ASTNode toString method */

function indent(string) {
  let lines = [];
  for (let line of string.split('\n')) {
    lines.push('  ' + line);
  }
  return lines.join('\n');
}

let showASTs; /* Forward declaration (for ESLint) */

function showAST(node) {
  if (node === null) {
    return 'null';
  } else if (node instanceof Array) {
    return '[\n' + showASTs(node).join(',\n') + '\n]';
  } else if (node instanceof Token) {
    return node.toString();
  } else {
    let tag = Symbol.keyFor(node.tag).substring(2);
    return tag + '(\n' + showASTs(node.children).join(',\n') + '\n)';
  }
}

showASTs = function (nodes) {
  let res = [];
  for (let node of nodes) {
    res.push(indent(showAST(node)));
  }
  return res;
};

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

    /* Assert this invariant to protect against common mistakes. */
    if (!(children instanceof Array)) {
      throw Error('The children of an ASTNode should be an array.');
    }
  }

  toMulangLike() {
    return {
      tag: this._tag.toString().replace(/(^Symbol\(|\)$)/g, ''),
      contents: this._children.map((node) => {
        if (node === null) {
          return 'null';
        } else if (node instanceof Array) {
          return new ASTNode(Symbol('?'), node).toMulangLike().contents;
        } else if (node instanceof ASTNode) {
          return node.toMulangLike();
        } else if (node instanceof Token) {
          return node.toString();
        } else {
          return '?';
        }
      })
    };
  }

  toString() {
    return showAST(this);
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

/* Main */

export class ASTMain extends ASTNode {
  constructor(definitions) {
    super(N_Main, definitions);
  }

  get definitions() {
    return this._children;
  }
}

/* Definitions */

export class ASTDefProgram extends ASTNode {
  constructor(body) {
    super(N_DefProgram, [body]);
  }

  get body() {
    return this.children[0];
  }
}

export class ASTDefInteractiveProgram extends ASTNode {
  constructor(branches) {
    super(N_DefInteractiveProgram, branches);
  }

  get branches() {
    return this.children;
  }
}

export class ASTDefProcedure extends ASTNode {
  constructor(name, parameters, body) {
    super(N_DefProcedure, [name, parameters, body]);
  }

  get name() {
    return this.children[0];
  }

  get parameters() {
    return this.children[1];
  }

  get body() {
    return this.children[2];
  }
}

export class ASTDefFunction extends ASTNode {
  constructor(name, parameters, body) {
    super(N_DefFunction, [name, parameters, body]);
  }

  get name() {
    return this.children[0];
  }

  get parameters() {
    return this.children[1];
  }

  get body() {
    return this.children[2];
  }
}

export class ASTDefType extends ASTNode {
  constructor(typeName, constructorDeclarations) {
    super(N_DefType, [typeName, constructorDeclarations]);
  }

  get typeName() {
    return this._children[0];
  }

  get constructorDeclarations() {
    return this._children[1];
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

  get condition() {
    return this._children[0];
  }

  get thenBlock() {
    return this._children[1];
  }

  get elseBlock() {
    return this._children[2];
  }
}

export class ASTStmtRepeat extends ASTNode {
  constructor(times, body) {
    super(N_StmtRepeat, [times, body]);
  }

  get times() {
    return this._children[0];
  }

  get body() {
    return this._children[1];
  }
}

export class ASTStmtForeach extends ASTNode {
  constructor(index, range, body) {
    super(N_StmtForeach, [index, range, body]);
  }

  get index() {
    return this._children[0];
  }

  get range() {
    return this._children[1];
  }

  get body() {
    return this._children[2];
  }
}

export class ASTStmtWhile extends ASTNode {
  constructor(condition, body) {
    super(N_StmtWhile, [condition, body]);
  }

  get condition() {
    return this._children[0];
  }

  get body() {
    return this._children[1];
  }
}

export class ASTStmtSwitch extends ASTNode {
  constructor(subject, branches) {
    super(N_StmtSwitch, [subject, branches]);
  }

  get subject() {
    return this._children[0];
  }

  get branches() {
    return this._children[1];
  }
}

export class ASTSwitchBranch extends ASTNode {
  constructor(pattern, body) {
    super(N_SwitchBranch, [pattern, body]);
  }

  get pattern() {
    return this._children[0];
  }

  get body() {
    return this._children[1];
  }
}

export class ASTStmtAssignVariable extends ASTNode {
  constructor(variable, value) {
    super(N_StmtAssignVariable, [variable, value]);
  }

  get variable() {
    return this._children[0];
  }

  get value() {
    return this._children[1];
  }
}

export class ASTStmtAssignTuple extends ASTNode {
  constructor(variables, value) {
    super(N_StmtAssignTuple, [variables, value]);
  }

  get variables() {
    return this._children[0];
  }

  get value() {
    return this._children[1];
  }
}

export class ASTStmtProcedureCall extends ASTNode {
  constructor(procedureName, args) {
    super(N_StmtProcedureCall, [procedureName, args]);
  }

  get procedureName() {
    return this._children[0];
  }

  get args() {
    return this._children[1];
  }
}

/* Patterns */

export class ASTPatternWildcard extends ASTNode {
  constructor() {
    super(N_PatternWildcard, []);
  }

  get parameters() {
    return [];
  }
}

export class ASTPatternNumber extends ASTNode {
  constructor(number) {
    super(N_PatternNumber, [number]);
  }

  get number() {
    return this._children[0];
  }

  get parameters() {
    return [];
  }
}

export class ASTPatternStructure extends ASTNode {
  constructor(constructorName, parameters) {
    super(N_PatternStructure, [constructorName, parameters]);
  }

  get constructorName() {
    return this._children[0];
  }

  get parameters() {
    return this._children[1];
  }
}

export class ASTPatternTuple extends ASTNode {
  constructor(parameters) {
    super(N_PatternTuple, parameters);
  }

  get parameters() {
    return this._children;
  }
}

export class ASTPatternTimeout extends ASTNode {
  constructor(timeout) {
    super(N_PatternTimeout, [timeout]);
  }

  get parameters() {
    return [];
  }

  get timeout() {
    return parseInt(this._children[0].value, 10);
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

  get number() {
    return this._children[0];
  }
}

export class ASTExprConstantString extends ASTNode {
  constructor(string) {
    super(N_ExprConstantString, [string]);
  }

  get string() {
    return this._children[0];
  }
}

export class ASTExprList extends ASTNode {
  constructor(elements) {
    super(N_ExprList, elements);
  }

  get elements() {
    return this._children;
  }
}

export class ASTExprRange extends ASTNode {
  // Note: second may be null
  constructor(first, second, last) {
    super(N_ExprRange, [first, second, last]);
  }

  get first() {
    return this._children[0];
  }

  get second() {
    return this._children[1];
  }

  get last() {
    return this._children[2];
  }
}

export class ASTExprTuple extends ASTNode {
  constructor(elements) {
    super(N_ExprTuple, elements);
  }

  get elements() {
    return this.children;
  }
}

export class ASTExprStructure extends ASTNode {
  constructor(constructorName, fieldBindings) {
    super(N_ExprStructure, [constructorName, fieldBindings]);
  }

  get constructorName() {
    return this._children[0];
  }

  get fieldBindings() {
    return this._children[1];
  }

  fieldNames() {
    let names = [];
    for (let fieldBinding of this.fieldBindings) {
      names.push(fieldBinding.fieldName.value);
    }
    return names;
  }
}

export class ASTExprStructureUpdate extends ASTNode {
  constructor(constructorName, original, fieldBindings) {
    super(N_ExprStructureUpdate, [constructorName, original, fieldBindings]);
  }

  get constructorName() {
    return this._children[0];
  }

  get original() {
    return this._children[1];
  }

  get fieldBindings() {
    return this._children[2];
  }

  fieldNames() {
    let names = [];
    for (let fieldBinding of this.fieldBindings) {
      names.push(fieldBinding.fieldName.value);
    }
    return names;
  }
}

export class ASTExprFunctionCall extends ASTNode {
  constructor(functionName, args) {
    super(N_ExprFunctionCall, [functionName, args]);
  }

  get functionName() {
    return this._children[0];
  }

  get args() {
    return this._children[1];
  }
}

export class ASTFieldBinding extends ASTNode {
  constructor(fieldName, value) {
    super(N_FieldBinding, [fieldName, value]);
  }

  get fieldName() {
    return this._children[0];
  }

  get value() {
    return this._children[1];
  }
}

export class ASTConstructorDeclaration extends ASTNode {
  constructor(constructorName, fieldNames) {
    super(N_ConstructorDeclaration, [constructorName, fieldNames]);
  }

  get constructorName() {
    return this._children[0];
  }

  get fieldNames() {
    return this._children[1];
  }
}

