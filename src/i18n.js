/* BEGIN LOCALE_ES */

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
const LOCALE_ES = {

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
           + 'El patrón debería ser de tipo "' + expectedType + '" '
           + 'pero es de tipo "' + patternType + '".';
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

  'errmsg:incompatible-types-on-structure-update':
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
           + LOCALE_ES['<n>-parameters'](expected)
           + ' pero se la invoca con '
           + LOCALE_ES['<n>-arguments'](received) + '.';
    },

  'errmsg:primitive-argument-type-mismatch':
    function (name, parameterIndex, expectedType, receivedType) {
      return 'El parámetro #' + parameterIndex.toString() + ' '
           + 'de la operación "' + name + '" '
           + 'debería ser de tipo ' + expectedType + ' '
           + 'pero el argumento es de tipo ' + receivedType + '.';
    },

  'errmsg:expected-value-of-type-but-got':
    function (expectedType, receivedType) {
      return 'Se esperaba un valor de tipo ' + expectedType + ' '
           + 'pero se recibió un valor de tipo ' + receivedType + '.';
    },

  'errmsg:expected-value-of-some-type-but-got':
    function (expectedTypes, receivedType) {
      return 'Se esperaba un valor de alguno de los siguientes tipos: '
           + expectedTypes.join(', ')
           + '; pero se recibió un valor de tipo ' + receivedType + '.';
    },

  'errmsg:expected-values-to-have-compatible-types':
    function (type1, type2) {
      return 'Los tipos de los valores deben ser compatibles, '
           + 'pero uno es de tipo ' + type1 + ' '
           + 'y el otro es de tipo ' + type2 + '.';
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
      if (patternType === 'Event') {
        return 'evento del programa interactivo';
      } else if (patternType.substring(0, 7) === '_TUPLE_') {
        return 'tupla de ' + patternType.substring(7) + ' componentes';
      } else {
        return patternType;
      }
    },
};
/* END LOCALE_ES */

/* BEGIN LOCALE_PT */
const LOCALE_PT = {};
for (let key in LOCALE_ES) {
  LOCALE_PT[key] = LOCALE_ES[key];
}

  /* Descriptions of syntactic constructions and tokens */
LOCALE_PT['definition'] =
  'uma definição (de programa, função, procedimento, ou tipo)';
