
import {
  N_DefProgram,
  N_DefInteractiveProgram,
  N_DefProcedure,
  N_DefFunction,
  N_DefType,
} from './ast';

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
    this._lint(ast);
    return this._symtable;
  }

  _lint(ast) {
    let dispatch = {
      'N_Main': (ast) => this._lintMain(ast),
    };
    let key = Symbol.keyFor(ast.tag);
    if (key in dispatch) {
      dispatch[key](ast);
    } else {
      throw Error('Lint for AST node "' + key + '" not implemented.');
    }
  }

  _lintMain(ast) {
    /* Add all definitions to the symbol table */
    for (let definition of ast.definitions) {
      switch (definition.tag) {
        case N_DefProgram:
          this._symtable.defProgram(definition);
          break;
        case N_DefInteractiveProgram:
          this._symtable.defInteractiveProgram(definition);
          break;
        case N_DefProcedure:
          this._symtable.defProcedure(definition);
          break;
        case N_DefFunction:
          this._symtable.defFunction(definition);
          break;
        case N_DefType:
          this._symtable.defType(definition);
          break;
        default:
          throw Error('Unknown definition: ' + Symbol.keyFor(definition.tag));
      }
    }
    // Check that there is exactly one program
  }

}

// TODO: 
// - dentro de una función, no se pueden mezclar los roles de
//   + variables
//   + índices
//   + parámetros
//   + campos???
// - el return en una "function" puede devolver varias cosas!!
//   ---es una tupla---
// - el return en un "program" puede devolver varias cosas
// - return en un "interactive program"?
// - en las ramas de un switch / interactive program
//   chequear que:
//   + los patrones sean lineales
//   + haya a lo sumo una ocurrencia de "_" al final de todo

