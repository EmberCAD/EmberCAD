import { codec64 } from './codec64';
import { tr } from './langs';

export default class Manager {
  constructor() {
    this._init();
    this.versionNumber = 0;
  }

  _init() {
    this.clear();
  }

  clear() {
    this.elements = [];
  }

  addElement(obj) {
    this.versionNumber++;
    let uid, store, name, bin;

    if (obj) {
      uid = obj.uid;
      store = obj.store;
      name = obj.name;
      bin = obj.bin;
    }

    uid = uid || codec64.uId('');
    name = String(name) || tr('No Name');

    this.elements[uid] = {
      name,
      store,
      bin
    };

    return uid;
  }

  updateStore(uid, store) {
    if (!this.elements[uid]) return;
    this.elements[uid].store = store;
  }

  updateName(uid, name) {
    if (!this.elements[uid]) return;
    this.elements[uid].name = name;
  }
  updateBin(uid, bin) {
    if (!this.elements[uid]) return;
    this.elements[uid].bin = bin;
  }

  deleteElement(uid) {
    if (this.elements[uid]) delete this.elements[uid];
  }

  duplicateElement(uid) {
    let newElement = JSON.parse(JSON.stringify(this.elements[uid]));
    newElement.uid = undefined;
    newElement.name += ' ' + tr('copy');
    return this.addElement(newElement);
  }

  get count() {
    return Object.keys(this.elements).length;
  }

  getElement(uid) {
    if (!uid) return;
    if (!this.elements[uid]) return;
    let { name, store, bin } = this.elements[uid];
    return {
      name,
      store,
      bin
    };
  }

  listelements() {
    let list = [];
    Object.keys(this.elements).forEach((uid) => {
      list.push({
        uid,
        data: this.getElement(uid)
      });
    });
    return list;
  }

  store() {
    let list = [];

    Object.keys(this.elements).forEach((uid) => {
      list.push({
        uid,
        data: JSON.parse(JSON.stringify(this.elements[uid]))
      });
    });

    return list;
  }

  restore(list) {
    this.elements = [];

    list.forEach((edit) => {
      this.elements[edit.uid] = edit.data;
    });
  }
}
