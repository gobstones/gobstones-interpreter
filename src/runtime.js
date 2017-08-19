import { i18n } from './i18n';
import {
  ValueInteger,
  ValueString,
  ValueTuple,
  ValueList,
  ValueStructure,
  TypeAny,
  TypeInteger,
  TypeTuple,
  TypeList,
  TypeStructure,
  joinTypes,
} from './value';
import {
  GbsRuntimeError,
} from './exceptions';

/*
 * This module provides the runtime support for the execution of a program.
 *
 * The runtime support includes:
 *
 * - A definition of a class RuntimeState, representing the global state
 *   of a program.
 *
 * - A definition of a class RuntimePrimitives, representing the available
 *   primitive functions.
 *
 * This file is a particular implementation, in which RuntimeState
 * represents a Gobstones board, and RuntimePrimitives are the primitives
 * functions and procedures available in Gobstones.
 *
 * Potential variants of the language might have a different notion of
 * global state, and different available primitives.
 */

let BOOL_ENUM = [
  i18n('CONS:False'),
  i18n('CONS:True'),
];

let COLOR_ENUM = [
  i18n('CONS:Color0'),
  i18n('CONS:Color1'),
  i18n('CONS:Color2'),
  i18n('CONS:Color3'),
];

let DIR_ENUM = [
  i18n('CONS:Dir0'),
  i18n('CONS:Dir1'),
  i18n('CONS:Dir2'),
  i18n('CONS:Dir3'),
];

function toEnum(enumeration, name) {
  return enumeration.indexOf(name);
}

function fromEnum(enumeration, index) {
  return enumeration[index];
}

function dirOpposite(dirName) {
  return fromEnum(DIR_ENUM, (toEnum(DIR_ENUM, dirName) + 2) % 4);
}

function enumIndex(value) {
  if (isBool(value)) {
    if (boolFromValue(value)) {
      return 1;
    } else {
      return 0;
    }
  } else if (isColor(value)) {
    return toEnum(COLOR_ENUM, colorFromValue(value));
  } else if (isDir(value)) {
    return toEnum(DIR_ENUM, dirFromValue(value));
  } else {
    throw Error('Value should be Bool, Color or Dir.');
  }
}

/*
 * An instance of RuntimeState represents the current global state of
 * a program. In the case of Gobstones, it is a Gobstones board.
 *
 * It MUST implement the following methods:
 *
 *   this.clone() ~~> returns a copy of the state
 *
 */
export class RuntimeState {
  constructor() {
    /*
     * The board is represented as a list of columns, so that board[x] is the
     * x-th column and board[x][y] is the cell at (x, y).
     *
     * By default, create an empty 1x1 board.
     */
    this._width = 1;
    this._height = 1;
    this._board = [[this._emptyCell()]];
    this._head = {'x': 0, 'y': 0};
  }

  clone() {
    let newState = new RuntimeState();
    newState._width = this._width;
    newState._height = this._height;
    newState._board = [];
    for (let x = 0; x < this._width; x++) {
      let column = [];
      for (let y = 0; y < this._height; y++) {
        let cell = {};
        for (let colorName of COLOR_ENUM) {
          cell[colorName] = this._board[x][y][colorName];
        }
        column.push(cell);
      }
      newState._board.push(column);
    }
    newState._head = {'x': this._head.x, 'y': this._head.y};
    return newState;
  }

  /* Gobstones specific methods */

  putStone(colorName) {
    let n = this._board[this._head.x][this._head.y][colorName];
    n = n.add(new ValueInteger(1));
    this._board[this._head.x][this._head.y][colorName] = n;
  }

  numStones(colorName) {
    return this._board[this._head.x][this._head.y][colorName];
  }

  _emptyCell() {
    let cell = {};
    for (let colorName of COLOR_ENUM) {
      cell[colorName] = new ValueInteger(0);
    }
    return cell;
  }
}

class PrimitiveOperation {

  constructor(argumentTypes, argumentValidator, implementation) {
    this._argumentTypes = argumentTypes;
    this._argumentValidator = argumentValidator;
    this._implementation = implementation;
  }

  get argumentTypes() {
    return this._argumentTypes;
  }

  nargs() {
    return this._argumentTypes.length;
  }

  /* Warning: mutates 'args' destructively */
  call(globalState, args) {
    return this._implementation.apply(null, [globalState].concat(args));
  }

  /* Check that the arguments are valid according to the validator.
   * The validator should be a function receiving a start and end
   * positions, and a list of arguments.
   * It should throw a GbsRuntimeError if the arguments are invalid.
   */
  validateArguments(startPos, endPos, args) {
    this._argumentValidator(startPos, endPos, args);
  }

}

/* Casting Gobstones values to JavaScript values and vice-versa */

let typeAny = new TypeAny();

let typeInteger = new TypeInteger();

let typeBool = new TypeStructure(i18n('TYPE:Bool'), {});

let typeListAny = new TypeList(new TypeAny());

function valueFromBool(bool) {
  if (bool) {
    return new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {});
  } else {
    return new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {});
  }
}

function boolFromValue(value) {
  return value.constructorName === i18n('CONS:True');
}

