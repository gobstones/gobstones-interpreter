
/* Base class for signalling conditions */
export class GbsInterpreterException extends Error {
  /* Note: position should typically be an instance of SourceReader */
  constructor(startPos, endPos, message) {
    super(message, startPos.filename, startPos.row);
    this._startPos = startPos;
    this._endPos = endPos;
    this._message = message;
  }

  get startPos() {
    return this._startPos;
  }

  get endPos() {
    return this._endPos;
  }

  get message() {
    return this._message;
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

