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
  N_PatternStructure,
  N_PatternTuple,
  N_PatternTimeout,
  /* Expressions */
  N_ExprVariable,
  N_ExprConstantNumber,
  N_ExprConstantString,
  N_ExprList,
  N_ExprRange,
  N_ExprTuple,
  N_ExprStructure,
  N_ExprStructureUpdate,
  N_ExprFunctionCall,
  /* SwitchBranch: pattern -> body */
  N_SwitchBranch,
  /* FieldValue: field <- value */
  N_FieldValue,
  /* ConstructorDeclaration */
  N_ConstructorDeclaration,
} from './ast';
import {
  IPushInteger,
  IPushString,
  IPushVariable,
  ISetVariable,
  IUnsetVariable,
  ILabel,
  IJump,
  IJumpIfFalse,
  IJumpIfStructure,
  IJumpIfTuple,
  ICall,
  IReturn,
  IMakeTuple,
  IMakeList,
  IMakeStructure,
  IUpdateStructure,
  IReadTupleComponent,
  IReadStructureField,
  IAdd,
  IDup,
  IPop,
  IPrimitiveCall,
  ISaveState,
  IRestoreState,
  ITypeCheck,
  Code
} from './instruction';
import {
  TypeStructure,
} from './value';
import { i18n } from './i18n';

/*
 * A compiler receives a symbol table (instance of SymbolTable).
 *
 * The method this.compile(ast) receives an abstract syntax tree
 * (the output of a parser).
 *
 * The AST is expected to have been linted against the given symbol table.
 *
 * The compiler produces an instance of Code, representing code for the
 * virtual machine.
 */
export class Compiler {

  constructor(symtable) {
    this._symtable = symtable;
    this._code = new Code([]);
    this._nextLabel = 0;
  }

  compile(ast) {
    this._compileMain(ast);
    return this._code;
  }

