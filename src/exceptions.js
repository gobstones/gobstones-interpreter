
/* Base class for signalling conditions */
export class GobstonesInterpreterException extends Error {
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

export class Warning extends GobstonesInterpreterException {
  constructor(position, message) {
    super(position, message);
  }
}

export class SyntaxError extends GobstonesInterpreterException {
  constructor(position, message) {
    super(position, message);
  }
}