let typeColor = new TypeStructure(i18n('TYPE:Color'), {});

function valueFromColor(colorName) {
  return new ValueStructure(i18n('TYPE:Color'), colorName, {})
}

function colorFromValue(value) {
  return value.constructorName;
}

let typeDir = new TypeStructure(i18n('TYPE:Dir'), {});

function valueFromDir(dirName) {
  return new ValueStructure(i18n('TYPE:Dir'), dirName, {})
}

function dirFromValue(value) {
  return value.constructorName;
}

/* Argument validators */

function noValidation(startPos, endPos, args) {
}

function isInteger(x) {
  return joinTypes(x.type(), typeInteger) !== null;
}

function isBool(x) {
  return joinTypes(x.type(), typeBool) !== null;
}

function isColor(x) {
  return joinTypes(x.type(), typeColor) !== null;
}

function isDir(x) {
  return joinTypes(x.type(), typeDir) !== null;
}

export const TYPES_WITH_OPPOSITE = [typeInteger, typeBool, typeDir];
export const TYPES_WITH_ORDER = [typeInteger, typeBool, typeColor, typeDir];

/* Validate that the type of 'x' is among the given list of types */
function validateTypeAmong(startPos, endPos, x, types) {
  /* Succeed if the type of x is in the list 'types' */
  for (let type of types) {
    if (joinTypes(x.type(), type) !== null) {
      return;
    }
  }
  /* Build a list of type names for error reporting */
  let typeStrings = [];
  for (let type of types) {
    typeStrings.push(type.toString());
  }
  /* Report error */
  throw new GbsRuntimeError(startPos, endPos,
    i18n('errmsg:expected-value-of-some-type-but-got')(
      typeStrings,
      x.type().toString()
    )
  );
}

/* Validate that the types of 'x' and 'y' are compatible */
function validateCompatibleTypes(startPos, endPos, x, y) {
  if (joinTypes(x.type(), y.type()) === null) {
    throw new GbsRuntimeError(startPos, endPos,
      i18n('errmsg:expected-values-to-have-compatible-types')(
        x.type().toString(),
        y.type().toString(),
      )
    );
  }
}

/* Runtime primitives */

export class RuntimePrimitives {

