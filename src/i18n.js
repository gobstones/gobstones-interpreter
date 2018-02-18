
import { LOCALE_ES } from './i18n/es';
import { LOCALE_EN } from './i18n/en';
import { LOCALE_PT } from './i18n/pt';

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

