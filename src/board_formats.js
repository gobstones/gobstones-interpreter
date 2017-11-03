
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

export function gbbFromJboard(jboard) {
  let gbb = [];
  gbb.push('GBB/1.0');
  gbb.push(
    'size'
    + ' ' + jboard.width.toString()
    + ' ' + jboard.height.toString()
  );
  for (let y = 0; y < jboard.height; y++) {
    for (let x = 0; x < jboard.width; x++) {
      let cell = jboard.board[x][y];
      if (cell.a + cell.n + cell.r + cell.v === 0) {
        continue;
      }
      let c = 'cell ' + x.toString() + ' ' + y.toString();
      if (cell.a > 0) {
        c += ' Azul ' + cell.a.toString();
      }
      if (cell.n > 0) {
        c += ' Negro ' + cell.n.toString();
      }
      if (cell.r > 0) {
        c += ' Rojo ' + cell.r.toString();
      }
      if (cell.v > 0) {
        c += ' Verde ' + cell.v.toString();
      }
      gbb.push(c);
    }
  }
  gbb.push(
    'head'
    + ' ' + jboard.head[0].toString()
    + ' ' + jboard.head[1].toString()
  );
  return gbb.join('\n') + '\n';
}

export function gbbToJboard(gbb) {
  let i = 0;
  let jboard = {};

  function isWhitespace(x) {
    return x == ' ' || x == '\t' || x == '\r' || x == '\n';
  }

  function isNumeric(str) {
    for (let i = 0; i < str.length; i++) {
      if ('0123456789'.indexOf(str[i]) === -1) {
        return false;
      }
    }
    return str.length > 0;
  }

  function skipWhitespace() {
    /* Skip whitespace */
    if (i < gbb.length && isWhitespace(gbb[i])) {
      i++;
    }
  }

  function readToken() {
    let t = [];
    skipWhitespace();
    while (i < gbb.length && !isWhitespace(gbb[i])) {
      t.push(gbb[i]);
      i++;
    }
    return t.join('');
  }

  function readN(errmsg) {
    let t = readToken();
    if (!isNumeric(t)) {
      throw Error(errmsg);
    }
    t = parseInt(t)
    if (t < 0) {
      throw Error(errmsg);
    }
    return t;
  }

  function readRange(a, b, errmsg) {
    let t = readN(errmsg);
    if (t < a || t >= b) {
      throw Error(errmsg);
    }
    return t;
  }

  if (readToken() !== 'GBB/1.0') {
    throw Error('GBB/1.0: Board not in GBB/1.0 format.');
  }
  if (readToken() !== 'size') {
    throw Error('GBB/1.0: Board lacks a size declaration.');
  }
  jboard.width = readN('GBB/1.0: Board width is not a number.');
  jboard.height = readN('GBB/1.0: Board height is not a number.');
  if (jboard.width <= 0 || jboard.height <= 0) {
    throw Error('GBB/1.0: Board size should be positive.');
  }
  jboard.head = [0, 0];
  jboard.board = [];
  for (let i = 0; i < jboard.width; i++) {
    let row = [];
    for (let j = 0; j < jboard.height; j++) {
      row.push({'a': 0, 'n': 0, 'r': 0, 'v': 0});
    }
    jboard.board.push(row);
  }

  let headDeclared = false;
  let cellDeclared = {};
  let colores = {
    'Azul': 'a',
    'A': 'a',
    'Negro': 'n',
    'N': 'n',
    'Rojo': 'r',
    'R': 'r',
    'Verde': 'v',
    'V': 'v',
  };

  while (i < gbb.length) {
    let op = readToken();
    if (op === '') {
      break;
    } else if (op === 'head') {
      if (headDeclared) {
        throw Error('GBB/1.0: Head position cannot be declared twice.');
      }
      headDeclared = true;
      let hx = readRange(0, jboard.width, 'GBB/1.0: Invalid head position.');
      let hy = readRange(0, jboard.height, 'GBB/1.0: Invalid head position.');
      jboard.head = [hx, hy];
    } else if (op === 'cell') {
      let cx = readRange(0, jboard.width, 'GBB/1.0: Invalid cell position.');
      let cy = readRange(0, jboard.height, 'GBB/1.0: Invalid cell position.');
      if ([cx, cy] in cellDeclared) {
        throw Error('GBB/1.0: Cell cannot be declared twice.');
      }
      cellDeclared[[cx, cy]] = true;

      let colorDeclared = {};
      while (i < gbb.length) {
        let color = readToken();
        if (!(color in colores)) {
          i -= color.length;
          break;
        }
        let colorId = colores[color];
        if (colorId in colorDeclared) {
          throw Error('GBB/1.0: Color cannot be declared twice.');
        }
        let n = readN('GBB/1.0: Invalid amount of stones.');
        jboard.board[cx][cy][colorId] = n;
      }
    } else {
      throw Error('GBB/1.0: Malformed board: unknown command "' + op + '".')
    }
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

