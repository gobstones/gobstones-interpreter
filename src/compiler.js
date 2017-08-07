import {
  N_Main,
  /* Definitions */
  N_DefProgram,
  N_DefInteractiveProgram,
  N_DefProcedure,
  N_DefFunction,
  N_DefType,
  /* Statements */
  N_StmtBlock,
  N_StmtReturn,
  N_StmtIf,
  N_StmtRepeat,
  N_StmtForeach,
  N_StmtWhile,
  N_StmtSwitch,
  N_StmtAssignVariable,
  N_StmtAssignTuple,
  N_StmtProcedureCall,
  /* Patterns */
  N_PatternWildcard,
  N_PatternConstructor,
  N_PatternTuple,
  N_PatternTimeout,
  /* Expressions */
  N_ExprVariable,
  N_ExprConstantNumber,
  N_ExprConstantString,
  N_ExprList,
  N_ExprRange,
  N_ExprTuple,
  N_ExprConstructor,
  N_ExprConstructorUpdate,
  N_ExprFunctionCall,
  /* SwitchBranch: pattern -> body */
  N_SwitchBranch,
  /* FieldValue: field <- value */
  N_FieldValue,
  /* ConstructorDeclaration */
  N_ConstructorDeclaration,
} from './ast';
import { Code } from './instruction';
import { i18n } from './i18n';

/*
 * A compiler receives
 *   a symbol table (instance of SymbolTable)
 *   an abstract syntax tree (the output of a parser)
 *
 * First the code is linted.
 * It produces an instance of Code, representing code for the
 * virtual machine.
 *
 * The AST is expected to have been linted against the symbol table.
 */
export class Compiler {

  constructor(symtable) {
    this._symtable = symtable;
  }

  compile(ast) {
    _compileMain(ast);
    return this._code;
  }

  _compileMain(ast) {
    /* Compile the program (or interactive program) */
    for (let definition of ast.definitions) {
      if (definition.tag === N_DefProgram) {
        this._compileProgram(definition);
      } else if (definition.tag === N_DefInteractiveProgram) {
        this._compileInteractiveProgram(definition);
      }
    }

    /* Compile procedures and functions */
    for (let definition of ast.definitions) {
      if (definition.tag === N_DefProcedure) {
        this._compileProcedure(definition);
      } else if (definition.tag === N_DefFunction) {
        this._compileFunction(definition);
      }
    }

  }

  _compileProgram(definition) {
    // TODO
  }

  _compileInteractiveProgram(definition) {
    // TODO
  }

  _compileProcedure(definition) {
    // TODO
  }

  _compileFunction(definition) {
    // TODO
  }

}

