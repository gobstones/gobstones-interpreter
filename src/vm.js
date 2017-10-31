
import {
  I_PushInteger,
  I_PushString,
  I_PushVariable,
  I_SetVariable,
  I_UnsetVariable,
  I_Label,
  I_Jump,
  I_JumpIfFalse,
  I_JumpIfStructure,
  I_JumpIfTuple,
  I_Call,
  I_Return,
  I_MakeTuple,
  I_MakeList,
  I_MakeStructure,
  I_UpdateStructure,
  I_ReadTupleComponent,
  I_ReadStructureField,
  I_ReadStructureFieldPop,
  I_Add,
  I_Dup,
  I_Pop,
  I_PrimitiveCall,
  I_SaveState,
  I_RestoreState,
  I_TypeCheck,
} from './instruction';
import {
  V_Tuple,
  V_Structure,
  ValueInteger,
  ValueString,
  ValueTuple,
  ValueList,
  ValueStructure,
  joinTypes,
  TypeAny,
} from './value';
import { GbsRuntimeError } from './exceptions';
import { i18n } from './i18n';
import { RuntimePrimitives } from './runtime';

/* Conditions that may occur on runtime */
const RT_ExitProgram = Symbol.for('RT_ExitProgram');

/* Instances of RuntimeCondition represent conditions that may occur
 * during runtime (e.g. program termination or timeout). */
class RuntimeCondition extends Error {
  constructor(tag) {
    super(Symbol.keyFor(tag));
    this.tag = tag;
  }
}

/* Runtime condition to mark the end of an execution */
class RuntimeExitProgram extends RuntimeCondition {
  constructor(returnValue) {
    super(RT_ExitProgram);
    this.returnValue = returnValue;
  }
}

function fail(startPos, endPos, reason, args) {
  throw new GbsRuntimeError(startPos, endPos, reason, args);
}

/* An instance of Frame represents the local execution context of a
 * function or procedure (a.k.a. "activation record" or "stack frame").
 *
 * It includes:
 * - a stack of local values
 * - a map from local names to values
 * - the current instruction pointer
 */
class Frame {
  constructor(instructionPointer) {
    this._instructionPointer = instructionPointer;
    this._variables = {};
    this._stack = [];
  }

  get instructionPointer() {
    return this._instructionPointer;
  }

  set instructionPointer(value) {
    this._instructionPointer = value;
  }

  setVariable(name, value) {
    this._variables[name] = value;
  }

  unsetVariable(name, value) {
    delete this._variables[name];
  }

  getVariable(name) {
    if (name in this._variables) {
      return this._variables[name];
    } else {
      return null;
    }
  }

  stackEmpty() {
    return this._stack.length === 0;
  }

  pushValue(value) {
    this._stack.push(value);
  }

  stackTop() {
    if (this._stack.length === 0) {
      throw Error('VM: no value at the top of the stack; the stack is empty.');
    }
    return this._stack[this._stack.length - 1];
  }

  popValue() {
    if (this._stack.length === 0) {
      throw Error('VM: no value to pop; the stack is empty.');
    }
    return this._stack.pop();
  }
}

/*
 * Receives an instance of Code, representing a program for the virtual
 * machine, and sets it up for running.
 *
 * Then it implements the following interface:
 *
 *   vm.run();    Run the program until termination.
 *                If the program returns a value, this method
 *                returns it. Otherwise it returns null.
 */
export class VirtualMachine {

  constructor(code, initialState) {
    this._code = code;

    /* "this._labelTargets" is a dictionary mapping label names to
     * the corresponding instruction pointers.
     *
     * It is calculated automatically from code.
     */
    this._labelTargets = this._code.labelTargets();

    /* A "call stack" is a stack of frames.
     *
     * The topmost element of the stack (i.e. the last element of the list)
     * is the execution context of the current function.
     *
     * The previous element is the execution context of the caller, and so on.
     *
     * During the execution of a program the call stack should never
     * become empty.
     */
    this._callStack = [];
    this._callStack.push(new Frame(0 /* instructionPointer */));

    /* The global state is the data that is available globally.
     *
     * In Gobstones, the global state is the board. The VM module
     * should not be aware of the actual implementation or nature of
     * the global state.
     *
     * We have a stack of global states.
     *
     * The instruction 'SaveState' saves the current global state.
     * It should be called whenever entering a user-defined function
     * in Gobstones.
     *
     * The instruction 'RestoreState' restores the previous global state.
     * It should be called whenever leaving a user-defined function
     * in Gobstones.
     */
    this._globalStateStack = [initialState];

    /* The following dictionary maps names of primitives to their
     * implementation.
     *
     * A primitive always receives 1 + n parameters, the first one being
     * the board.
     */
    this._primitives = new RuntimePrimitives();

  }

