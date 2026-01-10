import { alClient, crDiv, firstLetterUpper, numberToPx } from '../../api/cherry/api';
import Component from '../Component/Component';
import Input from '../Input/Input';

export default class Select extends Component {
  constructor(id) {
    super(id);

    this._init();
    this._events();
    this.defaults();
  }

  _init() {
    this.propsFilter = ['align'];

    this.baseClass = 'ch-select ch-flex100';

    this.input = new Input(this);
    this.input.align = alClient;
    this.input.readonly = true;
    this.input.width = 'calc(100% - 2rem)';
    this.input.designSwitch = true;
    this.input.cont.setAttribute('suid', this.uid);
    this.cont.setAttribute('suid', this.uid);

    this.cont.style.overflow = 'visible';

    this.select = crDiv(
      {
        class: this.baseClass,
        suid: this.uid,
      },
      this.cont,
    );
    this.itemsCont = crDiv(
      {
        class: 'ch-itemCont',
        suid: this.uid,
      },
      document.body,
    );

    this.select.innerHTML = '<i class="fas fa-chevron-down"></i>';

    this._redefineStyles({
      styles: ['borderRadius', 'border', 'background', 'backgroundColor'],
      targetElement: this.input.input,
      doDelete: true,
      unitConvert: true,
    });

    this._updateState();
  }

  _events() {
    document.addEventListener('mousedown', (e) => {
      const suid = e.target.parentElement.getAttribute('suid');
      if (this.showing && this.uid !== suid) {
        this.toggleItems();
      }
    });

    this.cont.addEventListener('mousedown', (e) => {
      this.toggleItems();
    });

    this.itemsCont.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      const itemIndex = e.target.getAttribute('itemIndex');
      if (itemIndex) {
        this.itemIndex = itemIndex;
        this.toggleItems();
        if (typeof this.onChange === 'function') this.onChange();
      }
    });

    this.itemsCont.addEventListener('mousemove', (e) => {
      const itemIndex = e.target.getAttribute('itemindex');
      if (itemIndex === this.prevIndex) return;

      this.prevIndex = itemIndex;
      if (typeof this.onMouseHover === 'function') this.onMouseHover(this.items[itemIndex]);
    });
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
    this.showing = false;
    this.width = 145;
    this.height = '1.5rem';
    this.input.text = firstLetterUpper(this.name);
  }

  render() {
    this.itemsCont.innerHTML = '';
    const items = this.items || [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const div = crDiv(
        {
          itemIndex: i,
          class: 'ch-selectItem',
        },
        this.itemsCont,
      );
      div.innerHTML = item;
    }
  }

  toggleItems() {
    if (this.design) return;
    const bounds = this.cont.getBoundingClientRect();

    this.itemsCont.style.left = bounds.left + 'px';
    if (!this.itemsWidth) this.itemsCont.style.width = bounds.width + 'px';
    this.itemsCont.style.top = bounds.bottom + 'px';

    this.showing = !this.showing;
    this.itemsCont.style.display = this.showing ? 'block' : null;
  }

  set design(op) {
    super.design = op;

    this.designClass = op ? 'ch-eventsDisabled' : 'ch-eventsEnabled';

    this.select.classList = [];
    this.select.className = this.baseClass;
    this.select.classList.add(this.designClass);

    this.itemsCont.classList = [];
    this.itemsCont.className = 'ch-itemCont';
    this.itemsCont.classList.add(this.designClass);
  }

  get design() {
    return super.design;
  }

  set showing(op) {
    this._showing = op;
  }

  get showing() {
    return this._showing;
  }

  set items(arr) {
    if (!arr) return;
    this._data.items = arr;
    this.height = this.height;
    this.text = '';
    this._data.itemIndex = -1;
    this.render();
  }

  get items() {
    return this._data.items;
  }

  set height(v) {
    super.height = v;
    if (v && this.itemsCont) this.itemsCont.style.top = numberToPx(v);
  }

  set itemsWidth(v) {
    this._data.itemsWidth = v;
    this.itemsCont.style.width = v;
  }

  get itemsWidth() {
    return this._data.itemsWidth;
  }

  set itemIndex(idx) {
    if (!isNaN(idx) && this.items[idx]) {
      this._data.itemIndex = idx;
      this.text = this.items[idx];
    }
  }

  get itemIndex() {
    return Number(this._data.itemIndex);
  }

  set placeholder(v) {
    this._data.placeholder = v;
    this.input.placeholder = v;
  }

  get placeholder() {
    return this._data.placeholder;
  }

  set text(v) {
    this._data.text = v;
    this.input.text = v;
  }

  get text() {
    return this._data.text;
  }

  set hint(v) {
    super.hint = v;
    this.input.hint = v;
  }
}
