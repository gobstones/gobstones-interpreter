import { RuntimeState } from './runtime.js';
import { Runner } from './runner.js';
import { readJboardFromFile, writeJboardToFile } from './board_formats.js';

const fs = require('fs');

function startsWith(string, prefix) {
  return string.substring(0, prefix.length) === prefix;
}

function readOptions(argv) {
  let options = {
    'arguments': [],
    'initial-board': null,
    'output-board': null,
    'print-ast': false,
    'print-code': false,
    'help': false,
  };
  let i = 2;
  while (i < argv.length) {
    if (argv[i] === '-h' || argv[i] === '--help') {
      options['help'] = true;
    } else if (argv[i] === '-a' || argv[i] === '--ast') {
      options['print-ast'] = true;
    } else if (argv[i] === '-c' || argv[i] === '--code') {
      options['print-code'] = true;
    } else if (argv[i] === '-i' && i + 1 < argv.length) {
      options['initial-board'] = argv[i + 1];
      i++;
    } else if (startsWith(argv[i], '--initial-board=')) {
      options['initial-board'] = argv[i].substring('--initial-board='.length);
    } else if (argv[i] === '-o' && i + 1 < argv.length) {
      options['output-board'] = argv[i + 1];
      i++;
    } else if (startsWith(argv[i], '--output-board=')) {
      options['output-board'] = argv[i].substring('--output-board='.length);
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
    ' -a, --ast                   Print AST (do not run).',
    ' -c, --code                  Print virtual machine code (do not run).',
    ' -i, --initial-board=<file>  Load initial board. Default: empty 9x9.',
    ' -o, --output-board=<file>   Save final board.',
    ' -h, --help                  Display this help message.',
  ];
  console.log(helpMessage.join('\n'));
}

function printGbsException(exception) {
  console.log(exception.message);
  let startPos = [
    exception.startPos.filename,
    exception.startPos.line,
    exception.startPos.column,
  ].join(':');
  let endPos = [
    exception.endPos.line,
    exception.endPos.column,
  ].join(':');
  console.log('At: ' + startPos + '--' + endPos);
}

function runProgram(options, filename) {
  let contents = fs.readFileSync(filename, 'utf8');
  try {
    let inputs = {};
    inputs[filename] = contents;
    let runner = new Runner();

    if (options['print-ast']) {
      runner.parse(inputs);
      runner.lint();
      console.log(runner.abstractSyntaxTree.toString());
      return;
    }

    if (options['print-code']) {
      runner.parse(inputs);
      runner.lint();
      runner.compile();
      console.log(runner.virtualMachineCode.toString());
      return;
    }

    let initialState = new RuntimeState();
    if (options['initial-board'] !== null) {
      initialState.load(readJboardFromFile(options['initial-board']));
    }

    let output = runner.runState(inputs, initialState);
    let finalState = output.state.dump();
    console.log(JSON.stringify(finalState));
    if (options['output-board'] !== null) {
      writeJboardToFile(options['output-board'], finalState);
    }
    if (output.result !== null) {
      /* The program has a return value */
      console.log(output.result.toString());
    }
  } catch (exception) {
    if (exception.isGobstonesException === undefined) {
      throw exception;
    }
    printGbsException(exception);
  }
}

function main() {
  let options = readOptions(process.argv);

  if (options['help']) {
    help();
    return;
  }

  if (options['arguments'].length === 1) {
    runProgram(options, options['arguments'][0]);
  } else {
    help();
  }
}

main();