LOCALE_PT['pattern'] = 'um padrão (comodín "_", construtor aplicado a variáveis, ou tupla)';
LOCALE_PT['statement'] = 'um comando';
LOCALE_PT['expression'] = 'uma expressão';
LOCALE_PT['procedure call'] = 'uma invocação a um procedimento';
LOCALE_PT['field name'] = 'o nome de um campo';
LOCALE_PT['T_EOF'] = 'o fim do arquivo';
LOCALE_PT['T_NUM'] = 'um número';
LOCALE_PT['T_STRING'] = 'uma corrente (string)';
LOCALE_PT['T_UPPERID'] = 'um identificador com maiúsculas';
LOCALE_PT['T_LOWERID'] = 'um identificador com minúsculas';
LOCALE_PT['T_PROGRAM'] = aPalavraChave('program');
LOCALE_PT['T_INTERACTIVE'] = aPalavraChave('interactive');
LOCALE_PT['T_PROCEDURE'] = aPalavraChave('procedure');
LOCALE_PT['T_FUNCTION'] = aPalavraChave('function');
LOCALE_PT['T_RETURN'] = aPalavraChave('return');
LOCALE_PT['T_IF'] = aPalavraChave('if');
LOCALE_PT['T_THEN'] = aPalavraChave('then');
LOCALE_PT['T_ELSE'] = aPalavraChave('else');
LOCALE_PT['T_REPEAT'] = aPalavraChave('repeat');
LOCALE_PT['T_FOREACH'] = aPalavraChave('foreach');
LOCALE_PT['T_IN'] = aPalavraChave('in');
LOCALE_PT['T_WHILE'] = aPalavraChave('while');
LOCALE_PT['T_SWITCH'] = aPalavraChave('switch');
LOCALE_PT['T_TO'] = aPalavraChave('to');
LOCALE_PT['T_LET'] = aPalavraChave('let');
LOCALE_PT['T_NOT'] = aPalavraChave('not');
LOCALE_PT['T_DIV'] = aPalavraChave('div');
LOCALE_PT['T_MOD'] = aPalavraChave('mod');
LOCALE_PT['T_TYPE'] = aPalavraChave('type');
LOCALE_PT['T_IS'] = aPalavraChave('is');
LOCALE_PT['T_RECORD'] = aPalavraChave('record');
LOCALE_PT['T_VARIANT'] = aPalavraChave('variant');
LOCALE_PT['T_CASE'] = aPalavraChave('case');
LOCALE_PT['T_FIELD'] = aPalavraChave('field');
LOCALE_PT['T_UNDERSCORE'] = 'um sublinhado ("_")';
LOCALE_PT['T_LPAREN'] = 'um parênteses esquerdo ("(")';
LOCALE_PT['T_RPAREN'] = 'um parênteses direito (")")';
LOCALE_PT['T_LBRACE'] = 'uma chave esquerda ("{")';
LOCALE_PT['T_RBRACE'] = 'uma chave direita ("}")';
LOCALE_PT['T_LBRACK'] = 'um colchete esquerdo ("[")';
LOCALE_PT['T_RBRACK'] = 'um colchete direito ("]")';
LOCALE_PT['T_COMMA'] = 'uma vírgula  (",")';
LOCALE_PT['T_SEMICOLON'] = 'um ponto e vírgula (";")';
LOCALE_PT['T_RANGE'] = 'um separador de intervalo ("..")';
LOCALE_PT['T_GETS'] = 'uma flecha para a esquerda ("<-")';
LOCALE_PT['T_PIPE'] = 'uma barra vertical ("|")';
LOCALE_PT['T_ARROW'] = 'uma flecha ("->")';
LOCALE_PT['T_ASSIGN'] = 'um operador de designação  (":=")';
LOCALE_PT['T_EQ'] = 'uma comparação por igualdade ("==")';
LOCALE_PT['T_NE'] = 'uma comparação por desigualdade ("/=")';
LOCALE_PT['T_LE'] = 'um menor ou igual ("<=")';
LOCALE_PT['T_GE'] = 'um maior ou igual (">=")';
LOCALE_PT['T_LT'] = 'um menor estrito ("<")';
LOCALE_PT['T_GT'] = 'um maior estrito (">")';
LOCALE_PT['T_AND'] = 'o "e" lógico ("&&")';
LOCALE_PT['T_OR'] = 'o "ou" lógico ("||")';
LOCALE_PT['T_CONCAT'] = 'o operador de concatenação de listas ("++")';
LOCALE_PT['T_PLUS'] = 'o operador de soma ("+")';
LOCALE_PT['T_MINUS'] = 'o operador de diferença ("-")';
LOCALE_PT['T_TIMES'] = 'o operador de produto ("*")';
LOCALE_PT['T_POW'] = 'o operador de potência ("^")';

  /* Local name categories */
LOCALE_PT['LocalVariable'] = 'variável';
LOCALE_PT['LocalIndex'] = 'índice';
LOCALE_PT['LocalParameter'] = 'parâmetro';

  /* Descriptions of value types */
LOCALE_PT['V_Integer'] = 'um número';
LOCALE_PT['V_String'] = 'uma cadeia';
LOCALE_PT['V_Tuple'] = 'uma tupla';
LOCALE_PT['V_List'] = 'uma lista';
LOCALE_PT['V_Structure'] = 'uma estrutura';

  /* Lexer */
LOCALE_PT['errmsg:unclosed-multiline-comment'] =
  'O comentário abre mas nunca fecha.';

LOCALE_PT['errmsg:unclosed-string-constant'] =
    'As aspas que abrem não possuem as aspas correspondentes que fecham.';

LOCALE_PT['errmsg:numeric-constant-should-not-have-leading-zeroes'] =
    'As constantes numéricas não podem ser escritas com zeros à '
   + 'esquerda.';

LOCALE_PT['errmsg:identifier-must-start-with-alphabetic-character'] =
    'Os identificadores devem começar com um caractere alfabético '
   + '(a...z,A...Z).';

LOCALE_PT['errmsg:unknown-token'] =
    function (symbol) {
      return 'Símbolo desconhecido na entrada: "' + symbol + '".';
    };

LOCALE_PT['warning:empty-pragma'] =
    'Diretiva pragma vazia.';

LOCALE_PT['warning:unknown-pragma'] =
    function (pragmaName) {
      return 'Diretiva pragma desconhecida: "' + pragmaName + '".';
    };

  /* Parser */
