import chai from 'chai';

import { i18n } from '../src/i18n';
import { GobstonesInterpreterAPI } from '../src/index';

function api() {
  return new GobstonesInterpreterAPI();
}

chai.expect();
const expect = chai.expect;

describe('Gobstones API', () => {

  it('Parse empty source', () => {
    let result = api().parse('');
    expect(result.program.alias).equals('program');
  });

  it('Parse basic program', () => {
    let result = api().parse('program {}');
    expect(result.program.alias).equals('program');
  });

  it('Parse basic interactive program', () => {
    let result = api().parse('interactive program {}');
    expect(result.program.alias).equals('interactiveProgram');
  });

  it('Parse definitions without a program', () => {
    let result = api().parse('procedure P() {}');
    expect(result.program.alias).equals('program');
  });

  it('Parse syntax error', () => {
    let result = api().parse('program { P() }');
    expect(result.message).equals(i18n('errmsg:undefined-procedure')('P'));
    expect(result.on.range.start.row).equals(1);
    expect(result.on.range.start.column).equals(11);
    expect(result.on.range.end.row).equals(1);
    expect(result.on.range.end.column).equals(13);
    expect(result.on.region).equals('');
  });

});

