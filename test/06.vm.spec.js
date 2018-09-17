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
  IReadStructureFieldPop,
  IAdd,
  IDup,
  IPop,
  IPrimitiveCall,
  ISaveState,
  IRestoreState,
  ITypeCheck,
  Code,
} from '../src/instruction';
import { RuntimeState } from '../src/runtime';
import {
  ValueInteger,
  ValueString,
  ValueTuple,
  ValueList,
  ValueStructure,
  TypeAny,
  TypeString,
  TypeInteger,
  TypeTuple,
  TypeList,
  TypeStructure,
} from '../src/value';
import { VirtualMachine } from '../src/vm';
import { i18n } from '../src/i18n';

chai.expect();
const expect = chai.expect;

function makeVirtualMachine(instructions) {
  return new VirtualMachine(
           new Code(instructions),
           new RuntimeState()
         );
}

describe('Virtual Machine', () => {

  describe('Return from program', () => {

    it('Return from program (no value)', () => {
      let vm = makeVirtualMachine([
        new IReturn(),
      ]);
      expect(vm.run()).equals(null);
    });


    it('Return from program (with value)', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(42),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(new ValueInteger(42));
    });

  });

  describe('Variables', () => {

    it('Set variable and push (1/2)', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(10),
        new ISetVariable('x'),
        new IPushInteger(20),
        new ISetVariable('y'),
        new IPushVariable('x'),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(new ValueInteger(10));
    });

    it('Set variable and push (2/2)', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(10),
        new ISetVariable('x'),
        new IPushInteger(20),
        new ISetVariable('y'),
        new IPushVariable('y'),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(new ValueInteger(20));
    });

    it('Reject assignment of non-matching type', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(10),
        new ISetVariable('x'),
        new IPushString('foo'),
        new ISetVariable('x'),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:incompatible-types-on-assignment')(
          'x',
          new TypeInteger(),
          new TypeString(),
        )
      );
    });

    it('Reject assignment of historically non-matching type', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(10),
        new IMakeList(1),
        new ISetVariable('x'),   // x : List(Int)
        new IMakeList(0),
        new ISetVariable('x'),   // x : List(Any)
        new IPushString('foo'),
        new IMakeList(1),
        new ISetVariable('x'),   // x : List(String)
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:incompatible-types-on-assignment')(
          'x',
          new TypeList(new TypeInteger()),
          new TypeList(new TypeString()),
        )
      );
    });

    it('Fail when reading an undefined variable', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(10),
        new ISetVariable('x'),
        new IPushVariable('y'),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:undefined-variable')('y')
      );
    });

    it('Unset an existing variable', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(10),
        new ISetVariable('x'),
        new IPushInteger(20),
        new ISetVariable('y'),
        new IUnsetVariable('x'),
        new IPushVariable('x'),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:undefined-variable')('x')
      );
    });

  });

  describe('Jumps', () => {

    it('Unconditional jump', () => {
      let vm = makeVirtualMachine([
        new IJump('L2'),
        new ILabel('L1'),
        new IPushInteger(10),
        new ILabel('L3'),
        new IReturn(),
        new ILabel('L2'),
        new IPushInteger(20),
        new IJump('L3'),
      ]);
      expect(vm.run()).deep.equals(new ValueInteger(20));
    });

    it('Jump if false (taken)', () => {
      let vm = makeVirtualMachine([
        new IMakeStructure('Bool', 'False', []),
        new IJumpIfFalse('L'),
        new IPushString('not taken'),
        new IReturn(),
        new ILabel('L'),
        new IPushString('taken'),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(new ValueString('taken'));
    });

    it('Jump if false (not taken)', () => {
      let vm = makeVirtualMachine([
        new IMakeStructure('Bool', 'True', []),
        new IJumpIfFalse('L'),
        new IPushString('not taken'),
        new IReturn(),
        new ILabel('L'),
        new IPushString('taken'),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(new ValueString('not taken'));
    });

    it('Jump if structure (taken)', () => {
      let vm = makeVirtualMachine([
        new IMakeStructure('Bool', 'True', []),
        new IJumpIfStructure('True', 'L'),
        new IPop(),
        new IPushString('not taken'),
        new IReturn(),
        new ILabel('L'),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(new ValueStructure('Bool', 'True', {}));
    });

    it('Jump if structure (not taken)', () => {
      let vm = makeVirtualMachine([
        new IMakeStructure('Bool', 'False', []),
        new IJumpIfStructure('True', 'L'),
        new IPop(),
        new IPushString('not taken'),
        new IReturn(),
        new ILabel('L'),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(new ValueString('not taken'));
    });

    it('Jump if tuple (taken)', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IPushInteger(2),
        new IPushInteger(3),
        new IMakeTuple(3),
        new IJumpIfTuple(3, 'L'),
        new IPop(),
        new IPushString('not taken'),
        new IReturn(),
        new ILabel('L'),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(
        new ValueTuple([
          new ValueInteger(1),
          new ValueInteger(2),
          new ValueInteger(3),
        ])
      );
    });

    it('Jump if tuple (not taken)', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IPushInteger(2),
        new IPushInteger(3),
        new IMakeTuple(3),
        new IJumpIfTuple(2, 'L'),
        new IPop(),
        new IPushString('not taken'),
        new IReturn(),
        new ILabel('L'),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(new ValueString('not taken'));
    });

    it('Infinite loop should timeout', () => {
      let vm = makeVirtualMachine([
        new ILabel('L'),
        new IJump('L'),
      ]);
      expect(() => vm.runWithTimeout(100)).throws(i18n('errmsg:timeout')(100));
    });

  });

  describe('Call/return', () => {

    it('Basic call/return mechanism', () => {
      let vm = makeVirtualMachine([
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
      ]);
      expect(vm.run()).deep.equals(new ValueInteger(121));
    });

    it('Call/return with arguments', () => {
      let vm = makeVirtualMachine([
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
      ]);
      expect(vm.run()).deep.equals(new ValueInteger(220));
    });

  });

  describe('Tuples', () => {

    it('Make tuple of size 0', () => {
      let vm = makeVirtualMachine([
        new IMakeTuple(0),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(new ValueTuple([]));
    });

    it('Make tuple of size 3', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IPushInteger(2),
        new IPushInteger(3),
        new IMakeTuple(3),
        new IReturn(),
      ]);
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
      let vm = makeVirtualMachine([
        new IMakeList(0),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(new ValueList([]));
    });

    it('Make list of size 3', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IPushInteger(2),
        new IPushInteger(3),
        new IMakeList(3),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(
        new ValueList([
          new ValueInteger(1),
          new ValueInteger(2),
          new ValueInteger(3),
        ])
      );
    });

    it('Reject list creation for incompatible types (int vs. string)', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IPushInteger(2),
        new IPushString('foo'),
        new IMakeList(3),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:incompatible-types-on-list-creation')(
          2,
          new TypeInteger(),
          new TypeString(),
        )
      );
    });

    it('Reject list creation for incompatible types (constructors)', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IMakeStructure('T', 'A', ['x']),
        new IPushString('foo'),
        new IMakeStructure('T', 'B', ['x']),
        new IPushString('foo'),
        new IMakeStructure('T', 'A', ['x']),
        new IMakeList(3),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:incompatible-types-on-list-creation')(
          2,
          new TypeStructure('T', {
            'A': {'x': new TypeInteger()},
            'B': {'x': new TypeString()},
          }),
          new TypeStructure('T', {
            'A': {'x': new TypeString()},
          }),
        )
      );
    });

    it('Accept list creation for compatible types', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IMakeStructure('T', 'A', ['x']),
        new IPushString('foo'),
        new IMakeStructure('T', 'B', ['x']),
        new IMakeList(2),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(
        new ValueList([
          new ValueStructure('T', 'A', {'x': new ValueInteger(1)}),
          new ValueStructure('T', 'B', {'x': new ValueString('foo')}),
        ])
      );
    });

  });

  describe('Structure instantiation', () => {

    it('Make structure without fields', () => {
      let vm = makeVirtualMachine([
        new IMakeStructure('Bool', 'False', []),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(new ValueStructure('Bool', 'False', {}));
    });

    it('Make structure with fields', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IPushInteger(2),
        new IMakeStructure('Coord', 'Coord', ['x', 'y']),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(
        new ValueStructure('Coord', 'Coord', {
          'x': new ValueInteger(1),
          'y': new ValueInteger(2),
        })
      );
    });

  });

  describe('Structure update', () => {

    it('Reject structure update if not a structure', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(42),
        new IUpdateStructure('Coord', 'Coord', []),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:expected-structure-but-got')(
          'Coord',
          i18n('V_Integer')
        )
      );
    });

    it('Reject structure update for different constructor', () => {
      let vm = makeVirtualMachine([
        new IMakeStructure('Bool', 'False', []),
        new IUpdateStructure('Coord', 'Coord', []),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:expected-constructor-but-got')(
          'Coord',
          'False'
        )
      );
    });

    it('Trivially update constructor (no change)', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IPushInteger(2),
        new IPushInteger(3),
        new IMakeStructure('Foo', 'Bar', ['x', 'y', 'z']),
        new IUpdateStructure('Foo', 'Bar', []),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(
        new ValueStructure('Foo', 'Bar', {
          'x': new ValueInteger(1),
          'y': new ValueInteger(2),
          'z': new ValueInteger(3),
        })
      );
    });

    it('Update constructor', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IPushInteger(2),
        new IPushInteger(3),
        new IMakeStructure('Foo', 'Bar', ['x', 'y', 'z']),
        new IPushInteger(30),
        new IPushInteger(10),
        new IUpdateStructure('Foo', 'Bar', ['z', 'x']),
        new IUpdateStructure('Foo', 'Bar', []),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(
        new ValueStructure('Foo', 'Bar', {
          'x': new ValueInteger(10),
          'y': new ValueInteger(2),
          'z': new ValueInteger(30),
        })
      );
    });

    it('Reject update for incompatible types (int vs. string)', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IPushInteger(2),
        new IPushInteger(3),
        new IMakeStructure('Foo', 'Bar', ['x', 'y', 'z']),
        new IPushInteger(10),
        new IPushString('foo'),
        new IUpdateStructure('Foo', 'Bar', ['x', 'z']),
        new IUpdateStructure('Foo', 'Bar', []),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:incompatible-types-on-structure-update')(
          'z',
          new TypeInteger(),
          new TypeString(),
        )
      );
    });

  });

  describe('Tuple access', () => {

    it('Read components of a tuple', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IPushInteger(2),
        new IMakeTuple(2),
        new IReadTupleComponent(1),
        new ISetVariable('x'),
        new IReadTupleComponent(0),
        new ISetVariable('y'),
        new IPop(),
        new IPushVariable('x'),
        new IPushVariable('x'),
        new IPushVariable('y'),
        new IPushVariable('y'),
        new IMakeTuple(4),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(
        new ValueTuple([
          new ValueInteger(2),
          new ValueInteger(2),
          new ValueInteger(1),
          new ValueInteger(1),
        ])
      );
    });

    it('Fail if not a tuple', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IReadTupleComponent(1),
        new IReturn(),
      ]); 
      expect(() => vm.run()).throws(
        i18n('errmsg:expected-tuple-value-but-got')(
          new TypeInteger()
        )
      );
    });

    it('Fail if index out of bounds', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IPushInteger(2),
        new IMakeTuple(2),
        new IReadTupleComponent(4),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:tuple-component-out-of-bounds')(2, 4)
      );
    });

  });

  describe('Structure access', () => {

    it('Read fields of a structure', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IPushInteger(2),
        new IMakeStructure('A', 'B', ['f', 'g']),
        new IReadStructureField('g'),
        new ISetVariable('x'),
        new IReadStructureField('f'),
        new ISetVariable('y'),
        new IPop(),
        new IPushVariable('x'),
        new IPushVariable('x'),
        new IPushVariable('y'),
        new IPushVariable('y'),
        new IMakeTuple(4),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(
        new ValueTuple([
          new ValueInteger(2),
          new ValueInteger(2),
          new ValueInteger(1),
          new ValueInteger(1),
        ])
      );
    });

    it('Read fields of a structure and pop', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IPushInteger(2),
        new IMakeStructure('A', 'B', ['f', 'g']),
        new IReadStructureField('g'),
        new ISetVariable('x'),
        new IReadStructureFieldPop('f'),
        new ISetVariable('y'),
        new IPushVariable('x'),
        new IPushVariable('x'),
        new IPushVariable('y'),
        new IPushVariable('y'),
        new IMakeTuple(4),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(
        new ValueTuple([
          new ValueInteger(2),
          new ValueInteger(2),
          new ValueInteger(1),
          new ValueInteger(1),
        ])
      );
    });


    it('Fail if not a structure', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IReadStructureField('f'),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:expected-structure-value-but-got')(
          new TypeInteger()
        )
      );
    });

    it('Fail if attempting to read a non-existing field', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IPushInteger(2),
        new IMakeStructure('A', 'B', ['x', 'y']),
        new IReadStructureField('z'),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:structure-field-not-present')(['x', 'y'], 'z')
      );
    });

  });

  describe('Primitive calls', () => {

    it('Call a primitive procedure', () => {
      let vm = makeVirtualMachine([
        new IMakeStructure(i18n('TYPE:Color'), i18n('CONS:Color0'), []),
        new IPrimitiveCall(i18n('PRIM:PutStone'), 1),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(null);

      let finalBoard = vm.globalState();
      expect(finalBoard.numStones(i18n('CONS:Color0'))).deep.equals(
        new ValueInteger(1)
      );
    });

    it('Call a primitive function', () => {
      let vm = makeVirtualMachine([
        new IMakeStructure(i18n('TYPE:Color'), i18n('CONS:Color0'), []),
        new IPrimitiveCall(i18n('PRIM:PutStone'), 1),
        new IMakeStructure(i18n('TYPE:Color'), i18n('CONS:Color0'), []),
        new IPrimitiveCall(i18n('PRIM:numStones'), 1),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(new ValueInteger(1));
    });

    it('Fail when calling a non-existing primitive', () => {
      let vm = makeVirtualMachine([
        new IPrimitiveCall('foo42bar', 0),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:primitive-does-not-exist')('foo42bar')
      );
    });

    it('Fail on arity mismatch', () => {
      let vm = makeVirtualMachine([
        new IPrimitiveCall(i18n('PRIM:PutStone'), 0),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:primitive-arity-mismatch')(
          i18n('PRIM:PutStone'),
          1,
          0,
        )
      );
    });

    it('Fail on type mismatch', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IPrimitiveCall(i18n('PRIM:PutStone'), 1),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:primitive-argument-type-mismatch')(
          i18n('PRIM:PutStone'),
          1,
          1,
          new TypeStructure(i18n('TYPE:Color'), {}),
          new TypeInteger(),
        )
      );
    });

  });

  describe('Save/restore state', () => {

    it('Save/restore the global state', () => {
      let vm = makeVirtualMachine([
        new IMakeStructure(i18n('TYPE:Color'), i18n('CONS:Color0'), []),
        new IPrimitiveCall(i18n('PRIM:numStones'), 1),
        new ISetVariable('a'),
        new ISaveState(),
        new IMakeStructure(i18n('TYPE:Color'), i18n('CONS:Color0'), []),
        new IPrimitiveCall(i18n('PRIM:PutStone'), 1),
        new IMakeStructure(i18n('TYPE:Color'), i18n('CONS:Color0'), []),
        new IPrimitiveCall(i18n('PRIM:numStones'), 1),
        new ISetVariable('b'),
        new ISaveState(),
        new IMakeStructure(i18n('TYPE:Color'), i18n('CONS:Color0'), []),
        new IPrimitiveCall(i18n('PRIM:PutStone'), 1),
        new IMakeStructure(i18n('TYPE:Color'), i18n('CONS:Color0'), []),
        new IPrimitiveCall(i18n('PRIM:numStones'), 1),
        new ISetVariable('c'),
        new IRestoreState(),
        new IMakeStructure(i18n('TYPE:Color'), i18n('CONS:Color0'), []),
        new IPrimitiveCall(i18n('PRIM:numStones'), 1),
        new ISetVariable('d'),
        new IRestoreState(),
        new IMakeStructure(i18n('TYPE:Color'), i18n('CONS:Color0'), []),
        new IPrimitiveCall(i18n('PRIM:numStones'), 1),
        new ISetVariable('e'),
        new IPushVariable('a'),
        new IPushVariable('b'),
        new IPushVariable('c'),
        new IPushVariable('d'),
        new IPushVariable('e'),
        new IMakeTuple(5),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(new ValueTuple([
        new ValueInteger(0),
        new ValueInteger(1),
        new ValueInteger(2),
        new ValueInteger(1),
        new ValueInteger(0),
      ]));
    });

  });

  describe('Type checking', () => {

    it('Accept: List(?) vs. List(Integer)', () => {
      let vm = makeVirtualMachine([
        new IMakeList(0),
        new ITypeCheck(new TypeList(new TypeInteger())),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(new ValueList([]));
    });

    it('Accept: List(Integer) vs. List(?)', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IMakeList(1),
        new ITypeCheck(new TypeList(new TypeAny())),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(new ValueList([new ValueInteger(1)]));
    });

    it('Accept: T1:A vs. T1:B', () => {
      let vm = makeVirtualMachine([
        new IMakeStructure('T1', 'A', []),
        new ITypeCheck(new TypeStructure('T1', {'B': {}})),
        new IReturn(),
      ]);
      expect(vm.run()).deep.equals(
        new ValueStructure('T1', 'A', {})
      );
    });

    it('Reject: Integer vs. String', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new ITypeCheck(new TypeString()),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeString(),
          new TypeInteger(),
        )
      );
    });

    it('Reject: Integer vs. List(?)', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(10),
        new ITypeCheck(new TypeList(new TypeAny())),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeList(new TypeAny()),
          new TypeInteger(),
        )
      );
    });

    it('Reject: Integer vs. List(Integer)', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(10),
        new ITypeCheck(new TypeList(new TypeInteger())),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeList(new TypeInteger()),
          new TypeInteger(),
        )
      );
    });

    it('Reject: Tuple(*, *) vs. Tuple(*, *, *)', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IPushInteger(2),
        new IMakeTuple(2),
        new ITypeCheck(
          new TypeTuple([
            new TypeInteger(),
            new TypeInteger(),
            new TypeInteger(),
          ])
        ),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeTuple([
            new TypeInteger(),
            new TypeInteger(),
            new TypeInteger(),
          ]),
          new TypeTuple([new TypeInteger(), new TypeInteger()]),
        )
      );
    });

    it('Reject: Tuple(String, Int) vs. Tuple(Int, Int)', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IPushString('foo'),
        new IMakeTuple(2),
        new ITypeCheck(
          new TypeTuple([
            new TypeInteger(),
            new TypeInteger(),
          ])
        ),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeTuple([new TypeInteger(), new TypeInteger()]),
          new TypeTuple([new TypeInteger(), new TypeString()]),
        )
      );
    });

    it('Reject: List(String) vs. List(Integer)', () => {
      let vm = makeVirtualMachine([
        new IPushString('foo'),
        new IPushString('bar'),
        new IMakeList(2),
        new ITypeCheck(new TypeList(new TypeInteger())),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeList(new TypeInteger()),
          new TypeList(new TypeString()),
        )
      );
    });

    it('Reject: T1:A vs. T2:B', () => {
      let vm = makeVirtualMachine([
        new IMakeStructure('T1', 'A', []),
        new ITypeCheck(new TypeStructure('T2', {'B': {}})),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeStructure('T2', {'B': {}}),
          new TypeStructure('T1', {'A': {}}),
        )
      );
    });

    it('Reject: T:A(f <- Integer) vs. T:A(f <- String)', () => {
      let vm = makeVirtualMachine([
        new IPushInteger(1),
        new IMakeStructure('T', 'A', ['f']),
        new ITypeCheck(new TypeStructure('T', {'A': {'f': new TypeString()}})),
        new IReturn(),
      ]);
      expect(() => vm.run()).throws(
        i18n('errmsg:expected-value-of-type-but-got')(
          new TypeStructure('T', {'A': {'f': new TypeString()}}),
          new TypeStructure('T', {'A': {'f': new TypeInteger()}})
        )
      );
    });

  });


});
