//@ts-ignore
//@ts-nocheck

import Component from '../Component/Component';
import Input from '../Input/Input';
import Label from '../Label/Label';
import Panel from '../Panel/Panel';

const validNumbers = '0123456789.,-';

export default class LabelInput extends Component {
  label: Label;
  input: Input;
  changed = false;
  isNumeric: any;
  initText: any;
  constructor(private id) {
    super(id);
    this._init();
    this.defaults();

    this._events();
  }

  defaults() {
    this.cont.style.width = 'auto';
    this.cont.style.height = '2rem';
    this.cont.style.justifyContent = 'right';
    this.input.width = 70;
  }
  private _init() {
    this.label = new Label(this.cont);
    this.input = new Input(this.cont);

    this.label.top = '0.25rem';
    this.label.marginRight = '0.5rem';
    this.label.marginLeft = '0.5rem';

    this.isNumeric = true;
  }

  private _events() {
    this.input.onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.input.input.blur();
        this.onChangeCB({ changed: false });
      }
    };

    this.input.onKeyPress = (e) => {
      if (e.key === 'Enter') {
        this.onChangeCB({ changed: true });
      }
      if (this.isNumeric && validNumbers.indexOf(e.key) < 0) {
        e.preventDefault();
        return;
      }
      this.changed = true;
    };

    this.input.onFocus = () => {
      this.initText = this.input.text;
    };

    this.input.onBlur = () => {
      this.onChangeCB({ blur: true, changed: this.changed });
    };
  }

  private onChangeCB(opt?) {
    this.changed = false;
    if (this.numeric) {
      const num = Number(this.input.text);
      if (isNaN(num)) this.input.text = this.initText || 0;
    }
    if (typeof this.onChange === 'function') this.onChange(opt);
  }

  set numeric(op) {
    this.isNumeric = op;
  }

  get numeric() {
    return this.isNumeric;
  }

  set disabled(op) {
    this.input.disabled = op;
  }
}
