
import { LOCALE_ES } from './es';

function keyword(palabra) {
  return '‘a palavra chave "' + palabra + '"';
}

function pluralize(n, singular, plural) {
  if (n === 0) {
    return 'nenhum ' + singular;
  } else if (n === 1) {
    return 'um ' + singular;
  } else {
    return n.toString() + ' ' + plural;
  }
}

export const LOCALE_PT = {};

for (let key in LOCALE_ES) {
  LOCALE_PT[key] = LOCALE_ES[key];
}

/* Descriptions of syntactic constructions and tokens */
LOCALE_PT['definition'] =
  'uma definição (de programa, função, procedimento, ou tipo)';
LOCALE_PT['pattern'] =
  'um padrão (comodín "_", construtor aplicado a variáveis, ou tupla)';
LOCALE_PT['statement'] = 'um comando';
LOCALE_PT['expression'] = 'uma expressão';
LOCALE_PT['procedure call'] = 'uma invocação a um procedimento';
LOCALE_PT['field name'] = 'o nome de um campo';
LOCALE_PT['T_EOF'] = 'o fim do arquivo';
LOCALE_PT['T_NUM'] = 'um número';
LOCALE_PT['T_STRING'] = 'uma corrente (string)';
LOCALE_PT['T_UPPERID'] = 'um identificador com maiúsculas';
LOCALE_PT['T_LOWERID'] = 'um identificador com minúsculas';
LOCALE_PT['T_PROGRAM'] = keyword('program');
LOCALE_PT['T_INTERACTIVE'] = keyword('interactive');
LOCALE_PT['T_PROCEDURE'] = keyword('procedure');
LOCALE_PT['T_FUNCTION'] = keyword('function');
LOCALE_PT['T_RETURN'] = keyword('return');
LOCALE_PT['T_IF'] = keyword('if');
LOCALE_PT['T_THEN'] = keyword('then');
LOCALE_PT['T_ELSE'] = keyword('else');
LOCALE_PT['T_REPEAT'] = keyword('repeat');
LOCALE_PT['T_FOREACH'] = keyword('foreach');
LOCALE_PT['T_IN'] = keyword('in');
LOCALE_PT['T_WHILE'] = keyword('while');
LOCALE_PT['T_SWITCH'] = keyword('switch');
LOCALE_PT['T_TO'] = keyword('to');
LOCALE_PT['T_LET'] = keyword('let');
LOCALE_PT['T_NOT'] = keyword('not');
LOCALE_PT['T_DIV'] = keyword('div');
LOCALE_PT['T_MOD'] = keyword('mod');
LOCALE_PT['T_TYPE'] = keyword('type');
LOCALE_PT['T_IS'] = keyword('is');
LOCALE_PT['T_RECORD'] = keyword('record');
LOCALE_PT['T_VARIANT'] = keyword('variant');
LOCALE_PT['T_CASE'] = keyword('case');
LOCALE_PT['T_FIELD'] = keyword('field');
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
    'A designação a uma tupla não pode ser '
  + ' constituída por apenas um componente. '
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
      return pluralize(n, 'parâmetro', 'parâmetros');
    };
LOCALE_PT['<n>-arguments'] =
    function (n) {
      return pluralize(n, 'argumento', 'argumentos');
    };
LOCALE_PT['<n>-fields'] =
    function (n) {
      return pluralize(n, 'campo', 'campos');
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

