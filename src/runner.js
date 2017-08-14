
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
  ASTDefType,
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
    for (let type of primitives.types()) {
      symtable.defType(this._astDefType(primitives, type));
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

  _astConstructorDeclaration(primitives, type, constructor) {
    let fields = [];
    for (let field of primitives.constructorFields(type, constructor)) {
      fields.push(tok(T_LOWERID, field));
    }
    return new ASTConstructorDeclaration(tok(T_UPPERID, constructor), fields);
  }

}

