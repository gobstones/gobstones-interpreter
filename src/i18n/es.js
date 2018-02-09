
function keyword(palabra) {
  return 'la palabra clave "' + palabra + '"';
}

function pluralize(n, singular, plural) {
  if (n === 0) {
    return 'ningún ' + singular;
  } else if (n === 1) {
    return 'un ' + singular;
  } else {
    return n.toString() + ' ' + plural;
  }
}

function ordinalNumber(n) {
  let units = [
    '', 'primer', 'segundo', 'tercer', 'cuarto',
    'quinto', 'sexto', 'séptimo', 'octavo', 'noveno'
  ];
  if (1 <= n <= 9) {
    return units[n];
  } else {
    return '#' + n.toString();
  }
}

function describeType(type) {
  if (type.isInteger()) {
    return ['m', 'número', 'números'];
  } else if (type.isBoolean()) {
    return ['m', 'booleano', 'booleanos'];
  } else if (type.isColor()) {
    return ['m', 'color', 'colores'];
  } else if (type.isDirection()) {
    return ['f', 'dirección', 'direcciones'];
  } else if (type.isList() && type.contentType.isAny()) {
    return ['f', 'lista', 'listas'];
  } else if (type.isList()) {
    let description = describeType(type.contentType);
    if (description === null) {
      return null;
    } else {
      let plural = description[2];
      return ['f', 'lista de ' + plural, 'listas de ' + plural];
    }
  } else {
    return null;
  }
}

function describeTypeSingular(type) {
  let description = describeType(type);
  if (description === null) {
    return type.toString();
  } else {
    let singular = description[1];
    return singular;
  }
}

function typeAsNoun(type) {
  let description = describeType(type);
  if (description === null) {
    return 'un valor de tipo ' + type.toString();
  } else {
    let gender = description[0];
    let singular = description[1];
    if (gender === 'm') {
      return 'un ' + singular;
    } else {
      return 'una ' + singular;
    }
  }
}

function typeAsQualifierSingular(type) {
  let description = describeType(type);
  if (description === null) {
    return 'de tipo ' + type.toString();
  } else {
    let gender = description[0];
    let singular = description[1];
    if (gender === 'm') {
      return 'un ' + singular;
    } else {
      return 'una ' + singular;
    }
  }
}

function typeAsQualifierPlural(type) {
  let description = describeType(type);
  if (description === null) {
    return 'de tipo ' + type.toString();
  } else {
    let gender = description[0];
    let plural = description[2];
    if (gender === 'm') {
      return plural;
    } else {
      return plural;
    }
  }
}

function listOfTypes(types) {
  let typeStrings = [];
  for (let type of types) {
    typeStrings.push(describeTypeSingular(type));
  }
  return typeStrings.join(', ');
}

function openingDelimiterName(delimiter) {
  if (delimiter === '(' || delimiter === ')') {
    return 'un paréntesis abierto "("';
  } else if (delimiter === '[' || delimiter === ']') {
    return 'un corchete abierto "["';
  } else if (delimiter === '{' || delimiter === '}') {
    return 'una llave abierta "{"';
  } else {
    return delimiter;
  }
}

