
import { Parser } from './parser';
import { Linter } from './linter';
import { SymbolTable } from './symtable';
import { Compiler } from './compiler';
import { RuntimePrimitives } from './runtime';
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
  }

  /* Parse, compile, and run a program */
  run(input) {
    let ast = new Parser(input).parse();
    let symtable = new Linter(this._newSymtableWithPrimitives()).lint(ast);
    let code = new Compiler(symtable).compile(ast);
    let vm = new VirtualMachine(code);
    return vm.run();
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
      )
    }
    return new ASTDefType(tok(T_UPPERID, type), constructorDeclarations);
  }

  _astDefProcedure(primitives, procedureName) {
    let nargs = primitives.getOperation(procedureName).nargs();
    let parameters = [];
    for (let i = 1; i <= nargs; i++) {
      parameters.push(tok(T_LOWERID, 'x' + i.toString()))
    }
    return new ASTDefProcedure(
        tok(T_LOWERID, procedureName),
        parameters,
        new ASTStmtBlock([])
    )
  }

  _astDefFunction(primitives, functionName) {
    let nargs = primitives.getOperation(functionName).nargs();
    let parameters = [];
    for (let i = 1; i <= nargs; i++) {
      parameters.push(tok(T_LOWERID, 'x' + i.toString()))
    }
    return new ASTDefFunction(
        tok(T_LOWERID, functionName),
        parameters,
        new ASTStmtBlock([])
    )
  }

  _astConstructorDeclaration(primitives, type, constructor) {
    let fields = [];
    for (let field of primitives.constructorFields(type, constructor)) {
      fields.push(tok(T_LOWERID, field));
    }
    return new ASTConstructorDeclaration(tok(T_UPPERID, constructor), fields);
  }

}

