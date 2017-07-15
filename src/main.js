
import { T_EOF, T_NUM } from './token.js';
import { Lexer } from './lexer.js';

var lexer = new Lexer('/*');

for (;;) {
  var tok = lexer.nextToken();
  if (tok.type === T_EOF) {
    break;
  }
  console.log(tok.type);
  console.log(tok.value);
}
