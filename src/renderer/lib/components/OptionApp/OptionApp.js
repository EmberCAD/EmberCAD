const { crEl, crDiv } = require('../../api/cherry/api');
const { codec64 } = require('../../api/cherry/codec64');
const { OR_VERTICAL } = require('../../api/declare_common');

class OptionApp {
  constructor(id, direction) {
    this.uniqId = codec64.uId('oa');
    this.itemIdx = -1;
    this._items = [];
    this.callback;
    this._parent = id;
    this._parent.flexDirection = 'column';
    this.direction = direction;
    this.cont = crDiv(
      {
        class: direction === OR_VERTICAL ? 'optionAppContV' : 'optionAppCont',
      },
      this._parent.cont,
    );
  }

  set menuItems(items) {
    this.cont.innerHTML = '';
    this.i_tems = [];
    for (let i = 0; i < items.length; i++) this.addItem(items[i]);
  }

  get menuItems() {
    return this._items;
  }

  select(sel, silent = false) {
    if (sel < 0 || sel > this.itemIdx) return;
    this._currentSelection = this._items[sel].item.ident;
    let e = this.cont.querySelector('[index="' + sel + '"]');
    e.checked = true;
    if (!silent) this.onChange_(e);
  }

  selectIdent(sel) {
    if (sel != undefined) {
      let selector = this.cont.querySelector('[ident="' + sel + '"]');

      if (selector != undefined) {
        let index = selector.getAttribute('index');
        this.select(index);
      }
    }
  }

  addItem(item) {
    this.itemIdx++;
    let index = this.itemIdx;

    let itmi = crEl(
      'input',
      {
        type: 'radio',
        name: this.uniqId,
        class: this.direction === OR_VERTICAL ? 'optionAppV' : 'optionApp',
        id: this.uniqId + this.itemIdx,
        index,
      },
      this.cont,
    );

    if (item.ident != undefined) itmi.setAttribute('ident', item.ident);
    if (item.disabled != undefined) itmi.setAttribute('disabled', item.disabled);

    let itml = crEl(
      'label',
      {
        class: this.direction === OR_VERTICAL ? 'optionAppV' : 'optionApp',
        for: itmi.id,
        hint: item.hint || item.label,
        style: item.style,
      },
      this.cont,
    );
    itml.innerHTML = item.label;

    if (item.color != undefined) itml.style.color = item.color;
    itmi.addEventListener('click', (e) => {
      this.onClick_(e.target);
    });
    itmi.addEventListener('touchstart', (e) => {
      this.onClick_(e.target);
    });

    this._items.push({ item, itemLabel: itml, itemInput: itmi });
  }

  set onChange(callback) {
    this.callback = callback;
    this.cont.addEventListener('change', (e) => {
      this.onChange_(e.target);
    });
  }

  set onClick(callback) {
    this.callback = callback;
  }

  enable(idx, state) {
    this.cont.querySelector('[index="' + idx + '"]').disabled = !state;
  }

  enabled(idx) {
    return !this.cont.querySelector('[index="' + idx + '"]').disabled;
  }

  onChange_(e) {
    if (this.callback != undefined) {
      this.callback(e.getAttribute('ident'));
    }
  }
  onClick_(e) {
    const idx = e.getAttribute('ident');
    this._currentSelection = idx;
    if (this.callback != undefined) {
      this.callback(idx);
    }
  }

  get currentSelection() {
    return this._currentSelection;
  }
}

module.exports = OptionApp;
