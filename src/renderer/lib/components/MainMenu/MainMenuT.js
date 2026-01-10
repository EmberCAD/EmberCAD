'use strict';

import { crDiv, crEl, DeepCopy } from '../../api/cherry/api';
import { Menu } from '@electron/remote';
import { isMac } from '../Application/Application';
import { tr } from '../../api/cherry/langs';

export default class MainMenuT {
  constructor(parent) {
    this._parent = parent;
    this.MenuShortCut = [];
    this.menuActive = false; // true if clicked - shows submenu on move

    this.appleMenu; // only for mac

    this._init();
    this._events();
  }

  _init() {
    this.cont = crDiv(
      {
        class: 'ch-MainMenu',
      },
      this._parent,
    );

    this._data = [];
    this.visible = false;
  }

  _events() {
    this.cont.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!e.target) return;
      this.updateContainer(e);
      this.menuActive = true;
    });

    this.cont.addEventListener('mousemove', (e) => {
      if (!e.target) return;
      if (!this.menuActive) return;
      this.updateContainer(e);
    });

    document.addEventListener('click', (e) => {
      if (!this.menuActive) return;
      let el = e.target;
      let submenu = el.getAttribute('submenu');
      let mmid = el.getAttribute('mmid');

      if (this.currentCont && !submenu) {
        this.hideAllContainers();
        this.currentCont = undefined;
        this.menuActive = false;
        this.execShortcut(mmid);
      }
    });

    document.addEventListener('keydown', (e) => {
      let isText;
      if (document.activeElement && document.activeElement.type)
        isText = document.activeElement.type.indexOf('text') >= 0;

      if (isText && this.checkForTextOp(e)) {
        e.preventDefault();
        return;
      }
      if (isText) {
        return;
      }

      if (this.convertShortCut(e)) {
        e.preventDefault();
      }

      if (e.key != 'Meta')
        if (e.key != 'Control')
          if (e.key != 'Alt')
            if (e.key != 'Shift') {
              let uid = this.convertShortCut(e);
              if (uid) this.execShortcut(uid);
            }
    });
  }

  checkForTextOp(e) {
    const key = e.key.toLowerCase();
    if ((e.metaKey && isMac) || (e.ctrlKey && !isMac)) {
      switch (key) {
        case 'a':
          document.execCommand('selectall', false, null);
          break;
        case 'c':
          document.execCommand('copy', false, null);
          break;
        case 'x':
          document.execCommand('cut', false, null);
          break;
        case 'v':
          document.execCommand('paste', false, null);
          break;
      }
      return true;
    }
  }

  execShortcut(uid) {
    if (typeof this.onClick === 'function') this.onClick(uid);
  }

  hideAllContainers() {
    let menus = document.querySelectorAll('.ch-menuItem');
    this.removeSelected(menus);
    let submenus = document.querySelectorAll('.ch-menuCont');
    for (let i = 0; i < submenus.length; i++) {
      submenus[i].style.display = null;
    }
  }

  removeSelected(menus) {
    for (let i = 0; i < menus.length; i++) {
      menus[i].removeAttribute('selected');
    }
  }

  hideFromLevel(level, el) {
    let cont = el.parentElement.querySelectorAll('.ch-menuItem');
    this.removeSelected(cont);

    let submenus = document.querySelectorAll('.ch-menuCont');
    for (let i = 0; i < submenus.length; i++) {
      let lvl = submenus[i].getAttribute('mlevel');
      if (lvl && parseInt(lvl) > level) submenus[i].style.display = null;
    }
  }

  updateContainer(e) {
    let el = e.target;
    let mmid = el.getAttribute('mmid');
    let submenu = el.getAttribute('submenu');
    let main = el.getAttribute('main');
    let level = el.parentElement.getAttribute('mlevel');

    if (this._mmid === mmid) return;
    this._mmid = mmid;
    if (this._mtimeout) {
      clearTimeout(this._mtimeout); // debounce
    }
    if (mmid && level) {
      this.hideFromLevel(level, el);
    }
    if (mmid && submenu) {
      if (this.currentCont && main) this.hideAllContainers();
      if (main) {
      }
      if (submenu && main) {
        this.mmCont[mmid].style.display = 'flex';
        el.setAttribute('selected', '');
      }
      if (!main) {
        let rect = el.getBoundingClientRect();
        this.mmCont[mmid].style.left = rect.right + 'px';
        this.mmCont[mmid].style.top = `calc(${rect.top}px - 0.5rem)`;
        el.setAttribute('selected', '');

        this._mtimeout = setTimeout(() => {
          this.mmCont[mmid].style.display = 'flex';
        }, 150);
      }
      this.currentCont = this.mmCont[mmid];
    }
  }

  get rect() {
    return this.cont.getBoundingClientRect();
  }

  set height(v) {
    this._data.height = v;
  }

  get height() {
    return this.rect.height;
  }

  hide() {
    this.hideAllContainers();
    this.cont.style.display = 'none';
    this._data.visible = false;
    if (this.mmCont) Object.keys(this.mmCont).forEach((cont) => (this.mmCont[cont].style.display = 'none'));
    if (typeof this.onHide == 'function') this.onHide();
  }

  show() {
    this.cont.style.display = null;
    this._data.visible = true;
    if (typeof this.onShow == 'function') this.onShow();
  }

  set visible(op) {
    if (op === this._data.visible) return;
    op ? this.show() : this.hide();
  }

  get visible() {
    return this._data.visible;
  }

  setMenu(template, custom) {
    if (isMac) {
      template = this.buildFromTemplate(template, custom); // read shortcuts and translate
      let menu = Menu.buildFromTemplate(template);
      this.appleMenu = Menu.setApplicationMenu(menu);
    } else {
      Menu.setApplicationMenu(null);
      this.buildFromTemplate(template);

      this.show();
    }
  }

  buildFromTemplate(template, custom) {
    if (!template) return;
    this._parent.querySelectorAll('.ch-menuCont').forEach((el) => this._parent.removeChild(el));
    this.MenuShortCut = [];

    let obj = template;
    this.cont.innerText = '';

    if (typeof obj !== 'object') obj = JSON.parse(template);
    else obj = DeepCopy(obj);

    for (let i = 0; i < obj.length; i++) {
      this.mlevel = 0;
      if (custom)
        if (obj[i].label == 'Edit') {
          obj[i].label = 'Edit ';
        }
      if (obj[i].label) {
        if (CHERRIES.autotranslate) obj[i].label = tr(obj[i].label);
        this.armLabel(obj[i], this.cont, true);
        if (obj[i].submenu) {
          this.mlevel++;
          this.makeCont(obj[i], this.mmLabel[obj[i].id], true);
        }
      }
    }
    return obj;
  }

  armSeparator(parent) {
    let men = crDiv(
      {
        class: 'ch-menuItemSeparator',
      },
      parent,
    );
    let sep = crEl(
      'hr',
      {
        class: 'ch-menuItemSeparatorLine',
      },
      men,
    );
  }

  makeCont(itm, parent, main) {
    let sub = itm.submenu;

    if (!this.mmCont) this.mmCont = [];

    if (isMac) {
      this.armSubMenu(sub, this.mmCont[itm.id]);
    } else {
      setTimeout(() => {
        this.mmCont[itm.id] = crDiv(
          {
            class: 'ch-menuCont',
            mlevel: this.mlevel,
          },
          this._parent,
        );

        let t = parent.offsetTop;
        let l = 0;
        if (main) {
          t = CHERRIES.menuTitleTop;
          l = this.cont.parentElement.offsetLeft;
        }
        this.mmCont[itm.id].style.left = parent.offsetLeft + l + 'px';
        this.mmCont[itm.id].style.top = t + 'px';
        this.armSubMenu(sub, this.mmCont[itm.id]);
      }, 1);
    }
  }

  armLabel(itm, parent, main) {
    if (!this.mmLabel) this.mmLabel = [];
    this.mmLabel[itm.id] = crDiv(
      {
        mmid: itm.id,
        class: 'ch-menuItem',
        style: itm.visible === false ? 'display:none;' : '',
      },
      parent,
    );

    this.mmLabel[itm.id].addEventListener('mousemove', (e) => {
      if (!e.target) return;
      if (!this.menuActive) return;
      this.updateContainer(e);
    });

    let checkIcon = '';
    if (itm.checked) checkIcon = '✓';
    let check = `<div class="ch-mmenuChecked">${checkIcon}</div>`;
    let label = `<div class="ch-mmenuLabel">${itm.label}</div>`;

    let acc = this.menuAccelerator(itm.accelerator, itm.id);
    if (itm.submenu) {
      this.mmLabel[itm.id].setAttribute('submenu', true);
      if (main) this.mmLabel[itm.id].setAttribute('main', true);
      acc = '<i class="fas fa-caret-right"></i>'; //'▶';
    }
    let res = check + '<div class="ch-menuItemAcc">' + label + acc + '</div>';
    if (main) res = label;
    this.mmLabel[itm.id].innerHTML = res;
  }

  armSubMenu(arr, parent, main) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].type == 'separator') this.armSeparator(parent);
      if (arr[i].label) {
        if (CHERRIES.autotranslate) arr[i].label = tr(arr[i].label);
        const self = this;
        arr[i].click = function (menuItem, browserWindow, event) {
          self.execShortcut(menuItem.id);
        };
        this.armLabel(arr[i], parent, main);
      }
      if (arr[i].submenu) {
        this.mlevel++;
        this.makeCont(arr[i], this.mmLabel[arr[i].id]);
      }
    }
  }

  convertShortCut(e) {
    if (e.code == 'AltRight') return false;
    let key = e.key;
    let scut = key;
    if (e.code.indexOf('Digit') >= 0) key = e.code.substr(5);
    if (e.code.indexOf('Key') >= 0) key = e.code.substr(3);
    // if (e.code == 'Equal' || e.code == 'Minus') key = e.key;

    if (e.shiftKey) scut = 'S+' + key;
    if (e.altKey) scut = 'A+' + key;
    if (e.ctrlKey || e.metaKey) scut = 'C+' + key;
    if (e.shiftKey && (e.ctrlKey || e.metaKey)) scut = 'CS+' + key;
    if (e.altKey && (e.ctrlKey || e.metaKey)) scut = 'CA+' + key;

    return this.MenuShortCut[scut];
  }

  menuAccelerator(acc, id) {
    if (acc == undefined) return `<div class="ch-mmenuAcc"></div>`;
    let scut = '';
    let escut = '';
    let key = '';
    if (acc.indexOf('CmdOrCtrl+') == 0) {
      scut = 'Ctrl+';
      escut = 'C+';
    }
    if (acc.indexOf('CmdOrCtrl+Shift') == 0) {
      scut = 'Ctrl+Shift+';
      escut = 'CS+';
    }
    if (acc.indexOf('Alt+') == 0) {
      scut = 'Alt+';
      escut = 'A+';
    }
    if (acc.indexOf('CmdOrCtrl+Alt') == 0) {
      scut = 'Ctrl+Alt+';
      escut = 'CA+';
    }
    key = acc.split('+');
    key = key[key.length - 1];
    escut += key;
    scut += `<span class="ch-mmenuKey">${key}</span>`;
    this.MenuShortCut[escut] = id;
    return `<div class="ch-mmenuAcc">${scut}</div>`;
  }
}
