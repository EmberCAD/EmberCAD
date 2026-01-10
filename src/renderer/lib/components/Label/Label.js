import { tr } from '../../api/cherry/langs';
import Component from '../Component/Component';

export default class Label extends Component {
  constructor(id) {
    super(id);

    this._init();
    this.defaults();
  }

  defaults() {
    this.width = 'auto';
    this.height = '1.5rem';
  }

  _init() {
    this.customProps = [{ name: 'text' }, { name: 'html' }, { name: 'fontFamily' }, { name: 'fontSize' }];

    this.baseClass += ' ch-label ch-flex100 ';

    // this.cont.classList.add('ch-label');
    // this.cont.setAttribute('type', 'label');
  }

  set font(v) {
    this._data.font = v;
    this.cont.style.fontFamily = v;
  }
  get font() {
    return this._data.font;
  }

  set size(v) {
    this._data.size = v;
    this.cont.style.fontSize = v + (typeof v == 'string' ? '' : 'px');
    this.height = v;
    this.height += 10;
  }

  get size() {
    return this._data.size;
  }

  set text(txt) {
    super.text = txt;

    txt = tr(txt);
    this._data.text = txt;
    this.cont.style.whiteSpace = 'pre';
    this.cont.innerText = txt;
  }

  get text() {
    return this.cont.innerText;
  }
  set html(txt) {
    this._data.html = txt;
    this.cont.innerHTML = txt;
  }

  get html() {
    return this.cont.innerHTML;
  }
}
