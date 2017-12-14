import { i18n } from './i18n';
import {
  ValueInteger,
  ValueList,
  ValueStructure,
  TypeAny,
  TypeInteger,
  TypeString,
  TypeStructure,
  TypeList,
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

function fail(startPos, endPos, reason, args) {
  throw new GbsRuntimeError(startPos, endPos, reason, args);
}

function boolEnum() {
  return [
    i18n('CONS:False'),
    i18n('CONS:True'),
  ];
}

function colorEnum() {
  return [
    i18n('CONS:Color0'),
    i18n('CONS:Color1'),
    i18n('CONS:Color2'),
    i18n('CONS:Color3'),
  ];
}

function dirEnum() {
  return [
    i18n('CONS:Dir0'),
    i18n('CONS:Dir1'),
    i18n('CONS:Dir2'),
    i18n('CONS:Dir3'),
  ];
}

/* Enumeration of all the constructors of the Event type, including
 * INIT and TIMEOUT. */
function keyEventEnum() {
  let modifiers = [
    '', 'CTRL_', 'ALT_', 'SHIFT_', 'CTRL_ALT_', 'CTRL_SHIFT_', 'ALT_SHIFT_',
    'CTRL_ALT_SHIFT_',
  ];
  let charKeys = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
    'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  ];
  let specialKeys = [
    'SPACE', 'ENTER', 'TAB', 'BACKSPACE', 'DELETE', 'ESCAPE',
  ];
  let symbolKeys = [
    'PLUS', 'MINUS', 'ASTERISK', 'SLASH', 'EQUALS', 'L_PARENT', 'R_PARENT',
    'L_BRACKET', 'R_BRACKET', 'L_ANGLEBR', 'R_ANGLEBR',
  ];
  let arrowKeys = [
    'ARROW_LEFT', 'ARROW_RIGHT', 'ARROW_UP', 'ARROW_DOWN',
  ];
  let keys = charKeys.concat(specialKeys).concat(symbolKeys).concat(arrowKeys);

  let eventNames = [];
  for (let modifier of modifiers) {
    for (let key of keys) {
      eventNames.push('K_' + modifier + key);
    }
  }
  return eventNames;
}

let KEY_EVENT_ENUM = keyEventEnum();

function eventEnum() {
  return [i18n('CONS:INIT'), i18n('CONS:TIMEOUT')].concat(KEY_EVENT_ENUM);
}

function toEnum(enumeration, name) {
  return enumeration.indexOf(name);
}

function fromEnum(enumeration, index) {
  return enumeration[index];
}

function dirOpposite(dirName) {
  return fromEnum(dirEnum(), (toEnum(dirEnum(), dirName) + 2) % 4);
}

function dirNext(dirName) {
  return fromEnum(dirEnum(), (toEnum(dirEnum(), dirName) + 1) % 4);
}

function dirPrev(dirName) {
  return fromEnum(dirEnum(), (toEnum(dirEnum(), dirName) + 3) % 4);
}

function colorNext(colorName) {
  return fromEnum(colorEnum(), (toEnum(colorEnum(), colorName) + 1) % 4);
}

function colorPrev(colorName) {
  return fromEnum(colorEnum(), (toEnum(colorEnum(), colorName) + 3) % 4);
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
     * By default, create an empty 9x9 board.
     */
    this._width = 11;
    this._height = 7;
    this._board = [];
    for (let x = 0; x < this._width; x++) {
      let column = [];
      for (let y = 0; y < this._height; y++) {
        column.push(this._emptyCell());
      }
      this._board.push(column);
    }
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
        for (let colorName of colorEnum()) {
          cell[colorName] = this._board[x][y][colorName];
        }
        column.push(cell);
      }
      newState._board.push(column);
    }
    newState._head = {'x': this._head.x, 'y': this._head.y};
    return newState;
  }

  /* Dump the state to a Jboard data structure */
  dump() {
    let jboard = {};
    jboard.width = this._width;
    jboard.height = this._height;
    jboard.head = [this._head.x, this._head.y];
    jboard.board = [];
    for (let x = 0; x < this._width; x++) {
      let column = [];
      for (let y = 0; y < this._height; y++) {
        let cell = {};
        cell['a'] = this._board[x][y][i18n('CONS:Color0')].asNumber();
        cell['n'] = this._board[x][y][i18n('CONS:Color1')].asNumber();
        cell['r'] = this._board[x][y][i18n('CONS:Color2')].asNumber();
        cell['v'] = this._board[x][y][i18n('CONS:Color3')].asNumber();
        column.push(cell);
      }
      jboard.board.push(column);
    }
    return jboard;
  }

  /* Load the state from a Jboard data structure */
  load(jboard) {
    this._width = jboard.width;
    this._height = jboard.height;
    this._head.x = jboard.head[0];
    this._head.y = jboard.head[1];
    for (let x = 0; x < this._width; x++) {
      for (let y = 0; y < this._height; y++) {
        let cell = jboard.board[x][y];
        this._board[x][y][i18n('CONS:Color0')] = new ValueInteger(cell['a']);
        this._board[x][y][i18n('CONS:Color1')] = new ValueInteger(cell['n']);
        this._board[x][y][i18n('CONS:Color2')] = new ValueInteger(cell['r']);
        this._board[x][y][i18n('CONS:Color3')] = new ValueInteger(cell['v']);
      }
    }
  }

  /* Gobstones specific methods */

  putStone(colorName) {
    let n = this._board[this._head.x][this._head.y][colorName];
    n = n.add(new ValueInteger(1));
    this._board[this._head.x][this._head.y][colorName] = n;
  }

  removeStone(colorName) {
    let n = this._board[this._head.x][this._head.y][colorName];
    if (n.le(new ValueInteger(0))) {
      throw Error('Cannot remove stone.');
    }
    n = n.sub(new ValueInteger(1));
    this._board[this._head.x][this._head.y][colorName] = n;
  }

  numStones(colorName) {
    return this._board[this._head.x][this._head.y][colorName];
  }

  move(dirName) {
    if (!this.canMove(dirName)) {
      throw Error('Cannot move.');
    }
    let delta = this._deltaForDirection(dirName);
    this._head.x += delta[0];
    this._head.y += delta[1];
  }

  goToEdge(dirName) {
    if (dirName === i18n('CONS:Dir0')) {
      this._head.y = this._height - 1;
    } else if (dirName === i18n('CONS:Dir1')) {
      this._head.x = this._width - 1;
    } else if (dirName === i18n('CONS:Dir2')) {
      this._head.y = 0;
    } else if (dirName === i18n('CONS:Dir3')) {
      this._head.x = 0;
    } else {
      throw Error('Invalid direction: ' + dirName);
    }
  }

  emptyBoardContents() {
    for (let x = 0; x < this._width; x++) {
      for (let y = 0; y < this._height; y++) {
        this._board[x][y] = this._emptyCell();
      }
    }
  }

  canMove(dirName) {
    let delta = this._deltaForDirection(dirName);
    let x = this._head.x + delta[0];
    let y = this._head.y + delta[1];
    return 0 <= x && x < this._width && 0 <= y && y < this._height;
  }

  _deltaForDirection(dirName) {
    let delta;
    if (dirName === i18n('CONS:Dir0')) {
      delta = [0, 1];
    } else if (dirName === i18n('CONS:Dir1')) {
      delta = [1, 0];
    } else if (dirName === i18n('CONS:Dir2')) {
      delta = [0, -1];
    } else if (dirName === i18n('CONS:Dir3')) {
      delta = [-1, 0];
    } else {
      throw Error('Invalid direction: ' + dirName);
    }
    return delta;
  }

  _emptyCell() {
    let cell = {};
    for (let colorName of colorEnum()) {
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

  call(globalState, args) {
    return this._implementation.apply(null, [globalState].concat(args));
  }

  /* Check that the arguments are valid according to the validator.
   * The validator should be a function receiving a start and end
   * positions, and a list of arguments.
   * It should throw a GbsRuntimeError if the arguments are invalid.
   */
  validateArguments(startPos, endPos, globalState, args) {
    this._argumentValidator(startPos, endPos, globalState, args);
  }

}

/* Casting Gobstones values to JavaScript values and vice-versa */

let typeAny = new TypeAny();

let typeInteger = new TypeInteger();

let typeString = new TypeString();

let typeBool = new TypeStructure(i18n('TYPE:Bool'), {});

let typeListAny = new TypeList(new TypeAny());

function valueFromBool(bool) {
  if (bool) {
    return new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:True'), {});
  } else {
    return new ValueStructure(i18n('TYPE:Bool'), i18n('CONS:False'), {});
  }
}

export function boolFromValue(value) {
  return value.constructorName === i18n('CONS:True');
}

let typeColor = new TypeStructure(i18n('TYPE:Color'), {});

function valueFromColor(colorName) {
  return new ValueStructure(i18n('TYPE:Color'), colorName, {});
}

function colorFromValue(value) {
  return value.constructorName;
}

let typeDir = new TypeStructure(i18n('TYPE:Dir'), {});

function valueFromDir(dirName) {
  return new ValueStructure(i18n('TYPE:Dir'), dirName, {});
}

function dirFromValue(value) {
  return value.constructorName;
}

/* Argument validators */

function noValidation(startPos, endPos, globalState, args) {
  /* No validation */
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

/* Generic operations */

function enumIndex(value) {
  if (isBool(value)) {
    if (boolFromValue(value)) {
      return 1;
    } else {
      return 0;
    }
  } else if (isColor(value)) {
    return toEnum(colorEnum(), colorFromValue(value));
  } else if (isDir(value)) {
    return toEnum(dirEnum(), dirFromValue(value));
  } else {
    throw Error('Value should be Bool, Color or Dir.');
  }
}

function genericLE(a, b) {
  if (isInteger(a)) {
    return valueFromBool(a.le(b));
  } else {
    let indexA = enumIndex(a);
    let indexB = enumIndex(b);
    return valueFromBool(indexA <= indexB);
  }
}

function genericGE(a, b) {
  if (isInteger(a)) {
    return valueFromBool(a.ge(b));
  } else {
    let indexA = enumIndex(a);
    let indexB = enumIndex(b);
    return valueFromBool(indexA >= indexB);
  }
}

function genericLT(a, b) {
  if (isInteger(a)) {
    return valueFromBool(a.lt(b));
  } else {
    let indexA = enumIndex(a);
    let indexB = enumIndex(b);
    return valueFromBool(indexA < indexB);
  }
}

function genericGT(a, b) {
  if (isInteger(a)) {
    return valueFromBool(a.gt(b));
  } else {
    let indexA = enumIndex(a);
    let indexB = enumIndex(b);
    return valueFromBool(indexA > indexB);
  }
}

function genericNext(a) {
  if (isInteger(a)) {
    return a.add(new ValueInteger(1));
  } else if (isBool(a)) {
    if (boolFromValue(a)) {
      return valueFromBool(false);
    } else {
      return valueFromBool(true);
    }
  } else if (isColor(a)) {
    return valueFromColor(colorNext(colorFromValue(a)));
  } else if (isDir(a)) {
    return valueFromDir(dirNext(dirFromValue(a)));
  } else {
    throw Error('genericNext: value has no next.');
  }
}

function genericPrev(a) {
  if (isInteger(a)) {
    return a.sub(new ValueInteger(1));
  } else if (isBool(a)) {
    if (boolFromValue(a)) {
      return valueFromBool(false);
    } else {
      return valueFromBool(true);
    }
  } else if (isColor(a)) {
    return valueFromColor(colorPrev(colorFromValue(a)));
  } else if (isDir(a)) {
    return valueFromDir(dirPrev(dirFromValue(a)));
  } else {
    throw Error('genericPrev: value has no prev.');
  }
}

function genericOpposite(a) {
  if (isInteger(a)) {
    return a.negate();
  } else if (isBool(a)) {
    return valueFromBool(!boolFromValue(a));
  } else if (isDir(a)) {
    return valueFromDir(dirOpposite(dirFromValue(a)));
  } else {
    throw Error('genericOpposite: value has no opposite.');
  }
}
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
  fail(startPos, endPos,
    'expected-value-of-some-type-but-got', [
      typeStrings,
      x.type().toString()
    ]
  );
}

/* Validate that the types of 'x' and 'y' are compatible */
function validateCompatibleTypes(startPos, endPos, x, y) {
  if (joinTypes(x.type(), y.type()) === null) {
    fail(startPos, endPos,
      'expected-values-to-have-compatible-types', [
        x.type().toString(),
        y.type().toString(),
      ]
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

    /* --Primitive types-- */

    /* Booleans */
    this._primitiveTypes[i18n('TYPE:Bool')] = {};
    for (let boolName of boolEnum()) {
      this._primitiveTypes[i18n('TYPE:Bool')][boolName] = [];
    }

    /* Colors */
    this._primitiveTypes[i18n('TYPE:Color')] = {};
    for (let colorName of colorEnum()) {
      this._primitiveTypes[i18n('TYPE:Color')][colorName] = [];
    }

    /* Directions */
    this._primitiveTypes[i18n('TYPE:Dir')] = {};
    for (let dirName of dirEnum()) {
      this._primitiveTypes[i18n('TYPE:Dir')][dirName] = [];
    }

    /* Events */
    this._primitiveTypes[i18n('TYPE:Event')] = {};
    for (let eventName of eventEnum()) {
      this._primitiveTypes[i18n('TYPE:Event')][eventName] = [];
    }

    /* --Primitive procedures-- */

    this._primitiveProcedures[i18n('PRIM:PutStone')] =
      new PrimitiveOperation(
        [typeColor], noValidation,
        function (globalState, color) {
          globalState.putStone(colorFromValue(color));
          return null;
        }
      );

    this._primitiveProcedures[i18n('PRIM:RemoveStone')] =
      new PrimitiveOperation(
        [typeColor],
        function (startPos, endPos, globalState, args) {
          let colorName = colorFromValue(args[0]);
          if (globalState.numStones(colorName).le(new ValueInteger(0))) {
            fail(startPos, endPos, 'cannot-remove-stone', [colorName]);
          }
        },
        function (globalState, color) {
          globalState.removeStone(colorFromValue(color));
          return null;
        }
      );

    this._primitiveProcedures[i18n('PRIM:Move')] =
      new PrimitiveOperation(
        [typeDir],
        function (startPos, endPos, globalState, args) {
          let dirName = dirFromValue(args[0]);
          if (!globalState.canMove(dirName)) {
            fail(startPos, endPos, 'cannot-move-to', [dirName]);
          }
        },
        function (globalState, dir) {
          globalState.move(dirFromValue(dir));
          return null;
        }
      );

    this._primitiveProcedures[i18n('PRIM:GoToEdge')] =
      new PrimitiveOperation(
        [typeDir], noValidation,
        function (globalState, dir) {
          globalState.goToEdge(dirFromValue(dir));
          return null;
        }
      );

    this._primitiveProcedures[i18n('PRIM:EmptyBoardContents')] =
      new PrimitiveOperation(
        [], noValidation,
        function (globalState, dir) {
          globalState.emptyBoardContents();
          return null;
        }
      );

    this._primitiveProcedures['_FAIL'] =
      /* Procedure that always fails */
      new PrimitiveOperation(
        [typeString],
        function (startPos, endPos, globalState, args) {
          fail(startPos, endPos, args[0].string, []);
        },
        function (globalState, errMsg) {
          /* Unreachable */
          return null;
        }
      );

    /* --Primitive functions-- */

    this._primitiveFunctions['_makeRange'] =
      new PrimitiveOperation(
        [typeAny, typeAny],
        function (startPos, endPos, globalState, args) {
          let first = args[0];
          let last = args[1];
          validateCompatibleTypes(startPos, endPos, first, last);
          validateTypeAmong(startPos, endPos, first, TYPES_WITH_ORDER);
          validateTypeAmong(startPos, endPos, last, TYPES_WITH_ORDER);
        },
        function (globalState, first, last) {
          let current = first;
          if (boolFromValue(genericGT(current, last))) {
            return new ValueList([]);
          }
          let result = [];
          while (boolFromValue(genericLT(current, last))) {
            result.push(current);
            current = genericNext(current);
          }
          result.push(current);
          return new ValueList(result);
        }
      );

    this._primitiveFunctions['not'] =
      new PrimitiveOperation(
        [typeBool], noValidation,
        function (globalState, x) {
          return valueFromBool(!boolFromValue(x));
        }
      );

    this._primitiveFunctions['&&'] =
      new PrimitiveOperation(
        [typeAny, typeAny], noValidation,
        /*
         * This function is a stub so the linter recognizes '&&'
         * as a defined primitive function of arity 2.
         *
         * The implementation of '&&' is treated specially by the
         * compiler to account for short-circuiting.
         */
        function (globalState, x, y) {
          throw Error('The function "&&" should never be called');
        }
      );

    this._primitiveFunctions['||'] =
      new PrimitiveOperation(
        [typeAny, typeAny], noValidation,
        /*
         * This function is a stub so the linter recognizes '||'
         * as a defined primitive function of arity 2.
         *
         * The implementation of '||' is treated specially by the
         * compiler to account for short-circuiting.
         */
        function (globalState, x, y) {
          throw Error('The function "||" should never be called');
        }
      );

    this._primitiveFunctions['_makeRangeWithSecond'] =
      new PrimitiveOperation(
        [typeAny, typeAny, typeAny],
        function (startPos, endPos, globalState, args) {
          let first = args[0];
          let last = args[1];
          let second = args[2];
          validateTypeAmong(startPos, endPos, first, [typeInteger]);
          validateTypeAmong(startPos, endPos, last, [typeInteger]);
          validateTypeAmong(startPos, endPos, second, [typeInteger]);
        },
        function (globalState, first, last, second) {
          let delta = second.sub(first);
          if (delta.lt(new ValueInteger(1))) {
            return new ValueList([]);
          }
          let current = first;
          let result = [];
          while (current.le(last)) {
            result.push(current);
            current = current.add(delta);
          }
          return new ValueList(result);
        }
      );

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

    this._primitiveFunctions[i18n('PRIM:anyStones')] =
      new PrimitiveOperation(
        [typeColor], noValidation,
        function (globalState, color) {
          let num = globalState.numStones(colorFromValue(color));
          return valueFromBool(num.gt(new ValueInteger(0)));
        }
      );

    this._primitiveFunctions[i18n('PRIM:canMove')] =
      new PrimitiveOperation(
        [typeDir], noValidation,
        function (globalState, dir) {
          return valueFromBool(globalState.canMove(dirFromValue(dir)));
        }
      );

    this._primitiveFunctions[i18n('PRIM:next')] =
      new PrimitiveOperation(
        [typeAny],
        function (startPos, endPos, globalState, args) {
          let value = args[0];
          validateTypeAmong(startPos, endPos, value, TYPES_WITH_ORDER);
        },
        function (globalState, value) {
          return genericNext(value);
        }
      );

    this._primitiveFunctions[i18n('PRIM:prev')] =
      new PrimitiveOperation(
        [typeAny],
        function (startPos, endPos, globalState, args) {
          let value = args[0];
          validateTypeAmong(startPos, endPos, value, TYPES_WITH_ORDER);
        },
        function (globalState, value) {
          return genericPrev(value);
        }
      );

    this._primitiveFunctions[i18n('PRIM:opposite')] =
      new PrimitiveOperation(
        [typeAny],
        function (startPos, endPos, globalState, args) {
          let value = args[0];
          validateTypeAmong(startPos, endPos, value, TYPES_WITH_ORDER);
        },
        function (globalState, value) {
          return genericOpposite(value);
        }
      );

    this._primitiveFunctions[i18n('PRIM:minBool')] =
      new PrimitiveOperation(
        [], noValidation,
        function (globalState) {
          return valueFromBool(false);
        }
      );

    this._primitiveFunctions[i18n('PRIM:maxBool')] =
      new PrimitiveOperation(
        [], noValidation,
        function (globalState) {
          return valueFromBool(true);
        }
      );

    this._primitiveFunctions[i18n('PRIM:minColor')] =
      new PrimitiveOperation(
        [], noValidation,
        function (globalState) {
          return valueFromColor(colorEnum()[0]);
        }
      );

    this._primitiveFunctions[i18n('PRIM:maxColor')] =
      new PrimitiveOperation(
        [], noValidation,
        function (globalState) {
          return valueFromColor(colorEnum()[colorEnum().length - 1]);
        }
      );

    this._primitiveFunctions[i18n('PRIM:minDir')] =
      new PrimitiveOperation(
        [], noValidation,
        function (globalState) {
          return valueFromDir(dirEnum()[0]);
        }
      );

    this._primitiveFunctions[i18n('PRIM:maxDir')] =
      new PrimitiveOperation(
        [], noValidation,
        function (globalState) {
          return valueFromDir(dirEnum()[dirEnum().length - 1]);
        }
      );

    /* Arithmetic operators */

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

    this._primitiveFunctions['*'] =
      new PrimitiveOperation(
        [typeInteger, typeInteger], noValidation,
        function (globalState, a, b) {
          return a.mul(b);
        }
      );

    this._primitiveFunctions['div'] =
      new PrimitiveOperation(
        [typeInteger, typeInteger],
        function (startPos, endPos, globalState, args) {
          let b = args[1];
          if (b.eq(new ValueInteger(0))) {
            fail(startPos, endPos, 'cannot-divide-by-zero', []);
          }
        },
        function (globalState, a, b) {
          return a.div(b);
        }
      );

    this._primitiveFunctions['mod'] =
      new PrimitiveOperation(
        [typeInteger, typeInteger],
        function (startPos, endPos, globalState, args) {
          let b = args[1];
          if (b.eq(new ValueInteger(0))) {
            fail(startPos, endPos, 'cannot-divide-by-zero', []);
          }
        },
        function (globalState, a, b) {
          return a.mod(b);
        }
      );

    this._primitiveFunctions['-(unary)'] =
      new PrimitiveOperation(
        [typeAny],
        function (startPos, endPos, globalState, args) {
          let a = args[0];
          validateTypeAmong(startPos, endPos, a, TYPES_WITH_OPPOSITE);
        },
        function (globalState, a) {
          return genericOpposite(a);
        }
      );

    /* Relational operators */

    this._primitiveFunctions['=='] =
      new PrimitiveOperation(
        [typeAny, typeAny],
        function (startPos, endPos, globalState, args) {
          let a = args[0];
          let b = args[1];
          validateCompatibleTypes(startPos, endPos, a, b);
        },
        function (globalState, a, b) {
          return valueFromBool(a.equal(b));
        }
      );

    this._primitiveFunctions['/='] =
      new PrimitiveOperation(
        [typeAny, typeAny],
        function (startPos, endPos, globalState, args) {
          let a = args[0];
          let b = args[1];
          validateCompatibleTypes(startPos, endPos, a, b);
        },
        function (globalState, a, b) {
          return valueFromBool(!a.equal(b));
        }
      );

    this._primitiveFunctions['<='] =
      new PrimitiveOperation(
        [typeAny, typeAny],
        function (startPos, endPos, globalState, args) {
          let a = args[0];
          let b = args[1];
          validateCompatibleTypes(startPos, endPos, a, b);
          validateTypeAmong(startPos, endPos, a, TYPES_WITH_ORDER);
          validateTypeAmong(startPos, endPos, b, TYPES_WITH_ORDER);
        },
        function (globalState, a, b) {
          return genericLE(a, b);
        }
      );

    this._primitiveFunctions['>='] =
      new PrimitiveOperation(
        [typeAny, typeAny],
        function (startPos, endPos, globalState, args) {
          let a = args[0];
          let b = args[1];
          validateCompatibleTypes(startPos, endPos, a, b);
          validateTypeAmong(startPos, endPos, a, TYPES_WITH_ORDER);
          validateTypeAmong(startPos, endPos, b, TYPES_WITH_ORDER);
        },
        function (globalState, a, b) {
          return genericGE(a, b);
        }
      );

    this._primitiveFunctions['<'] =
      new PrimitiveOperation(
        [typeAny, typeAny],
        function (startPos, endPos, globalState, args) {
          let a = args[0];
          let b = args[1];
          validateCompatibleTypes(startPos, endPos, a, b);
          validateTypeAmong(startPos, endPos, a, TYPES_WITH_ORDER);
          validateTypeAmong(startPos, endPos, b, TYPES_WITH_ORDER);
        },
        function (globalState, a, b) {
          return genericLT(a, b);
        }
      );

    this._primitiveFunctions['>'] =
      new PrimitiveOperation(
        [typeAny, typeAny],
        function (startPos, endPos, globalState, args) {
          let a = args[0];
          let b = args[1];
          validateCompatibleTypes(startPos, endPos, a, b);
          validateTypeAmong(startPos, endPos, a, TYPES_WITH_ORDER);
          validateTypeAmong(startPos, endPos, b, TYPES_WITH_ORDER);
        },
        function (globalState, a, b) {
          return genericGT(a, b);
        }
      );

    /* User-triggered failure */

    this._primitiveProcedures[i18n('PRIM:BOOM')] =
      new PrimitiveOperation(
        [typeString],
        function (startPos, endPos, globalState, args) {
          fail(startPos, endPos, 'boom-called', [args[0].string]);
        },
        function (globalState, msg) {
          throw Error('Should not be reachable.');
        }
      );

    this._primitiveFunctions[i18n('PRIM:boom')] =
      this._primitiveProcedures[i18n('PRIM:BOOM')];

    /* List opreators */
    this._primitiveFunctions['++'] =
      new PrimitiveOperation(
        [typeListAny, typeListAny],
        function (startPos, endPos, globalState, args) {
          let a = args[0];
          let b = args[1];
          validateCompatibleTypes(startPos, endPos, a, b);
        },
        function (globalState, a, b) {
          return a.append(b);
        }
      );

    this._primitiveFunctions[i18n('PRIM:head')] =
      new PrimitiveOperation(
        [typeListAny],
        function (startPos, endPos, globalState, args) {
          let a = args[0];
          if (a.length() === 0) {
            fail(startPos, endPos, 'list-cannot-be-empty', []);
          }
        },
        function (globalState, a) {
          return a.head();
        }
      );

    this._primitiveFunctions[i18n('PRIM:tail')] =
      new PrimitiveOperation(
        [typeListAny],
        function (startPos, endPos, globalState, args) {
          let a = args[0];
          if (a.length() === 0) {
            fail(startPos, endPos, 'list-cannot-be-empty', []);
          }
        },
        function (globalState, a) {
          return a.tail();
        }
      );

    this._primitiveFunctions[i18n('PRIM:init')] =
      new PrimitiveOperation(
        [typeListAny],
        function (startPos, endPos, globalState, args) {
          let a = args[0];
          if (a.length() === 0) {
            fail(startPos, endPos, 'list-cannot-be-empty', []);
          }
        },
        function (globalState, a) {
          return a.init();
        }
      );

    this._primitiveFunctions[i18n('PRIM:last')] =
      new PrimitiveOperation(
        [typeListAny],
        function (startPos, endPos, globalState, args) {
          let a = args[0];
          if (a.length() === 0) {
            fail(startPos, endPos, 'list-cannot-be-empty', []);
          }
        },
        function (globalState, a) {
          return a.last();
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