LOCALE_PT['errmsg:empty-source'] =
    'O programa está vazio.';

LOCALE_PT['errmsg:expected-but-found'] =
    function (expected, found) {
      return 'Esperava-se ' + expected + '.\n'
           + 'Encontrado: ' + found + '.';
    };

LOCALE_PT['errmsg:pattern-number-cannot-be-negative-zero'] =
    'O padrão numérico não pode ser "-0".';

LOCALE_PT['errmsg:pattern-tuple-cannot-be-singleton'] =
    'O padrão para uma tupla não pode ter apenas um componente. '
  + 'As tuplas têm 0, 2, 3, ou mais componentes, mas não 1.';

LOCALE_PT['errmsg:assignment-tuple-cannot-be-singleton'] =
    'A designação a uma tupla não pode ser constituída por apenas um componente. '
  + 'As tuplas têm 0, 2, 3, ou mais componentes, mas não 1.';

LOCALE_PT['errmsg:operators-are-not-associative'] =
    function (op1, op2) {
      return 'A expressão usa '
           + op1 + ' e ' + op2
           + ', mas estes operadores não podem ser associados. '
           + 'Talvez faltam parênteses.';
    };

LOCALE_PT['errmsg:obsolete-tuple-assignment'] =
    'Esperava-se um comando mas não foi encontrado um parênteses esquerdo. '
  + 'Nota: a sintaxe de designação de tuplas "(x1, ..., xN) := y" '
  + 'está obsoleta. Usar "let (x1, ..., xN) := y".';

  /* Linter */
LOCALE_PT['errmsg:program-already-defined'] =
    function (pos1, pos2) {
      return 'Já havia um programa definido em ' + pos1 + '.\n'
           + 'Não é possível definir um programa em ' + pos2 + '.';
    };

LOCALE_PT['errmsg:procedure-already-defined'] =
    function (name, pos1, pos2) {
      return 'O procedimiento "' + name + '" está definido duas vezes: '
           + 'em ' + pos1 + ' e em ' + pos2 + '.';
    };

LOCALE_PT['errmsg:function-already-defined'] =
    function (name, pos1, pos2) {
      return 'A função "' + name + '" está definida duas vezes: '
           + 'em ' + pos1 + ' e em ' + pos2 + '.';
    };

LOCALE_PT['errmsg:type-already-defined'] =
    function (name, pos1, pos2) {
      return 'O tipo "' + name + '" está definido duas vezes: '
           + 'em ' + pos1 + ' e em ' + pos2 + '.';
    };

LOCALE_PT['errmsg:constructor-already-defined'] =
    function (name, pos1, pos2) {
      return 'O construtor "' + name + '" está definido duas vezes: '
           + 'em ' + pos1 + ' e em ' + pos2 + '.';
    };

LOCALE_PT['errmsg:repeated-field-name'] =
    function (constructorName, fieldName) {
      return 'O campo "' + fieldName + '" não pode estar repetido '
           + 'para o construtor "' + constructorName + '".';
    };

LOCALE_PT['errmsg:function-and-field-cannot-have-the-same-name'] =
    function (name, posFunction, posField) {
      return 'O nome "' + name + '" usa-se '
           + 'para uma função em ' + posFunction + ' e '
           + 'para um campo em ' + posField + '.';
    };

LOCALE_PT['errmsg:source-should-have-a-program-definition'] =
    /* Note: the code may actually be completely empty, but
     * we avoid this technicality since the message could be
     * confusing. */
    'O código deve ter uma definição de "program { ... }".';

LOCALE_PT['errmsg:procedure-should-not-have-return'] =
    function (name) {
      return 'O procedimento "' + name + '" '
           + 'não deveria ter um comando "return".';
    };

LOCALE_PT['errmsg:function-should-have-return'] =
    function (name) {
      return 'A função "' + name + '" deveria ter um comando "return".';
    };

LOCALE_PT['errmsg:return-statement-not-allowed-here'] =
    'O comando "return"  pode aparecer apenas como o último comando '
  + 'de uma função ou como o último comando do programa.';

LOCALE_PT['errmsg:local-name-conflict'] =
    function (name, oldCat, oldPos, newCat, newPos) {
      return 'Conflito de nomes: "' + name + '" se usa duas vezes: '
           + 'como ' + oldCat + ' em ' + oldPos + ', e '
           + 'como ' + newCat + ' em ' + newPos + '.';
    };