  constructor() {
    /* this._primitiveTypes is a dictionary indexed by type names.
     *
     * this._primitiveTypes[typeName] is a dictionary indexed by
     * the constructor names of the given type.
     *
     * this._primitiveTypes[typeName][constructorName]
     * is a list of field names.
     */
    this._primitiveTypes = {};

    /* this._primitiveProcedures and this._primitiveFunctions
     * are dictionaries indexed by the name of the primitive operation
     * (procedure or function). Their value is an instance of
     * PrimitiveOperation.
     */
    this._primitiveProcedures = {};
    this._primitiveFunctions = {};

    /*** Primitive types ***/

    /* Booleans */
    this._primitiveTypes[i18n('TYPE:Bool')] = {};
    for (let boolName of BOOL_ENUM) {
      this._primitiveTypes[i18n('TYPE:Bool')][boolName] = [];
    }

    /* Colors */
    this._primitiveTypes[i18n('TYPE:Color')] = {};
    for (let colorName of COLOR_ENUM) {
      this._primitiveTypes[i18n('TYPE:Color')][colorName] = [];
    }

    /* Directions */
    this._primitiveTypes[i18n('TYPE:Dir')] = {};
    for (let dirName of DIR_ENUM) {
      this._primitiveTypes[i18n('TYPE:Dir')][dirName] = [];
    }

    /*** Primitive procedures ***/

    this._primitiveProcedures[i18n('PRIM:PutStone')] =
      new PrimitiveOperation(
          [typeColor], noValidation,
          function (globalState, color) {
            globalState.putStone(colorFromValue(color));
            return null;
          }
      );

    /*** Primitive functions ***/


    this._primitiveFunctions['_unsafeListLength'] =
      new PrimitiveOperation(
          [typeAny], noValidation,
          function (globalState, list) {
            return new ValueInteger(list.length());
          }
      );

    this._primitiveFunctions['_unsafeListNth'] =
      new PrimitiveOperation(
          [typeAny, typeAny], noValidation,
          function (globalState, list, index) {
            let i = index.asNumber();
            return list.elements[index.asNumber()];
          }
      );

    this._primitiveFunctions[i18n('PRIM:numStones')] =
      new PrimitiveOperation(
          [typeColor], noValidation,
          function (globalState, color) {
            return globalState.numStones(colorFromValue(color));
          }
      );

    this._primitiveFunctions['+'] =
      new PrimitiveOperation(
          [typeInteger, typeInteger], noValidation,
          function (globalState, a, b) {
            return a.add(b);
          }
      );

    this._primitiveFunctions['-'] =
      new PrimitiveOperation(
          [typeInteger, typeInteger], noValidation,
          function (globalState, a, b) {
            return a.sub(b);
          }
      );

    this._primitiveFunctions['-(unary)'] =
      new PrimitiveOperation(
          [typeAny],
          function (startPos, endPos, args) {
            let a = args[0];
            validateTypeAmong(startPos, endPos, a, TYPES_WITH_OPPOSITE);
          },
          function (globalState, a) {
            if (isInteger(a)) {
              return a.negate();
            } else if (isBool(a)) {
              return valueFromBool(!boolFromValue(a));
            } else if (isDir(a)) {
              return valueFromDir(dirOpposite(dirFromValue(a)));
            } else {
              throw Error('Value has no opposite.');
            }
          }
      );

    this._primitiveFunctions['<='] =
      new PrimitiveOperation(
          [typeAny, typeAny],
          function (startPos, endPos, args) {
            let a = args[0];
            let b = args[1];
            validateCompatibleTypes(startPos, endPos, a, b);
            validateTypeAmong(startPos, endPos, a, TYPES_WITH_ORDER);
            validateTypeAmong(startPos, endPos, b, TYPES_WITH_ORDER);
          },
          function (globalState, a, b) {
            if (isInteger(a)) {
              return valueFromBool(a.le(b));
            } else {
              let indexA = enumIndex(a);
              let indexB = enumIndex(b);
              return valueFromBool(indexA <= indexB);
            }
          }
      );

    this._primitiveFunctions['>='] =
      new PrimitiveOperation(
          [typeAny, typeAny],
          function (startPos, endPos, args) {
            let a = args[0];
            let b = args[1];
            validateCompatibleTypes(startPos, endPos, a, b);
            validateTypeAmong(startPos, endPos, a, TYPES_WITH_ORDER);
            validateTypeAmong(startPos, endPos, b, TYPES_WITH_ORDER);
          },
          function (globalState, a, b) {
            if (isInteger(a)) {
              return valueFromBool(a.ge(b));
            } else {
              let indexA = enumIndex(a);
              let indexB = enumIndex(b);
              return valueFromBool(indexA >= indexB);
            }
          }
      );

    this._primitiveFunctions['<'] =
      new PrimitiveOperation(
          [typeAny, typeAny],
          function (startPos, endPos, args) {
            let a = args[0];
            let b = args[1];
            validateCompatibleTypes(startPos, endPos, a, b);
            validateTypeAmong(startPos, endPos, a, TYPES_WITH_ORDER);
            validateTypeAmong(startPos, endPos, b, TYPES_WITH_ORDER);
          },
          function (globalState, a, b) {
            if (isInteger(a)) {
              return valueFromBool(a.lt(b));
            } else {
              let indexA = enumIndex(a);
              let indexB = enumIndex(b);
              return valueFromBool(indexA < indexB);
            }
          }
      );

    this._primitiveFunctions['>'] =
      new PrimitiveOperation(
          [typeAny, typeAny],
          function (startPos, endPos, args) {
            let a = args[0];
            let b = args[1];
            validateCompatibleTypes(startPos, endPos, a, b);
            validateTypeAmong(startPos, endPos, a, TYPES_WITH_ORDER);
            validateTypeAmong(startPos, endPos, b, TYPES_WITH_ORDER);
          },
          function (globalState, a, b) {
            if (isInteger(a)) {
              return valueFromBool(a.gt(b));
            } else {
              let indexA = enumIndex(a);
              let indexB = enumIndex(b);
              return valueFromBool(indexA > indexB);
            }
          }
      );

  }

  /* Types */

  types() {
    let typeNames = [];
    for (let typeName in this._primitiveTypes) {
      typeNames.push(typeName);
    }
    return typeNames;
  }

  typeConstructors(typeName) {
    if (!(typeName in this._primitiveTypes)) {
      throw Error('Not a primitive type: ' + typeName);
    }
    let constructorNames = [];
    for (let constructorName in this._primitiveTypes[typeName]) {
      constructorNames.push(constructorName);
    }
    return constructorNames;
  }

  constructorFields(typeName, constructorName) {
    if (!(typeName in this._primitiveTypes)) {
      throw Error('Not a primitive type: ' + typeName);
    }
    if (!(constructorName in this._primitiveTypes[typeName])) {
      throw Error('Not a primitive constructor: ' + constructorName);
    }
    return this._primitiveTypes[typeName][constructorName];
  }

  /* Operations */

  isOperation(primitiveName) {
    return primitiveName in this._primitiveProcedures
        || primitiveName in this._primitiveFunctions;
  }

  getOperation(primitiveName) {
    if (primitiveName in this._primitiveProcedures) {
      return this._primitiveProcedures[primitiveName];
    } else if (primitiveName in this._primitiveFunctions) {
      return this._primitiveFunctions[primitiveName];
    } else {
      throw Error(primitiveName + ' is not a primitive.');
    }
  }

  /* Procedures */

  procedures() {
    let procedureNames = [];
    for (let procedureName in this._primitiveProcedures) {
      procedureNames.push(procedureName);
    }
    return procedureNames;
  }

  isProcedure(primitiveName) {
    return primitiveName in this._primitiveProcedures;
  }

  /* Functions */

  functions() {
    let functionNames = [];
    for (let functionName in this._primitiveFunctions) {
      functionNames.push(functionName);
    }
    return functionNames;
  }

  isFunction(primitiveName) {
    return primitiveName in this._primitiveFunctions;
  }

}

