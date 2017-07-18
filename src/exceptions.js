
/* Base class for signalling conditions */
export class GbsInterpreterException extends Error {
  /* Note: position should typically be an instance of SourceReader */
  constructor(position, message) {
    super(message, position.filename, position.row);
    this._position = position;
    this._message = message;
  }

  get message() {
    return this._message;
  }
}

export class GbsWarning extends GbsInterpreterException {
  constructor(position, message) {
    super(position, message);
  }
}

export class GbsSyntaxError extends GbsInterpreterException {
  constructor(position, message) {
    super(position, message);
  }
}

