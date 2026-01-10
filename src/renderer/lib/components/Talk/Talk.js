class Talk extends Component {
  constructor() {
    super();
    this.defaults();
    this._init();
    this._events();
  }

  defaults() {
    this.kind = 'nonvisual';
  }

  _init() {
    this.speaker = new SpeechSynthesisUtterance();
  }

  _events() {
    this.speaker.onboundary = (e) => {
      if (typeof this.onWord === 'function')
        this.onWord({
          charIndex: e.charIndex,
          charLength: e.charLength,
          elapsedTime: e.elapsedTime,
        });
    };

    this.speaker.onend = (e) => {
      if (typeof this.onEnd === 'function') this.onEnd(e);
    };
  }

  set text(txt) {
    this._data.text = txt;
    this.speaker.text = txt;
  }

  set lang(lang) {
    this.speaker.lang = lang || 'en-GB';
  }

  set rate(rate) {
    this.speaker.rate = rate || 1;
  }

  say(txt) {
    speechSynthesis.cancel();
    if (txt !== undefined) this.text = txt.replace(/’/g, "'");
    speechSynthesis.speak(this.speaker);
  }
}

module.exports = Talk;
