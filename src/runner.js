
import { Parser } from './parser';
import { Linter } from './linter';
import { SymbolTable } from './symtable';
import { Compiler } from './compiler';
import { RuntimePrimitives, RuntimeState } from './runtime';
import { VirtualMachine } from './vm';

import { UnknownPosition } from './reader';
import {
  T_UPPERID,
  T_LOWERID,
  Token,
} from './token';
import {
  ASTDefProcedure,
  ASTDefFunction,
  ASTDefType,
  ASTStmtBlock,
  ASTConstructorDeclaration,
} from './ast';

/* This module is a façade for all the combined functionality of the
 * parser/compiler/vm
 */

function tok(tag, value) {
  return new Token(tag, value, UnknownPosition, UnknownPosition);
}

export class Runner {

  constructor() {
    this.initialize();
  }

  initialize() {
    this._ast = null;
    this._primitives = new RuntimePrimitives();
    this._symtable = this._newSymtableWithPrimitives();
    this._linter = new Linter(this._symtable);
    this._code = null;
    this._vm = null;
    this._result = null;
  }

  /* Parse, compile, and run a program in the default global state
   * (typically an empty 9x9 board in Gobstones).
   * Return the return value of the program, ignoring the final state.
   * A GbsInterpreterException may be thrown.
   */
  run(input) {
    return this.runState(input, new RuntimeState()).result;
  }

  /* Parse, compile, and run a program in the given initial state.
   * Return an object of the form
   *   {'result': r, 'state': s]
   * where r is the result of the program and s is the final state.
   * A GbsInterpreterException may be thrown.
   */
  runState(input, initialState) {
    this.parse(input);
    this.lint();
    this.compile();
    this.execute(initialState);
    return {'result': this._result, 'state': this._vm.globalState()};
  }

  parse(input) {
    let parser = new Parser(input);
    this._ast = parser.parse();

    for (let option of parser.getLanguageOptions()) {
      this._setLanguageOption(option);
    }
  }

  enableLintCheck(linterCheckId, enabled) {
    this._linter.enableCheck(linterCheckId, enabled);
  }

  lint() {
    this._symtable = this._linter.lint(this._ast);
  }

  compile() {
    this._code = new Compiler(this._symtable).compile(this._ast);
  }

  initializeVirtualMachine(initialState) {
    this._vm = new VirtualMachine(this._code, initialState);
  }

  execute(initialState) {
    this.executeWithTimeout(initialState, 0);
  }

  executeWithTimeout(initialState, millisecs) {
    this.executeWithTimeoutTakingSnapshots(initialState, millisecs, null);
  }

  executeWithTimeoutTakingSnapshots(initialState, millisecs, snapshotCallback) {
    this.initializeVirtualMachine(initialState);
    this._result = this._vm.runWithTimeoutTakingSnapshots(
      millisecs, snapshotCallback
    );
  }

  executeEventWithTimeout(eventValue, millisecs) {
    this._result = this._vm.runEventWithTimeout(eventValue, millisecs);
  }

  get abstractSyntaxTree() {
    return this._ast;
  }

  get primitives() {
    return this._primitives;
  }

  get symbolTable() {
    return this._symtable;
  }

  get virtualMachineCode() {
    return this._code;
  }

  get result() {
    return this._result;
  }

  get globalState() {
    return this._vm.globalState();
  }

  /* Evaluate language options set by the LANGUAGE pragma */
  _setLanguageOption(option) {
    if (option === 'DestructuringForeach') {
      this.enableLintCheck('forbidden-extension-destructuring-foreach', false);
    } else {
      throw Error('Unknown language option: ' + option);
    }
  }

  /* Dynamic stack of regions */
  regionStack() {
    return this._vm.regionStack();
  }

  /* Create a new symbol table, including definitions for all the primitive
   * types and operations (which come from RuntimePrimitives) */
  _newSymtableWithPrimitives() {
    let symtable = new SymbolTable();

    /* Populate symbol table with primitive types */
    for (let type of this._primitives.types()) {
      symtable.defType(this._astDefType(type));
    }

    /* Populate symbol table with primitive procedures */
    for (let procedureName of this._primitives.procedures()) {
      symtable.defProcedure(this._astDefProcedure(procedureName));
    }

    /* Populate symbol table with primitive functions */
    for (let functionName of this._primitives.functions()) {
      symtable.defFunction(this._astDefFunction(functionName));
    }

    return symtable;
  }

  _astDefType(type) {
    let constructorDeclarations = [];
    for (let constructor of this._primitives.typeConstructors(type)) {
      constructorDeclarations.push(
        this._astConstructorDeclaration(type, constructor)
      );
    }
    return new ASTDefType(tok(T_UPPERID, type), constructorDeclarations);
  }

  _astDefProcedure(procedureName) {
    let nargs = this._primitives.getOperation(procedureName).nargs();
    let parameters = [];
    for (let i = 1; i <= nargs; i++) {
      parameters.push(tok(T_LOWERID, 'x' + i.toString()));
    }
    return new ASTDefProcedure(
        tok(T_LOWERID, procedureName),
        parameters,
        new ASTStmtBlock([])
    );
  }

  _astDefFunction(functionName) {
    let nargs = this._primitives.getOperation(functionName).nargs();
    let parameters = [];
    for (let i = 1; i <= nargs; i++) {
      parameters.push(tok(T_LOWERID, 'x' + i.toString()));
    }
    return new ASTDefFunction(
        tok(T_LOWERID, functionName),
        parameters,
        new ASTStmtBlock([])
    );
  }

  _astConstructorDeclaration(type, constructor) {
    let fields = [];
    for (let field of this._primitives.constructorFields(type, constructor)) {
      fields.push(tok(T_LOWERID, field));
    }
    return new ASTConstructorDeclaration(tok(T_UPPERID, constructor), fields);
  }

}

