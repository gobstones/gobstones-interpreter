
/* Base class for signalling conditions */
export class GbsInterpreterException extends Error {
  /* Note: position should typically be an instance of SourceReader */
  constructor(startPos, endPos, message) {
    super(message, startPos.filename, startPos.row);
    this.startPos = startPos;
    this.endPos = endPos;
    this.message = message;
  }
}

export class GbsWarning extends GbsInterpreterException {
  constructor(startPos, endPos, message) {
    super(startPos, endPos, message);
  }
}

export class GbsSyntaxError extends GbsInterpreterException {
  constructor(startPos, endPos, message) {
    super(startPos, endPos, message);
  }
}

export class GbsRuntimeError extends GbsInterpreterException {
  constructor(startPos, endPos, message) {
    super(startPos, endPos, message);
  }
}

