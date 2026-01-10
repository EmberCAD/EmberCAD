import { alNone, crEl } from '../../api/cherry/api';
import Component from '../Component/Component';
import { tr } from '../../api/cherry/langs';

export default class Panel extends Component {
  constructor(id) {
    super(id);
    this._init();
    this.defaults();
  }

  _init() {
    this.customProps = [{ name: 'text' }, { name: 'size' }];

    this._radius = 0;
    this.baseClass += 'ch-panel';
    this.cont.className = this.baseClass;
    this.cont.setAttribute('type', 'panel');
  }

  defaults() {
    this.width = this.height = 100;
    this.align = alNone;
    this.backgroundColor = 'inherit';
    this.text = '';
  }

  set text(txt) {
    super.text = txt;

    txt = tr(txt);

    this._data.text = txt;
    if (txt === '') {
      if (this.span) this.span.remove();
      this.span = null;
      return;
    }
    if (!this.span) {
      this.span = crEl(
        'span',
        {
          class: 'ch-panelText'
        },
        this.cont
      );
    }

    this.span.innerHTML = txt;
  }

  get text() {
    return this._data.text;
  }

  set caption(txt) {
    this.text = txt;
  }

  get caption() {
    return this.text;
  }

  set size(v) {
    this._data.size = v;
    this.cont.style.fontSize = v + (typeof v == 'string' ? '' : 'px');
  }

  get size() {
    return this._data.size || window.getComputedStyle(this.cont).fontSize;
  }
}
