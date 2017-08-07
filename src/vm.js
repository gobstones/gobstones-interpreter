
import {
  O_PushConstant,
  O_PushVariable,
  O_SetVariable,
  O_UnsetVariable,
  O_Label,
  O_Jump,
  O_JumpIfFalse,
  O_JumpIfConstructor,
  O_JumpIfTuple,
  O_Call,
  O_Return,
  O_MakeTuple,
  O_MakeConstructor,
  O_UpdateConstructor,
  O_ReadTupleComponent,
  O_ReadConstructorField,
  O_Dup,
  O_Pop,
  O_PrimitiveCall,
  O_SaveState,
  O_RestoreState,
  O_CheckIsInteger,
  O_CheckIsTuple,
  O_CheckIsType,
} from './instruction';
import { GbsRuntimeError } from './exceptions';
import { i18n } from './i18n';

/* Conditions that may occur on runtime */
const RT_ExitProgram = Symbol.for('RT_ExitProgram');

/* Instances of RuntimeCondition represent conditions that may occur
 * during runtime (e.g. program termination or timeout). */
class RuntimeCondition extends Error {
  constructor(tag) {
    super(Symbol.keyFor(tag))
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
    return this._stack.length == 0;
  }

  pushValue(value) {
    this._stack.push(value);
  }

  popValue() {
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

  constructor(code) {
    this._code = code;

    /* this._labelTargets is a dictionary mapping label names to
     * the corresponding instruction pointers. */
    this._labelTargets = this._code.labelTargets();

    /* A "call stack" is a stack of frames.
     *
     * The topmost element of the stack (i.e. the last element of the list)
     * is the execution context of the current function.
     *
     * The previous element is the execution context of the caller, and so on.
     *
     * During the execution of a program the call stack is never empty.
     */
    this._callStack = [];
    this._callStack.push(new Frame(0));
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
      case O_PushConstant:
        return this._stepPushConstant();
      case O_PushVariable:
        return this._stepPushVariable();
      case O_SetVariable:
        return this._stepSetVariable();
      case O_UnsetVariable:
        return this._stepUnsetVariable();
      case O_Label:
        return this._stepLabel();
      case O_Jump:
        return this._stepJump();
      case O_JumpIfFalse:
        // TODO
        break;
      case O_JumpIfConstructor:
        // TODO
        break;
      case O_JumpIfTuple:
        // TODO
        break;
      case O_Call:
        // TODO
        break;
      case O_Return:
        return this._stepReturn();
      case O_MakeTuple:
        // TODO
        break;
      case O_MakeConstructor:
        // TODO
        break;
      case O_UpdateConstructor:
        // TODO
        break;
      case O_ReadTupleComponent:
        // TODO
        break;
      case O_ReadConstructorField:
        // TODO
        break;
      case O_Dup:
        // TODO
        break;
      case O_Pop:
        // TODO
        break;
      case O_PrimitiveCall:
        // TODO
        break;
      case O_SaveState:
        // TODO
        break;
      case O_RestoreState:
        // TODO
        break;
      case O_CheckIsInteger:
        // TODO
        break;
      case O_CheckIsTuple:
        // TODO
        break;
      case O_CheckIsType:
        // TODO
        break;
      default:
        throw Error(
                'VM: opcode '
              + Symbol.keyFor(instruction.opcode)
              + ' not implemented'
              );
    }
  }

  _stepPushConstant() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();
    frame.pushValue(instruction.constant);
    frame.instructionPointer++;
  }

  _stepPushVariable() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();
    let value = frame.getVariable(instruction.variableName);
    if (value === null) {
      throw new GbsRuntimeError(instruction.startPos, instruction.endPos,
          i18n('errmsg:undefined-variable')(instruction.variableName)
      );
    }
    frame.pushValue(value);
    frame.instructionPointer++;
  }

  _stepSetVariable() {
    let frame = this._currentFrame();
    let instruction = this._currentInstruction();
    let value = frame.popValue();
    frame.setVariable(instruction.variableName, value);
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
      let outerFrame = this._currentActivationRecord();
      outerFrame.push(returnValue);
      // TODO: check position of ip
    }
  }

}
