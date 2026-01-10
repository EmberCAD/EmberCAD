import { codec64 } from '../../api/cherry/codec64';
import { cherryStylesUnitConvert, cheryStyles } from '../../api/cherry/props';
import {
  anTopLeft,
  crDiv,
  numberToPx,
  alNone,
  alClient,
  alTop,
  alRight,
  alBottom,
  alLeft,
  DeepCopy,
} from '../../api/cherry/api';
import { OR_VERTICAL } from '../../api/declare_common';
/**
 * Base component
 */
export default class Component {
  /**
   *
   * @param {*} parent - CHERRIES Component - if undefined - get app form
   */
  constructor(parent) {
    let p = parent ? parent.cont : App.form.cont;

    this._armStyles();

    this.uid = codec64.uId('');
    if (!window['CHERRIES']) window['CHERRIES'] = {};

    window['CHERRIES'][this.uid] = this;

    this.baseClass = 'ch-component ';
    this.designClass = '';

    this.cont = crDiv(
      {
        class: this.baseClass,
        uid: this.uid,
      },
      p || parent,
    );
    // if (CHERRIES.nameSpace) {
    //   this.cont.setAttribute('namespace', CHERRIES.nameSpace);
    //   this.nameSpace = CHERRIES.nameSpace;
    // }

    this.parent = p || parent;

    this.changeOrig = true; // for store original top/left position - usage resize from center

    // available platform
    // this.platform = ['pc', 'mac', 'linux', 'mobile', 'browser'];

    // events
    this.onEvents = [
      'onClick',
      'onMouseDown',
      'onMouseUp',
      'onMouseMove',
      'onKeyDown',
      'onKeyUp',
      'onKeyPress',
      'onDrop',
      'onDragStart',
      'onDragEnter',
      'onDragLeave',
    ];

    this.eventListeners = [];

    /// data to store
    this._data = {};
    this.prevAnchor = 'init';
    this.top = this.left = 0;
    this.width = this.height = 100;
    this._data.anchor = anTopLeft;
    this.boxSizing = 'border-box';

    this.type = Object.getPrototypeOf(this).constructor.name;
    this.kind = 'visual';

    this._data.visible = true;

    // CHERRIES.registerComponent(this);
  }

  // add resize listener if required
  addResizeListener() {
    window.addEventListener('resize', (e) => {
      clearTimeout(this.resizeDebouncer);
      this.resizeDebouncer = setTimeout(() => {
        this._onResizeCB();
      }, 50);
    });
  }

  _armStyles() {
    this.stylesUnitConvert = cherryStylesUnitConvert;
    this.styles = cheryStyles;

    this.properties = ['offsetTop', 'offsetBottom', 'offsetLeft', 'offsetRight', 'offsetParent'];

    // set usage without -> *.style.+
    ////////////////////////////////////

    this._redefineStyles({ styles: this.stylesUnitConvert, targetElement: this, unitConvert: true });
    this._redefineStyles({ styles: this.styles, targetElement: this });
    this._redefineProperties(this.properties);
  }

  _redefineStyles({ styles, targetElement, doDelete, unitConvert }) {
    for (let i = 0; i < styles.length; i++) {
      if (doDelete) delete this[styles[i]];
      Object.defineProperty(this, styles[i], {
        configurable: true,

        set: (v) => {
          this._data[styles[i]] = v;
          if (targetElement.style) {
            targetElement.style[styles[i]] = unitConvert ? numberToPx(v) : v;
          } else if (targetElement.cont && targetElement.cont.style) {
            targetElement.cont.style[styles[i]] = unitConvert ? numberToPx(v) : v;
          }
        },
        get: () => {
          return (
            this._data[styles[i]] || (targetElement.cont ? window.getComputedStyle(targetElement.cont)[styles[i]] : '')
          );
        },
      });
    }
  }

  _redefineProperties(properties) {
    for (let i = 0; i < properties.length; i++) {
      Object.defineProperty(this, properties[i], {
        set: (v) => {
          this._data[properties[i]] = v;
          this.cont[properties[i]] = v;
        },
        get: () => {
          return this._data[properties[i]] || this.cont[properties[i]];
        },
      });
    }
  }

  set design(op) {
    this._design = op;
    this.muteChildren(op);
  }

  get design() {
    return this._design;
  }

  set designSwitch(op) {
    if (op) this.cont.setAttribute('designswitch', '');
    else this.cont.removeAttribute('designswitch');
  }
  get designSwitch() {
    return this.cont.getAttribute('designswitch');
  }

  destroy() {
    this.destroyChildren(this.cont);
    // CHERRIES.removeComponent(this.uid);
    this.cont.innerHTML = '';
    delete window[this.name];
    delete this;
  }

