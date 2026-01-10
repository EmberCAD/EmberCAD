import { cherryOptions as darkCherry } from '../../themes/darkCherry';

export default class ThemeManager {
  constructor() {}

  async setTheme(name) {
    name = name.replace('.js', '') + '.js';
    this.setRootCss();
  }

  setRootCss() {
    this._setCSS(darkCherry);
  }

  _setCSS(op, parent) {
    if (!op) return {};
    parent = parent || '';
    const keys = Object.keys(op);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (typeof op[key] === 'object') {
        this._setCSS(op[key], '-' + key);
      } else {
        const varName = `--cherry${parent}-${key}`;
        document.documentElement.style.setProperty(varName, op[key]);
      }
    }
  }
}
