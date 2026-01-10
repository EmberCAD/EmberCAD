import { tr } from '../../api/cherry/langs';

const { crDiv } = require('../../api/cherry/api');

const MIN_WIDTH = 300;
const FORCE = true;

export default class Hint {
  constructor(id) {
    this._parent = id;
    this._init();
    this._events();
  }

  _init() {
    this.time = 500;
    this.timer = this.time;
    this.active = true;

    this.showDebouncer;
    this.hideDebouncer;

    this.mainCont = crDiv(
      {
        class: 'hinterCont',
      },
      this._parent,
    );
  }

  _events() {
    document.body.addEventListener('mousemove', (e) => {
      this.hintEngine(e);
    });

    document.addEventListener('click', () => {
      this.hide(FORCE);
    });
  }

  hintEngine(e) {
    if (this.forceHiding) return;
    let hint = e.target.getAttribute('hint');
    let devhint = e.target.getAttribute('devhint');
    this.show(e, hint);

    if (devhint && CHERRIES.app.design && devhint.indexOf('_IDE') < 0) {
      this.show(e, devhint);
    }
  }

  show(e, txt) {
    txt = tr(txt);
    if (this._display) {
      // custom display instead standard hint.
      this._display.text = txt;
      return;
    }
    if (!this.active) return;

    let posX = e.clientX;
    let width = this.mainCont.offsetWidth;

    let safePos = window.innerWidth - (width > MIN_WIDTH ? MIN_WIDTH : width);
    if (posX > safePos) posX = safePos;
    let posY = e.clientY + 22;
    if (posY > window.innerHeight - 22) posY = e.clientY - 40;
    this.mainCont.style.left = posX + 'px';
    this.mainCont.style.top = posY + 'px';

    if (this.prevTxt == txt) return;

    if (txt === null) {
      if (!this.showing) {
        this.timer = this.time;
      }
      this.prevTxt = '';
      this.hide(FORCE);
      return;
    }
    this.prevTxt = txt;
    this.mainCont.innerHTML = txt;

    if (this.showing) {
      this.timer = 10;
      return;
    }

    this.showing = true;

    clearTimeout(this.showDebouncer);
    this.showDebouncer = setTimeout(() => {
      this.mainCont.style.display = 'flex';
      clearTimeout(this.hideDebouncer);
      this.hideDebouncer = setTimeout(() => {
        this.prevTxt = '';
        this.hide();
      }, 5000);
    }, this.timer);
  }

  set display(cont) {
    this._display = cont;
  }

  set active(op) {
    this._active = op;
    if (!op) {
      this.showing = false;
      this.hide();
    }
  }

  get active() {
    return this._active;
  }

  hide(force) {
    if (force) {
      this.forceHiding = true;
      this.mainCont.style.display = null;
      this.showing = false;
      this.prevTxt = '';
      if (this._display) this._display.text = '';
      clearTimeout(this.showDebouncer);
      clearTimeout(this.hideDebouncer);
      setTimeout(() => {
        this.forceHiding = false;
      }, 100);
    } else if (this.prevTxt == '') {
      this.mainCont.style.display = null;
      this.showing = false;
    }
  }
}
