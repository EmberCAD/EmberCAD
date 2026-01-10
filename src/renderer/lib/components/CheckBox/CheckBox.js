import { crEl } from '../../api/cherry/api';
import Component from '../Component/Component';
import Panel from '../Panel/Panel';
import Label from '../Label/Label';
import { tr } from '../../api/cherry/langs';
import { LP_RIGHT } from '../../api/declare_common';

const LABEL_MARGIN = 0;

export default class CheckBox extends Component {
  constructor(id) {
    super(id);

    this._init();
    this._events();
    this.defaults();
  }

  _init() {
    this.customProps = [
      { name: 'size' },
      { name: 'checked', values: ['true', 'false'] },
      { name: 'checkSymbol' },
      { name: 'uncheckSymbol' },
    ];
    this.propsFilter = ['align'];

    this.baseClass += ' ch-checkbox ch-flex100';
    this.cont.className = this.baseClass;

    this.border = '0 none transparent';

    this.checker = new Panel(this);
    this.checker.border = '1px solid var(--cherry-primary-main)';
    this.checker.borderRadius = 5;
    this.checker.designSwitch = true;
    this.checker.position = 'relative';
  }

  defaults() {
    this.size = 20;
    this.width = 100;
    this.checked = true;
    this.enabled = true;
    this.checker.ignoreEvents = true;
    this.design = false;
  }

  _events() {
    this.onClick = () => {
      if (!this.enabled) return;
      this.checked = !this.checked;
      if (typeof this.onChanged == 'function') this.onChanged(this.checked);
    };

    this.onStateChanged = () => {
      this.text = this.text;
      this.label.visibile = this.visible;
    };
  }

  set design(op) {
    super.design = op;

    this.designClass = op ? 'ch-eventsDisabled' : 'ch-eventsEnabled';
    if (this.label) {
      this.label.cont.classList = [];
      this.label.className = this.baseClass;
      this.label.cont.classList.add(this.designClass);
    }
  }

  get design() {
    return super.design;
  }

  set color(v) {
    this._data.color = v;
    this.checker.color = v;
    this.checker.border = '1px solid ' + v;
  }

  get color() {
    return this._data.color || window.getComputedStyle(this.cont).color;
  }

  set size(v) {
    this._data.size = v;
    this.height = v;
    this.checker.width = v;
    this.checker.height = v;
  }

  get size() {
    return this._data.size;
  }

  set checked(v) {
    this._data.checked = v;
    this.checker.caption = v ? this.checkSymbol : this.uncheckSymbol;
  }

  get checked() {
    return this._data.checked;
  }

  set checkSymbol(v) {
    this._data.checkSymbol = v;
  }

  get checkSymbol() {
    return this._data.checkSymbol || '<i class="fas fa-check"></i>';
  }

  set uncheckSymbol(v) {
    this._data.uncheckSymbol = v;
  }

  get uncheckSymbol() {
    return this._data.uncheckSymbol || '';
  }

  set text(txt) {
    super.text = txt;

    if (!this.label) {
      if (!txt) txt = this.name;
      this.cont.style.overflow = 'visible';
      this.label = new Label(this);
      this.label.margin = '0.15rem 0.5rem';
      this.label.position = 'relative';
      this.label.cont.setAttribute('designswitch', '');
    }

    // txt = tr(txt);
    this.label.text = txt;
    this._data.text = txt;
    setTimeout(() => {
      this._updateState();
    }, 1);
  }

  _updateState() {
    if (this.hint !== undefined) {
      this.label.hint = this.hint;
      this.checker.hint = this.hint;
    }
    if (this.devhint !== undefined) {
      this.label.devhint = this.devhint;
      this.checker.devhint = this.devhint;
    }

    switch (this.labelPosition) {
      case LP_RIGHT:
        break;

      case LP_LEFT:
        break;

      case LP_TOP:
        break;

      case LP_BOTTOM:
        break;

      default:
        break;
    }
  }

  get text() {
    return this._data.text || '';
  }

  set labelPosition(v) {
    this._data.labelPosition = v;
    this._updateState();
  }

  get labelPosition() {
    return this._data.labelPosition || LP_RIGHT;
  }

  set html(txt) {
    if (!txt) txt = this.name;
    this.cont.style.overflow = 'visible';
    this.label = new Label(this);
    this.label.margin = '0.15rem 0.5rem';
    this.label.position = 'relative';
    this.label.cont.setAttribute('designswitch', '');
    this.label.hint = super.hint;

    this.label.html = txt;
    this._data.html = txt;
    setTimeout(() => {
      this._updateState();
    }, 1);
  }

  set hint(txt) {
    super.hint = txt;
    this.cont.setAttribute('hint', txt);
    if (this.label) this.label.hint = super.hint;
  }
}
