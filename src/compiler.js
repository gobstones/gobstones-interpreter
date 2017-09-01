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
  TypeAny,
  TypeInteger,
  TypeStructure,
  TypeList,
} from './value';
import { RuntimePrimitives } from './runtime';
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
    this._nextVariable = 0;
    this._primitives = new RuntimePrimitives();
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
        return this._compileStmtRepeat(statement);
      case N_StmtForeach:
        return this._compileStmtForeach(statement);
      case N_StmtWhile:
        return this._compileStmtWhile(statement);
      case N_StmtSwitch:
        return this._compileStmtSwitch(statement);
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
   *   <condition>
   *   TypeCheck Bool
   *   JumpIfFalse labelElse
   *   <thenBranch>
   *   labelElse:
   *
   * If with else:
   *
   *   <condition>
   *   TypeCheck Bool
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

  /* <times>
   * TypeCheck Integer
   * labelStart:
   *   Dup                     ;\
   *   PushInteger 0           ;| if not positive, end
   *   PrimitiveCall ">", 2    ;|
   *   JumpIfFalse labelEnd    ;/
   *   <body>
   *   PushInteger 1           ;\ subtract 1
   *   PrimitiveCall "-", 2    ;/
   * Jump labelStart
   * labelEnd:
   * Pop                       ; pop the remaining number
   */
  _compileStmtRepeat(statement) {
    this._compileExpression(statement.times);
    this._produce(statement.times.startPos, statement.times.endPos,
      new ITypeCheck(new TypeInteger())
    );
    let labelStart = this._freshLabel();
    let labelEnd = this._freshLabel();
    this._produceList(statement.startPos, statement.endPos, [
      new ILabel(labelStart),
      new IDup(),
      new IPushInteger(0),
      new IPrimitiveCall('>', 2),
      new IJumpIfFalse(labelEnd),
    ]);
    this._compileStatement(statement.body);
    this._produceList(statement.startPos, statement.endPos, [
      new IPushInteger(1),
      new IPrimitiveCall('-', 2),
      new IJump(labelStart),
      new ILabel(labelEnd),
      new IPop(),
    ]);
  }

  /* <range>                   ;\ _list = temporary variable
   * TypeCheck List(Any)       ;| holding the list we are ranging over
   * SetVariable _list         ;/
   *
   * PushVariable _list                    ;\ _n = temporary variable
   * PrimitiveCall "_unsafeListLength", 1  ;| holding the total length
   * SetVariable _n                        ;/ of the list
   *
   * PushInteger 0             ;\ _pos = temporary variable holding the
   * SetVariable _pos          ;/ current index inside the list
   *
   * labelStart:
   *   PushVariable _pos       ;\
   *   PushVariable _n         ;| if out of the bounds of the list, end
   *   PrimitiveCall "<", 2    ;|
   *   JumpIfFalse labelEnd    ;/
   *
   *   PushVariable _list                 ;\  get the `pos`-th element of the
   *   PushVariable _pos                  ;|  list and store it in the local
   *   PrimitiveCall "_unsafeListNth", 2  ;|  variable "<index>"
   *   SetVariable <index>                ;/
   *
   *   <body>
   *
   *   PushVariable _pos       ;\
   *   PushInteger 1           ;| add 1 to the current index
   *   PrimitiveCall "+", 2    ;|
   *   SetVariable _pos        ;/
   *
   * Jump labelStart
   * labelEnd:
   * UnsetVariable _list
   * UnsetVariable _n
   * UnsetVariable _pos
   * UnsetVariable <index>
   */
  _compileStmtForeach(statement) {
    let labelStart = this._freshLabel();
    let labelEnd = this._freshLabel();
    let list = this._freshVariable();
    let pos = this._freshVariable();
    let n = this._freshVariable();

    this._compileExpression(statement.range);
    this._produceList(statement.range.startPos, statement.range.endPos, [
      new ITypeCheck(new TypeList(new TypeAny())),
      new ISetVariable(list),

      new IPushVariable(list),
      new IPrimitiveCall('_unsafeListLength', 1),
      new ISetVariable(n),
    ]);
    this._produceList(statement.startPos, statement.endPos, [
      new IPushInteger(0),
      new ISetVariable(pos),

      new ILabel(labelStart),
      new IPushVariable(pos),
      new IPushVariable(n),
      new IPrimitiveCall('<', 2),
      new IJumpIfFalse(labelEnd),

      new IPushVariable(list),
      new IPushVariable(pos),
      new IPrimitiveCall('_unsafeListNth', 2),
      new ISetVariable(statement.index.value),
    ]);
    this._compileStatement(statement.body);
    this._produceList(statement.startPos, statement.endPos, [
      new IPushVariable(pos),
      new IPushInteger(1),
      new IPrimitiveCall('+', 2),
      new ISetVariable(pos),

      new IJump(labelStart),

      new ILabel(labelEnd),
      new IUnsetVariable(list),
      new IUnsetVariable(n),
      new IUnsetVariable(pos),
      new IUnsetVariable(statement.index.value),
    ]);
  }

  /* labelStart:
   * <condition>
   * TypeCheck Bool
   * JumpIfFalse labelEnd
   * <body>
   * Jump labelStart
   * labelEnd:
   */
  _compileStmtWhile(statement) {
    let labelStart = this._freshLabel();
    let labelEnd = this._freshLabel();
    this._produce(statement.startPos, statement.endPos,
      new ILabel(labelStart)
    );
    this._compileExpression(statement.condition);
    this._produceList(statement.startPos, statement.endPos, [
      new ITypeCheck(new TypeStructure(i18n('TYPE:Bool'), {})),
      new IJumpIfFalse(labelEnd),
    ]);
    this._compileStatement(statement.body);
    this._produceList(statement.startPos, statement.endPos, [
      new IJump(labelStart),
      new ILabel(labelEnd),
    ]);
  }

  /* If the branches of the switch are:
   *    pattern1 -> body1
   *    ...      -> ...
   *    patternN -> bodyN
   * the switch construction is compiled as follows:
   *
   * <subject>
   *   [if matches pattern1, jump to label1]
   *   Pop
   *   ...
   *   [if matches patternN, jump to labelN]
   *   [error message: no match]
   *
   * label1:
   *   [bind parameters in pattern1]
   *   [pop subject]
   *   <body1>
   *   Jump labelEnd
   * ...
   * labelN:
   *   [bind parameters in patternN]
   *   Pop
   *   <bodyN>
   *   Jump labelEnd
   * labelEnd:
   */
  _compileStmtSwitch(statement) {
    // TODO
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
        return this._compileExprList(expression);
      case N_ExprRange:
        // TODO
        break;
      case N_ExprTuple:
        return this._compileExprTuple(expression);
      case N_ExprStructure:
        return this._compileExprStructure(expression);
      case N_ExprStructureUpdate:
        // TODO
        break;
      case N_ExprFunctionCall:
        return this._compileExprFunctionCall(expression);
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
      new IPushInteger(expression.number.value)
    );
  }

  _compileExprConstantString(expression) {
    this._produce(expression.startPos, expression.endPos,
      new IPushString(expression.string.value)
    );
  }

  _compileExprList(expression) {
    for (let element of expression.elements) {
      this._compileExpression(element);
    }
    this._produce(expression.startPos, expression.endPos,
      new IMakeList(expression.elements.length)
    );
  }

  _compileExprTuple(expression) {
    for (let element of expression.elements) {
      this._compileExpression(element);
    }
    this._produce(expression.startPos, expression.endPos,
      new IMakeTuple(expression.elements.length)
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

  /* There are four cases:
   * (1) The function is '&&' or '||' which must be considered separately
   *     to account for short-circuting.
   * (2) The function is a built-in primitive.
   * (3) The function is a user-defined function.
   * (4) The function is an observer / field accessor.
   */
  _compileExprFunctionCall(expression) {
    let functionName = expression.functionName.value;
    if (functionName === '&&' || functionName === '||') {
      // TODO
      throw Error('short-circuiting not implemented');
    } else {
      for (let argument of expression.args) {
        this._compileExpression(argument);
      }
      if (this._primitives.isFunction(functionName)) {
        this._compileExprFunctionCallPrimitive(expression);
      } else if (this._symtable.isFunction(functionName)) {
        // TODO
        throw Error('calling a user-defined function not implemented');
      } else if (this._symtable.isField(functionName)) {
        // TODO
        throw Error('accessing a field not implemented');
      } else {
        throw Error(
          'Compiler: ' + expression.functionName + ' is an undefined function.'
        );
      }
    }
  }

  _compileExprFunctionCallPrimitive(expression) {
    this._produce(expression.startPos, expression.endPos,
      new IPrimitiveCall(expression.functionName.value, expression.args.length)
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

  /* Create a fresh local variable name */
  _freshVariable() {
    let v = '_v' + this._nextVariable.toString();
    this._nextVariable++;
    return v;
  }

}

