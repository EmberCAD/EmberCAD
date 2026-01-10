import Panel from '../Panel/Panel';

export default class View extends Panel {
  constructor(id) {
    super(id);
    this._init();
  }

  _init() {
    this.align = 'alClient';
    this.position = 'absolute';
    this.top = 0;
    this.left = 0;
    // this.backgroundColor = "#111";
  }
}
