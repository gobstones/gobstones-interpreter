
import { visitAST } from './ast';

/* A semantic analyzer receives
 *   a global environment (instance of GlobalEnvironment)
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

  constructor(globalEnvironment, ast) {
    this._globalEnvironment = globalEnvironment;
    this._ast = ast;
  }

  lint() {
    visitAST(this._visitNode, this._ast);
  }

  /* Visit a single node of the AST */
  _visitNode(ast) {
    console.log(ast);
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

