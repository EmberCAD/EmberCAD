/// translator

class Translator {
  constructor() {
    this._words = []; // dictionary
  }

  set lang(l) {
    this._lang = l;
  }

  get lang() {
    return this._lang || 'en';
  }

  translate(word) {
    let init = this._words[word];
    return init != undefined ? this._words[word][this.lang] : word;
  }

  addWords(obj) {
    this._words = Object.assign(this._words, obj);
  }
}

const translator = new Translator();

/// tr:  word - translate word
export const tr = (word) => translator.translate(word) || word;

translator.lang = 'en';

translator.addWords({
  Hello: {
    pl: 'Cześć',
    de: 'Halo',
    es: 'Hola',
    fr: 'Salut',
    it: 'Ciao',
  },
  Cherry: {
    pl: 'Wiśnia',
    de: 'Kirche',
    es: 'Cereza',
    fr: 'Cerise',
    it: 'Ciliegia',
  },
});

translator.addWords({
  'No Name': {
    pl: 'Bez nazwy',
  },
  copy: {
    pl: 'kopia',
  },
});

translator.addWords({
  App: {
    en: 'EmberCAD',
    pl: 'EmberCAD',
  },
  About: {
    en: 'About EmberCAD...',
    pl: 'O EmberCAD...',
  },
});
