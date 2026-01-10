import { computedStyleToNumber } from '../../api/cherry/api.js';
import Hint from '../Hint/Hint.js';
import MainMenuT from '../MainMenu/MainMenuT.js';
import TitleBar from '../TitleBar/TitleBar.js';
import * as remote from '@electron/remote';
import Form from '../Form/Form.js';
import '../../css/main.css';
export const isMac = process.platform === 'darwin';
export const isWindows = process.platform === 'win32';
export const isWeb = false;

export const mainProcess = remote;
mainProcess.win = remote.getCurrentWindow();

export default class Application {
  constructor(name, isModern, parent) {
    this._parent = parent || document.body;
    this.isModern = isModern;

    this.mainMenu = new MainMenuT(this._parent);
    this.titleBar = new TitleBar(this._parent, isModern ? this.mainMenu : null);
    if (!isModern) {
      this._parent.appendChild(this.mainMenu.cont);
    }
    this.caption = name || 'CherryJS';

    this.form = new Form(this._parent);

    this._data = {};

    this.lineHeight = computedStyleToNumber(document.body, 'fontSize');
    this.onEvents();

    this.hinter = new Hint(document.body);

    this._setHeight();
  }

  _setHeight() {
    this.form.height = 0;
    let menuHeight = 0;
    let titleBarHeight = this.titleBar.visible ? computedStyleToNumber(this.titleBar.cont, 'height') : 0;
    if (!isMac) menuHeight = this.mainMenu.visible && !this.isModern ? computedStyleToNumber(this.mainMenu.cont, 'height') : 0;
    if (isNaN(menuHeight)) menuHeight = 0;
    this.form.height = `calc(100vh - (var(--app-title-bar-height) + ${menuHeight}px))`;
    this.resize();
  }

  setRes(fname) {
    try {
      let res = fs.readFileSync(fname);
      console.log(res);
    } catch (error) { }
  }

  resize() {
    window.dispatchEvent(new Event('resize'));
  }

  onEvents() {
    this.form.onKeyDown = (res) => {
      if (typeof this.onKeyDown === 'function') this.onKeyDown(res);
    };
    this.form.onKeyUp = (res) => {
      if (typeof this.onKeyUp === 'function') this.onKeyUp(res);
    };

    this.form.onMouseMove = (res) => {
      if (typeof this.onMouseMove === 'function') this.onMouseMove(res);
    };

    this.form.onMouseDown = (res) => {
      if (typeof this.onMouseDown === 'function') this.onMouseDown(res);
    };
    this.form.onMouseUp = (res) => {
      if (typeof this.onMouseUp === 'function') this.onMouseUp(res);
    };
    ///////////
    window.addEventListener('resize', (e) => {
      this.titleBar.updateRestore();
      if (typeof this.onResize === 'function') this.onResize(e);
    });
    ///////////
    if (!isMac) {
      this.mainMenu.onShow = () => {
        this._setHeight();
      };
      this.mainMenu.onHide = () => {
        this._setHeight();
      };
    }

    ///////////
    this.titleBar.onShow = () => {
      this._setHeight();
    };
    this.titleBar.onHide = () => {
      this._setHeight();
    };
    ///////////
  }

  set caption(txt) {
    this.titleBar.caption = document.title = txt;
  }

  get caption() {
    return this.titleBar.caption;
  }

  set design(op) {
    this._design = op;
  }

  get design() {
    return this._design;
  }

  ////////////////////////////////////////

  onClose() { }

  onMaximize() { }

  onMinimize() { }
}
