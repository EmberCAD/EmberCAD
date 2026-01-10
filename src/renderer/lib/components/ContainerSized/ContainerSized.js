import Container from '../Container/Container.js';
import { OR_VERTICAL, OR_HORIZONTAL } from '../../api/declare_common';
import Application from '../Application/Application.js';

/**
 * Adds movable size element to the container
 */
export default class ContainerSized extends Container {
  constructor(parent) {
    super(parent);
    this.cont.remove(); // remove inherited container
    // this._init(parent);
    this._events();
  }

  _init(parent) {
    this.parent = parent;
    this.customProps = ['split', 'parts'];
    this.onEvents = [...this.onEvents, 'onSplitChange'];
    this.split = { parent, num: 2 };
  }

  _events() {
    this._onSplitChange = () => {
      this._data.parts = this.splitter.getSizes();

      if (typeof this.onSplitChange == 'function') this.onSplitChange(this.splitter);
    };
  }

  set split(obj) {
    if (!obj) return;
    this._data.split = obj;

    let { parent, num, direction, minSizes, splitId } = obj;

    if (!direction) direction = OR_VERTICAL;
    if (!parent) parent = this.parent || App.form;
    if (!num) num = 2;

    this._partsNum = num;
    this._uid = parent.uid;
    this._direction = direction;
    this.cont = this._divide(parent, num, direction, minSizes, splitId);

    if (obj.uids) {
      for (let i = 0; i < num; i++) {
        // CHERRIES.objects[obj.uids[i]] = CHERRIES.objects[this.cont[i].uid];
        // delete CHERRIES.objects[this.cont[i].uid];
        this.cont[i].uid = obj.uids[i];

        this.cont[i].cont.setAttribute('uid', obj.uids[i]);
      }
    }
    this._data.split.uids = [];

    for (let i = 0; i < num; i++) this._data.split.uids[i] = this.cont[i].uid;

    this._addSplit(parent);

    this._setParts();
  }

  _setParts() {
    this.topPart = this.bottomPart = this.centerPart = this.leftPart = this.rightPart = null;
    if (this._partsNum > 3) return;
    if (this._partsNum == 2) {
      if (this._direction == OR_VERTICAL) {
        this.topPart = this.part(0);
        this.bottomPart = this.part(1);
      } else {
        this.leftPart = this.part(0);
        this.rightPart = this.part(1);
      }
    }
    if (this._partsNum == 3) {
      this.centerPart = this.part(1);
      if (this._direction == OR_VERTICAL) {
        this.topPart = this.part(0);
        this.bottomPart = this.part(2);
      } else {
        this.leftPart = this.part(0);
        this.rightPart = this.part(2);
      }
    }
  }

  get split() {
    return this._data.split;
  }

  set parts(p) {
    this._data.parts = p;
    if (p.length != this._partsNum) {
      throw 'ContainerSized: Wrong number of arguments';
    }
    for (let i = 0; i < this._partsNum; i++) {
      this._direction == OR_VERTICAL ? (this.cont[i].height = p[i] + '%') : (this.cont[i].width = p[i] + '%');
    }
    this.splitSizes(p);
  }

  get parts() {
    return this._data.parts;
  }

  part(i) {
    return this.cont[i];
  }

  set color(v) {
    for (let i = 0; i < this._partsNum; i++) {
      this.cont[i].cont.style.backgroundColor = v;
    }
  }
}