LOCALE_PT['errmsg:repeated-variable-in-tuple-assignment'] =
    function (name) {
      return 'La variável "' + name + '" está repetida na designação '
           + 'de tuplas.';
    };

LOCALE_PT['errmsg:constructor-used-as-procedure'] =
    function (name, type) {
      return 'O procedimento "' + name + '" não está definido. '
           + 'O nome "' + name + '" é o nome de um construtor '
           + 'do tipo "' + type + '".';
    };

LOCALE_PT['errmsg:undefined-procedure'] =
    function (name) {
      return 'O procedimento "' + name + '" não está definido.';
    };

LOCALE_PT['errmsg:undefined-function'] =
    function (name) {
      return 'A função "' + name + '" não está definida.';
    };

LOCALE_PT['errmsg:procedure-arity-mismatch'] =
    function (name, expected, received) {
      return 'O procedimento "' + name + '" espera receber '
           + LOCALE_ES['<n>-parameters'](expected)
           + ' mas é invocado com '
           + LOCALE_ES['<n>-arguments'](received) + '.';
    };

LOCALE_PT['errmsg:function-arity-mismatch'] =
    function (name, expected, received) {
      return 'A função "' + name + '" espera receber '
           + LOCALE_ES['<n>-parameters'](expected)
           + ' mas é invocado com '
           + LOCALE_ES['<n>-arguments'](received) + '.';
    };

LOCALE_PT['errmsg:structure-pattern-arity-mismatch'] =
    function (name, expected, received) {
      return 'O construtor "' + name + '" tem '
           + LOCALE_ES['<n>-fields'](expected)
           + ' mas o padrão tem '
           + LOCALE_ES['<n>-parameters'](received) + '.';
    };

LOCALE_PT['errmsg:type-used-as-constructor'] =
    function (name, constructorNames) {
      let msg;
      if (constructorNames.length === 0) {
        msg = '(não tem construtores).';
      } else if (constructorNames.length === 1) {
        msg = '(tem um construtor: ' + constructorNames[0] + ').';
      } else {
        msg = '(seus construtores são: '
            + constructorNames.join(', ') + ').';
      }
      return 'O construtor "' + name + '" não está definido. '
           + 'O nome "' + name + '" é o nome de um tipo '
           + msg;
    };

LOCALE_PT['errmsg:procedure-used-as-constructor'] =
    function (name) {
      return 'O construtor "' + name + '" não está definido. '
           + 'O nome "' + name + '" é o nome de um procedimento.';
    };

LOCALE_PT['errmsg:undeclared-constructor'] =
    function (name) {
      return 'O construtor "' + name + '" não está definido.';
    };

LOCALE_PT['errmsg:wildcard-pattern-should-be-last'] =
    'O comodín "_" tem que ser o último ramo do switch.';

LOCALE_PT['errmsg:numeric-pattern-repeats-number'] =
    function (number) {
      return 'Tem dois ramos diferentes para o número "' + number + '".';
    };

LOCALE_PT['errmsg:structure-pattern-repeats-constructor'] =
    function (name) {
      return 'Há dois ramos distintos para o construtor "' + name + '".';
    };

LOCALE_PT['errmsg:structure-pattern-repeats-tuple-arity'] =
    function (arity) {
      return 'Há dois ramos distintos para as tuplas de ' + arity.toString()
           + ' componentes.';
    };

LOCALE_PT['errmsg:structure-pattern-repeats-timeout'] =
    'Há dois ramos distintos para o TIMEOUT.';

LOCALE_PT['errmsg:pattern-does-not-match-type'] =
    function (expectedType, patternType) {
      return 'Os padrões devem ser todos do mesmo tipo. '
           + 'O padrão deveria ser de tipo "' + expectedType + '" '
           + 'pero es de tipo "' + patternType + '".';
    };

LOCALE_PT['errmsg:patterns-in-interactive-program-must-be-events'] =
    'Os padrões de um "interactive program" devem ser eventos.';

LOCALE_PT['errmsg:patterns-in-switch-must-not-be-events'] =
    'Os padrões de um "switch" não podem ser eventos.';

