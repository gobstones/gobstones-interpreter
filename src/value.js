
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
}

export class ValueInteger extends Value {
  constructor(number) {
    super(V_Integer);
    this._number = number
  }

  get number() {
    return this._number;
  }
}

export class ValueString extends Value {
  constructor(string) {
    super(V_String);
    this._string = string
  }

  get string() {
    return this._string;
  }
}

export class ValueTuple extends Value {
  constructor(elements) {
    super(V_Tuple);
    this._elements = elements
  }

  get elements() {
    return this._elements;
  }
}

export class ValueList extends Value {
  constructor(elements) {
    super(V_List);
    this._elements = elements
  }

  get elements() {
    return this._elements;
  }
}

/* "fields" should be a dictionary mapping field names to values */
export class ValueStructure extends Value {

  constructor(constructorName, fields) {
    super(V_Structure);
    this._constructorName = constructorName;
    this._fields = fields;
  }

  get constructorName() {
    return this._constructorName;
  }

  get fields() {
    return this._fields;
  }

  _clone() {
    let newFields = {};
    for (let fieldName in this._fields) {
      newFields[fieldName] = this._fields[fieldName];
    }
    return new ValueStructure(this._constructorName, newFields);
  }

  updateFields(fields) {
    let newStructure = this._clone();
    for (let fieldName in fields) {
      newStructure.fields[fieldName] = fields[fieldName];
    }
    return newStructure;
  }
}

