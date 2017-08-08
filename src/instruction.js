import { UnknownPosition } from './reader';

/* Opcodes are constant symbols */
export const O_PushConstant = Symbol.for('O_PushConstant');
export const O_PushVariable = Symbol.for('O_PushVariable');
export const O_SetVariable = Symbol.for('O_SetVariable');
export const O_UnsetVariable = Symbol.for('O_UnsetVariable');
export const O_Label = Symbol.for('O_Label');
export const O_Jump = Symbol.for('O_Jump');
export const O_JumpIfFalse = Symbol.for('O_JumpIfFalse');
export const O_JumpIfConstructor = Symbol.for('O_JumpIfConstructor');
export const O_JumpIfTuple = Symbol.for('O_JumpIfTuple');
export const O_Call = Symbol.for('O_Call');
export const O_Return = Symbol.for('O_Return');
export const O_MakeTuple = Symbol.for('O_MakeTuple');
export const O_MakeConstructor = Symbol.for('O_MakeConstructor');
export const O_UpdateConstructor = Symbol.for('O_UpdateConstructor');
export const O_ReadTupleComponent = Symbol.for('O_ReadTupleComponent');
export const O_ReadConstructorField = Symbol.for('O_ReadConstructorField');
export const O_Add = Symbol.for('O_Add');
export const O_Dup = Symbol.for('O_Dup');
export const O_Pop = Symbol.for('O_Pop');
export const O_PrimitiveCall = Symbol.for('O_PrimitiveCall');
export const O_SaveState = Symbol.for('O_SaveState');
export const O_RestoreState = Symbol.for('O_RestoreState');
export const O_CheckIsInteger = Symbol.for('O_CheckIsInteger');
export const O_CheckIsTuple = Symbol.for('O_CheckIsTuple');
export const O_CheckIsType = Symbol.for('O_CheckIsType');

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
      if (this._instructions[i].opcode == O_Label) {
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
export class IPushConstant extends Instruction {
  constructor(constant) {
    super(O_PushConstant, [constant]);
  }

  get constant() {
    return this._args[0];
  }
}

/* Push a local index/variable/parameter on the stack. */
export class IPushVariable extends Instruction {
  constructor(variableName) {
    super(O_PushVariable, [variableName]);
  }

  get variableName() {
    return this._args[0];
  }
}

/* Set a local index/variable/parameter to the value on the top of the stack. */
export class ISetVariable extends Instruction {
  constructor(variableName) {
    super(O_SetVariable, [variableName]);
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
    super(O_UnsetVariable, [variableName]);
  }

  get variableName() {
    return this._args[0];
  }
}


/* Pseudo-instruction to mark the target of a jump. */
export class ILabel extends Instruction {
  constructor(label) {
    super(O_Label, [label]);
  }

  get label() {
    return this._args[0];
  }
}

/* Unconditional jump. */
export class IJump extends Instruction {
  constructor(targetLabel) {
    super(O_Jump, [targetLabel]);
  }

  get targetLabel() {
    return this._args[0];
  }
}

/* Jump if the top of the stack is False.
 * Pops the top of the stack. */
export class IJumpIfFalse extends Instruction {
  constructor(targetLabel) {
    super(O_JumpIfFalse, [targetLabel]);
  }

  get targetLabel() {
    return this._args[0];
  }
}

/* Jump if the top of the stack is built using the given constructor.
 * Does NOT pop the top of the stack. */
export class IJumpIfConstructor extends Instruction {
  constructor(constructorName, targetLabel) {
    super(O_JumpIfConstructor, [constructorName, targetLabel]);
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
    super(O_JumpIfTuple, [size, targetLabel]);
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
    super(O_Call, [targetLabel, nargs]);
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
    super(O_Return, []);
  }
}

/* Make a tuple of the given size.
 * The components are expected to be located in the stack
 * with the last one at the top. */
export class IMakeTuple extends Instruction {
  constructor(size) {
    super(O_MakeTuple, [size]);
  }

  get size() {
    return this._args[0];
  }
}

/* Make an instance of a constructor with the given fields.
 * The values of the fields are expected to be located in the stack
 * with the last one at the top. */
export class IMakeConstructor extends Instruction {
  constructor(constructorName, fieldNames) {
    super(O_MakeConstructor, [constructorName, fieldNames]);
  }

  get constructorName() {
    return this._args[0];
  }

  get fieldNames() {
    return this._args[1];
  }
}

/* Update an instance of a constructor with the given fields.
 * The stack should have an instance of the given constructor,
 * followed by the values of the fields are expected.
 * The last field should be at the top. */
export class IUpdateConstructor extends Instruction {
  constructor(constructorName, fieldNames) {
    super(O_UpdateConstructor, [constructorName, fieldNames]);
  }

  get constructorName() {
    return this._args[0];
  }

  get fieldNames() {
    return this._args[1];
  }
}

/* Read the n-th component from the tuple at the top of the stack.
 * Does not pop the tuple. */
export class IReadTupleComponent extends Instruction {
  constructor(index) {
    super(O_ReadTupleComponent, [index]);
  }

  get index() {
    return this._args[0];
  }
}

/* Read the given field from the record at the top of the stack.
 * Does not pop the record. */
export class IReadConstructorField extends Instruction {
  constructor(fieldName) {
    super(O_ReadConstructorField, [fieldName]);
  }

  get fieldName() {
    return this._args[0];
  }
}

/* Add the topmost elements of the stack (used mostly for testing/debugging) */
export class IAdd extends Instruction {
  constructor() {
    super(O_Add, []);
  }
}


/* Duplicate the top of the stack (there should be at least one element) */
export class IDup extends Instruction {
  constructor() {
    super(O_Dup, []);
  }
}

/* Pop the top of the stack (there should be at least one element) */
export class IPop extends Instruction {
  constructor() {
    super(O_Pop, []);
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
    super(O_PrimitiveCall, [nargs]);
  }

  get nargs() {
    return this._args[0];
  }
}

/* Save the global state (when entering a function) */
export class ISaveState extends Instruction {
  constructor() {
    super(O_SaveState, []);
  }
}

/* Restore the global state (when leaving a function) */
export class IRestoreState extends Instruction {
  constructor() {
    super(O_RestoreState, []);
  }
}

/* Check that the top of the stack is an integer.
 * Does not pop the top of the stack. */
export class ICheckIsInteger extends Instruction {
  constructor() {
    super(O_CheckIsInteger, []);
  }
}

/* Check that the top of the stack is a tuple of the given size.
 * Does not pop the top of the stack. */
export class ICheckIsTuple extends Instruction {
  constructor(size) {
    super(O_CheckIsTuple, [size]);
  }

  get size() {
    return this._args[0];
  }
}

/* Check that the top of the stack is an instance of the given type.
 * Does not pop the top of the stack. */
export class ICheckIsType extends Instruction {
  constructor(typeName) {
    super(O_CheckIsType, [typeName]);
  }

  get typeName() {
    return this._args[0];
  }
}

