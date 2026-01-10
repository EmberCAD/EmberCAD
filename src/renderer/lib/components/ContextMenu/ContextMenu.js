class ContextMenu {
  constructor(parent, template) {
    let p = parent ? parent.cont : CHERRIES.app.form.cont;

    this._parent = p || parent;

    this._init(template);
    this._events();
  }

  _init(template) {
    this.uid = codec64.uId('cm');
    this.active = true;
    this.menuCounter = 0;

    this._data = [];
    this.visible = false;

    this.setMenu(template);
  }

  _events() {
    document.addEventListener('mousedown', (e) => {
      let ctxid = e.target.getAttribute('ctxid');
      if (ctxid) {
        this.execShortcut(ctxid);
        this.menuActive = true;
      }
      this.hide();
    });

    this._parent.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      if (e.button == 2) {
        this.hide();
        this.initRT = e.clientY;
        this.initRL = e.clientX;
        this.show(e.target);
        this.cont.style.left = this.initRL + 'px';
        this.cont.style.top = this.initRT - CHERRIES.menuTitleTop + 'px';
        this.updateContainer(e);
        this.menuActive = true;
      } else {
        this.hide();
      }
    });

    this._parent.addEventListener('mousemove', (e) => {
      e.stopPropagation();
      if (!e.target) return;
      if (!this.menuActive) return;
      this.updateContainer(e);
    });
  }

  execShortcut(ctxid) {
    if (typeof this.onClick === 'function') this.onClick(ctxid);
  }

  hideAllContainers() {
    let submenus = document.querySelectorAll('.ctx-menuCont');
    for (let i = 0; i < submenus.length; i++) submenus[i].style.display = null;
  }

  hideFromLevel(level, el) {
    this.hideSelected(el);
    let submenus = document.querySelectorAll('.ctx-menuCont');
    for (let i = 0; i < submenus.length; i++) {
      let lvl = submenus[i].getAttribute('mlevel');
      if (lvl && parseInt(lvl) > level) submenus[i].style.display = null;
    }
  }

  hideSelected(el) {
    let cont = el.parentElement.querySelectorAll('.ctx-menuItem');
    for (let i = 0; i < cont.length; i++) {
      cont[i].removeAttribute('selected');
    }
  }

  updateContainer(e) {
    let el = e.target;
    let ctxid = el.getAttribute('ctxid');
    let puid = el.parentElement.getAttribute('uid');
    let submenu = el.getAttribute('submenu');
    let level = el.parentElement.getAttribute('mlevel');

    if (this._ctxid === ctxid) return;
    this._ctxid = ctxid;
    if (this._mtimeout) {
      clearTimeout(this._mtimeout); // debounce
    }
    if (ctxid && level) {
      this.hideFromLevel(level, el);
    }
    if (ctxid && submenu) {
      if (puid == this.uid) {
        let rect = el.getBoundingClientRect();
        this.mmCont[ctxid].style.left = rect.right + 'px';
        this.mmCont[ctxid].style.top = `calc(${rect.top - CHERRIES.menuTitleTop}px - 0.4rem)`;
        el.setAttribute('selected', '');

        this._mtimeout = setTimeout(() => {
          this.mmCont[ctxid].style.display = 'flex';
        }, 150);
      }
    }
  }

  get rect() {
    return this.cont.getBoundingClientRect();
  }

  hide() {
    this.hideAllContainers();
  }

  show() {
    if (typeof this.cont !== 'undefined') {
      this.cont.style.display = 'block';
      this._data.visible = true;
      this.menuActive = true;
      this.hideSelected(this.cont);

      if (typeof this.onShow == 'function') this.onShow();
    }
  }

  set visible(op) {
    if (op === this._data.visible) return;
    op ? this.show() : this.hide();
  }

  get visible() {
    return this._data.visible;
  }

  setMenu(template) {
    this.buildFromTemplate(template);
  }

  buildFromTemplate(template) {
    if (!template) return;
    App.form.cont.querySelectorAll('.ctx-menuCont').forEach((el) => App.form.cont.removeChild(el));

    let obj = template;
    if (typeof obj !== 'object') obj = JSON.parse(template);
    else obj = DeepCopy(obj);

    for (let i = 0; i < obj.length; i++) {
      this.mlevel = 0;

      if (obj[i].label) {
        if (CHERRIES.autotranslate) obj[i].label = tr(obj[i].label);
        this.armLabel(obj[i], this.cont, true);
        if (obj[i].submenu) {
          this.mlevel++;
          this.makeCont(obj[i], true);
        }
      }
    }
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

  makeCont(itm, main) {
    // if (main)
    let sub = itm.submenu;

    setTimeout(() => {
      if (!this.mmCont) this.mmCont = [];

      const parent = CHERRIES.app.form.cont;

      this.mmCont[itm.id] = crDiv(
        {
          class: 'ctx-menuCont',
          mlevel: this.mlevel,
          uid: this.uid,
        },
        parent,
      );

      if (main) {
        this.cont = this.mmCont[itm.id];
      }

      let t = this.initRT;
      let l = this.initRL;
      // if (main) t = parent.parentElement.offsetTop + parent.offsetHeight;
      if (!main) {
        t = parent.offsetTop;
        this.mmCont[itm.id].style.left = parent.offsetLeft + 'px';
      }
      this.mmCont[itm.id].style.top = t + 'px';
      this.armSubMenu(sub, this.mmCont[itm.id]);
    });
  }

  armLabel(itm, parent, main) {
    if (!this.mmLabel) this.mmLabel = [];
    this.mmLabel[itm.id] = crDiv(
      {
        ctxid: itm.id,
        class: 'ctx-menuItem',
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
    if (itm.checked) checkIcon = 'v';
    let check = `<div class="ch-mmenuChecked">${checkIcon}</div>`;
    let label = `<div class="ch-mmenuLabel">${itm.label}</div>`;
    let acc = '';
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

        this.armLabel(arr[i], parent, main);
        if (arr[i].submenu) {
          this.mlevel++;

          this.makeCont(arr[i]);
        }
      }
    }
  }

  itemEnabled(id, op) {
    const el = document.querySelector(`[ctxid="${id}"]`);
    if (el) {
      const item = el.getAttribute('ctxid');
      if (item) op ? el.removeAttribute('disabled') : el.setAttribute('disabled', '');
    }
  }

  itemVisible(id, op) {
    const el = document.querySelector(`[ctxid="${id}"]`);
    if (el) {
      const item = el.getAttribute('ctxid');
      if (item) el.style.display = op ? null : 'none';
    }
  }
}

module.exports = ContextMenu;