LOCALE_PT['errmsg:structure-construction-repeated-field'] =
    function (constructorName, fieldName) {
      return 'O campo "' + fieldName + '" está repetido em '
           + 'a instanciação do construtor "' + constructorName + '".';
    };

LOCALE_PT['errmsg:structure-construction-invalid-field'] =
    function (constructorName, fieldName) {
      return 'O campo "' + fieldName + '" não é um campo válido '
           + 'para o construtor "' + constructorName + '".';
    };

LOCALE_PT['errmsg:structure-construction-missing-field'] =
    function (constructorName, fieldName) {
      return 'Falta dar valor ao campo "' + fieldName + '" '
           + 'do construtor "' + constructorName + '".';
    };

LOCALE_PT['errmsg:structure-construction-cannot-be-an-event'] =
    function (constructorName) {
      return 'O construtor "' + constructorName + '" corresponde a um '
           + 'evento, e só pode ser administrado implicitamente '
           + 'em um programa interativo (o usuário não pode construir '
           + 'instâncias).';
    };

  /* Runtime errors (virtual machine) */
LOCALE_PT['errmsg:undefined-variable'] =
    function (variableName) {
      return 'A variável "' + variableName + '" não está definida.';
    };

LOCALE_PT['errmsg:too-few-arguments'] =
    function (routineName) {
      return 'Faltam argumentos para "' + routineName + '".';
    };

LOCALE_PT['errmsg:expected-structure-but-got'] =
    function (constructorName, valueTag) {
      return 'Esperava-se uma estrutura construída '
           + 'com o construtor "' + constructorName + '", '
           + 'mas foi recebido ' + valueTag + '.';
    };

LOCALE_PT['errmsg:expected-constructor-but-got'] =
    function (constructorNameExpected, constructorNameReceived) {
      return 'Esperava-se uma estrutura construída '
           + 'com o construtor "'
           + constructorNameExpected + '", '
           + 'mas o construtor recebido é '
           + constructorNameReceived + '".';
    };

LOCALE_PT['errmsg:incompatible-types-on-assignment'] =
    function (variableName, oldType, newType) {
      return 'A variável "' + variableName + '" '
           + 'continha un valor do tipo ' + oldType + ', '
           + 'não é possível designar um valor de tipo ' + newType + '".';
    };

LOCALE_PT['errmsg:incompatible-types-on-list-creation'] =
    function (index, oldType, newType) {
      return 'Todos os elementos de uma lista devem ser do mesmo tipo. '
           + 'Os elementos são do tipo ' + oldType + ', '
           + 'mas o elemento na posição ' + index.toString() + ' '
           + 'é do tipo ' + newType + '.';
    };

LOCALE_PT['errmsg:incompatible-types-on-structure-update'] =
    function (fieldName, oldType, newType) {
      return 'O campo "' + fieldName + '" é do tipo ' + oldType + '. '
           + 'Não pode ser atualizado com um valor do tipo ' + newType + '.';

    };

LOCALE_PT['errmsg:expected-tuple-value-but-got'] =
    function (receivedType) {
      return 'Esperava-se uma tupla mas um valor não foi recebido '
           + 'de tipo ' + receivedType + '.';
    };

LOCALE_PT['errmsg:tuple-component-out-of-bounds'] =
    function (size, index) {
      return 'Índice fora do intervalo. '
           + 'A tupla é do tamanho ' + size.toString() + ' e '
           + 'o índice é ' + index.toString() + '.';
    };

LOCALE_PT['errmsg:expected-structure-value-but-got'] =
    function (receivedType) {
      return 'Se esperaba una estructura pero se recibió un valor '
           + 'de tipo ' + receivedType + '.';
    };

LOCALE_PT['errmsg:structure-field-not-present'] =
    function (fieldNames, missingFieldName) {
      return 'A estrutura não possui um campo "' + missingFieldName + '". '
           + 'Os campos são: [' + fieldNames.join(', ') + '].';
    };

LOCALE_PT['errmsg:primitive-does-not-exist'] =
    function (primitiveName) {
      return 'A operação primitiva "' + primitiveName + '" '
           + 'não existe ou não está disponível.';
    };

LOCALE_PT['errmsg:primitive-arity-mismatch'] =
    function (name, expected, received) {
      return 'A operação "' + name + '" espera receber '
           + LOCALE_ES['<n>-parameters'](expected)
           + ' mas é invocada com '
           + LOCALE_ES['<n>-arguments'](received) + '.';
    };

