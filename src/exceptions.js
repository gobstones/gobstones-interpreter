import { i18n } from './i18n';

/* Base class for signalling conditions */
export class GbsInterpreterException extends Error {
  /* Note: position should typically be an instance of SourceReader */
  constructor(startPos, endPos, errorType, reason, args) {
    super(reason, startPos.filename, startPos.row);
    this.isGobstonesException = true;
    this.startPos = startPos;
    this.endPos = endPos;
    this.reason = reason;
    this.args = args;

    this.message = i18n(errorType + ':' + reason);
    if (args.length > 0 && typeof this.message === 'function') {
      this.message = this.message.apply(null, args);
    }
  }
}

export class GbsWarning extends GbsInterpreterException {
  constructor(startPos, endPos, reason, args) {
    super(startPos, endPos, 'warning', reason, args);
  }
}

export class GbsSyntaxError extends GbsInterpreterException {
  constructor(startPos, endPos, reason, args) {
    super(startPos, endPos, 'errmsg', reason, args);
  }
}

export class GbsRuntimeError extends GbsInterpreterException {
  constructor(startPos, endPos, reason, args) {
    super(startPos, endPos, 'errmsg', reason, args);
  }
}

