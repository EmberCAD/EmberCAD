import { crEl } from '../../api/cherry/api';
import Component from '../Component/Component';

export default class Input extends Component {
  constructor(id) {
    super(id);
    this._init();
    this._events();
    this.defaults();
  }

  _init() {
    this.customProps = [
      { name: 'text' },
      { name: 'placeholder' },
      { name: 'size' },
      { name: 'readonly', values: ['true', 'false'] },
    ];
    this.propsFilter = ['align'];

    this.cont.classList.add('ch-inputCont');
    this.cont.setAttribute('type', 'input');

    this.baseClass = ' ch-inputCont ch-flex100 ';

    this.input = crEl(
      'input',
      {
        class: ' ch-input ch-flex100 ',
        spellcheck: false,
      },
      this.cont,
    );

    this._redefineStyles({
      styles: ['borderRadius', 'border', 'background', 'backgroundColor'],
      targetElement: this.input,
      doDelete: true,
      unitConvert: true,
    });

    this._updateState();
  }

  _events() {
    this.onStateChanged = () => {
      this._updateState();
    };
  }

  set onChange(func) {
    this._clearListener(this.input, 'change');
    if (typeof func !== 'function') return;
    this._onInputCB = func;
    this.input.addEventListener(
      'change',
      (this.eventListeners['change'] = (e) => {
        if (this._design) return;
        func(e);
      }),
    );
  }

  set onInput(func) {
    this._clearListener(this.input, 'input');
    if (typeof func !== 'function') return;
    this._onInputCB = func;
    this.input.addEventListener(
      'input',
      (this.eventListeners['input'] = (e) => {
        if (this._design) return;
        func(e);
      }),
    );
  }

  set onFocus(func) {
    this._clearListener(this.input, 'focus');
    if (typeof func !== 'function') return;
    this.input.addEventListener(
      'focus',
      (this.eventListeners['focus'] = (e) => {
        if (this._design) return;
        func(e);
      }),
    );
  }

  set onKeyPress(func) {
    this._clearListener(this.input, 'keypress');
    if (typeof func !== 'function') return;
    this.input.addEventListener(
      'keypress',
      (this.eventListeners['keypress'] = (e) => {
        if (this._design) return;
        func(e);
      }),
    );
  }

  set onKeyDown(func) {
    this._clearListener(this.input, 'keydown');
    if (typeof func !== 'function') return;
    this.input.addEventListener(
      'keydown',
      (this.eventListeners['keydown'] = (e) => {
        if (this._design) return;
        func(e);
      }),
    );
  }

  set onBlur(func) {
    this._clearListener(this.input, 'blur');
    if (typeof func !== 'function') return;
    this.input.addEventListener(
      'blur',
      (this.eventListeners['blur'] = (e) => {
        if (this._design) return;
        func(e);
      }),
    );
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
    this.height = '1.5rem';
  }

  set text(txt) {
    this._data.text = txt;
    this.input.value = txt;
    if (typeof this._onInputCB === 'function') this._onInputCB();
  }

  get text() {
    return this.input.value;
  }
  set placeholder(txt) {
    this._data.placeholder = txt;
    this.input.placeholder = txt;
  }

  get placeholder() {
    return this.input.placeholder;
  }

  set design(op) {
    super.design = op;
    this.designClass = op ? ' ch-eventsDisabled' : ' ch-eventsEnabled';

    this.input.classList = [];
    this.input.className = this.designClass;
    this.input.classList.add('ch-input');
    this._design = op;
  }

  get design() {
    return super.design;
  }

  set backgroundColor(v) {
    this._data.backgroundColor = v;
    this.input.style.backgroundColor = v;
  }
  get backgroundColor() {
    return this._data.backgroundColor;
  }

  set size(v) {
    this._data.size = v;
    this.input.style.fontSize = v + (typeof v == 'string' ? '' : 'px');
    this.height = v;
  }

  get size() {
    return this._data.size;
  }

  set readonly(op) {
    this._data.readonly = op;
    op ? this.input.setAttribute('readonly', '') : this.input.removeAttribute('readonly');
  }

  get readonly() {
    return this._data.readonly;
  }

  set disabled(op) {
    op ? this.input.setAttribute('disabled', '') : this.input.removeAttribute('disabled');
  }
}
