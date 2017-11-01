
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

export function apiboardFromJboard(jboard) {
  let apiboard = {};
  apiboard.head = {x: jboard.head[0], y: jboard.head[1]};
  apiboard.width = jboard.width;
  apiboard.height = jboard.height;
  apiboard.table = [];
  for (let y = 0; y < jboard.height; y++) {
    let row = [];
    for (let x = 0; x < jboard.width; x++) {
      let cellO = jboard.board[x][y];
      let cell = {};
      if (cellO.a > 0) {
        cell.blue = cellO.a;
      }
      if (cellO.n > 0) {
        cell.black = cellO.n;
      }
      if (cellO.r > 0) {
        cell.red = cellO.r;
      }
      if (cellO.v > 0) {
        cell.green = cellO.v;
      }
      row.push(cell);
    }
    apiboard.table.unshift(row);
  }
  return apiboard;
}

export function apiboardToJboard(apiboard) {
  let jboard = {};
  jboard.head = [apiboard.head.x, apiboard.head.y];
  jboard.width = apiboard.width;
  jboard.height = apiboard.height;
  jboard.board = [];
  for (let x = 0; x < jboard.width; x++) {
    let column = [];
    for (let y = 0; y < jboard.height; y++) {
      let cell = apiboard.table[jboard.height - y - 1][x];
      let ca = ('blue' in cell) ? cell.blue : 0;
      let cn = ('black' in cell) ? cell.black : 0;
      let cr = ('red' in cell) ? cell.red : 0;
      let cv = ('green' in cell) ? cell.green : 0;
      column.push({
        'a': ca,
        'n': cn,
        'r': cr,
        'v': cv,
      });
    }
    jboard.board.push(column);
  }
  return jboard;
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

function gbbFromJboard(jboard) {
  let gbb = [];
  gbb.push('GBB/1.0');
  gbb.push(
    'size'
    + ' ' + jboard.width.toString()
    + ' ' + jboard.height.toString()
  );
  gbb.push(
    'head'
    + ' ' + jboard.head[0].toString()
    + ' ' + jboard.head[1].toString()
  );
  for (let y = 0; y < jboard.height; y++) {
    for (let x = 0; x < jboard.width; x++) {
      let cell = jboard.board[x][y];
      let c = 'cell ' + x.toString() + ' ' + y.toString();
      c += ' A ' + cell.a.toString();
      c += ' N ' + cell.n.toString();
      c += ' R ' + cell.r.toString();
      c += ' V ' + cell.v.toString();
      gbb.push(c);
    }
  }
  return gbb.join('\n') + '\n';
}

function gbbToJboard(gbb) {
  throw Error('Not implemented.');
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

  new BoardFormat(
    'gbb',
    'GBB/1.0',
    'gbb',
    gbbFromJboard,
    gbbToJboard,
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

