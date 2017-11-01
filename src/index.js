/* Gobstones API for backwards compatibility with gs-weblang-core */
import { boolFromValue, RuntimeState } from './runtime.js';
import { Runner } from './runner.js';
import { i18n, i18nWithLanguage } from './i18n.js';
import { apiboardFromJboard, apiboardToJboard } from './board_formats.js';

const fs = require('fs');

const DEFAULT_INFINITE_LOOP_TIMEOUT = 3000; /* millisecs */
const DEFAULT_LANGUAGE = 'es'; /* millisecs */

/* Backwards-compatible type/value with special cases for some types */
function apivalueFromValue(value) {
  if (value === null) {
    return null;
  }
  if (value.isInteger()) {
    return {
      type: i18n('TYPE:Integer'),
      value: value.asNumber()
    };
  } else if (value.isBoolean()) {
    return {
      type: i18n('TYPE:Bool'),
      value: boolFromValue(value)
    };
  } else if (value.isString()) {
    return {
      type: i18n('TYPE:String'),
      value: value.string
    };
  } else if (value.isStructure()) {
    return {
      type: value.typeName,
      value: value.toString()
    };
  } else {
    return {
      type: value.type().toString(),
      value: value.toString()
    };
  }
}

class NormalExecutionResult {
  constructor(finalBoard, snapshots, returnValue) {
    this.finalBoard = finalBoard;
    this.snapshots = snapshots;
    this.returnValue = apivalueFromValue(returnValue);

    /* Actual return value */
    this.actualReturnValue = returnValue;
  }
}

class InteractiveExecutionResult {
  // TODO
}

class GobstonesInterpreterError {

  constructor(exception) {
    this.message = exception.message;
    this.reason = {
      code: exception.reason,
      detail: exception.args
    };
    this.on = {
      range: {
        start: {
          row: exception.startPos.line,
          column: exception.startPos.column
        },
        end: {
          row: exception.endPos.line,
          column: exception.endPos.column
        },
      },
      region: exception.startPos.region
    };
  }

}

class ParseError extends GobstonesInterpreterError {
  constructor(exception) {
    super(exception);
  }
}

class ExecutionError extends GobstonesInterpreterError {
  constructor(exception) {
    super(exception);
  }
}

function apiboardToState(apiboard) {
  let state = new RuntimeState();
  state.load(apiboardToJboard(apiboard));
  return state;
}

function apiboardFromState(state) {
  return apiboardFromJboard(state.dump());
}

class ParseResult {

  constructor(state) {
    if (state.runner.symbolTable.program === null) {
      this.program = null;
    } else if (state.runner.symbolTable.isInteractiveProgram()) {
      this._resultForInteractiveProgram(state);
    } else {
      this._resultForProgram(state);
    }
    this.declarations = this._collectDeclarations(state.runner);
  }

  _resultForProgram(state) {
    this.program = {};
    this.program.alias = 'program';
    this.program.interpret = function (board) {
      return i18nWithLanguage(state.language, () => {
        try {
          state.runner.compile();
          state.runner.executeWithTimeout(
            state.infiniteLoopTimeout,
            apiboardToState(board)
          );

          let finalBoard = apiboardFromState(state.runner.globalState);
          let snapshots = []; // TODO
          let returnValue = state.runner.result;
          return new NormalExecutionResult(
            finalBoard,
            snapshots,
            returnValue,
          );
        } catch (exception) {
          if (exception.isGobstonesException === undefined) {
            throw exception;
          }
          return new ExecutionError(exception)
        }
      });
    };
  }

  _resultForInteractiveProgram(state) {
    this.program = {};
    this.program.alias = 'interactiveProgram';
    this.program.interpret = function (board) {
      return i18nWithLanguage(state.language, () => {
        // TODO
      });
    };
  }

  _collectDeclarations(runner) {
    let declarations = [];
    for (let name of runner.symbolTable.allProcedureNames()) {
      if (runner.primitives.isProcedure(name)) {
        continue; /* Skip primitive procedures */
      }
      declarations.push({
        alias: 'procedureDeclaration',
        name: name
      });
    }
    for (let name of runner.symbolTable.allFunctionNames()) {
      if (runner.primitives.isFunction(name)) {
        continue; /* Skip primitive functions */
      }
      declarations.push({
        alias: 'functionDeclaration',
        name: name
      });
    }
    return declarations;
  }

}

export class GobstonesInterpreterAPI {

  constructor() {
    /* Internal state of the interpreter */
    let state = {
      infiniteLoopTimeout: DEFAULT_INFINITE_LOOP_TIMEOUT,
      language: DEFAULT_LANGUAGE,
      runner: new Runner(),
    };

    this.config = {
      setLanguage: function (code) {
        state.language = code;
      },
      setInfiniteLoopTimeout: function (milliseconds) {
        state.infiniteLoopTimeout = milliseconds;
      },
      setXGobstonesEnabled: function (isEnabled) {
        // TODO
      },
    };

    this.gbb = {
      read: function (gbb) {}, // TODO
      write: function (string) {}, // TODO
    };

    this.parse = function (sourceCode) {
      return i18nWithLanguage(state.language, () => {
        try {
          state.runner.initialize();
          state.runner.parse(sourceCode);
          /* Disable checking whether there is a main 'program' present. */
          state.runner.enableLintCheck(
            'source-should-have-a-program-definition', false
          );
          state.runner.lint();
          return new ParseResult(state);
        } catch (exception) {
          if (exception.isGobstonesException === undefined) {
            throw exception;
          }
          return new ParseError(exception)
        }
      });
    };

  }

}

