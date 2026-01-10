import Container from '../Container/Container.js';
import { OR_VERTICAL, OR_HORIZONTAL } from '../../api/declare_common';
import Application from '../Application/Application.js';

export default class Container3 extends Container {
  constructor(parent) {
    super(parent);
    this._init(parent);
    this.cont.remove(); // remove inherited container
  }

  _init(parent) {
    this.parent = parent;
    this.customProps = ['divide', 'parts'];
    this.divide = { parent };
  }

  set direction(dir) {
    this._data.direction = dir;
    this.divide = { direction: dir };
  }

  get direction() {
    return this._data.direction;
  }

  set divide(obj) {
    if (!obj) return;
    this._data.divide = obj;
    let { parent, direction } = obj;
    if (!direction) direction = OR_VERTICAL;
    if (!parent) parent = this.parent || App.form;

    let uid = parent.uid;
    this._uid = uid;
    this._direction = direction;
    this._cont = this._divide(parent, 3, direction);
    if (obj.uids) {
      for (let i = 0; i < 3; i++) {
        // CHERRIES.objects[obj.uids[i]] = CHERRIES.objects[this._cont[i].uid];
        // delete CHERRIES.objects[this._cont[i].uid];
        this._cont[i].uid = obj.uids[i];
        this._cont[i].cont.setAttribute('uid', obj.uids[i]);
      }
    }
    this._data.divide.uids = [];
    this._data.divide.uids[0] = this._cont[0].uid;
    this._data.divide.uids[1] = this._cont[1].uid;
    this._data.divide.uids[2] = this._cont[2].uid;
    this._setParts();
  }

  get divide() {
    return this._data.divide;
  }

  set parts(p) {
    let sum = 0;
    let check = 0;
    let elastic;
    this._data.parts = p;
    for (let i = 0; i < 3; i++) {
      let pi = p[i];

      if (typeof pi == 'number' || pi.indexOf('rem') > 0) {
        if (typeof pi == 'string' && pi.indexOf('rem') > 0) pi = remToPixels(pi.replace('rem', ''));
        sum += pi;
        this._direction == OR_VERTICAL ? (this._cont[i].height = pi) : (this._cont[i].width = pi);
        check++;
      } else elastic = i;
    }
    if (check != 2 || elastic == undefined) {
      throw "Container3: Arguments for parts must be 2 numbers or rems and 1 percent sign ('%').";
    }

    sum = `calc(100% - ${sum}px)`;

    this._direction == OR_VERTICAL ? (this._cont[elastic].height = sum) : (this._cont[elastic].width = sum);
    this._setParts();
  }

  _setParts() {
    this.topPart = this.bottomPart = this.leftPart = this.rightPart = null;
    this.centerPart = this.part(1);
    if (this._direction == OR_VERTICAL) {
      this.topPart = this.part(0);
      this.bottomPart = this.part(2);
    } else {
      this.leftPart = this.part(0);
      this.rightPart = this.part(2);
    }
  }

  get parts() {
    return this._data.parts;
  }

  part(i) {
    return this._cont[i];
  }
}
