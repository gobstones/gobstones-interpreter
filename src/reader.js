
/* A SourceReader represents the current position in a source file.
 * It keeps track of line and column numbers.
 * Methods are non-destructive. For example:
 *
 *     var r = new SourceReader('foo.gbs', 'if\n(True)');
 *
 *     r.peek();                       // ~~> 'i'
 *     r = r.consumeCharacter();       // Note: returns a new file reader.
 *
 *     r.peek();                       // ~~> 'f'
 *     r = r.consumeCharacter();
 *
 *     r.peek();                       // ~~> '\n'
 *     r = r.consumeCharacter('\n');
 *
 *     r.line();                       // ~~> 2
 */
export class SourceReader {

  constructor(filename, string) {
    this._filename = filename;   // Filename
    this._string = string;       // Source of the current file
    this._index = 0;             // Index in the current file
    this._line = 1;              // Line in the current file
    this._column = 1;            // Column in the current file
    this._regions = [];          // Stack of regions
  }

  _clone() {
    var r = new SourceReader(this._filename, this._string);
    r._index = this._index;
    r._line = this._line;
    r._column = this._column;
    r._regions = this._regions;
    return r;
  }

  get filename() {
    return this._filename;
  }

  get line() {
    return this._line;
  }

  get column() {
    return this._column;
  }

  get region() {
    if (this._regions.length > 0) {
      return this._regions[0];
    } else {
      return '';
    }
  }

  /* Consume one character */
  consumeCharacter() {
    var r = this._clone();
    if (r.peek() === '\n') {
      r._line++;
      r._column = 1;
    } else {
      r._column++;
    }
    r._index++;
    return r;
  }

  /* Consume characters from the input, one per each character in the string
   * (the contents of the string are ignored). */
  consumeString(string) {
    var r = this;
    for (var _ in string) {
      r = r.consumeCharacter();
    }
    return r;
  }

  /* Returns the SourceReader after consuming an 'invisible' character.
   * Invisible characters affect the index but not the line or column.
   */
  consumeInvisibleCharacter() {
    var r = this._clone();
    r._index++;
    return r;
  }

  /* Consume 'invisible' characters from the input, one per each character
   * in the string */
  consumeInvisibleString(string) {
    var r = this;
    for (var _ in string) {
      r = r.consumeInvisibleCharacter();
    }
    return r;
  }

  /* Return true if the substring occurs at the current point. */
  startsWith(sub) {
    var i = this._index;
    var j = this._index + sub.length;
    return j <= this._string.length && this._string.substring(i, j) === sub;
  }

  /* Return true if we have reached the end of the current file */
  eof() {
    return this._index >= this._string.length;
  }

  /* Return the current character, assuming we have not reached EOF */
  peek() {
    return this._string[this._index];
  }

  /* Push a region to the stack of regions (non-destructively) */
  beginRegion(region) {
    var r = this._clone();
    r._regions = [region].concat(r._regions);
    return r;
  }

  /* Pop a region from the stack of regions (non-destructively) */
  endRegion() {
    var r = this._clone();
    if (r._regions.length > 0) {
      r._regions = r._regions.slice(1);
    }
    return r;
  }

}

/* An instance of MultifileReader represents a scanner for reading
 * source code from a list of files.
 */
export class MultifileReader {

  /* Sources is either:
   * (1) a string. e.g.  'program {}', or
   * (2) a map from filenames to strings, e.g.
   *     {
   *       'foo.gbs': 'program { P() }',
   *       'bar.gbs': 'procedure P() {}',
   *     }
   */
  constructor(input) {
    if (typeof input === 'string') {
      input = {'(?)': input};
    }
    this._filenames = Object.keys(input);
    this._filenames.sort();
    this._sources = input;
    this._index = 0;
  }

  /* Return true if there are more files */
  moreFiles() {
    return this._index + 1 < this._filenames.length;
  }

  /* Advance to the next file */
  nextFile() {
    this._index++;
  }

  /* Return a SourceReader for the current files */
  readCurrentFile() {
    if (this._index < this._filenames.length) {
      var filename = this._filenames[this._index];
      return new SourceReader(filename, this._sources[filename]);
    } else {
      return new SourceReader('(?)', '');
    }
  }

}