  _compileMain(ast) {
    /* Accept the empty source */
    if (ast.definitions.length === 0) {
      this._produce(ast.startPos, ast.endPos,
        new IReturn()
      );
      return;
    }

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
    this._compileStatement(definition.body);
    this._produce(definition.startPos, definition.endPos,
      new IReturn()
    );
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

  /* Statements are compiled to VM instructions that start and end
   * with an empty local stack. The stack may grow and shrink during the
   * execution of a statement, but it should be empty by the end.
   *
   * The only exception to this rule is the "return" statement, which
   * pushes a single value on the stack.
   */
  _compileStatement(statement) {
    switch (statement.tag) {
      case N_StmtBlock:
        return this._compileStmtBlock(statement);
      case N_StmtReturn:
        return this._compileStmtReturn(statement);
      case N_StmtIf:
        return this._compileStmtIf(statement);
      case N_StmtRepeat:
        // TODO
        break;
      case N_StmtForeach:
        // TODO
        break;
      case N_StmtWhile:
        // TODO
        break;
      case N_StmtSwitch:
        // TODO
        break;
      case N_StmtAssignVariable:
        return this._compileStmtAssignVariable(statement);
      case N_StmtAssignTuple:
        // TODO
        break;
      case N_StmtProcedureCall:
        // TODO
        break;
      default:
        throw Error(
                'Compiler: Statement not implemented: '
              + Symbol.keyFor(statement.tag)
              );
    }
  }

  _compileStmtBlock(block) {
    for (let statement of block.statements) {
      this._compileStatement(statement);
    }
  }

  /* Merely push the return value in the stack.
   * The "new IReturn()" instruction itself is produced by the
   * methods:
   *   _compileProgram
   *   _compileInteractiveProgram
   *   _compileProcedure
   *   _compileFunction
   * */
  _compileStmtReturn(statement) {
    return this._compileExpression(statement.result);
  }

  /*
   * If without else:
   *
   *   <expression>
   *   JumpIfFalse labelElse
   *   <thenBranch>
   *   labelElse:
   *
   * If with else:
   *
   *   <expression>
   *   JumpIfFalse labelElse
   *   <thenBranch>
   *   Jump labelEnd
   *   labelElse:
   *   <elseBranch>
   *   labelEnd:
   */
  _compileStmtIf(statement) {
    this._compileExpression(statement.condition);
    this._produce(statement.condition.startPos, statement.condition.endPos,
      new ITypeCheck(new TypeStructure(i18n('TYPE:Bool'), {}))
    );
    let labelElse = this._freshLabel();
    this._produce(statement.startPos, statement.endPos,
      new IJumpIfFalse(labelElse)
    );
    this._compileStatement(statement.thenBlock);
    if (statement.elseBlock === null) {
      this._produce(statement.startPos, statement.endPos,
        new ILabel(labelElse)
      );
    } else {
      let labelEnd = this._freshLabel();
      this._produceList(statement.startPos, statement.endPos, [
        new IJump(labelEnd),
        new ILabel(labelElse),
      ]);
      this._compileStatement(statement.elseBlock);
      this._produce(statement.startPos, statement.endPos,
        new ILabel(labelEnd)
      );
    }
  }

  _compileStmtAssignVariable(statement) {
    this._compileExpression(statement.value);
    this._produce(statement.startPos, statement.endPos,
      new ISetVariable(statement.variable.value)
    );
  }

  /* Expressions are compiled to instructions that make the size
   * of the local stack grow in exactly one.
   * The stack may grow and shrink during the evaluation of an
   * expression, but an expression should not consume values
   * that were present on the stack before its evaluation started.
   * In the end the stack should have exactly one more value than
   * at the start.
   */
  _compileExpression(expression) {
    switch (expression.tag) {
      case N_ExprVariable:
        return this._compileExprVariable(expression);
      case N_ExprConstantNumber:
        return this._compileExprConstantNumber(expression);
      case N_ExprConstantString:
        return this._compileExprConstantString(expression);
      case N_ExprList:
        // TODO
        break;
      case N_ExprRange:
        // TODO
        break;
      case N_ExprTuple:
        // TODO
        break;
      case N_ExprStructure:
        return this._compileExprStructure(expression);
      case N_ExprStructureUpdate:
        // TODO
        break;
      case N_ExprFunctionCall:
        // TODO
        break;
      default:
        throw Error(
                'Compiler: Expression not implemented: '
              + Symbol.keyFor(expression.tag)
              );
      }
  }

  _compileExprVariable(expression) {
    this._produce(expression.startPos, expression.endPos,
      new IPushVariable(expression.variableName.value)
    );
  }

  _compileExprConstantNumber(expression) {
    this._produce(expression.startPos, expression.endPos,
      new IPushInteger(parseInt(expression.number.value))
    );
  }

  _compileExprConstantString(expression) {
    this._produce(expression.startPos, expression.endPos,
      new IPushString(expression.string.value)
    );
  }

  _compileExprStructure(expression) {
    let fieldNames = [];
    for (let fieldBinding of expression.fieldBindings) {
      this._compileExpression(fieldBinding.value);
      fieldNames.push(fieldBinding.fieldName.value);
    }
    let constructorName = expression.constructorName.value;
    let typeName = this._symtable.constructorType(constructorName);
    this._produce(expression.startPos, expression.endPos,
      new IMakeStructure(typeName, constructorName, fieldNames)
    );
  }
  
  /* Helpers */

  /* Produce the given instruction, setting its starting and ending
   * position to startPos and endPos respectively */
  _produce(startPos, endPos, instruction) {
    instruction.startPos = startPos;
    instruction.endPos = endPos;
    this._code.produce(instruction);
  }

  _produceList(startPos, endPos, instructions) {
    for (let instruction of instructions) {
      this._produce(startPos, endPos, instruction);
    }
  }

  /* Create a fresh label name */
  _freshLabel() {
    let label = '_l' + this._nextLabel.toString();
    this._nextLabel++;
    return label;
  }

}

