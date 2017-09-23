import { Runner } from './runner.js';

let fs = require('fs');

function readOptions(argv) {
  let options = {
    'arguments': [],
    'help': false,
  };
  let i = 2;
  while (i < argv.length) {
    if (argv[i] === '-h' || argv[i] === '--help') {
      options['help'] = true;
    } else {
      options['arguments'].push(argv[i]);
    }
    i++;
  }
  return options;
}

function help() {
  let helpMessage = [
    'Usage:',
    'gobstones-interpreter input.gbs',
    '',
    ' -h, --help                Display this help message.',
  ];
  console.log(helpMessage.join('\n'));
}

function runFile(filename) {
  fs.readFile(filename, 'utf8', function (err, contents) {
    if (err) {
      console.log('Error: cannot read input file: ' + filename);
      console.log(err);
      process.exit(1);
    }
    let result = new Runner().run(contents);
    console.log(result.show());
  });
}

function main() {
  let options = readOptions(process.argv);
  if (options['help']) {
    help();
  } else if (options['arguments'].length === 1) {
    runFile(options['arguments'][0]);
  } else {
    help();
  }
}

main();

