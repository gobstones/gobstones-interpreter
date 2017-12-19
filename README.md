[![Build Status](https://travis-ci.org/gobstones/gobstones-interpreter.svg?branch=master)](https://travis-ci.org/gobstones/gobstones-interpreter)

# gobstones-interpreter

## example of usage

```js
// in node REPL
var Interpreter = require("./lib/gobstones-interpreter.js").GobstonesInterpreterAPI;
var interpreter = new Interpreter();

// parse
parseResult = interpreter.parse("program { Poner(Rojo) }");

// interpret
parseResult.program.interpret({
  width: 2,
  height: 2,
  head: { x: 0, y: 0 },
  table: [
    [ { red: 0, blue: 0, green: 0, black: 0 }, {} ], // cells (0; 1) and (1; 1)
    [ { blue: 0 }, { red: 0, black: 0 } ] // cells (0; 0) and (1; 0)
  ]
})
```

## deploy to npm

```bash
# put a new version number in package.json
# copy package.json from master to origin/bower
git checkout origin/bower
npm publish
```

## important scripts

* `npm install` - install the dependencies of the library
* `npm run build` - produces production version of your library under the `lib` folder
* `npm run dev` - produces development version of your library and runs a watcher
* `npm run test` - well ... it runs the tests :)
* `npm run test:watch` - same as above but in a watch mode