  run() {
    try {
      while (true) {
        this._step();
      }
    } catch (condition) {
      if (condition.tag === RT_ExitProgram) {
        return condition.returnValue;
      } else {
        throw condition;
      }
    }
  }

  globalState() {
    return this._globalStateStack[this._globalStateStack.length - 1];
  }

  setGlobalState(globalState) {
    this._globalStateStack[this._globalStateStack.length - 1] = globalState;
  }

  /* Return the current frame, which is the top of the call stack */
  _currentFrame() {
    return this._callStack[this._callStack.length - 1];
  }

  /* Return the current instruction, given by the instruction pointer
   * of the current activation record */
  _currentInstruction() {
    return this._code.at(this._currentFrame().instructionPointer);
  }

  /* Execute a single instruction.
   *
   * If the program finishes, it throws an exception
   *   RuntimeExitProgram(returnValue)
   */
  _step() {
    switch (this._currentInstruction().opcode) {
      case I_PushInteger:
        return this._stepPushInteger();
      case I_PushString:
        return this._stepPushString();
      case I_PushVariable:
        return this._stepPushVariable();
      case I_SetVariable:
        return this._stepSetVariable();
      case I_UnsetVariable:
        return this._stepUnsetVariable();
      case I_Label:
        return this._stepLabel();
      case I_Jump:
        return this._stepJump();
      case I_JumpIfFalse:
        return this._stepJumpIfFalse();
      case I_JumpIfStructure:
        return this._stepJumpIfStructure();
      case I_JumpIfTuple:
        return this._stepJumpIfTuple();
      case I_Call:
        return this._stepCall();
      case I_Return:
        return this._stepReturn();
      case I_MakeTuple:
        return this._stepMakeTuple();
      case I_MakeList:
        return this._stepMakeList();
      case I_MakeStructure:
        return this._stepMakeStructure();
      case I_UpdateStructure:
        return this._stepUpdateStructure();
      case I_ReadTupleComponent:
        return this._stepReadTupleComponent();
      case I_ReadStructureField:
        return this._stepReadStructureField();
      case I_ReadStructureFieldPop:
        return this._stepReadStructureFieldPop();
      case I_Add:
        return this._stepAdd();
      case I_Dup:
        return this._stepDup();
      case I_Pop:
        return this._stepPop();
      case I_PrimitiveCall:
        return this._stepPrimitiveCall();
      case I_SaveState:
        return this._stepSaveState();
      case I_RestoreState:
        return this._stepRestoreState();
      case I_TypeCheck:
        return this._stepTypeCheck();
      default:
        throw Error(
                'VM: opcode '
              + Symbol.keyFor(this._currentInstruction().opcode)
              + ' not implemented'
              );
    }
  }

