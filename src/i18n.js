
const ES = {
  'errmsg:unclosed-multiline-comment':
    'El comentario se abre pero nunca se cierra.',

  'errmsg:unclosed-string-constant':
    'La comilla que abre no tiene una comilla que cierra correspondiente.',

  'errmsg:unknown-token':
    'Símbolo desconocido en la entrada.',

  'errmsg:obsolete-tuple-assignment':
    'La sintaxis de asignación de tuplas "(x1, ..., xN) := y" está obsoleta. Usar "let (x1, ..., xN) := y".',

  'warning:empty-pragma':
    'Directiva pragma vacía.',

  'warning:unknown-pragma':
    'Directiva pragma desconocida.'
};

var language = 'ES';

var dictionaries = {
  'ES': ES
};

export function i18n(message) {
  return dictionaries[language][message];
}

