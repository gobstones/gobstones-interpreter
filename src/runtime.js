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
} from './value';

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

let COLOR_NAMES = [
  i18n('CONS:Color0'),
  i18n('CONS:Color1'),
  i18n('CONS:Color2'),
  i18n('CONS:Color3'),
];

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
        for (let colorName of COLOR_NAMES) {
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
    this._board[this._head.x][this._head.y][colorName]++;
  }

  numStones(colorName) {
    return this._board[this._head.x][this._head.y][colorName];
  }

  _emptyCell() {
    let cell = {};
    for (let colorName of COLOR_NAMES) {
      cell[colorName] = 0;
    }
    return cell;
  }
}

class PrimitiveOperation {
  constructor(argumentTypes, implementation) {
    this._argumentTypes = argumentTypes;
    this._implementation = implementation;
  }

  get argumentTypes() {
    return this._argumentTypes;
  }

  /* Warning: mutates 'args' destructively */
  call(globalState, args) {
    args.unshift(globalState);
    return this._implementation.apply(null, args);
  }
}

const TypeColor = new TypeStructure(i18n('TYPE:Color'), {});

export class RuntimePrimitives {

  constructor() {
    this._primitiveOperations = {};
    this._primitiveTypes = {};

    /*** Primitive types ***/

    /* Booleans */
    this._primitiveTypes[i18n('TYPE:Bool')] = {};
    this._primitiveTypes[i18n('TYPE:Bool')][i18n('CONS:False')] = [];
    this._primitiveTypes[i18n('TYPE:Bool')][i18n('CONS:True')] = [];

    /* Colors */
    this._primitiveTypes[i18n('TYPE:Color')] = {};
    for (let colorName of COLOR_NAMES) {
      this._primitiveTypes[i18n('TYPE:Color')][colorName] = [];
    }

    /*** Primitive operations ***/

    this._primitiveOperations[i18n('PRIM:PutStone')] =
      new PrimitiveOperation(
          [TypeColor],
          function (globalState, color) {
            let colorName = color.constructorName;
            globalState.putStone(colorName);
            return null;
          }
      );

    this._primitiveOperations[i18n('PRIM:numStones')] =
      new PrimitiveOperation(
          [TypeColor],
          function (globalState, color) {
            let colorName = color.constructorName;
            return new ValueInteger(globalState.numStones(colorName));
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
    return primitiveName in this._primitiveOperations;
  }

  getOperation(primitiveName) {
    return this._primitiveOperations[primitiveName];
  }

}

