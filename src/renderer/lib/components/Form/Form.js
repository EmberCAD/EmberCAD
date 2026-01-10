import { crDiv, DeepCopy, numberToPx } from '../../api/cherry/api';

export default class Form {
  constructor(id) {
    this._parent = id;
    this._init();
    this._events();
  }

  _init() {
    this.form = true; // identifier for components
    this.type = 'form';
    this.cont = crDiv(
      {
        class: 'ch-form',
        type: 'form',
      },
      this._parent,
    );

    this.props = ['backgroundColor', 'color', 'fontFamily', 'fontSize'];
    this.props['main'] = ['rect', 'cursor'];

    this.onEvents = [
      'onKeyDown',
      'onKeyUp',
      'onMouseMove',
      'onMouseDown',
      'onMouseUp',
      'onMouseLeave',
      'onMouseEnter',
      'onDblClick',
      'onClick',
      'onDragOver',
      'onDrop',
    ];
    this.eventListeners = [];
  }

  _events() {
    document.addEventListener('mouseup', (e) => {
      if (typeof this.onMouseUp === 'function') this.onMouseUp(this.getKeysAndMouse(e));
    });
  }

  _setListener(type, func) {
    this._clearListeners(this.cont, type);
    if (typeof func !== 'function') return;
    this.cont.addEventListener(
      type,
      (this.eventListeners[type] = (e) => {
        func(this.getKeysAndMouse(e));
      }),
    );
  }

  _clearListeners(node, type) {
    node.removeEventListener(type, this.eventListeners[type]);
  }

  set onKeyDown(func) {
    this._clearListeners(document, 'keydown');
    if (typeof func !== 'function') return;
    document.addEventListener('keydown', (e) => {
      func(this.getKeys(e));
    });
  }

  set onKeyUp(func) {
    this._clearListeners(document, 'keyup');
    if (typeof func !== 'function') return;
    document.addEventListener('keyup', (e) => {
      func(this.getKeys(e));
    });
  }

  set onMouseMove(func) {
    this._setListener('mousemove', func);
  }
  set onMouseDown(func) {
    this._setListener('mousedown', func);
  }

  set onMouseLeave(func) {
    this._setListener('mouseleave', func);
  }

  set onMouseEnter(func) {
    this._setListener('mouseenter', func);
  }

  set onDblClick(func) {
    this._setListener('dblclick', func);
  }

  set onClick(func) {
    this._setListener('click', func);
  }

  set onDragOver(func) {
    this._setListener('dragover', func);
  }

  set onDrop(func) {
    this._setListener('drop', func);
  }

  getKeys(e) {
    return {
      code: e.code,
      key: e.key,
      keyCode: e.keyCode,
      repeat: e.repeat,
      type: e.type,
      altKey: e.altKey,
      ctrlKey: e.ctrlKey || e.metaKey, // mac fix
      shiftKey: e.shiftKey,
      metaKey: e.metaKey,
    };
  }

  getKeysAndMouse(e) {
    // let rect = DeepCopy(e.target.getBoundingClientRect());

    return {
      target: e.target,
      // rect,
      // contRect: this.cont.getBoundingClientRect(),
      uid: e.target.getAttribute('uid'),
      type: e.target.getAttribute('type'),
      name: e.target.getAttribute('name'),
      pos: this.getPos(e),
      button: e.button,
      altKey: e.altKey,
      ctrlKey: e.ctrlKey || e.metaKey, // mac fix
      shiftKey: e.shiftKey,
      metaKey: e.metaKey,
    };
  }

  get top() {
    return this.rect.top;
  }
  get left() {
    return this.rect.left;
  }

  set left(v) {
    this.cont.style.left = v + 'px';
  }
  set top(v) {
    this.cont.style.top = v + 'px';
  }

  set height(v) {
    this.cont.style.height = numberToPx(v);
  }

  get height() {
    return this.rect.height;
  }
  get width() {
    return this.rect.width;
  }

  get rect() {
    return this.cont.getBoundingClientRect();
  }

  set color(col) {
    this.cont.style.color = col;
  }

  get color() {
    return this.cont.style.color || window.getComputedStyle(this.cont).color;
  }

  set backgroundColor(col) {
    this.cont.style.backgroundColor = col;
  }

  get backgroundColor() {
    return this.cont.style.backgroundColor || window.getComputedStyle(this.cont).backgroundColor;
  }

  set cursor(v) {
    this.cont.style.cursor = v;
  }

  get cursor() {
    return this.cont.style.cursor;
  }

  getPos(e) {
    return {
      x: e.clientX - this.rect.left,
      y: e.clientY - this.rect.top,
    };
  }

  clear() {
    this._removeComponents();
    this.cont.innerText = '';
  }

  _removeComponents() {
    const children = Array.from(this.cont.querySelectorAll('[name]'));
    for (let i = 0; i < children.length; i++) {
      const child = children[i].getAttribute('name');
      delete window[child];
      delete App[child];
    }
  }
}
