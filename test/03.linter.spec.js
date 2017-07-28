import chai from 'chai';

import { Parser } from '../src/parser';
import { Linter } from '../src/linter';

chai.expect();
const expect = chai.expect;

const GLOBAL_ENV = null;

it('Linter - (TODO)', () => {
  let ast = new Parser('program {}').parse();
  new Linter(GLOBAL_ENV, ast).lint();
});

