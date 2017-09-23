import { i18n } from './i18n';
import { Integer } from './bigint';

/* Helper function */

function sortedKeys(dictionary) {
  let keys = [];
  for (let key in dictionary) {
    keys.push(key);
  }
  return keys.sort();
}

/* Value tags */
export const V_Integer = Symbol.for('V_Integer');
export const V_String = Symbol.for('V_String');
export const V_Tuple = Symbol.for('V_Tuple');
export const V_List = Symbol.for('V_List');
export const V_Structure = Symbol.for('V_Structure');

export class Value {
  constructor(tag) {
    this._tag = tag;
  }

  get tag() {
    return this._tag;
  }

  type() {
    return new Type('?', []);
  }
}

export class ValueInteger extends Value {
  constructor(number) {
    super(V_Integer);
    if (typeof number === 'number') {
      this._number = number.toString();
    } else if (typeof number === 'string') {
      this._number = number;
    } else {
      throw Error(
        'Integer value must be constructed with an integer or a string'
      );
    }
  }

  show() {
    return this._number;
  }

  get number() {
    return this._number;
  }

  type() {
    return new TypeInteger();
  }

  add(other) {
    let a = Integer(this._number);
    let b = Integer(other._number);
    return new ValueInteger(a.add(b).toString());
  }

  sub(other) {
    let a = Integer(this._number);
    let b = Integer(other._number);
    return new ValueInteger(a.subtract(b).toString());
  }

  le(other) {
    let a = Integer(this._number);
    let b = Integer(other._number);
    return a.leq(b);
  }

  lt(other) {
    let a = Integer(this._number);
    let b = Integer(other._number);
    return a.lt(b);
  }

  ge(other) {
    let a = Integer(this._number);
    let b = Integer(other._number);
    return a.geq(b);
  }

  gt(other) {
    let a = Integer(this._number);
    let b = Integer(other._number);
    return a.gt(b);
  }

  negate() {
    let a = Integer(this._number);
    return new ValueInteger(a.negate().toString());
  }

  asNumber() {
    return parseInt(this._number);
  }
}

export class ValueString extends Value {
  constructor(string) {
    super(V_String);
    this._string = string
  }

  show() {
    let res = ['"'];
    for (let i = 0; i < this._string.length; i++) {
      let chr = this._string[i];
      switch (chr) {
        case '"':
          res.push('\\');
          res.push('"');
          break;
        case '\\':
          res.push('\\');
          res.push('\\');
          break;
        case '\u0007':
          res.push('\\');
          res.push('a');
          break;
        case '\b':
          res.push('\\');
          res.push('b');
          break;
        case '\f':
          res.push('\\');
          res.push('f');
          break;
        case '\n':
          res.push('\\');
          res.push('n');
          break;
        case '\r':
          res.push('\\');
          res.push('r');
          break;
        case '\t':
          res.push('\\');
          res.push('t');
          break;
        case '\v':
          res.push('\\');
          res.push('v');
          break;
        default:
          res.push(chr);
          break;
      }
    }
    res.push('"');
    return res.join('');
  }

  get string() {
    return this._string;
  }

  type() {
    return new TypeString();
  }
}

export class ValueTuple extends Value {
  constructor(components) {
    super(V_Tuple);
    this._components = components;
    this._type = this._inferType();
  }

  show() {
    let res = [];
    for (let component of this._components) {
      res.push(component.show());
    }
    return '(' + res.join(', ') + ')';
  }

  get components() {
    return this._components;
  }

  size() {
    return this._components.length;
  }

  type() {
    return this._type;
  }

  _inferType() {
    let componentTypes = [];
    for (let component of this._components) {
      componentTypes.push(component.type());
    }
    return new TypeTuple(componentTypes);
  }
}

export class ValueList extends Value {
  constructor(elements) {
    super(V_List);
    this._elements = elements
    this._type = this._inferType();
  }

  show() {
    let res = [];
    for (let element of this._elements) {
      res.push(element.show());
    }
    return '[' + res.join(', ') + ']';
  }

  get elements() {
    return this._elements;
  }

  type() {
    return this._type;
  }

  length() {
    return this._elements.length;
  }

  _inferType() {
    let contentType = new TypeAny();
    for (let element of this._elements) {
      contentType = joinTypes(contentType, element.type());
    }
    return new TypeList(contentType);
  }
}

/* An instance of ValueStructure represents a 'structure' i.e.  a value
 * inhabiting an 'inductive' datatype.
 *
 * This includes built-in enumerations (e.g. booleans), the "event" type
 * received by an interactive program, and user-defined records and variants.
 *
 * The second parameter "fields" should be a dictionary mapping field names to
 * values
 */
export class ValueStructure extends Value {

  constructor(typeName, constructorName, fields) {
    super(V_Structure);
    this._typeName = typeName;
    this._constructorName = constructorName;
    this._fields = fields;
  }

