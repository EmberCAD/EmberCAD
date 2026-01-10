import Manager from '../../api/cherry/manager';

export default class ViewManager {
  constructor() {
    this._init();
  }

  _init() {
    this.views = new Manager();
  }

  addView(obj) {
    if (!obj) return;
    this.views.addElement({ store: obj.view, name: obj.ident });
  }

  clear() {
    this.views.clear();
  }

  switchTo(id) {
    Object.keys(this.views.elements).forEach((uid) => {
      let view = this.views.elements[uid];

      view.store.opacity = 0;
      view.store.zIndex = -1;
      view.store.pointerEvents = 'none';
      if (view.name === String(id)) {
        view.store.opacity = 1;
        view.store.zIndex = 1;
        view.store.pointerEvents = 'all';
        this._onSwitch(view.name);
      }
    });
  }

  _onSwitch(id) {
    if (typeof this.onSwitch == 'function') this.onSwitch(id);
  }
}