LOCALE_PT['errmsg:primitive-argument-type-mismatch'] =
    function (name, parameterIndex, expectedType, receivedType) {
      return 'O parâmetro #' + parameterIndex.toString() + ' '
           + 'da operação "' + name + '" '
           + 'deveria ser do tipo ' + expectedType + ' '
           + 'mas o argumento é do tipo ' + receivedType + '.';
    };

LOCALE_PT['errmsg:expected-value-of-type-but-got'] =
    function (expectedType, receivedType) {
      return 'Esperava-se um valor do tipo ' + expectedType + ' '
           + 'mas foi recebido um valor do tipo ' + receivedType + '.';
    };

LOCALE_PT['errmsg:expected-value-of-some-type-but-got'] =
    function (expectedTypes, receivedType) {
      return 'Esperava-se um valor de algum dos seguintes tipos: '
           + expectedTypes.join(', ')
           + '; mas foi recebido um valor do tipo ' + receivedType + '.';
    };

LOCALE_PT['errmsg:expected-values-to-have-compatible-types'] =
    function (type1, type2) {
      return 'Os tipos dos valores devem ser compatíveis, '
           + 'mas um é do tipo ' + type1 + ' '
           + 'e o outro é do tipo ' + type2 + '.';
    };

LOCALE_PT['errmsg:switch-does-not-match'] =
    'O valor analisado não coincide com nenhum dos ramos do switch.';

LOCALE_PT['errmsg:cannot-divide-by-zero'] =
    'Não é possível dividir por zero.';

LOCALE_PT['errmsg:list-cannot-be-empty'] =
    'A lista não pode ser vazia.';

LOCALE_PT['errmsg:timeout'] =
    function (millisecs) {
      return 'A execução do programa demorou mais de '
           + millisecs.toString() + 'ms.';
    };

  /* Board operations */
LOCALE_PT['errmsg:cannot-move-to'] =
    function (dirName) {
      return 'Não é possível mover para a direção ' + dirName +
             ': cai fora do tabuleiro.';
    };

LOCALE_PT['errmsg:cannot-remove-stone'] =
    function (dirName) {
      return 'Não é posível retirar uma pedra de cor ' + dirName +
             ': não há pedras dessa cor.';
    };

  /* Runtime */

LOCALE_PT['TYPE:Color'] = 'Cor';
LOCALE_PT['CONS:Color0'] = 'Azul';
LOCALE_PT['CONS:Color1'] = 'Preto';
LOCALE_PT['CONS:Color2'] = 'Vermelho';
LOCALE_PT['CONS:Color3'] = 'Verde';

LOCALE_PT['TYPE:Dir'] = 'Dir';
LOCALE_PT['CONS:Dir0'] = 'Norte';
LOCALE_PT['CONS:Dir1'] = 'Leste';
LOCALE_PT['CONS:Dir2'] = 'Sul';
LOCALE_PT['CONS:Dir3'] = 'Oeste';

LOCALE_PT['PRIM:PutStone'] = 'Colocar';
LOCALE_PT['PRIM:RemoveStone'] = 'Retirar';
LOCALE_PT['PRIM:Move'] = 'Mover';
LOCALE_PT['PRIM:GoToEdge'] = 'IrABorda';
LOCALE_PT['PRIM:EmptyBoardContents'] = 'EsvaziarTabuleiro';
LOCALE_PT['PRIM:numStones'] = 'nroPedras';
LOCALE_PT['PRIM:anyStones'] = 'haPedras';
LOCALE_PT['PRIM:canMove'] = 'podeMover';
LOCALE_PT['PRIM:next'] = 'seguinte';
LOCALE_PT['PRIM:prev'] = 'previo';
LOCALE_PT['PRIM:opposite'] = 'oposto';
LOCALE_PT['PRIM:minBool'] = 'minBool';
LOCALE_PT['PRIM:maxBool'] = 'maxBool';
LOCALE_PT['PRIM:minColor'] = 'minCor';
LOCALE_PT['PRIM:maxColor'] = 'maxCor';
LOCALE_PT['PRIM:minDir'] = 'minDir';
LOCALE_PT['PRIM:maxDir'] = 'maxDir';

