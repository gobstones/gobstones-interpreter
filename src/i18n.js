
function laPalabraClave(palabra) {
  return 'la palabra clave "' + palabra + '"';
}

function masculino(n, singular, plural) {
  if (n === 0) {
    return 'ningún ' + singular;
  } else if (n === 1) {
    return 'un ' + singular;
  } else {
    return n.toString() + ' ' + plural;
  }
}

const ES = {

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
  'T_PROGRAM': laPalabraClave('program'),
  'T_INTERACTIVE': laPalabraClave('interactive'),
  'T_PROCEDURE': laPalabraClave('procedure'),
  'T_FUNCTION': laPalabraClave('function'),
  'T_RETURN': laPalabraClave('return'),
  'T_IF': laPalabraClave('if'),
  'T_THEN': laPalabraClave('then'),
  'T_ELSE': laPalabraClave('else'),
  'T_REPEAT': laPalabraClave('repeat'),
  'T_FOREACH': laPalabraClave('foreach'),
  'T_IN': laPalabraClave('in'),
  'T_WHILE': laPalabraClave('while'),
  'T_SWITCH': laPalabraClave('switch'),
  'T_TO': laPalabraClave('to'),
  'T_LET': laPalabraClave('let'),
  'T_NOT': laPalabraClave('not'),
  'T_DIV': laPalabraClave('div'),
  'T_MOD': laPalabraClave('mod'),
  'T_TYPE': laPalabraClave('type'),
  'T_IS': laPalabraClave('is'),
  'T_RECORD': laPalabraClave('record'),
  'T_VARIANT': laPalabraClave('variant'),
  'T_CASE': laPalabraClave('case'),
  'T_FIELD': laPalabraClave('field'),
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

  /* Parser */
  'errmsg:empty-source':
    'El programa está vacío.',

  'errmsg:expected-but-found':
    function (expected, found) {
      return 'Se esperaba ' + expected + '.\n'
           + 'Se encontró: ' + found + '.';
    },

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
           + ES['<n>-parameters'](expected)
           + ' pero se lo invoca con '
           + ES['<n>-arguments'](received) + '.';
    },

  'errmsg:function-arity-mismatch':
    function (name, expected, received) {
      return 'La función "' + name + '" espera recibir '
           + ES['<n>-parameters'](expected)
           + ' pero se la invoca con '
           + ES['<n>-arguments'](received) + '.';
    },

  'errmsg:constructor-pattern-arity-mismatch':
    function (name, expected, received) {
      return 'El constructor "' + name + '" tiene '
           + ES['<n>-fields'](expected)
           + ' pero el patrón tiene '
           + ES['<n>-parameters'](received) + '.';
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

  'errmsg:constructor-pattern-repeats-constructor':
    function (name) {
      return 'Hay dos ramas distintas para el constructor "' + name + '".';
    },

  'errmsg:constructor-pattern-repeats-tuple-arity':
    function (arity) {
      return 'Hay dos ramas distintas para las tuplas de ' + arity.toString()
           + ' componentes.';
    },

  'errmsg:constructor-pattern-repeats-timeout':
    'Hay dos ramas distintas para el TIMEOUT.',

  'errmsg:pattern-does-not-match-type':
    function (expectedType, patternType) {
      return 'Los patrones tienen que ser todos del mismo tipo. '
           + 'El patrón debería ser de tipo "' + expectedType + '" '
           + 'pero es de tipo "' + patternType + '".';
    },

  'errmsg:patterns-in-interactive-program-must-be-events':
    'Los patrones de un "interactive program" deben ser eventos.',

  'errmsg:patterns-in-switch-must-not-be-events':
    'Los patrones de un "switch" no pueden ser eventos.',

  'errmsg:constructor-instantiation-repeated-field':
    function (constructorName, fieldName) {
      return 'El campo "' + fieldName + '" está repetido en '
           + 'la instanciación del constructor "' + constructorName + '".';
    },

  'errmsg:constructor-instantiation-invalid-field':
    function (constructorName, fieldName) {
      return 'El campo "' + fieldName + '" no es un campo válido '
           + 'para el constructor "' + constructorName + '".';
    },

  'errmsg:constructor-instantiation-missing-field':
    function (constructorName, fieldName) {
      return 'Falta darle valor al campo "' + fieldName + '" '
           + 'del constructor "' + constructorName + '".';
    },

  'errmsg:constructor-instantiation-cannot-be-an-event':
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
           + 'contenía un valor de tipo ' + oldType + ', '
           + 'no se le puede asignar un valor de tipo ' + newType + '".';
    },

  'errmsg:incompatible-types-on-list-creation':
    function (index, oldType, newType) {
      return 'Todos los elementos de una lista deben ser del mismo tipo. '
           + 'Los elementos son de tipo ' + oldType + ', '
           + 'pero el elemento en la posición ' + index.toString() + ' '
           + 'es de tipo ' + newType + '.';
    },

  'errmsg:incompatible-types-on-record-update':
    function (fieldName, oldType, newType) {
      return 'El campo "' + fieldName + '" es de tipo ' + oldType + '. '
           + 'No se lo puede actualizar con un valor de tipo ' + newType + '.';
    },

  'errmsg:expected-tuple-value-but-got':
    function (receivedType) {
      return 'Se esperaba una tupla pero se recibió un valor '
           + 'de tipo ' + receivedType + '.';
    },

  'errmsg:tuple-component-out-of-bounds':
    function (size, index) {
      return 'Índice fuera de rango. '
           + 'La tupla es de tamaño ' + size.toString() + ' y '
           + 'el índice es ' + index.toString() + '.';
    },

  'errmsg:expected-structure-value-but-got':
    function (receivedType) {
      return 'Se esperaba una estructura pero se recibió un valor '
           + 'de tipo ' + receivedType + '.';
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
           + ES['<n>-parameters'](expected)
           + ' pero se la invoca con '
           + ES['<n>-arguments'](received) + '.';
    },

  'errmsg:primitive-argument-type-mismatch':
    function (name, parameterIndex, expectedType, receivedType) {
      return 'El parámetro #' + parameterIndex.toString() + ' '
           + 'de la operación "' + name + '" '
           + 'debería ser de tipo ' + expectedType + ' '
           + 'pero el argumento es de tipo ' + receivedType + '.';
    },

  /* Runtime */

  'TYPE:Color': 'Color',
  'CONS:Color0': 'Azul',
  'CONS:Color1': 'Negro',
  'CONS:Color2': 'Rojo',
  'CONS:Color3': 'Verde',
  'PRIM:PutStone': 'Poner',
  'PRIM:numStones': 'nroBolitas',

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
      return masculino(n, 'parámetro', 'parámetros');
    },
  '<n>-arguments':
    function (n) {
      return masculino(n, 'argumento', 'argumentos');
    },
  '<n>-fields':
    function (n) {
      return masculino(n, 'campo', 'campos');
    },
  '<pattern-type>':
    function (patternType) {
      if (patternType.substring(0, 6) === '_EVENT') {
        return 'evento del programa interactivo';
      } else if (patternType.substring(0, 7) === '_TUPLE_') {
        return 'tupla de ' + patternType.substring(7) + ' componentes';
      } else {
        return patternType;
      }
    },
};

let language = 'ES';

let dictionaries = {
  'ES': ES
};

export function i18n(message) {
  return dictionaries[language][message];
}

export function i18nPosition(position) {
  return i18n('<position>')(
           position.filename,
           position.line,
           position.column,
         );
}