  show() {
    let res = [];
    let fieldNames = this.fieldNames();
    if (fieldNames.length === 0) {
      return this._constructorName;
    }
    for (let fieldName of fieldNames) {
      res.push(fieldName + ' <- ' + this.fields[fieldName].show());
    }
    return this._constructorName + '(' + res.join(', ') + ')';
  }

  get typeName() {
    return this._typeName;
  }

  get constructorName() {
    return this._constructorName;
  }

  get fields() {
    return this._fields;
  }

  fieldNames() {
    return sortedKeys(this._fields);
  }

  _clone() {
    let newFields = {};
    for (let fieldName in this._fields) {
      newFields[fieldName] = this._fields[fieldName];
    }
    return new ValueStructure(
      this._typeName, this._constructorName, newFields
    );
  }

  updateFields(fields) {
    let newStructure = this._clone();
    for (let fieldName in fields) {
      newStructure.fields[fieldName] = fields[fieldName];
    }
    return newStructure;
  }

  type() {
    let fieldTypes = {};
    for (let fieldName in this._fields) {
      fieldTypes[fieldName] = this._fields[fieldName].type();
    }
    let cases = {};
    cases[this._constructorName] = fieldTypes;
    return new TypeStructure(this._typeName, cases);
  }
}

/* Each value has a *type*.
 *
 * A type is a tree, represented with instances of Type (or its subclasses).
 * We write:
 *   r(c1, ..., cN) 
 * for a tree whose root is r and whose children are c1, ..., cN.
 *
 * The type of a value may be one of the following:
 *   new TypeAny()                      (unknown)
 *   new TypeInteger()
 *   new TypeString()
 *   new TypeTuple([t1, ..., tN])
 *     where ti is the type of the i-th component.
 *   new TypeList(t)
 *     where t is the type of the elements.
 *   new TypeStructure(typeName, cases)
 *     where typeName is the name of the type (e.g. 'Bool').
 *     Moreover, cases is an object of the following "type":
 *       Map String (Map String Type)
 *     more precisely,
 *     - cases is dictionary indexed by constructor names,
 *     - if c is a constructor name, cases[c] is a dictionary
 *       indexed by field name,
 *     - if f is a field name, cases[c][f] is the type of the
 *       field f for the constructor c.
 *
 *     For example, consider the following type definition:
 *       type A is variant {
 *         case B {
 *           field x
 *           field y
 *         }
 *         case C {
 *           field z
 *         }
 *       }
 *
 *    Then the following expression in Gobstones:
 *      [B(x <- 1, y <- "foo")]
 *    is a list whose type is represented as:
 *      new TypeList(
 *        new TypeStructure('A', {
 *          'B': {'x': new TypeInteger(), 'y': new TypeString()}
 *        })
 *      )
 *
 *    The following expression in Gobstones:
 *      [B(x <- 1, y <- "foo"), C(z <- "bar")]
 *    is a list whose type is represented as:
 *      new TypeList(
 *        new TypeStructure('A', {
 *          'B': {'x': new TypeInteger(), 'y': new TypeString()},
 *          'C': {'z': new TypeString()},
 *        })
 *      )
 */
const Ty_Any = Symbol.for('Ty_Any');
const Ty_Integer = Symbol.for('Ty_Integer');
const Ty_String = Symbol.for('Ty_String');
const Ty_Tuple = Symbol.for('Ty_Tuple');
const Ty_List = Symbol.for('Ty_List');
const Ty_Structure = Symbol.for('Ty_Structure');

class Type {
  constructor(tag) {
    this._tag = tag;
  }

  get tag() {
    return this._tag;
  }
}

export class TypeAny extends Type {
  constructor() {
    super(Ty_Any);
  }

  toString() {
    return '?';
  }
}

export class TypeInteger extends Type {
  constructor() {
    super(Ty_Integer);
  }

  toString() {
    return i18n('TYPE:Integer');
  }
}

export class TypeString extends Type {
  constructor() {
    super(Ty_String);
  }

  toString() {
    return i18n('TYPE:String');
  }
}

export class TypeTuple extends Type {
  constructor(componentTypes) {
    super(Ty_Tuple);
    this._componentTypes = componentTypes;
  }

  get componentTypes() {
    return this._componentTypes;
  }

  toString() {
    let strings = [];
    for (let t of this._componentTypes) {
      strings.push(t.toString());
    }
    return i18n('TYPE:Tuple') + '(' + strings.join(', ') + ')';
  }
}

export class TypeList extends Type {
  constructor(contentType) {
    super(Ty_List);
    this._contentType = contentType;
  }
  
  get contentType() {
    return this._contentType;
  }

  toString() {
    return i18n('TYPE:List') + '(' + this._contentType.toString() + ')';
  }
}

export class TypeStructure extends Type {
  constructor(typeName, cases) {
    super(Ty_Structure);
    this._typeName = typeName;
    this._cases = cases;
  }

  get typeName() {
    return this._typeName;
  }

  get cases() {
    return this._cases;
  }

