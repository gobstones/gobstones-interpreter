/* Gobstones API for backwards compatibility with gs-weblang-core */
import { RuntimeState } from './runtime.js';
import { Runner } from './runner.js';

const fs = require('fs');

class ParseResult {

  constructor(runner) {

    this.program = {};
    if (runner.symbolTable.isInteractiveProgram()) {
      this.program.alias = 'interactiveProgram';
    } else {
      this.program.alias = 'program';
    }
    this.program.interpret = function (board) {
      // TODO
    };

    this.declarations = []; // TODO
  }

}

class ParseError {
  constructor(exception) {
    this.message = exception.message;
    this.reason = {};
    this.reason.code = exception.reason;
    this.reason.detail = exception.args;
    this.on = {};
    this.on.range = {};
    this.on.range.start = {};
    this.on.range.start.row = exception.startPos.line;
    this.on.range.start.column = exception.startPos.column;
    this.on.range.end = {};
    this.on.range.end.row = exception.endPos.line;
    this.on.range.end.column = exception.endPos.column;
    this.on.region = exception.startPos.region;
  }
}

export class GobstonesInterpreterAPI {

  constructor() {

    this.config = {};
    this.config.setLanguage = function (code) {
      // TODO
    };
    this.config.setInfiniteLoopTimeout = function (milliseconds) {
      // TODO
    };
    this.config.setXGobstonesEnabled = function (isEnabled) {
      // TODO
    };

    this.gbb = {};
    this.gbb.read = function (gbb) {
      // TODO
    };
    this.gbb.write = function (gbb) {
      // TODO
    };

    this.parse = function (sourceCode) {
      try {
        let runner = new Runner();
        runner.parse(sourceCode);
        /* Do not check if there is a main 'program' present. */
        runner.enableLintCheck(
          'source-should-have-a-program-definition', false
        );
        runner.lint();
        return new ParseResult(runner);
      } catch (exception) {
        if (exception.isGobstonesException === undefined) {
          throw exception;
        }
        return new ParseError(exception)
      }
    };
  }

}

