
/*
 * A board format FMT is a pair of two functions:
 *
 *   fromJboard : jboard -> string
 *   toJboard   : string -> jboard
 *
 * where "string" is a string in the given format, and
 * "jboard" is the internal format produced/consumed by
 * the RuntimeState class in src/runtime.js.
 *
 * Internal format:
 *   jboard.width  = width of the board
 *   jboard.height = height of the board
 *   jboard.head   = array [x, y] with the position of the head
 *   jboard.board  = array of <width> elements,
 *                   each of which is an array of <height> elements,
 *                   each of which is a cell, of the form
 *                     {"a": na, "n": nn, "r": nr, "v": nv}
 *                   in such a way that:
 *                     jboard.board[x][y].a = number of blue  stones at (x, y)
 *                     jboard.board[x][y].n = number of black stones at (x, y)
 *                     jboard.board[x][y].r = number of red   stones at (x, y)
 *                     jboard.board[x][y].v = number of green stones at (x, y)
 */

class BoardFormat {
  constructor(formatName, description, extension, fromJboard, toJboard) {
    this._formatName = formatName;
    this._description = description;
    this._extension = extension;
    this._fromJboard = fromJboard;
    this._toJboard = toJboard;
  }

  get formatName() {
    return this._formatName;
  }

  get description() {
    return this._description;
  }

  get extension() {
    return this._extension;
  }

  get fromJboard() {
    return this._fromJboard;
  }

  get toJboard() {
    return this._toJboard;
  }
}

function gsboardFromJboard(jboard) {
  let gsboard = {};
  gsboard.x = jboard.head[0];
  gsboard.y = jboard.head[1];
  gsboard.sizeX = jboard.width;
  gsboard.sizeY = jboard.height;
  gsboard.table = [];
  for (let y = 0; y < jboard.height; y++) {
    let row = [];
    for (let x = 0; x < jboard.width; x++) {
      let cell = jboard.board[x][y];
      row.push({
        'blue': cell.a,
        'black': cell.n,
        'red': cell.r,
        'green': cell.v,
      });
    }
    gsboard.table.unshift(row);
  }
  return JSON.stringify(gsboard);
}

function gsboardToJboard(gsBoardString) {
  let gsboard = JSON.parse(gsBoardString);
  let jboard = {};
  jboard.head = [gsboard.x, gsboard.y];
  jboard.width = gsboard.sizeX;
  jboard.height = gsboard.sizeY;
  jboard.board = [];
  for (let x = 0; x < jboard.width; x++) {
    let column = [];
    for (let y = 0; y < jboard.height; y++) {
      let cell = gsboard.table[jboard.height - y - 1][x];
      column.push({
        'a': cell.blue,
        'n': cell.black,
        'r': cell.red,
        'v': cell.green,
      });
    }
    jboard.board.push(column);
  }
  return jboard;
}

let BOARD_FORMAT_LIST = [

  new BoardFormat(
    'jboard',
    'Representation of a board as a JavaScript object for internal usage.',
    'jboard',
    JSON.stringify,
    JSON.parse
  ),

  new BoardFormat(
    'gs-weblang-cli-json-board',
    'Representation of a board as a Javascript object' +
    ' used by the gs-weblang-cli tool.',
    'json',
    gsboardFromJboard,
    gsboardToJboard
  ),

];

export let DEFAULT_FORMAT = 'gs-weblang-cli-json-board';
export let BOARD_FORMATS = {};
for (let boardFormat of BOARD_FORMAT_LIST) {
  BOARD_FORMATS[boardFormat.formatName] = boardFormat;
}

function fileExtension(filename) {
  let parts = filename.split('.');
  return parts[parts.length - 1];
}

function fileBoardFormat(filename) {
  let extension = fileExtension(filename);
  for (let fmt of BOARD_FORMAT_LIST) {
    if (extension === fmt.extension) {
      return fmt;
    }
  }
  return BOARD_FORMATS[DEFAULT_FORMAT];
}

const fs = require('fs');

export function readJboardFromFile(filename) {
  let format = fileBoardFormat(filename);
  let contents = fs.readFileSync(filename, 'utf8');
  return format.toJboard(contents);
}

export function writeJboardToFile(filename, jboard) {
  let format = fileBoardFormat(filename);
  let contents = format.fromJboard(jboard);
  fs.writeFileSync(filename, contents, 'utf8');
}