LOCALE_PT['PRIM:head'] = 'primeiro';
LOCALE_PT['PRIM:tail'] = 'resto';
LOCALE_PT['PRIM:init'] = 'ultimo';
LOCALE_PT['PRIM:last'] = 'comeco';

  /* Helpers */
LOCALE_PT['<alternative>'] =
    function (strings) {
      return 'alguma das seguintes alternativas:\n'
           + strings.map(s => '  ' + s).join('\n');
    };
LOCALE_PT['<position>'] =
    function (filename, line, column) {
      return filename + ':' + line.toString() + ':' + column.toString();
    };
LOCALE_PT['<n>-parameters'] =
    function (n) {
      return masculino(n, 'parâmetro', 'parâmetros');
    };
LOCALE_PT['<n>-arguments'] =
    function (n) {
      return masculino(n, 'argumento', 'argumentos');
    };
LOCALE_PT['<n>-fields'] =
    function (n) {
      return masculino(n, 'campo', 'campos');
    };
LOCALE_PT['<pattern-type>'] =
    function (patternType) {
      if (patternType === 'Event') {
        return 'evento do programa interativo';
      } else if (patternType.substring(0, 7) === '_TUPLE_') {
        return 'tupla de ' + patternType.substring(7) + ' componentes';
      } else {
        return patternType;
      }
    };

/* END LOCALE_PT */

/* BEGIN LOCALE_EN */
const LOCALE_EN = {};
for (let key in LOCALE_ES) {
  LOCALE_EN[key] = LOCALE_ES[key];
}

LOCALE_EN['TYPE:Color'] = 'Color';
LOCALE_EN['CONS:Color0'] = 'Blue';
LOCALE_EN['CONS:Color1'] = 'Black';
LOCALE_EN['CONS:Color2'] = 'Red';
LOCALE_EN['CONS:Color3'] = 'Green';

LOCALE_EN['TYPE:Dir'] = 'Dir';
LOCALE_EN['CONS:Dir0'] = 'North';
LOCALE_EN['CONS:Dir1'] = 'East';
LOCALE_EN['CONS:Dir2'] = 'South';
LOCALE_EN['CONS:Dir3'] = 'West';

LOCALE_EN['PRIM:PutStone'] = 'PutStone';
LOCALE_EN['PRIM:RemoveStone'] = 'RemoveStone';
LOCALE_EN['PRIM:Move'] = 'Move';
LOCALE_EN['PRIM:GoToEdge'] = 'GoToEdge';
LOCALE_EN['PRIM:EmptyBoardContents'] = 'EmptyBoardContents';
LOCALE_EN['PRIM:numStones'] = 'numStones';
LOCALE_EN['PRIM:anyStones'] = 'anyStones';
LOCALE_EN['PRIM:canMove'] = 'canMove';
LOCALE_EN['PRIM:next'] = 'next';
LOCALE_EN['PRIM:prev'] = 'prev';
LOCALE_EN['PRIM:opposite'] = 'opposite';
LOCALE_EN['PRIM:minBool'] = 'minBool';
LOCALE_EN['PRIM:maxBool'] = 'maxBool';
LOCALE_EN['PRIM:minColor'] = 'minColor';
LOCALE_EN['PRIM:maxColor'] = 'maxColor';
LOCALE_EN['PRIM:minDir'] = 'minDir';
LOCALE_EN['PRIM:maxDir'] = 'maxDir';

LOCALE_EN['PRIM:head'] = 'head';
LOCALE_EN['PRIM:tail'] = 'tail';
LOCALE_EN['PRIM:init'] = 'init';
LOCALE_EN['PRIM:last'] = 'last';

/* END LOCALE_EN */

let CURRENT_LANGUAGE = 'es';

let dictionaries = {
  'es': LOCALE_ES,
  'en': LOCALE_EN,
  'pt': LOCALE_PT,
};

export function i18n(message) {
  return dictionaries[CURRENT_LANGUAGE][message];
}

export function i18nWithLanguage(code, thunk) {
  if (!(code in dictionaries)) {
    throw Error('Invlid language code: ' + code);
  }
  let oldLanguage = CURRENT_LANGUAGE;
  CURRENT_LANGUAGE = code;
  try {
    return thunk();
  } finally {
    CURRENT_LANGUAGE = oldLanguage;
  }
}

export function i18nPosition(position) {
  return i18n('<position>')(
           position.filename,
           position.line,
           position.column,
         );
}