  toString() {
    let caseStrings = [];
    for (let constructorName of sortedKeys(this._cases)) {
      let fieldTypes = this._cases[constructorName];
      let fieldStrings = [];
      for (let fieldName of sortedKeys(fieldTypes)) {
        fieldStrings.push(
          fieldName + ' <- ' + fieldTypes[fieldName].toString()
        )
      }
      let qualifiedConstructor = this._typeName + ':' + constructorName;
      if (fieldStrings.length === 0) {
        caseStrings.push(qualifiedConstructor);
      } else {
        caseStrings.push(
          qualifiedConstructor + '(' + fieldStrings.join(', ') + ')'
        );
      }
    }
    if (caseStrings.length === 0) {
      return this._typeName;
    } else {
      return caseStrings.join(' + ');
    }
  }
}

/* Attempts to calculate the "join" of two types.
 *
 * To join two types:
 * - any occurrence of TypeAny() may be replaced by an arbitrary type,
 * - structures of the same type built with different constructors
 *   are joinable,
 * - structures of the same type built with the same constructors
 *   are joinable if their matching fields are joinable.
 *
 * If the types are joinable, return their join.
 * If the types are not joinable, return null.
 */
export function joinTypes(type1, type2) {
  if (type1 === null || type2 === null) {
    return null;
  } else if (type1.tag === Ty_Any) {
    return type2;
  } else if (type2.tag === Ty_Any) {
    return type1;
  } else if (type1.tag === Ty_Integer && type2.tag === Ty_Integer) {
    return type1;
  } else if (type1.tag === Ty_String && type2.tag === Ty_String) {
    return type1;
  } else if (type1.tag === Ty_Tuple && type2.tag === Ty_Tuple) {
    return joinTupleTypes(type1, type2);
  } else if (type1.tag === Ty_List && type2.tag === Ty_List) {
    return joinListTypes(type1, type2);
  } else if (type1.tag === Ty_Structure && type2.tag === Ty_Structure) {
    return joinStructureTypes(type1, type2);
  } else {
    /* Otherwise the types are not joinable */
    return null;
  }
}

function joinTupleTypes(type1, type2) {
  if (type1.componentTypes.length !== type2.componentTypes.length) {
    /* Tuples are of different length */
    return null;
  }
  let joinedComponents = [];
  for (let i = 0; i < type1.componentTypes.length; i++) {
    let t1 = type1.componentTypes[i];
    let t2 = type2.componentTypes[i];
    let tj = joinTypes(t1, t2);
    if (tj === null) {
      /* Cannot join the i-th component */
      return null;
    }
    joinedComponents.push(tj);
  }
  return new TypeTuple(joinedComponents);
}

function joinListTypes(type1, type2) {
  let joinedContent = joinTypes(type1.contentType, type2.contentType);
  if (joinedContent === null) {
    /* Cannot join the contents of the lists */
    return null;
  }
  return new TypeList(joinedContent);
}

/*
 * The join of two structures is quite like a least common multiple.
 * We must:
 * - Check that they are structures of the same type.
 * - Include all the non-common constructors verbatim
 *   (with "non-common" we mean those that are in type1
 *   but not in type2 or vice-versa).
 * - For all common constructors, we must recursively join
 *   the types of their respective fields.
 */
function joinStructureTypes(type1, type2) {
  if (type1.typeName !== type2.typeName) {
    return null;
  }

  let joinedCases = {};

  /* Include all the non-common constructors */
  function joinCommon(typeA, typeB) {
    for (let constructorName in typeA.cases) {
      if (!(constructorName in typeB.cases)) {
        joinedCases[constructorName] = typeA.cases[constructorName];
      }
    }
  }
  joinCommon(type1, type2);
  joinCommon(type2, type1);

  /* Include all the common constructors */
  for (let constructorName in type1.cases) {
    if (constructorName in type2.cases) {
      let joinedFields = joinFields(
                           type1.cases[constructorName],
                           type2.cases[constructorName]
                         );
      if (joinedFields === null) {
        return null;
      }
      joinedCases[constructorName] = joinedFields;
    }
  }
  
  return new TypeStructure(type1.typeName, joinedCases);
}

function joinFields(fields1, fields2) {
  /* Ensure that they have the same set of fields */
  function checkIncluded(fieldsA, fieldsB) {
    for (let fieldName in fieldsA) {
      if (!(fieldName in fieldsB)) {
        throw Error(
          'Join fields: structures built using the same constructor '
        + 'should have the same set of fields.'
        );
      }
    }
  }
  checkIncluded(fields1, fields2);
  checkIncluded(fields2, fields1);

  /* Recursively join the types of the common fields */
  let joinedFields = {};
  for (let fieldName in fields1) {
    let type1 = fields1[fieldName];
    let type2 = fields2[fieldName];
    let joinedTypes = joinTypes(type1, type2);
    if (joinedTypes === null) {
      return null;
    }
    joinedFields[fieldName] = joinedTypes;
  }
  return joinedFields;
}