  _stepPushInteger() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();
    frame.pushValue(new ValueInteger(instruction.number));
    frame.instructionPointer++;
  }

  _stepPushString() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();
    frame.pushValue(new ValueString(instruction.string));
    frame.instructionPointer++;
  }

  _stepPushVariable() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();
    let value = frame.getVariable(instruction.variableName);
    if (value === null) {
      fail(
        instruction.startPos, instruction.endPos,
        'undefined-variable', [instruction.variableName]
      );
    }
    frame.pushValue(value);
    frame.instructionPointer++;
  }

  _stepSetVariable() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();
    let newValue = frame.popValue();

    /* Check that types are compatible */
    let oldValue = frame.getVariable(instruction.variableName);
    if (oldValue !== null) {
      let oldType = oldValue.type();
      let newType = newValue.type();
      if (joinTypes(oldType, newType) === null) {
        fail(
          instruction.startPos, instruction.endPos,
          'incompatible-types-on-assignment', [
            instruction.variableName,
            oldType.toString(),
            newType.toString(),
          ]
        );
      }
    }

    /* Proceed with assignment */
    frame.setVariable(instruction.variableName, newValue);
    frame.instructionPointer++;
  }

  _stepUnsetVariable() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();
    frame.unsetVariable(instruction.variableName);
    frame.instructionPointer++;
  }

  _stepLabel() {
    /* Ignore pseudo-instruction */
    let frame = this._currentFrame();
    frame.instructionPointer++;
  }

  _stepJump() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();
    frame.instructionPointer = this._labelTargets[instruction.targetLabel];
  }

  _stepJumpIfFalse() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();
    let value = frame.popValue(); /* Pop the value */
    if (value.tag === V_Structure && value.constructorName === 'False') {
      frame.instructionPointer = this._labelTargets[instruction.targetLabel];
    } else {
      frame.instructionPointer++;
    }
  }

  _stepJumpIfStructure() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();
    let value = frame.stackTop(); /* Do not pop the value */
    if (value.tag === V_Structure
        && value.constructorName === instruction.constructorName) {
      frame.instructionPointer = this._labelTargets[instruction.targetLabel];
    } else {
      frame.instructionPointer++;
    }
  }

  _stepJumpIfTuple() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();
    let value = frame.stackTop(); /* Do not pop the value */
    if (value.tag === V_Tuple && value.size() === instruction.size) {
      frame.instructionPointer = this._labelTargets[instruction.targetLabel];
    } else {
      frame.instructionPointer++;
    }
  }

  _stepCall() {
    let callerFrame = this._currentFrame();
    let instruction = this._currentInstruction();

    /* Create a new stack frame for the callee */
    let newFrame = new Frame(this._labelTargets[instruction.targetLabel]);
    this._callStack.push(newFrame);

    /* Pop arguments from caller's frame and push them into callee's frame */
    for (let i = 0; i < instruction.nargs; i++) {
      if (callerFrame.stackEmpty()) {
        fail(
          instruction.startPos, instruction.endPos,
          'too-few-arguments', [instruction.targetLabel]
        );
      }
      newFrame.pushValue(callerFrame.popValue());
    }
  }

  _stepReturn() {
    let innerFrame = this._currentFrame();

    let returnValue;
    if (innerFrame.stackEmpty()) {
      returnValue = null;
    } else {
      returnValue = innerFrame.popValue();
      if (!innerFrame.stackEmpty()) {
        throw Error('VM: stack should be empty');
      }
    }

    this._callStack.pop();
    if (this._callStack.length === 0) {
      /* There are no more frames in the call stack, which means
       * that we are returning from the main program. */
      throw new RuntimeExitProgram(returnValue);
    } else {
      /* There are further frames in the call stack, which means
       * that we are returning from a function. */
      let outerFrame = this._currentFrame();
      if (returnValue !== null) {
        outerFrame.pushValue(returnValue);
      }
      outerFrame.instructionPointer++;
    }
  }

  _stepMakeTuple() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();

    let elements = [];
    for (let i = 0; i < instruction.size; i++) {
      elements.unshift(frame.popValue());
    }
    frame.pushValue(new ValueTuple(elements));
    frame.instructionPointer++;
  }

  _stepMakeList() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();

    let elements = [];
    for (let i = 0; i < instruction.size; i++) {
      elements.unshift(frame.popValue());
    }

    /* Check that the types of the elements are compatible */
    let contentType = new TypeAny();
    let index = 0;
    for (let element of elements) {
      let oldType = contentType;
      let newType = element.type();
      contentType = joinTypes(oldType, newType);
      if (contentType === null) {
        fail(
          instruction.startPos, instruction.endPos,
          'incompatible-types-on-list-creation', [
            index,
            oldType.toString(),
            newType.toString(),
          ]
        );
      }
      index++;
    }
    frame.pushValue(new ValueList(elements));
    frame.instructionPointer++;
  }

  _stepMakeStructure() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();

    let fields = {};
    let n = instruction.fieldNames.length;
    for (let i = 0; i < n; i++) {
      let fieldName = instruction.fieldNames[n - i - 1];
      fields[fieldName] = frame.popValue();
    }
    frame.pushValue(
      new ValueStructure(
        instruction.typeName, instruction.constructorName, fields
      )
    );
    frame.instructionPointer++;
  }

  _stepUpdateStructure() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();

    let newFields = {};
    let newFieldNames = [];
    let n = instruction.fieldNames.length;
    for (let i = 0; i < n; i++) {
      let fieldName = instruction.fieldNames[n - i - 1];
      newFields[fieldName] = frame.popValue();
      newFieldNames.unshift(fieldName);
    }

    /* Check that it is a structure and built with the same constructor */
    let structure = frame.popValue();
    if (structure.tag !== V_Structure) {
      fail(
        instruction.startPos, instruction.endPos,
        'expected-structure-but-got', [
          instruction.constructorName,
          i18n(Symbol.keyFor(structure.tag)),
        ]
      );
    }
    if (structure.constructorName !== instruction.constructorName) {
      fail(
        instruction.startPos, instruction.endPos,
        'expected-constructor-but-got', [
          instruction.constructorName,
          structure.constructorName,
        ]
      );
    }
    if (structure.typeName !== instruction.typeName) {
      throw Error('VM: UpdateStructure instruction does not match type.');
    }

    /* Check that the types of the fields are compatible */
    for (let fieldName of newFieldNames) {
      let oldType = structure.fields[fieldName].type();
      let newType = newFields[fieldName].type();
      if (joinTypes(oldType, newType) === null) {
        fail(
          instruction.startPos, instruction.endPos,
          'incompatible-types-on-structure-update', [
            fieldName,
            oldType.toString(),
            newType.toString(),
          ]
        );
      }
    }

    /* Proceed with structure update */
    frame.pushValue(structure.updateFields(newFields));
    frame.instructionPointer++;
  }

  _stepReadTupleComponent() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();
    let tuple = frame.stackTop();
    if (tuple.tag !== V_Tuple) {
      fail(
        instruction.startPos, instruction.endPos,
        'expected-tuple-value-but-got', [tuple.type().toString()]
      );
    }
    if (instruction.index >= tuple.size()) {
      fail(
        instruction.startPos, instruction.endPos,
        'tuple-component-out-of-bounds', [
          tuple.size(), instruction.index,
        ]
      );
    }
    frame.pushValue(tuple.components[instruction.index]);
    frame.instructionPointer++;
  }

  _stepReadStructureFieldGeneric(shouldPopStructure) {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();
    let structure;
    if (shouldPopStructure) {
      structure = frame.popValue();
    } else {
      structure = frame.stackTop();
    }
    if (structure.tag !== V_Structure) {
      fail(
        instruction.startPos, instruction.endPos,
        'expected-structure-value-but-got', [structure.type().toString()]
      );
    }
    if (!(instruction.fieldName in structure.fields)) {
      fail(
        instruction.startPos, instruction.endPos,
        'structure-field-not-present', [
          structure.fieldNames(),
          instruction.fieldName,
        ]
      );
    }
    frame.pushValue(structure.fields[instruction.fieldName]);
    frame.instructionPointer++;
  }

  _stepReadStructureField() {
    this._stepReadStructureFieldGeneric(false); /* Do not pop the structure */
  }

  _stepReadStructureFieldPop() {
    this._stepReadStructureFieldGeneric(true);  /* Pop the structure */
  }

  /* Instruction used for testing/debugging */
  _stepAdd() {
    let frame = this._currentFrame();
    let v1 = frame.popValue();
    let v2 = frame.popValue();
    frame.pushValue(v1.add(v2));
    frame.instructionPointer++;
  }

  _stepDup() {
    let frame = this._currentFrame();
    let value = frame.popValue();
    frame.pushValue(value);
    frame.pushValue(value);
    frame.instructionPointer++;
  }

  _stepPop() {
    let frame = this._currentFrame();
    frame.popValue();
    frame.instructionPointer++;
  }

  _stepPrimitiveCall() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();

    /* Pop arguments from stack */
    let args = [];
    for (let i = 0; i < instruction.nargs; i++) {
      args.unshift(frame.popValue());
    }

    /* Check that the primitive exists */
    if (!this._primitives.isOperation(instruction.primitiveName)) {
      fail(
        instruction.startPos, instruction.endPos,
        'primitive-does-not-exist', [instruction.primitiveName]
      );
    }

    let primitive = this._primitives.getOperation(instruction.primitiveName);

    /* Check that the number of expected parameters coincides with
     * the actual arguments provided */
    if (primitive.argumentTypes.length !== instruction.nargs) {
      fail(instruction.startPos, instruction.endPos,
        'primitive-arity-mismatch', [
          instruction.primitiveName,
          primitive.argumentTypes.length,
          instruction.nargs,
        ]
      );
    }

    /* Check that the types of all parameters coincide with the types of the
     * actual arguments */
    for (let i = 0; i < instruction.nargs; i++) {
      let expectedType = primitive.argumentTypes[i];
      let receivedType = args[i].type();
      if (joinTypes(expectedType, receivedType) === null) {
        fail(
          instruction.startPos, instruction.endPos,
          'primitive-argument-type-mismatch', [
            instruction.primitiveName,
            i + 1,
            expectedType.toString(),
            receivedType.toString(),
          ]
        );
      }
    }

    /* Validate the arguments using the primitive-specific validator */
    primitive.validateArguments(
      instruction.startPos, instruction.endPos, this.globalState(), args
    );

    /* Proceed to call the primitive operation */
    let result = primitive.call(this.globalState(), args); /* mutates 'args' */
    if (result !== null) {
      frame.pushValue(result);
    }
    frame.instructionPointer++;
  }

  _stepSaveState() {
    let frame = this._currentFrame();
    this._globalStateStack.push(this.globalState().clone());
    frame.instructionPointer++;
  }

  _stepRestoreState() {
    let frame = this._currentFrame();
    this._globalStateStack.pop();
    if (this._globalStateStack.length === 0) {
      throw Error('RestoreState: the stack of global states is empty.');
    }
    frame.instructionPointer++;
  }

  _stepTypeCheck() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();
    let expectedType = instruction.type;
    let receivedType = frame.stackTop().type();
    if (joinTypes(expectedType, receivedType) === null) {
      fail(
        instruction.startPos, instruction.endPos,
        'expected-value-of-type-but-got', [
          expectedType.toString(),
          receivedType.toString(),
        ]
      );
    }
    frame.instructionPointer++;
  }

}