export const LOCALE_ES = {

  /* Descriptions of syntactic constructions and tokens */
  'definition':
    'una definición (de programa, función, procedimiento, o tipo)',
  'pattern':
    'un patrón (comodín "_", constructor aplicado a variables, o tupla)',
  'statement': 'un comando',
  'expression': 'una expresión',
  'procedure call': 'una invocación a un procedimiento',
  'field name': 'el nombre de un campo',
  'T_EOF': 'el final del archivo',
  'T_NUM': 'un número',
  'T_STRING': 'una cadena (string)',
  'T_UPPERID': 'un identificador con mayúsculas',
  'T_LOWERID': 'un identificador con minúsculas',
  'T_PROGRAM': keyword('program'),
  'T_INTERACTIVE': keyword('interactive'),
  'T_PROCEDURE': keyword('procedure'),
  'T_FUNCTION': keyword('function'),
  'T_RETURN': keyword('return'),
  'T_IF': keyword('if'),
  'T_THEN': keyword('then'),
  'T_ELSE': keyword('else'),
  'T_REPEAT': keyword('repeat'),
  'T_FOREACH': keyword('foreach'),
  'T_IN': keyword('in'),
  'T_WHILE': keyword('while'),
  'T_SWITCH': keyword('switch'),
  'T_TO': keyword('to'),
  'T_LET': keyword('let'),
  'T_NOT': keyword('not'),
  'T_DIV': keyword('div'),
  'T_MOD': keyword('mod'),
  'T_TYPE': keyword('type'),
  'T_IS': keyword('is'),
  'T_RECORD': keyword('record'),
  'T_VARIANT': keyword('variant'),
  'T_CASE': keyword('case'),
  'T_FIELD': keyword('field'),
  'T_UNDERSCORE': 'un guión bajo ("_")',
  'T_LPAREN': 'un paréntesis izquierdo ("(")',
  'T_RPAREN': 'un paréntesis derecho (")")',
  'T_LBRACE': 'una llave izquierda ("{")',
  'T_RBRACE': 'una llave derecha ("}")',
  'T_LBRACK': 'un corchete izquierdo ("[")',
  'T_RBRACK': 'un corchete derecho ("]")',
  'T_COMMA': 'una coma (",")',
  'T_SEMICOLON': 'un punto y coma (";")',
  'T_RANGE': 'un separador de rango ("..")',
  'T_GETS': 'una flecha hacia la izquierda ("<-")',
  'T_PIPE': 'una barra vertical ("|")',
  'T_ARROW': 'una flecha ("->")',
  'T_ASSIGN': 'un operador de asignación (":=")',
  'T_EQ': 'una comparación por igualdad ("==")',
  'T_NE': 'una comparación por desigualdad ("/=")',
  'T_LE': 'un menor o igual ("<=")',
  'T_GE': 'un mayor o igual (">=")',
  'T_LT': 'un menor estricto ("<")',
  'T_GT': 'un mayor estricto (">")',
  'T_AND': 'el "y" lógico ("&&")',
  'T_OR': 'el "o" lógico ("||")',
  'T_CONCAT': 'el operador de concatenación de listas ("++")',
  'T_PLUS': 'el operador de suma ("+")',
  'T_MINUS': 'el operador de resta ("-")',
  'T_TIMES': 'el operador de producto ("*")',
  'T_POW': 'el operador de potencia ("^")',

  /* Local name categories */
  'LocalVariable': 'variable',
  'LocalIndex': 'índice',
  'LocalParameter': 'parámetro',

  /* Descriptions of value types */
  'V_Integer': 'un número',
  'V_String': 'una cadena',
  'V_Tuple': 'una tupla',
  'V_List': 'una lista',
  'V_Structure': 'una estructura',

  /* Lexer */
  'errmsg:unclosed-multiline-comment':
    'El comentario se abre pero nunca se cierra.',

  'errmsg:unclosed-string-constant':
    'La comilla que abre no tiene una comilla que cierra correspondiente.',

  'errmsg:numeric-constant-should-not-have-leading-zeroes':
    'Las constantes numéricas no se pueden escribir con ceros a la '
   + 'izquierda.',

  'errmsg:identifier-must-start-with-alphabetic-character':
    'Los identificadores deben empezar con un caracter alfabético '
   + '(a...z,A...Z).',

  'errmsg:unknown-token':
    function (symbol) {
      return 'Símbolo desconocido en la entrada: "' + symbol + '".';
    },

  'warning:empty-pragma':
    'Directiva pragma vacía.',

  'warning:unknown-pragma':
    function (pragmaName) {
      return 'Directiva pragma desconocida: "' + pragmaName + '".';
    },

  'errmsg:unmatched-opening-delimiter':
    function (delimiter) {
      return 'Se encontró ' + openingDelimiterName(delimiter)
           + ' pero nunca se cierra.';
    },

  'errmsg:unmatched-closing-delimiter':
    function (delimiter) {
      return 'Se encontró un "' + delimiter + '" '
           + 'pero no había ' + openingDelimiterName(delimiter) + '.';
    },

  /* Parser */
  'errmsg:empty-source':
    'El programa está vacío.',

  'errmsg:expected-but-found':
    function (expected, found) {
      return 'Se esperaba ' + expected + '.\n'
           + 'Se encontró: ' + found + '.';
    },

  'errmsg:pattern-number-cannot-be-negative-zero':
    'El patrón numérico no puede ser "-0".',

  'errmsg:pattern-tuple-cannot-be-singleton':
    'El patrón para una tupla no puede tener una sola componente. '
  + 'Las tuplas tienen 0, 2, 3, o más componentes, pero no 1.',

  'errmsg:assignment-tuple-cannot-be-singleton':
    'La asignación a una tupla no puede constar de una sola componente. '
  + 'Las tuplas tienen 0, 2, 3, o más componentes, pero no 1.',

  'errmsg:operators-are-not-associative':
    function (op1, op2) {
      return 'La expresión usa '
           + op1 + ' y ' + op2
           + ', pero estos operadores no se pueden asociar. '
           + 'Quizás faltan paréntesis.';
    },

  'errmsg:obsolete-tuple-assignment':
    'Se esperaba un comando pero se encontró un paréntesis izquierdo. '
  + 'Nota: la sintaxis de asignación de tuplas "(x1, ..., xN) := y" '
  + 'está obsoleta. Usar "let (x1, ..., xN) := y".',

  /* Linter */
  'errmsg:program-already-defined':
    function (pos1, pos2) {
      return 'Ya había un programa definido en ' + pos1 + '.\n'
           + 'No se puede definir un programa en ' + pos2 + '.';
    },

  'errmsg:procedure-already-defined':
    function (name, pos1, pos2) {
      return 'El procedimiento "' + name + '" está definido dos veces: '
           + 'en ' + pos1 + ' y en ' + pos2 + '.';
    },

  'errmsg:function-already-defined':
    function (name, pos1, pos2) {
      return 'La función "' + name + '" está definida dos veces: '
           + 'en ' + pos1 + ' y en ' + pos2 + '.';
    },

  'errmsg:type-already-defined':
    function (name, pos1, pos2) {
      return 'El tipo "' + name + '" está definido dos veces: '
           + 'en ' + pos1 + ' y en ' + pos2 + '.';
    },

  'errmsg:constructor-already-defined':
    function (name, pos1, pos2) {
      return 'El constructor "' + name + '" está definido dos veces: '
           + 'en ' + pos1 + ' y en ' + pos2 + '.';
    },

  'errmsg:repeated-field-name':
    function (constructorName, fieldName) {
      return 'El campo "' + fieldName + '" no puede estar repetido '
           + 'para el constructor "' + constructorName + '".';
    },

  'errmsg:function-and-field-cannot-have-the-same-name':
    function (name, posFunction, posField) {
      return 'El nombre "' + name + '" se usa '
           + 'para una función en ' + posFunction + ' y '
           + 'para un campo en ' + posField + '.';
    },

  'errmsg:source-should-have-a-program-definition':
    /* Note: the code may actually be completely empty, but
     * we avoid this technicality since the message could be
     * confusing. */
    'El código debe tener una definición de "program { ... }".',

  'errmsg:procedure-should-not-have-return':
    function (name) {
      return 'El procedimiento "' + name + '" '
           + 'no debería tener un comando "return".';
    },

  'errmsg:function-should-have-return':
    function (name) {
      return 'La función "' + name + '" debería tener un comando "return".';
    },

  'errmsg:return-statement-not-allowed-here':
    'El comando "return" solo puede aparecer como el último comando '
  + 'de una función o como el último comando del programa.',

  'errmsg:local-name-conflict':
    function (name, oldCat, oldPos, newCat, newPos) {
      return 'Conflicto de nombres: "' + name + '" se usa dos veces: '
           + 'como ' + oldCat + ' en ' + oldPos + ', y '
           + 'como ' + newCat + ' en ' + newPos + '.';
    },

  'errmsg:repeated-variable-in-tuple-assignment':
    function (name) {
      return 'La variable "' + name + '" está repetida en la asignación '
           + 'de tuplas.';
    },

  'errmsg:constructor-used-as-procedure':
    function (name, type) {
      return 'El procedimiento "' + name + '" no está definido. '
           + 'El nombre "' + name + '" es el nombre de un constructor '
           + 'del tipo "' + type + '".';
    },

  'errmsg:undefined-procedure':
    function (name) {
      return 'El procedimiento "' + name + '" no está definido.';
    },

  'errmsg:undefined-function':
    function (name) {
      return 'La función "' + name + '" no está definida.';
    },

  'errmsg:procedure-arity-mismatch':
    function (name, expected, received) {
      return 'El procedimiento "' + name + '" espera recibir '
           + LOCALE_ES['<n>-parameters'](expected)
           + ' pero se lo invoca con '
           + LOCALE_ES['<n>-arguments'](received) + '.';
    },

  'errmsg:function-arity-mismatch':
    function (name, expected, received) {
      return 'La función "' + name + '" espera recibir '
           + LOCALE_ES['<n>-parameters'](expected)
           + ' pero se la invoca con '
           + LOCALE_ES['<n>-arguments'](received) + '.';
    },

  'errmsg:structure-pattern-arity-mismatch':
    function (name, expected, received) {
      return 'El constructor "' + name + '" tiene '
           + LOCALE_ES['<n>-fields'](expected)
           + ' pero el patrón tiene '
           + LOCALE_ES['<n>-parameters'](received) + '.';
    },

  'errmsg:type-used-as-constructor':
    function (name, constructorNames) {
      let msg;
      if (constructorNames.length === 0) {
        msg = '(no tiene constructores).';
      } else if (constructorNames.length === 1) {
        msg = '(tiene un constructor: ' + constructorNames[0] + ').';
      } else {
        msg = '(sus constructores son: '
            + constructorNames.join(', ') + ').';
      }
      return 'El constructor "' + name + '" no está definido. '
           + 'El nombre "' + name + '" es el nombre de un tipo '
           + msg;
    },

  'errmsg:procedure-used-as-constructor':
    function (name) {
      return 'El constructor "' + name + '" no está definido. '
           + 'El nombre "' + name + '" es el nombre de un procedimiento.';
    },

  'errmsg:undeclared-constructor':
    function (name) {
      return 'El constructor "' + name + '" no está definido.';
    },

  'errmsg:wildcard-pattern-should-be-last':
    'El comodín "_" tiene que ser la última rama del switch.',

  'errmsg:numeric-pattern-repeats-number':
    function (number) {
      return 'Hay dos ramas distintas para el número "' + number + '".';
    },

  'errmsg:structure-pattern-repeats-constructor':
    function (name) {
      return 'Hay dos ramas distintas para el constructor "' + name + '".';
    },

  'errmsg:structure-pattern-repeats-tuple-arity':
    function (arity) {
      return 'Hay dos ramas distintas para las tuplas de ' + arity.toString()
           + ' componentes.';
    },

  'errmsg:structure-pattern-repeats-timeout':
    'Hay dos ramas distintas para el TIMEOUT.',

  'errmsg:pattern-does-not-match-type':
    function (expectedType, patternType) {
      return 'Los patrones tienen que ser todos del mismo tipo. '
           + 'El patrón debería ser de tipo ' + expectedType
           + 'pero es de tipo ' + patternType + '.';
    },

  'errmsg:patterns-in-interactive-program-must-be-events':
    'Los patrones de un "interactive program" deben ser eventos.',

  'errmsg:patterns-in-switch-must-not-be-events':
    'Los patrones de un "switch" no pueden ser eventos.',

  'errmsg:structure-construction-repeated-field':
    function (constructorName, fieldName) {
      return 'El campo "' + fieldName + '" está repetido en '
           + 'la instanciación del constructor "' + constructorName + '".';
    },

  'errmsg:structure-construction-invalid-field':
    function (constructorName, fieldName) {
      return 'El campo "' + fieldName + '" no es un campo válido '
           + 'para el constructor "' + constructorName + '".';
    },

  'errmsg:structure-construction-missing-field':
    function (constructorName, fieldName) {
      return 'Falta darle valor al campo "' + fieldName + '" '
           + 'del constructor "' + constructorName + '".';
    },

  'errmsg:structure-construction-cannot-be-an-event':
    function (constructorName) {
      return 'El constructor "' + constructorName + '" corresponde a un '
           + 'evento, y solamente se puede manejar implícitamente '
           + 'en un programa interactivo (el usuario no puede construir '
           + 'instancias).';
    },

  /* Runtime errors (virtual machine) */
  'errmsg:undefined-variable':
    function (variableName) {
      return 'La variable "' + variableName + '" no está definida.';
    },

  'errmsg:too-few-arguments':
    function (routineName) {
      return 'Faltan argumentos para "' + routineName + '".';
    },

  'errmsg:expected-structure-but-got':
    function (constructorName, valueTag) {
      return 'Se esperaba una estructura construida '
           + 'con el constructor "' + constructorName + '", '
           + 'pero se recibió ' + valueTag + '.';
    },

  'errmsg:expected-constructor-but-got':
    function (constructorNameExpected, constructorNameReceived) {
      return 'Se esperaba una estructura construida '
           + 'con el constructor "'
           + constructorNameExpected + '", '
           + 'pero el constructor recibido es '
           + constructorNameReceived + '".';
    },

  'errmsg:incompatible-types-on-assignment':
    function (variableName, oldType, newType) {
      return 'La variable "' + variableName + '" '
           + 'contenía ' + typeAsNoun(oldType) + ', '
           + 'no se le puede asignar ' + typeAsNoun(newType) + '".';
    },

  'errmsg:incompatible-types-on-list-creation':
    function (index, oldType, newType) {
      return 'Todos los elementos de una lista deben ser del mismo tipo. '
           + 'Los elementos son ' + typeAsQualifierPlural(oldType) + ', '
           + 'pero el elemento en la posición ' + index.toString() + ' '
           + 'es ' + typeAsQualifierSingular(newType) + '.';
    },

  'errmsg:incompatible-types-on-structure-update':
    function (fieldName, oldType, newType) {
      return 'El campo "' + fieldName + '" es '
           + typeAsQualifierSingular(oldType) + '. '
           + 'No se lo puede actualizar con '
           + typeAsNoun(newType) + '.';
    },

  'errmsg:expected-tuple-value-but-got':
    function (receivedType) {
      return 'Se esperaba una tupla pero se recibió '
           + typeAsNoun(receivedType) + '.';
    },

  'errmsg:tuple-component-out-of-bounds':
    function (size, index) {
      return 'Índice fuera de rango. '
           + 'La tupla es de tamaño ' + size.toString() + ' y '
           + 'el índice es ' + index.toString() + '.';
    },

  'errmsg:expected-structure-value-but-got':
    function (receivedType) {
      return 'Se esperaba una estructura pero se recibió '
           + typeAsNoun(receivedType) + '.';
    },

  'errmsg:structure-field-not-present':
    function (fieldNames, missingFieldName) {
      return 'La estructura no tiene un campo "' + missingFieldName + '". '
           + 'Los campos son: [' + fieldNames.join(', ') + '].';
    },

  'errmsg:primitive-does-not-exist':
    function (primitiveName) {
      return 'La operación primitiva "' + primitiveName + '" '
           + 'no existe o no está disponible.';
    },

  'errmsg:primitive-arity-mismatch':
    function (name, expected, received) {
      return 'La operación "' + name + '" espera recibir '
           + LOCALE_ES['<n>-parameters'](expected)
           + ' pero se la invoca con '
           + LOCALE_ES['<n>-arguments'](received) + '.';
    },

  'errmsg:primitive-argument-type-mismatch':
    function (name, parameterIndex, numArgs, expectedType, receivedType) {
      let msg = 'El ';
      if (numArgs > 1) {
        msg += ordinalNumber(parameterIndex) + ' ';
      }
      msg += 'parámetro ';
      msg += 'de "' + name + '" ';
      msg += 'debería ser ' + typeAsQualifierSingular(expectedType) + ' ';
      msg += 'pero es ' + typeAsQualifierSingular(receivedType) + '.';
      return msg;
    },

  'errmsg:expected-value-of-type-but-got':
    function (expectedType, receivedType) {
      return 'Se esperaba ' + typeAsNoun(expectedType) + ' '
           + 'pero se recibió ' + typeAsNoun(receivedType) + '.';
    },

  'errmsg:expected-value-of-some-type-but-got':
    function (expectedTypes, receivedType) {
      return 'Se esperaba un valor de alguno de los siguientes tipos: '
           + listOfTypes(expectedTypes) + '. '
           + 'Pero se recibió '
           + typeAsNoun(receivedType) + '.';
    },

  'errmsg:expected-values-to-have-compatible-types':
    function (type1, type2) {
      return 'Los tipos de las expresiones no coinciden: '
           + 'la primera es ' + typeAsQualifierSingular(type1) + ' '
           + 'y la segunda es ' + typeAsQualifierSingular(type2) + '.';
    },

  'errmsg:switch-does-not-match':
    'El valor analizado no coincide con ninguna de las ramas del switch.',

  'errmsg:cannot-divide-by-zero':
    'No se puede dividir por cero.',

  'errmsg:list-cannot-be-empty':
    'La lista no puede ser vacía.',

  'errmsg:timeout':
    function (millisecs) {
      return 'La ejecución del programa demoró más de '
           + millisecs.toString() + 'ms.';
    },

  /* Board operations */
  'errmsg:cannot-move-to':
    function (dirName) {
      return 'No se puede mover hacia la dirección ' + dirName +
             ': cae afuera del tablero.';
    },

  'errmsg:cannot-remove-stone':
    function (dirName) {
      return 'No se puede sacar una bolita de color ' + dirName +
             ': no hay bolitas de ese color.';
    },

  /* Runtime */

  'TYPE:Integer': 'Number',
  'TYPE:String': 'String',
  'TYPE:Tuple': 'Tuple',
  'TYPE:List': 'List',

  'TYPE:Event': 'Event',
  'CONS:INIT': 'INIT',
  'CONS:TIMEOUT': 'TIMEOUT',

  'TYPE:Bool': 'Bool',
  'CONS:False': 'False',
  'CONS:True': 'True',

  'TYPE:Color': 'Color',
  'CONS:Color0': 'Azul',
  'CONS:Color1': 'Negro',
  'CONS:Color2': 'Rojo',
  'CONS:Color3': 'Verde',

  'TYPE:Dir': 'Dir',
  'CONS:Dir0': 'Norte',
  'CONS:Dir1': 'Este',
  'CONS:Dir2': 'Sur',
  'CONS:Dir3': 'Oeste',

  'PRIM:BOOM': 'BOOM',
  'PRIM:boom': 'boom',

  'PRIM:PutStone': 'Poner',
  'PRIM:RemoveStone': 'Sacar',
  'PRIM:Move': 'Mover',
  'PRIM:GoToEdge': 'IrAlBorde',
  'PRIM:EmptyBoardContents': 'VaciarTablero',
  'PRIM:numStones': 'nroBolitas',
  'PRIM:anyStones': 'hayBolitas',
  'PRIM:canMove': 'puedeMover',
  'PRIM:next': 'siguiente',
  'PRIM:prev': 'previo',
  'PRIM:opposite': 'opuesto',
  'PRIM:minBool': 'minBool',
  'PRIM:maxBool': 'maxBool',
  'PRIM:minColor': 'minColor',
  'PRIM:maxColor': 'maxColor',
  'PRIM:minDir': 'minDir',
  'PRIM:maxDir': 'maxDir',

  'PRIM:head': 'primero',
  'PRIM:tail': 'resto',
  'PRIM:init': 'ultimo',
  'PRIM:last': 'comienzo',

  /* Helpers */
  '<alternative>':
    function (strings) {
      return 'alguna de las siguientes alternativas:\n'
           + strings.map(s => '  ' + s).join('\n');
    },
  '<position>':
    function (filename, line, column) {
      return filename + ':' + line.toString() + ':' + column.toString();
    },
  '<n>-parameters':
    function (n) {
      return pluralize(n, 'parámetro', 'parámetros');
    },
  '<n>-arguments':
    function (n) {
      return pluralize(n, 'argumento', 'argumentos');
    },
  '<n>-fields':
    function (n) {
      return pluralize(n, 'campo', 'campos');
    },
  '<pattern-type>':
    function (patternType) {
      if (patternType === 'Event') {
        return 'evento del programa interactivo';
      } else if (patternType.substring(0, 7) === '_TUPLE_') {
        return 'tupla de ' + patternType.substring(7) + ' componentes';
      } else {
        return patternType;
      }
    },
};

