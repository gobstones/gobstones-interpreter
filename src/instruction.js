import { UnknownPosition } from './reader';

/* Opcodes are constant symbols */
export const I_PushInteger = Symbol.for('I_PushInteger');
export const I_PushString = Symbol.for('I_PushString');
export const I_PushVariable = Symbol.for('I_PushVariable');
export const I_SetVariable = Symbol.for('I_SetVariable');
export const I_UnsetVariable = Symbol.for('I_UnsetVariable');
export const I_Label = Symbol.for('I_Label');
export const I_Jump = Symbol.for('I_Jump');
export const I_JumpIfFalse = Symbol.for('I_JumpIfFalse');
export const I_JumpIfStructure = Symbol.for('I_JumpIfStructure');
export const I_JumpIfTuple = Symbol.for('I_JumpIfTuple');
export const I_Call = Symbol.for('I_Call');
export const I_Return = Symbol.for('I_Return');
export const I_MakeTuple = Symbol.for('I_MakeTuple');
export const I_MakeList = Symbol.for('I_MakeList');
export const I_MakeStructure = Symbol.for('I_MakeStructure');
export const I_UpdateStructure = Symbol.for('I_UpdateStructure');
export const I_ReadTupleComponent = Symbol.for('I_ReadTupleComponent');
export const I_ReadStructureField = Symbol.for('I_ReadStructureField');
export const I_Add = Symbol.for('I_Add');
export const I_Dup = Symbol.for('I_Dup');
export const I_Pop = Symbol.for('I_Pop');
export const I_PrimitiveCall = Symbol.for('I_PrimitiveCall');
export const I_SaveState = Symbol.for('I_SaveState');
export const I_RestoreState = Symbol.for('I_RestoreState');
export const I_CheckIsInteger = Symbol.for('I_CheckIsInteger');
export const I_CheckIsTuple = Symbol.for('I_CheckIsTuple');
export const I_CheckIsList = Symbol.for('I_CheckIsList');
export const I_CheckIsType = Symbol.for('I_CheckIsType');

export class Code {
  constructor(instructions) {
    this._instructions = instructions;
  }

  produce(instruction) {
    this._instructions.push(instruction);
  }

  at(ip) {
    if (0 <= ip && ip < this._instructions.length) {
      return this._instructions[ip];
    } else {
      throw Error('Code: instruction pointer out of range.');
    }
  }
  
  /* Return a dictionary mapping label names to their corresponding
   * instruction pointers. */
  labelTargets() {
    let labelTargets = {};
    for (let i = 0; i < this._instructions.length; i++)  {
      if (this._instructions[i].opcode == I_Label) {
        let label = this._instructions[i].label;
        if (label in labelTargets) {
          throw Error('Code: label "' + label + '" is repeated.');
        }
        labelTargets[label] = i;
      }
    }
    return labelTargets;
  }

}

export class Instruction {
  constructor(opcode, args) {
    this._opcode = opcode;
    this._args = args;
    this._startPos = UnknownPosition;
    this._endPos = UnknownPosition;
  }

  get opcode() {
    return this._opcode;
  }

  get args() {
    return this._args;
  }

  set startPos(position) {
    this._startPos = position;
  }

  get startPos() {
    return this._startPos;
  }

  set endPos(position) {
    this._endPos = position;
  }

  get endPos() {
    return this._endPos;
  }

}

/* Push a constant on the stack. */

export class IPushInteger extends Instruction {
  constructor(number) {
    super(I_PushInteger, [number]);
  }

  get number() {
    return this._args[0];
  }
}

export class IPushString extends Instruction {
  constructor(string) {
    super(I_PushString, [string]);
  }

  get string() {
    return this._args[0];
  }
}

/* Push a local index/variable/parameter on the stack. */
export class IPushVariable extends Instruction {
  constructor(variableName) {
    super(I_PushVariable, [variableName]);
  }

  get variableName() {
    return this._args[0];
  }
}

/* Set a local index/variable/parameter to the value on the top of the stack. */
export class ISetVariable extends Instruction {
  constructor(variableName) {
    super(I_SetVariable, [variableName]);
  }

  get variableName() {
    return this._args[0];
  }
}

/* Unset a local index/variable/parameter.
 * This should be used to avoid the variable being used after the end
 * of its scope.
 *
 * E.g. "i" should have no value after the end of the foreach:
 *
 *   foreach i in [1,2,3] {
 *   }
 *   x := i
 */
export class IUnsetVariable extends Instruction {
  constructor(variableName) {
    super(I_UnsetVariable, [variableName]);
  }

  get variableName() {
    return this._args[0];
  }
}


/* Pseudo-instruction to mark the target of a jump. */
export class ILabel extends Instruction {
  constructor(label) {
    super(I_Label, [label]);
  }

  get label() {
    return this._args[0];
  }
}

/* Unconditional jump. */
export class IJump extends Instruction {
  constructor(targetLabel) {
    super(I_Jump, [targetLabel]);
  }

  get targetLabel() {
    return this._args[0];
  }
}

/* Jump if the top of the stack is False.
 * Pops the top of the stack. */
export class IJumpIfFalse extends Instruction {
  constructor(targetLabel) {
    super(I_JumpIfFalse, [targetLabel]);
  }

  get targetLabel() {
    return this._args[0];
  }
}

/* Jump if the top of the stack is a structure built using the given
 * constructor. Does NOT pop the top of the stack. */
export class IJumpIfStructure extends Instruction {
  constructor(constructorName, targetLabel) {
    super(I_JumpIfStructure, [constructorName, targetLabel]);
  }

