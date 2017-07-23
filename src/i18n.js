
function laPalabraClave(palabra) {
  return 'la palabra clave "' + palabra + '"';
}

const ES = {
  /* Lexer */
  'errmsg:unclosed-multiline-comment':
    'El comentario se abre pero nunca se cierra.',

  'errmsg:unclosed-string-constant':
    'La comilla que abre no tiene una comilla que cierra correspondiente.',

  'errmsg:numeric-constant-should-not-have-leading-zeroes':
    'Las constantes numéricas no se pueden escribir con ceros a la ' +
    'izquierda.',

  'errmsg:identifier-must-start-with-alphabetic-character':
    'Los identificadores deben empezar con un caracter alfabético ' +
    '(a...z,A...Z).',

  'errmsg:unknown-token':
    function (symbol) {
      return 'Símbolo desconocido en la entrada: "' + symbol + '".';
    },

  'errmsg:obsolete-tuple-assignment':
    'La sintaxis de asignación de tuplas "(x1, ..., xN) := y" está obsoleta.'
  + 'Usar "let (x1, ..., xN) := y".',

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
      return 'Se esperaba ' + expected + '.\n' +
             'Se encontró: ' + found + '.';
    },

  'errmsg:pattern-tuple-cannot-be-singleton':
    'El patrón para una tupla no puede tener una sola componente.\n' +
    'Las tuplas tienen 0, 2, 3, o más componentes, pero no 1.',

  'errmsg:assignment-tuple-cannot-be-singleton':
    'La asignación a una tupla no puede constar de una sola componente.\n' +
    'Las tuplas tienen 0, 2, 3, o más componentes, pero no 1.',

  '<alternative>':
    function (strings) {
      return 'alguna de las siguientes alternativas:\n'
           + strings.map(s => '  ' + s).join('\n');
    },

  /* Descriptions of syntactic constructions and tokens */
  'definition':
    'una definición (de programa, función, procedimiento, o tipo)',
  'pattern':
    'un patrón (comodín "_", constructor aplicado a variables, o tupla)',
  'statement': 'un comando',
  'expression': 'una expresión',
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
};

var language = 'ES';

var dictionaries = {
  'ES': ES
};

export function i18n(message) {
  return dictionaries[language][message];
}

