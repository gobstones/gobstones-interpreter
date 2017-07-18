
import { T_EOF, T_NUM } from './token.js';
//import { Lexer } from './lexer.js';
import { Parser } from './parser.js';

var parser = new Parser(' program { } ');

console.log(parser.parse());
