import chai from 'chai';

import {
  IReturn,
  IPushConstant,
  IPushVariable,
  ISetVariable,
  IUnsetVariable,
  ILabel,
  IJump,
  IJumpIfFalse,
  IJumpIfConstructor,
  IJumpIfTuple,
  ICall,
  IMakeTuple,
  IMakeConstructor,
  IUpdateConstructor,
  IReadTupleComponent,
  IReadConstructorField,
  IAdd,
  IDup,
  IPop,
  IPrimitiveCall,
  ISaveState,
  IRestoreState,
  ICheckIsInteger,
  ICheckIsTuple,
  ICheckIsType,
  Code,
} from '../src/instruction';
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
        new IPushConstant(42),
        new IReturn(),
      ]));
      expect(vm.run()).equals(42);
    });

  });

  describe('Variables', () => {

    it('Set variable and push (1/2)', () => {
      let vm = new VirtualMachine(new Code([
        new IPushConstant(10),
        new ISetVariable('x'),
        new IPushConstant(20),
        new ISetVariable('y'),
        new IPushVariable('x'),
        new IReturn(),
      ]));
      expect(vm.run()).equals(10);
    });

    it('Set variable and push (2/2)', () => {
      let vm = new VirtualMachine(new Code([
        new IPushConstant(10),
        new ISetVariable('x'),
        new IPushConstant(20),
        new ISetVariable('y'),
        new IPushVariable('y'),
        new IReturn(),
      ]));
      expect(vm.run()).equals(20);
    });

    it('Fail when reading an undefined variable', () => {
      let vm = new VirtualMachine(new Code([
        new IPushConstant(10),
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
        new IPushConstant(10),
        new ISetVariable('x'),
        new IPushConstant(20),
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
        new IPushConstant(10),
        new ILabel('L3'),
        new IReturn(),
        new ILabel('L2'),
        new IPushConstant(20),
        new IJump('L3'),
      ]));
      expect(vm.run()).equals(20);
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
        new IPushConstant(1),
        new ICall('g', 0),
        new IAdd(),
        new ICall('g', 0),
        new IAdd(),
        new IReturn(),

        new ILabel('g'),
        new IPushConstant(10),
        new IReturn(),

        new ILabel('h'),
        new IPushConstant(100),
        new IReturn(),
      ]));
      expect(vm.run()).equals(121);
    });

    it('Call/return with arguments', () => {
      let vm = new VirtualMachine(new Code([
        new IPushConstant(1),
        new IPushConstant(10),
        new ICall('f', 2),
        new ICall('g', 1),
        new IReturn(),

        new ILabel('f'),
        new IPop(),
        new IPushConstant(100),
        new IAdd(),
        new IReturn(),

        new ILabel('g'),
        new IDup(),
        new IAdd(),
        new IReturn(),
      ]));
      expect(vm.run()).equals(220);
    });

  });

});
