
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
    /* These are set after running a program once */
    this._ast = null;
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
    this._ast = new Parser(input).parse();
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

  execute(initialState) {
    this._vm = new VirtualMachine(this._code, initialState);
    this._result = this._vm.run();
  }

  get abstractSyntaxTree() {
    return this._ast;
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

  /* Create a new symbol table, including definitions for all the primitive
   * types and operations (which come from RuntimePrimitives) */
  _newSymtableWithPrimitives() {
    let symtable = new SymbolTable();

    let primitives = new RuntimePrimitives();

    /* Populate symbol table with primitive types */
    for (let type of primitives.types()) {
      symtable.defType(this._astDefType(primitives, type));
    }

    /* Populate symbol table with primitive procedures */
    for (let procedureName of primitives.procedures()) {
      symtable.defProcedure(this._astDefProcedure(primitives, procedureName));
    }

    /* Populate symbol table with primitive functions */
    for (let functionName of primitives.functions()) {
      symtable.defFunction(this._astDefFunction(primitives, functionName));
    }

    return symtable;
  }

  _astDefType(primitives, type) {
    let constructorDeclarations = [];
    for (let constructor of primitives.typeConstructors(type)) {
      constructorDeclarations.push(
        this._astConstructorDeclaration(primitives, type, constructor)
      );
    }
    return new ASTDefType(tok(T_UPPERID, type), constructorDeclarations);
  }

  _astDefProcedure(primitives, procedureName) {
    let nargs = primitives.getOperation(procedureName).nargs();
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

  _astDefFunction(primitives, functionName) {
    let nargs = primitives.getOperation(functionName).nargs();
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

  _astConstructorDeclaration(primitives, type, constructor) {
    let fields = [];
    for (let field of primitives.constructorFields(type, constructor)) {
      fields.push(tok(T_LOWERID, field));
    }
    return new ASTConstructorDeclaration(tok(T_UPPERID, constructor), fields);
  }

}

