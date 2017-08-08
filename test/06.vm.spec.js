import chai from 'chai';

import {
  IReturn,
  IPushInteger,
  IPushString,
  IPushVariable,
  ISetVariable,
  IUnsetVariable,
  ILabel,
  IJump,
  IJumpIfFalse,
  IJumpIfStructure,
  IJumpIfTuple,
  ICall,
  IMakeTuple,
  IMakeList,
  IMakeStructure,
  IUpdateStructure,
  IReadTupleComponent,
  IReadStructureField,
  IAdd,
  IDup,
  IPop,
  IPrimitiveCall,
  ISaveState,
  IRestoreState,
  ICheckIsInteger,
  ICheckIsTuple,
  ICheckIsList,
  ICheckIsType,
  Code,
} from '../src/instruction';
import {
  ValueInteger,
  ValueString,
  ValueTuple,
  ValueList,
  ValueStructure,
} from '../src/value';
import { VirtualMachine } from '../src/vm';
import { i18n } from '../src/i18n';

chai.expect();
const expect = chai.expect;

describe('Virtual Machine', () => {

  describe('Return from program', () => {

    it('Return from program (no value)', () => {
      let vm = new VirtualMachine(new Code([
        new IReturn(),
      ]));
      expect(vm.run()).equals(null);
    });


    it('Return from program (with value)', () => {
      let vm = new VirtualMachine(new Code([
        new IPushInteger(42),
        new IReturn(),
      ]));
      expect(vm.run()).deep.equals(new ValueInteger(42));
    });

  });

  describe('Variables', () => {

    it('Set variable and push (1/2)', () => {
      let vm = new VirtualMachine(new Code([
        new IPushInteger(10),
        new ISetVariable('x'),
        new IPushInteger(20),
        new ISetVariable('y'),
        new IPushVariable('x'),
        new IReturn(),
      ]));
      expect(vm.run()).deep.equals(new ValueInteger(10));
    });

    it('Set variable and push (2/2)', () => {
      let vm = new VirtualMachine(new Code([
        new IPushInteger(10),
        new ISetVariable('x'),
        new IPushInteger(20),
        new ISetVariable('y'),
        new IPushVariable('y'),
        new IReturn(),
      ]));
      expect(vm.run()).deep.equals(new ValueInteger(20));
    });

    it('Fail when reading an undefined variable', () => {
      let vm = new VirtualMachine(new Code([
        new IPushInteger(10),
        new ISetVariable('x'),
        new IPushVariable('y'),
        new IReturn(),
      ]));
      expect(() => vm.run()).throws(
        i18n('errmsg:undefined-variable')('y')
      );
    });

    it('Unset an existing variable', () => {
      let vm = new VirtualMachine(new Code([
        new IPushInteger(10),
        new ISetVariable('x'),
        new IPushInteger(20),
        new ISetVariable('y'),
        new IUnsetVariable('x'),
        new IPushVariable('x'),
        new IReturn(),
      ]));
      expect(() => vm.run()).throws(
        i18n('errmsg:undefined-variable')('x')
      );
    });

  });

  describe('Jumps', () => {

    it('Unconditional jump', () => {
      let vm = new VirtualMachine(new Code([
        new IJump('L2'),
        new ILabel('L1'),
        new IPushInteger(10),
        new ILabel('L3'),
        new IReturn(),
        new ILabel('L2'),
        new IPushInteger(20),
        new IJump('L3'),
      ]));
      expect(vm.run()).deep.equals(new ValueInteger(20));
    });

  });

  describe('Call/return', () => {

    it('Basic call/return mechanism', () => {
      let vm = new VirtualMachine(new Code([
        new ICall('f', 0),
        new ICall('h', 0),
        new IAdd(),
        new IReturn(),

        new ILabel('f'),
        new IPushInteger(1),
        new ICall('g', 0),
        new IAdd(),
        new ICall('g', 0),
        new IAdd(),
        new IReturn(),

        new ILabel('g'),
        new IPushInteger(10),
        new IReturn(),

        new ILabel('h'),
        new IPushInteger(100),
        new IReturn(),
      ]));
      expect(vm.run()).deep.equals(new ValueInteger(121));
    });

    it('Call/return with arguments', () => {
      let vm = new VirtualMachine(new Code([
        new IPushInteger(1),
        new IPushInteger(10),
        new ICall('f', 2),
        new ICall('g', 1),
        new IReturn(),

        new ILabel('f'),
        new IPop(),
        new IPushInteger(100),
        new IAdd(),
        new IReturn(),

        new ILabel('g'),
        new IDup(),
        new IAdd(),
        new IReturn(),
      ]));
      expect(vm.run()).deep.equals(new ValueInteger(220));
    });

  });

  describe('Tuples', () => {

    it('Make tuple of size 0', () => {
      let vm = new VirtualMachine(new Code([
        new IMakeTuple(0),
        new IReturn(),
      ]));
      expect(vm.run()).deep.equals(new ValueTuple([]));
    });

    it('Make tuple of size 3', () => {
      let vm = new VirtualMachine(new Code([
        new IPushInteger(1),
        new IPushInteger(2),
        new IPushInteger(3),
        new IMakeTuple(3),
        new IReturn(),
      ]));
      expect(vm.run()).deep.equals(
        new ValueTuple([
          new ValueInteger(1),
          new ValueInteger(2),
          new ValueInteger(3),
        ])
      );
    });

  });

  describe('Lists', () => {

    it('Make list of size 0', () => {
      let vm = new VirtualMachine(new Code([
        new IMakeList(0),
        new IReturn(),
      ]));
      expect(vm.run()).deep.equals(new ValueList([]));
    });

    it('Make list of size 3', () => {
      let vm = new VirtualMachine(new Code([
        new IPushInteger(1),
        new IPushInteger(2),
        new IPushInteger(3),
        new IMakeList(3),
        new IReturn(),
      ]));
      expect(vm.run()).deep.equals(
        new ValueList([
          new ValueInteger(1),
          new ValueInteger(2),
          new ValueInteger(3),
        ])
      );
    });

  });

  describe('Structure instantiation', () => {

    it('Make structure without fields', () => {
      let vm = new VirtualMachine(new Code([
        new IMakeStructure('False', []),
        new IReturn(),
      ]));
      expect(vm.run()).deep.equals(new ValueStructure('False', {}));
    });

    it('Make structure with fields', () => {
      let vm = new VirtualMachine(new Code([
        new IPushInteger(1),
        new IPushInteger(2),
        new IMakeStructure('Coord', ['x', 'y']),
        new IReturn(),
      ]));
      expect(vm.run()).deep.equals(
        new ValueStructure('Coord', {
          'x': new ValueInteger(1),
          'y': new ValueInteger(2),
        })
      );
    });

  });

  describe('Structure update', () => {

    it('Reject structure update if not a structure', () => {
      let vm = new VirtualMachine(new Code([
        new IPushInteger(42),
        new IUpdateStructure('Coord', []),
        new IReturn(),
      ]));
      expect(() => vm.run()).throws(
        i18n('errmsg:expected-structure-but-got')(
          'Coord',
          i18n('V_Integer')
        )
      );
    });

    it('Reject structure update for different constructor', () => {
      let vm = new VirtualMachine(new Code([
        new IMakeStructure('False', []),
        new IUpdateStructure('Coord', []),
        new IReturn(),
      ]));
      expect(() => vm.run()).throws(
        i18n('errmsg:expected-constructor-but-got')(
          'Coord',
          'False'
        )
      );
    });

    it('Trivially update constructor (no change)', () => {
      let vm = new VirtualMachine(new Code([
        new IPushInteger(1),
        new IPushInteger(2),
        new IPushInteger(3),
        new IMakeStructure('Foo', ['x', 'y', 'z']),
        new IUpdateStructure('Foo', []),
        new IReturn(),
      ]));
      expect(vm.run()).deep.equals(
        new ValueStructure('Foo', {
          'x': new ValueInteger(1),
          'y': new ValueInteger(2),
          'z': new ValueInteger(3),
        })
      );
    });

    it('Update constructor', () => {
      let vm = new VirtualMachine(new Code([
        new IPushInteger(1),
        new IPushInteger(2),
        new IPushInteger(3),
        new IMakeStructure('Foo', ['x', 'y', 'z']),
        new IPushInteger(30),
        new IPushInteger(10),
        new IUpdateStructure('Foo', ['z', 'x']),
        new IUpdateStructure('Foo', []),
        new IReturn(),
      ]));
      expect(vm.run()).deep.equals(
        new ValueStructure('Foo', {
          'x': new ValueInteger(10),
          'y': new ValueInteger(2),
          'z': new ValueInteger(30),
        })
      );
    });

  });

});