  destroyChildren(el) {
    const children = Array.from(el.querySelectorAll('[uid]'));
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const uid = child.getAttribute('uid');
      const name = child.getAttribute('name');
      if (uid) {
        this.destroyChildren(child);
        // if (CHERRIES.objects[uid]) {
        //   CHERRIES.removeComponent(uid);
        // }

        if (name) delete window[name];
      }
    }
    el.innerHTML = '';
  }

  // set pointer-evets to childs with design 'designswitch' tag
  muteChildren(op) {
    for (let i = 0; i < this.cont.children.length; i++) {
      let el = this.cont.children[i];
      let designswitch = el.getAttribute('designswitch');
      if (designswitch !== null) {
        el.style.pointerEvents = op ? 'none' : 'all';
      }
    }
  }

  set onMouseWheel(func) {
    this._setListener('wheel', func);
  }

  set onMouseDown(func) {
    this._setListener('mousedown', func);
  }

  set onMouseMove(func) {
    this._setListener('mousemove', func);
  }

  set onMouseLeave(func) {
    this._setListener('mouseleave', func);
  }

  set onMouseEnter(func) {
    this._setListener('mouseenter', func);
  }

  set onMouseUp(func) {
    this._setListener('mouseup', func);
  }

  set onDblClick(func) {
    this._setListener('dblclick', func);
  }

  set onClick(func) {
    this._setListener('click', func);
  }

  set onDragEnter(func) {
    this._setListener('dragenter', func);
  }

  set onDragOver(func) {
    this._setListener('dragover', func);
  }

  set onDrop(func) {
    this._setListener('drop', func);
  }

  set onDragStart(func) {
    this._setListener('dragstart', func);
  }

  set onDragEnter(func) {
    this._setListener('dragenter', func);
  }

  set onDragLeave(func) {
    this._setListener('dragleave', func);
  }

  set onTouchStart(func) {
    this._setListener('touchstart', func);
  }

  set onTouchEnd(func) {
    this._setListener('touchend', func);
  }

  set onTouchMove(func) {
    this._setListener('touchmove', func);
  }

  set onTouchCancel(func) {
    this._setListener('touchcancel', func);
  }

  setAttribute(a, v) {
    this.cont.setAttribute(a, v);
  }
  getAttribute(a) {
    return this.cont.getAttribute(a);
  }
  removeAttribute(a) {
    return this.cont.removeAttribute(a);
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
      event: e,
      target: e.target,
      state: this.getState(e),
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

  set name(v) {
    if (!v) return;

    let valid = !v.replace(/^[a-zA-Z_$][a-zA-Z_$0-9]*$/, '');

    if (!valid) {
      console.error(`Name '${v}' is not valid.`);
      return;
    }

    // const tempNameSpace = CHERRIES.nameSpace;
    const parentNameSpace = this.cont.parentElement.getAttribute('namespace');

    // if (!tempNameSpace && parentNameSpace) CHERRIES.nameSpace = parentNameSpace;
    // if (CHERRIES.nameSpace !== 'default' && CHERRIES.nameSpace && v.indexOf('_' + CHERRIES.nameSpace) < 0) {
    //   v += `_${CHERRIES.nameSpace}`;
    // }

    if (window[this.name]) delete window[this.name];
    this._data.name = v;

    window[v] = this;
    this.cont.setAttribute('name', v);
    // this.devhint = CHERRIES.nameSpace === 'default' ? v : '';

    // CHERRIES.nameSpace = tempNameSpace;
  }

  get name() {
    return this._data.name;
  }

  set userClass(cl) {
    this.cont.className = cl;
  }

  get userClass() {
    return this.cont.className;
  }

  set enabled(v) {
    this._data.enabled = v;
    let ev = 'all';
    if (v) {
      this.cont.style.opacity = 1;
      this.cont.style.pointerEvents = 'all';
      this.restoreStyle(this.cont, 'pointerEvents');
    } else {
      this.cont.style.opacity = 0.4;
      ev = 'none';
      this.storeStyle(this.cont, 'pointerEvents');
      this.cont.style.pointerEvents = 'none';
    }
    this.setStyle(this.cont, 'pointerEvents', ev);
  }

  set draggable(v) {
    this._data.draggable = v;
    this.cont.draggable = v ? true : null;
  }

  get draggable() {
    return this._data.draggable;
  }

  storeStyle(el, style) {
    let uid = el.getAttribute('uid');
    if (!uid) return;
    if (!this.storedStyles) this.storedStyles = [];
    this.storedStyles[uid] = window.getComputedStyle(el)[style];
    for (let i = 0; i < el.children.length; i++) this.storeStyle(el.children[i], style);
  }

  restoreStyle(el, style) {
    let uid = el.getAttribute('uid');
    if (!uid) return;
    if (!this.storedStyles) return;
    el[style] = this.storedStyles[uid];
    for (let i = 0; i < el.children.length; i++) this.restoreStyle(el.children[i], style);
  }

  setStyle(el, style, v) {
    let uid = el.getAttribute('uid');
    if (!uid) return;
    el.style[style] = v;
    for (let i = 0; i < el.children.length; i++) this.setStyle(el.children[i], style, v);
  }

  get enabled() {
    return this._data.enabled;
  }

  set text(v) {
    if (this.initialText) return;
    this.initialText = v;
  }

  set visible(op) {
    if (!this._design || op) this.display = op ? null : 'none';
    this._data.visible = op;
  }

  get visible() {
    return this._data.visible;
  }

  _setListener(type, func) {
    this._clearListener(this.cont, type);
    if (typeof func !== 'function') return;
    this.cont.addEventListener(
      type,
      (this.eventListeners[type] = (e) => {
        if (this._design) return;
        func(this.getKeysAndMouse(e));
      }),
    );
  }

  _clearListener(node, type) {
    if (this.eventListeners[type]) node.removeEventListener(type, this.eventListeners[type]);
  }

  set ignoreEvents(op) {
    this._data.ignoreEvents = op;
    this.cont.style.pointerEvents = op ? 'none' : 'all';
  }

  get ignoreEvents() {
    return this._data.ignoreEvents;
  }

  show() {
    if (this.cont) this.display = null;
  }

  hide() {
    if (this.cont) this.display = 'none';
  }

  _getParentInstance(parent) {
    if (!parent) return;
    if (parent.form) parent.cont = parent.form.cont;
    return parent.cont;
  }

  set parent(parent) {
    if (parent == undefined)
      if (App) {
        parent = App.form.cont;
      }

    if (parent.childCont) {
      parent = parent.childCont;
    } else if (parent.cont) parent = parent.cont;

    if (this.cont) {
      parent.appendChild(this.cont);
    }

    const type = parent.getAttribute('type');
    if (parent && type !== 'form' && type !== 'app') {
      const parentNameSpace =
        parent.getAttribute('namespace') || parent.parentElement.getAttribute('namespace') || 'default';
      if (parentNameSpace && this.cont) this.cont.setAttribute('namespace', parentNameSpace);
    }

    this._parent = parent; // DIV
  }

  get parent() {
    return window['CHERRIES'][this._parent.getAttribute('uid')] || App.form;
  }

  set top(v) {
    this._data.top = v;
    this.cont.style.top = numberToPx(v);
    this._data.bottom = null;
    this.cont.style.bottom = null;
    if (this.changeOrig) this.origTop = v;
    this.anchorUpdate();
  }

  get top() {
    return this.offsetTop;
  }

  set bottom(v) {
    this._data.bottom = v;
    if (v === null) return;

    this.cont.style.bottom = numberToPx(v);
    this._data.top = null;
    this.cont.style.top = null;
    if (this.changeOrig) this.origBottom = v;
    this.anchorUpdate();
  }

  get bottom() {
    return this.parent.cont.offsetHeight - this.cont.offsetHeight - this.cont.offsetTop;
  }

  set left(v) {
    this._data.left = v;
    this.cont.style.left = numberToPx(v);
    this._data.right = null;
    this.cont.style.right = null;
    if (this.changeOrig) this.origLeft = v;
    this.anchorUpdate();
  }

  get left() {
    return this.offsetLeft;
  }
  set right(v) {
    this._data.right = v;
    if (v === null) return;
    this.cont.style.right = numberToPx(v);
    this._data.left = null;
    this.cont.style.left = null;
    if (this.changeOrig) this.origRight = v;
    this.anchorUpdate();
  }

  get right() {
    return this.parent.cont.offsetWidth - this.cont.offsetWidth - this.cont.offsetLeft;
  }

  set width(v) {
    this._data.width = v;
    this.cont.style.width = numberToPx(v);
    this._onResizeCB();
    this.anchorUpdate();
  }

  get width() {
    return this.cont.offsetWidth;
  }

  set height(v) {
    this._data.height = v;
    this.cont.style.height = numberToPx(v);
    this._onResizeCB();
    this.anchorUpdate();
  }

  get height() {
    return this.cont.offsetHeight;
  }

  get rect() {
    if (!this.cont) return;
    this._rect = this.cont.getBoundingClientRect();
    return this._rect;
  }

  set rect(v) {
    // left blank intentionally
  }

  set align(v) {
    if (this._data.align === v) return;

    this._data.align = v;

    let uC = ` ${this.baseClass} ch-flex100 ch-${v} `;

    if (v == alNone) {
      if (this._data.align !== alNone) this.position = 'absolute';
      uC = this.baseClass;
      this._data.align = undefined;
      this.anchor = anTopLeft;
    }

    if (v == alClient) {
      this.anchor = anTopLeft;
    }

    if (v == alTop) {
      this.anchor = anTop;
    }

    if (v == alRight) {
      this.anchor = anRight;
    }

    if (v == alBottom) {
      this.anchor = anBottom;
    }

    if (v == alLeft) {
      this.anchor = anLeft;
    }

    this.userClass = uC;
    this._onResizeCB();
  }

  _resetPosition() {
    this.cont.style.top = null;
    this.cont.style.right = null;
    this.cont.style.bottom = null;
    this.cont.style.left = null;
  }

  get align() {
    return this._data.align || alNone;
  }

  set anchor(v) {
    if (this._data.anchor === v) return;

    this._data.anchor = v;

    // if (CHERRIES.loading) return;

    if (v === anTop || v === anLeft || v === anTopLeft) {
      this.top = this.top;
      this.left = this.left;
    }
    if (v === anTopRight || v === anRight) {
      this.top = this.top;
      this.right = this.right;
    }

    if (v === anBottomRight) {
      this.bottom = this.bottom;
      this.right = this.right;
    }
    if (v === anBottom || v === anBottomLeft) {
      this.bottom = this.bottom;
      this.left = this.left;
    }

    this.prevAnchor = '';
  }

  get anchor() {
    return this._data.anchor || anTopLeft;
  }

  anchorUpdate() {
    if (this.prevAnchor) return;
    this.prevAnchor = this._data.anchor;
    this._data.anchor = '';
    this.anchor = this.prevAnchor;
  }

  _onResizeCB() {
    if (typeof this.onResize === 'function') this.onResize();
  }

  center() {
    this.centerH();
    this.centerV();
  }

  centerH() {
    this.left = (this.parent.width - this.width) >> 1;
  }
  centerV() {
    this.top = (this.parent.height - this.height) >> 1;
  }

  set devhint(v) {
    this._devhint = v;
    if (v !== '') {
      this.setAttribute('devhint', v);
      // for (let i = 0; i < this.cont.children.length; i++)
      //     this.cont.children[i].setAttribute('devhint', v);
    } else {
      this.removeAttribute('devhint');
      // for (let i = 0; i < this.cont.children.length; i++)
      //     this.cont.children[i].removeAttribute('devhint');
    }
  }

  get devhint() {
    return this._devhint;
  }

  set hint(v) {
    this._data.hint = v;
    if (v !== '') {
      // if (this.cont.children.length > 0) this.cont.children[0].setAttribute('hint', v);
      // else
      this.cont.setAttribute('hint', v);
      for (let i = 0; i < this.cont.children.length; i++) this.cont.children[i].setAttribute('hint', v);
    } else {
      this.cont.removeAttribute('hint');
      for (let i = 0; i < this.cont.children.length; i++) this.cont.children[i].removeAttribute('hint');
    }
    if (typeof window['App'].onHintChange === 'function') window['App'].onHintChange();
  }

  get hint() {
    return this._data.hint;
  }

  set flash(v) {
    this._data.flash = v;
    if (v) {
      if (this.flashInt) return;
      this._tempColor = this.color;
      this._tempBackgroundColor = this.backgroundColor;
      this._counter = 1;
      this.color = this._tempBackgroundColor;
      this.backgroundColor = this._tempColor;
      this.flashInt = setInterval(() => {
        if (this._counter == 0) {
          this.color = this._tempBackgroundColor;
          this.backgroundColor = this._tempColor;
        }
        if (this._counter == 1) {
          this.color = this._tempColor;
          this.backgroundColor = this._tempBackgroundColor;
        }
        this._counter++;
        if (this._counter > 1) this._counter = 0;
      }, 500);
    } else {
      clearInterval(this.flashInt);
      this._counter = 0;
      this.flashInt = undefined;
      this.color = this._tempColor;
      this.backgroundColor = this._tempBackgroundColor;
    }
  }

  get flash() {
    return this._data.flash || false;
  }

  set autotranslate(op) {
    this._data.autotranslate = op;
  }

  get autotranslate() {
    return;
  }

  refresh() {}
  getPos(e) {
    let rect = this.cont.getBoundingClientRect();
    let res = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    if (e.touches) {
      res = {
        touches: e.touches,
        targetTouches: e.targetTouches,
        changedTouches: e.changedTouches,
      };
    }
    return res;
  }

  remove() {
    this.cont.remove();
  }

  set state(obj) {
    if (!obj || typeof obj !== 'object') {
      delete this.cont.dataset.state;
      return;
    }
    this.cont.dataset.state = JSON.stringify(Object.assign(this.state, obj));
  }

  get state() {
    return JSON.parse(this.cont.dataset.state || null) || {};
  }

  getState(e) {
    return JSON.parse(e.target.dataset.state || null) || {};
  }
}