  get constructorName() {
    return this._args[0];
  }

  get targetLabel() {
    return this._args[1];
  }
}

/* Jump if the top of the stack is an n-tuple of the given size.
 * Does NOT pop the top of the stack. */
export class IJumpIfTuple extends Instruction {
  constructor(size, targetLabel) {
    super(I_JumpIfTuple, [size, targetLabel]);
  }

  get size() {
    return this._args[0];
  }

  get targetLabel() {
    return this._args[1];
  }
}

/* Call a subroutine (procedure or function).
 * The arguments are expected to be located in the stack
 * with the last one at the top.
 *
 * The arguments are popped from the current frame and pushed
 * onto the new frame.
 */
export class ICall extends Instruction {
  constructor(targetLabel, nargs) {
    super(I_Call, [targetLabel, nargs]);
  }

  get targetLabel() {
    return this._args[0];
  }

  get nargs() {
    return this._args[1];
  }
}

/* Return from a routine to the caller.
 * If returning a value (from a function or program),
 * it must be on the top of the stack. */
export class IReturn extends Instruction {
  constructor() {
    super(I_Return, []);
  }
}

/* Make a tuple of the given size.
 * The components are expected to be located in the stack
 * with the last one at the top. */
export class IMakeTuple extends Instruction {
  constructor(size) {
    super(I_MakeTuple, [size]);
  }

  get size() {
    return this._args[0];
  }
}

/* Make a list of the given size.
 * The elements are expected to be located in the stack
 * with the last one at the top. */
export class IMakeList extends Instruction {
  constructor(size) {
    super(I_MakeList, [size]);
  }

  get size() {
    return this._args[0];
  }
}

/* Make a structure using the given constructor and the given fields.
 * The values of the fields are expected to be located in the stack
 * with the last one at the top. */
export class IMakeStructure extends Instruction {
  constructor(typeName, constructorName, fieldNames) {
    super(I_MakeStructure, [typeName, constructorName, fieldNames]);
  }

  get typeName() {
    return this._args[0];
  }

  get constructorName() {
    return this._args[1];
  }

  get fieldNames() {
    return this._args[2];
  }
}

/* Update a structure built using the given constructor with the given
 * fields.
 * The stack should have a structure built using the given constructor,
 * followed by the values of the fields that are expected.
 * The last field should be at the top. */
export class IUpdateStructure extends Instruction {
  constructor(typeName, constructorName, fieldNames) {
    super(I_UpdateStructure, [typeName, constructorName, fieldNames]);
  }

  get typeName() {
    return this._args[0];
  }

  get constructorName() {
    return this._args[1];
  }

  get fieldNames() {
    return this._args[2];
  }
}

/* Read the n-th component from the tuple at the top of the stack.
 * Does not pop the tuple. */
export class IReadTupleComponent extends Instruction {
  constructor(index) {
    super(I_ReadTupleComponent, [index]);
  }

  get index() {
    return this._args[0];
  }
}

/* Read the given field from the structure at the top of the stack.
 * Does not pop the record. */
export class IReadStructureField extends Instruction {
  constructor(fieldName) {
    super(I_ReadStructureField, [fieldName]);
  }

  get fieldName() {
    return this._args[0];
  }
}

/* Add the topmost elements of the stack (used mostly for testing/debugging) */
export class IAdd extends Instruction {
  constructor() {
    super(I_Add, []);
  }
}


/* Duplicate the top of the stack (there should be at least one element) */
export class IDup extends Instruction {
  constructor() {
    super(I_Dup, []);
  }
}

/* Pop the top of the stack (there should be at least one element) */
export class IPop extends Instruction {
  constructor() {
    super(I_Pop, []);
  }
}

/* Call a primitive function.
 *
 * The arguments are expected to be located in the stack
 * with the last one at the top.
 *
 * Note: the compiler relies on various primitive functions.
 * For example, the operation to make a range is a primitive
 * function:
 *
 *   function _makeRange(start, end)
 *
 * So is the function that checks whether the top of the stack is a list,
 * etc. (required to compile a "foreach"), and so on.
 */
export class IPrimitiveCall extends Instruction {
  constructor(nargs) {
    super(I_PrimitiveCall, [nargs]);
  }

  get nargs() {
    return this._args[0];
  }
}

/* Save the global state (when entering a function) */
export class ISaveState extends Instruction {
  constructor() {
    super(I_SaveState, []);
  }
}

/* Restore the global state (when leaving a function) */
export class IRestoreState extends Instruction {
  constructor() {
    super(I_RestoreState, []);
  }
}

/* Check that the top of the stack is an integer.
 * Does not pop the top of the stack. */
export class ICheckIsInteger extends Instruction {
  constructor() {
    super(I_CheckIsInteger, []);
  }
}

/* Check that the top of the stack is a tuple of the given size.
 * Does not pop the top of the stack. */
export class ICheckIsTuple extends Instruction {
  constructor(size) {
    super(I_CheckIsTuple, [size]);
  }

  get size() {
    return this._args[0];
  }
}

/* Check that the top of the stack is a list.
 * Does not pop the top of the stack. */
export class ICheckIsList extends Instruction {
  constructor() {
    super(I_CheckIsList, []);
  }
}

/* Check that the top of the stack is an instance of the given type.
 * Does not pop the top of the stack. */
export class ICheckIsType extends Instruction {
  constructor(typeName) {
    super(I_CheckIsType, [typeName]);
  }

  get typeName() {
    return this._args[0];
  }
}

