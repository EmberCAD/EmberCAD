import { DeepCopy, firstLetterLower } from '../../api/cherry/api';
import * as fs from 'fs';
import { loadJSON } from '../../api/cherry/files';

export default class ObjectsManager {
  constructor() {
    this.objects = [];
    this.objectsOrder = [];

    this.guiFile = path.join(__dirname, '..', '..', '..', 'app', __STARTAPP__, 'gui.json');
    this.guiFileWeb = path.join(__dirname, '..', '..', '..', __STARTAPP__, 'gui.json');
  }

  add(obj) {
    this.objects[obj.uid] = obj;
    this.objects[obj.uid].design = true;
    this.objectsOrder.push(obj.uid);
    return obj;
  }

  delete(uid) {
    if (!this.objects[uid]) return;
    delete this.objects[uid];
  }

  set design(op) {
    Object.keys(this.objects).forEach((uid) => {
      if (!this.objects[uid].ignoreDesign) {
        this.objects[uid].design = op;
        if (op) this.objects[uid].devhint = this.objects[uid].name;
        else this.objects[uid].devhint = ''; //removes attribute too
      } else {
        this.objects[uid].design = false;
        this.objects[uid].devhint = ''; //removes attribute too
      }
      if (typeof this.objects[uid].show == 'function') op ? this.objects[uid].show() : this.objects[uid].visible ? this.objects[uid].show() : this.objects[uid].hide();
    });
  }

  store(orderArray) {
    let objects = [];

    Object.keys(this.objects).forEach((uid, i) => {
      if (orderArray) uid = orderArray[i];
      let obj = this.objects[uid];
      if (!obj?._parent) return;

      let object = {};
      Object.keys(obj._data).forEach((method) => {
        object[method] = obj._data[method];
      });

      objects.push({
        uid,
        platform: obj.platform,
        parent: obj._parent.getAttribute('uid'),
        type: obj.type,
        kind: obj.kind,
        object: DeepCopy(object)
      });
    });
    return DeepCopy(objects);
  }

  saveObjects(orderArray) {
    fs.writeFileSync(this.guiFile, JSON.stringify(this.store(orderArray), '', 4));
  }

  async loadJSON() {
    const json = await loadJSON(path.join(APPROOT, __STARTAPP__, 'gui.json'));
    return json;
  }

  async loadObjects() {
    this.counter = [];
    try {
      let objects;
      let json;
      if (isWeb) {
        json = await loadJSON(path.join(APPROOT, __STARTAPP__, 'gui.json'));
      } else {
        json = await fs.readFileSync(this.guiFile);
      }
      objects = JSON.parse(json);
      return objects;
    } catch (error) {}
  }

  addComponent(obj, parent) {
    if (!obj) return;
    const nameSpace = this.getNameSpace(obj);

    let newComponent = {};

    if (parent !== null && parent !== undefined) {
      parent = parent.cont ? parent.cont : parent;
    } else parent = this.app.form.cont;

    let name = obj.type;
    name = firstLetterUpper(name);
    let Comp = eval(name);

    newComponent = new Comp(parent);
    newComponent.name = obj.name;

    if (obj.uid) {
      newComponent.uid = obj.uid;
      if (newComponent.cont) newComponent.cont.setAttribute('uid', obj.uid);
    }

    if (obj.remove) newComponent.remove = true;
    if (obj.object)
      Object.keys(obj.object).forEach((method) => {
        if (obj.object[method] !== null) newComponent[method] = obj.object[method];
      });

    let res = this.add(newComponent);

    return res;
  }

  removeComponent(uid) {
    const rem = this.app.form.cont.querySelector(`[uid="${uid}"]`);

    if (rem) {
      rem.remove();
    }
    const obj = this.objects[uid];
    if (obj) delete this.app[obj.name];
    this.delete(uid);
    this.saveObjects();
  }

  removeAll() {
    const rems = Array.from(this.app.form.cont.querySelectorAll(`[uid]`));
    for (let i = 0; i < rems.length; i++) {
      const rem = rems[i];
      const uid = rem.getAttribute('uid');
      const name = rem.getAttribute('name');
      if (uid && name) {
        delete window[name];
        const obj = this.objects[uid];
        if (obj) this.app[obj.name];
      }
    }
    this.app.form.cont.innerHTML = '';
  }

  registerComponent(obj) {
    const nameSpace = this.setCounter(obj);

    if (!obj.name) {
      let suffix = '';

      if (nameSpace !== 'default') suffix = '_' + nameSpace;
      let name = this.isExisting(obj, nameSpace, suffix);

      obj.name = name;
      obj.cont.setAttribute('name', name);
    }
    this.app[obj.name] = obj;
  }

  isExisting(obj, nameSpace, suffix) {
    let name = String(obj.type + this.counter[nameSpace][obj.type]) + suffix;
    name = firstLetterLower(name);

    if (window[name]) {
      this.counter[nameSpace][obj.type]++;
      return this.isExisting(obj, nameSpace, suffix);
    } else return name;
  }

  setDefaultCount() {
    const objects = Object.entries(this.objects);
    const nameSpace = 'default';
    this.resetCounter(nameSpace);
    for (let i = 0; i < objects.length; i++) {
      const object = objects[i][1];
      if (!this.counter[nameSpace][object.type]) this.counter[nameSpace][object.type] = 0;
      this.counter[nameSpace][object.type]++;
    }
  }

  resetCounter(nameSpace) {
    if (!this.counter) this.counter = [];
    this.counter[nameSpace] = [];
  }

  getNameSpace(obj) {
    return this.nameSpace || obj.nameSpace || obj.cont?.getAttribute('namespace') || 'default';
  }

  setCounter(obj) {
    if (!this.counter) this.counter = [];
    const nameSpace = this.getNameSpace(obj);

    if (!this.counter[nameSpace]) this.counter[nameSpace] = [];
    if (!this.counter[nameSpace][obj.type]) this.counter[nameSpace][obj.type] = 0;
    this.counter[nameSpace][obj.type]++;

    return nameSpace;
  }

  translate() {
    const elements = Array.from(document.querySelectorAll('[uid]'));
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const name = el.getAttribute('name');
      if (name) {
        const obj = eval(name);
        if (obj && obj.text) {
          let initialText = obj.initialText || obj.text;
          obj.text = tr(initialText);
        }
      }
    }
  }
}
