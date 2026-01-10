import { crEl } from '../../api/cherry/api';
import Component from '../Component/Component';
import { tr } from '../../api/cherry/langs';

export default class Button extends Component {
  constructor(id) {
    super(id);

    this._init();
    this._events();
    this.defaults();
  }

  _init() {
    this.customProps = [{ name: 'text' }];

    this.baseClass = 'ch-button ch-flex100';

    this.button = crEl(
      'button',
      {
        class: this.baseClass + ' ch-eventsDisabled',
        uid: this.uid
      },
      this.cont
    );

    this._redefineStyles({
      styles: ['borderRadius', 'border', 'background', 'backgroundColor'],
      targetElement: this.button,
      doDelete: true,
      unitConvert: true
    });

    this._updateState();
  }

  _events() {
    this.onStateChanged = () => {
      this._updateState();
    };
  }

  _updateState() {
    if (this.hint !== undefined) {
      this.button.setAttribute('hint', this.hint);
    }
    if (this.devhint !== undefined) {
      this.button.setAttribute('devhint', this.devhint);
    }
  }

  defaults() {
    this.width = 80;
    this.height = '1.5rem';
    this.design = false;
  }
  /////////////

  set text(txt) {
    super.text = txt;
    txt = tr(txt);
    this._data.text = txt;
    this.button.innerText = txt;
  }

  get text() {
    return this._data.text || '';
  }

  set html(txt) {
    this._data.html = txt;
    this.button.innerHTML = txt;
  }

  get html() {
    return this._data.html;
  }

  set caption(txt) {
    this.text = txt;
  }

  get caption() {
    return this.text;
  }

  set enabled(v) {
    this._data.enabled = v;
    v ? this.button.removeAttribute('disabled') : this.button.setAttribute('disabled', '');
  }

  get enabled() {
    return this._data.enabled;
  }

  /////////////

  set design(op) {
    this.designClass = op ? ' ch-eventsDisabled' : ' ch-eventsEnabled';
    this.button.className = this.baseClass + this.designClass;
    this._design = op;
  }

  get design() {
    return super.design;
  }
}
