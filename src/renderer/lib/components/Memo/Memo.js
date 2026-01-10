class Memo extends Component {
  constructor(id) {
    super(id);
    this._init();
    this._events();
    this.defaults();
  }

  _init() {
    this.customProps = [{ name: 'text' }, { name: 'placeholder' }, { name: 'readonly', values: ['true', 'false'] }];

    this.cont.classList.add('ch-memo');
    this.cont.setAttribute('type', 'memo');

    this.baseClass = ' ch-memo ch-flex100 ';

    this.input = crEl(
      'textarea',
      {
        class: this.baseClass,
        style: 'overflow:auto;border-radius:0',
      },
      this.cont,
    );

    this._redefineStyles({
      styles: ['fontFamily'],
      targetElement: this.input,
      doDelete: true,
    });

    this._redefineStyles({
      styles: ['background', 'backgroundColor'],
      targetElement: this.input,
      doDelete: true,
      unitConvert: true,
    });

    this._updateState();
  }

  _events() {
    this.input.oninput = (e) => {
      if (typeof this.onInput == 'function') this.onInput({ e, value: this.input.value });
    };
    this.input.onfocus = (e) => {
      if (typeof this.onFocus == 'function') this.onFocus({ e, value: this.input.value });
    };
    this.input.onblur = (e) => {
      if (typeof this.onBlur == 'function') this.onBlur({ e, value: this.input.value });
    };
    this.input.onpaste = (e) => {
      if (typeof this.onPaste == 'function') this.onPaste({ e, value: this.input.value });
    };

    this.onStateChanged = () => {
      this._updateState();
    };
  }

  _updateState() {
    if (this.hint !== undefined) {
      this.input.setAttribute('hint', this.hint);
    }
    if (this.devhint !== undefined) {
      this.input.setAttribute('devhint', this.devhint);
    }
  }

  defaults() {
    this.width = 100;
    this.height = 50;
  }

  clear() {
    this.text = '';
  }

  addLine(txt) {
    txt = txt || '';
    this.text += this.text === '' || this.text[this.text.length] === '\n' ? txt : '\n' + txt;
  }

  set readonly(op) {
    this._data.readonly = op;
    op ? this.input.setAttribute('readonly', '') : this.input.removeAttribute('readonly');
  }

  get readonly() {
    return this._data.readonly;
  }

  set text(txt) {
    this._data.text = txt;
    this.input.value = txt;
  }

  get text() {
    return this.input.value;
  }

  set size(v) {
    this._data.size = v;
    this.input.style.fontSize = v + (typeof v == 'string' ? '' : 'px');
    this.height = v;
    this.height += 10;
  }

  get size() {
    return this._data.size;
  }

  set placeholder(txt) {
    this._data.placeholder = txt;
    this.input.placeholder = txt;
  }

  get placeholder() {
    return this.input.placeholder;
  }

  set design(op) {
    this.designClass = op ? ' ch-eventsDisabled' : ' ch-eventsEnabled';
    this.input.className = this.baseClass + this.designClass;
    this._design = op;
  }

  get design() {
    return this._design;
  }

  set color(v) {
    this._data.backgroundColor = v;
    this.input.style.backgroundColor = v;
  }
  get color() {
    return this._data.color;
  }

  load(fname) {
    if (isWeb) {
      webLoad(fname);
      return;
    }

    try {
      this.text = fs.readFile(fname, 'utf8');
    } catch (err) {
      log(err);
    }
  }
}

module.exports = Memo;
