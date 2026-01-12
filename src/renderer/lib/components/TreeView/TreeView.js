const { remToPixels, DeepCopy } = require('../../api/cherry/api');
const { codec64 } = require('../../api/cherry/codec64');
const { OR_VERTICAL } = require('../../api/declare_common');
const { default: Component } = require('../Component/Component');
const { default: Label } = require('../Label/Label');
const { default: Panel } = require('../Panel/Panel');
const { default: ScrollBar } = require('../ScrollBar/ScrollBar');

const ITEMS_HEIGHT = 1.6;
const ITEM_COLUMNS = 6;
const ROOT = 'root';
const OPEN = '_open';
const CLOSED = '_closed';
const BIN = 'bin';
const ITEM = 'item';
const ON = 'on';
const TOP = 'top';
const BOTTOM = 'bottom';
const FORBIDDEN = 'forbidden';

class TreeView extends Component {
  constructor(id) {
    super(id);
    this._init();
    this._events();
    this.defaults();
  }

  _init() {
    this.baseClass = 'ch-treeView';
    this.cont.classList.add('ch-treeView');
    this.cont.setAttribute('type', 'TreeView');
    this.cont.setAttribute('tabindex', '0');

    this.items = [];
    this.itemsOrder = [];
    this.binsOrder = [];
    this.binState = [];

    this._data.iconOpen = '<i class="fas fa-chevron-down"></i>';
    this._data.iconClosed = '<i class="fas fa-chevron-right"></i>';
    this._data.iconEmpty = '<i class="fa-regular fa-circle-xmark" style="opacity:.5" ></i>';

    this.lineHeight = remToPixels(ITEMS_HEIGHT);

    this.scrollBar = new ScrollBar(this.parent);
    this.scrollBar.orientation = OR_VERTICAL;
    this.scrollBar.position = 'absolute';
    this.scrollBar.width = 10;
    this.scrollBar.right = 0;
    window['scrollbar'] = this.scrollBar;

    this.updateTree();
  }

  defaults() {
    this.width = '100%';
    this.height = '100%';
    this.multiselect = false;
    this.binsView = this.itemsView = this;
  }

  clear() {
    this.items = [];
    this.itemsOrder = [];
    this.binsOrder = [];
    this.selected = [];
    this.selectedBins = [];

    this.updateTree();
  }

  removeDropIndicator() {
    this.cont.querySelectorAll('[top]').forEach((el) => el.removeAttribute(TOP));
    this.cont.querySelectorAll('[bottom]').forEach((el) => el.removeAttribute(BOTTOM));
    this.cont.querySelectorAll('[on]').forEach((el) => el.removeAttribute(ON));
  }

  _events() {
    this.onDragOver = (e) => {
      e.event.preventDefault();
      const el = e.target;
      const elUid = el.getAttribute('uid');
      const itemUid = e.state.uid;

      const item = this.items[itemUid];

      if (!item) {
        this.removeDropIndicator();
        return;
      }
      const type = item.type;
      const elHalfHeight = item.panel.height / 2;
      const elQuarterHeight = elHalfHeight / 2;
      const elTop = item.panel.top;

      let cover = ON;
      if (e.pos.y < elTop - elQuarterHeight) cover = TOP;
      if (e.pos.y > elTop + elQuarterHeight) cover = BOTTOM;

      if (this.currentCover !== cover) {
        this.removeDropIndicator();
        if (item && item.parent === ROOT && cover === TOP) cover = undefined;
        if (
          (cover && type === BIN && cover === ON) ||
          (type === BIN && cover !== ON) ||
          (type !== BIN && cover !== ON)
        ) {
          const isParental = this.checkForBranch(itemUid);
          if (isParental) {
            cover = FORBIDDEN;
          }
          this.cont.querySelector(`[uid=${elUid}]`).setAttribute(cover, '');
        }
        this.currentCover = cover;
      }
    };

    this.addResizeListener();

    this.onResize = () => {
      if (this.binsView) {
        this.updateTree(false);
      }
    };

    this.onDragStart = (e) => {
      const ev = e.event;
      ev.dataTransfer.setData('text', JSON.stringify({ target: this.uid }));
    };

    this.onDrop = (e) => {
      let uid = e.state.uid;
      this.removeDropIndicator();
      if (!uid) return;
      const data = JSON.parse(e.event.dataTransfer.getData('text'));

      if (!uid && e.type === 'TreeView') uid = ROOT;
      if (!uid || this.currentCover === FORBIDDEN) return;

      if (uid !== ROOT && this.items[uid].type !== BIN && this.currentCover === ON) {
        uid = this.items[uid].parent;
      }

      let selectedItems = this.selected;

      if (this.currentCover === ON) {
        for (let i = 0; i < this.selected.length; i++) {
          const selected = this.selected[i];
          if (selected && selected != uid) {
            this.items[selected].parent = uid;
          }
        }
        this.refreshOrder();
      } else {
        this.reorder(uid);
      }

      if (this._onDrop) {
        this._onDrop({
          target: this.items[uid],
          cover: this.currentCover,
        });
      }

      if (this.currentBin && this.items[this.currentBin]) this.items[this.currentBin].selected = false;
      this.currentBin = uid;
      if (this.binMode && this.currentBin && this.items[this.currentBin]) this.items[this.currentBin].selected = true;
      this.updateTree();
    };

    this.onMouseDown = () => {
      clearTimeout(this.mouseDebouncer);
    };

    this.onDblClick = (e) => {
      clearTimeout(this.mouseDebouncer);
      if (this._onDblClick) this._onDblClick(e);
    };

    this.onClick = (e) => {
      this.mouseDebouncer = setTimeout(() => {
        this.handleMouseDown(e);
        let uid = e.state.uid;

        if (!uid) return;

        if (this.items[uid].type === BIN && e.state.role === 'icon') {
          this.toggleBin(uid);
        }
        this.updateTree();
      }, 30);
    };

    //////

    this.scrollBar.onChange = (off) => {
      this.updateTree(false);
    };

    this.onMouseWheel = (e) => {
      const STEP = 5;
      this.scrollBar.value += e.event.deltaY < 0 ? -STEP : STEP;
      this.updateTree(false);
    };
  }

  handleMouseDown(e) {
    let column = e.state.col;

    if (column) {
      if (column.i !== 1 && typeof this.onColumnClick === 'function') this.onColumnClick(column);
      return;
    }

    let uid = e.state.uid || e.target.getAttribute('uid');

    if (!uid) {
      this.unselectAll();

      if (this._onSelect) this._onSelect([]);
      return;
    }

    if (this.binMode && this.items[uid].type === BIN) {
      if (this.currentBin && this.items[uid].type === BIN) {
        this.items[this.currentBin].selected = false;
      }
      this.currentBin = uid;
    } else {
      if (this.currentBin && this.items[uid] && this.items[uid].type === BIN && this.items[this.currentBin]) {
        this.items[this.currentBin].selected = false;
      }
    }

    // if (!this.binMode) {
    //   const item = this.items[uid];
    //   const parent = item.parent;
    //   if (parent !== ROOT) {
    //     if (item.type === BIN) {
    //       if (item.childSelected) {
    //         item.childSelected = false;
    //         this.items[parent].selected = false;
    //       }
    //     } else {
    //       this.items[parent].selected = false;
    //       this.items[parent].childSelected = true;
    //     }
    //   }
    // }

    const isUidSelected = this.selected ? this.selected.includes(uid) : false;

    if (this.multiselect && !e.shiftKey && !e.ctrlKey) {
      this.unselectAll();
    }

    this.addSelection(uid);

    if (!this.selected) this.selected = [];

    if (e.shiftKey) {
      this.secondClick = uid;
    } else {
      this.firstClick = uid;
    }

    let useSelector = true;

    if (isUidSelected && e.ctrlKey) {
      this.secondClick = undefined;
      this.items[uid].selected = !this.items[uid].selected;

      if (!this.items[uid].selected) {
        let index = this.selected.indexOf(uid);
        if (index !== -1) {
          this.selected.splice(index, 1);
          useSelector = false;
        }
      }
    }

    if (useSelector) this.selectWithShift();

    this.updateTree(false);

    if (this._onSelect) {
      let selItems = [];
      for (let i = 0; i < this.selected.length; i++) {
        selItems.push(this.items[this.selected[i]]);
      }
      this._onSelect(selItems);
    }
  }

  select(uid) {
    this.unselectAll();
    this.addSelection(uid);
    this.updateTree(false);
  }

  checkForBranch(uid) {
    const targetItem = this.items[uid];
    if (!targetItem) return false;
    const branchParent = targetItem.branchParent;
    for (let i = 0; i < this.selectedBins.length; i++) {
      const binUid = this.selectedBins[i];
      if (binUid !== uid) {
        const sourceBin = this.items[binUid];
        if (sourceBin.branchParent === branchParent && sourceBin.ident < targetItem.ident) return true;
      }
    }
    return false;
  }

  toggleBin(uid) {
    this.items[uid].icon = this.items[uid].icon === CLOSED ? OPEN : CLOSED;
    if (this.items[uid].icon === OPEN) {
      this.binState[uid] = uid;
    } else {
      delete this.binState[uid];
    }
  }

  getLinesCount() {
    this.linesCount = Math.floor(this.cont.offsetHeight / this.lineHeight);
  }

  selectAll() {
    if (!this.orderedItems || !this.orderedItems.length) return;
    const selItems = [];
    this.selected = [];
    this.selectedBins = [];

    for (let i = 0; i < this.orderedItems.length; i++) {
      const uid = this.orderedItems[i];
      this.addSelection(uid);
      selItems.push(this.items[uid]);
    }
    this.updateTree(false);
    if (this._onSelect) this._onSelect(selItems);
  }

  unselectAll() {
    if (!this.selected || !this.selected.length) return;
    this.clearSelection(ROOT, true);
    this.updateTree(false);
    if (this._onSelect) this._onSelect([]);
  }

  foldAll() {
    const bins = Object.keys(this.itemsOrder);

    for (let i = 0; i < bins.length; i++) {
      const uid = bins[i];
      if (uid === ROOT) continue;
      const item = this.items[uid];
      if (!item.icon) item.icon = OPEN;
      if (item.icon === OPEN) {
        this.toggleBin(uid);
      } else item.icon = CLOSED;
    }

    this.updateTree();
    this.updateSelection();
  }

  unfoldAll() {
    const bins = Object.keys(this.itemsOrder);

    for (let i = 0; i < bins.length; i++) {
      const uid = bins[i];
      if (uid === ROOT) continue;
      const item = this.items[uid];
      if (!item.icon) item.icon = CLOSED;
      if (item.icon === CLOSED) {
        this.toggleBin(uid);
      } else item.icon = OPEN;
    }

    this.updateTree();
    this.updateSelection();
  }

  selectWithShift() {
    if (!this.firstClick) this.firstClick = this.secondClick; // for first shift-click

    let fcItem = this.items[this.firstClick];
    let scItem = this.items[this.secondClick];

    if (!fcItem) return;

    let fcTop = fcItem.index;
    let scTop = -1;

    if (fcItem && scItem) {
      scTop = scItem.index;

      if (fcItem.index > scItem.index) {
        fcTop = scItem.index;
        scTop = fcItem.index;
      }
    } else {
      scTop = fcTop;
    }

    const items = this.orderedItems;

    for (let i = fcTop; i <= scTop; i++) {
      const uid = items[i];
      const item = this.items[uid];

      if (!item.selected) {
        this.addSelection(uid);
      }
    }
  }

  refreshOrder() {
    this.itemsOrder = [];
    const items = Object.entries(this.items);

    for (let i = 0; i < items.length; i++) {
      const item = items[i][1];
      const uid = item.uid;
      const parent = item.parent;
      if (!this.itemsOrder[parent]) this.itemsOrder[parent] = [];
      this.itemsOrder[parent].push(uid);
    }
  }

  applyOrder(orderMap) {
    if (!orderMap || !this.itemsOrder) return;
    const sortByOrder = (a, b) => {
      const hasA = Object.prototype.hasOwnProperty.call(orderMap, a);
      const hasB = Object.prototype.hasOwnProperty.call(orderMap, b);
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1;
      if (!hasB) return -1;
      return orderMap[a] - orderMap[b];
    };

    const parents = Object.keys(this.itemsOrder);
    for (let i = 0; i < parents.length; i++) {
      const parent = parents[i];
      const uids = this.itemsOrder[parent];
      if (!uids || uids.length < 2) continue;
      this.itemsOrder[parent] = uids.slice().sort(sortByOrder);
    }
  }

  getOrder() {
    return this.orderedItems;
  }

  reorder(dropUid) {
    const parent =
      this.currentCover === BOTTOM && this.items[dropUid].type === BIN ? dropUid : this.items[dropUid].parent;

    let uids = this.itemsOrder[parent].filter((item) => !this.selected.includes(item));

    const itemIndex = uids.indexOf(dropUid);
    const insertIndex = itemIndex + (this.currentCover === BOTTOM ? 1 : 0);

    uids.splice(insertIndex, 0, ...this.selected);

    this.itemsOrder[parent] = uids;

    this.updateTree(false);
  }

  addSelection(uid) {
    if (this.items[uid]) {
      if (!this.items[uid].selected) {
        this.selected.push(uid);
        if (this.items[uid].type === BIN) this.selectedBins.push(uid);
      }
      this.items[uid].selected = true;
    }
  }

  clearSelection(uid, forced) {
    this.firstClick = this.secondClick = undefined;

    this.selectedBins = [];
    if (!this.selected && !forced) {
      this.selected = [];
      return;
    }
    if (!this.selected || !this.selected.length) return;
    let selToDel = [];
    for (let i = 0; i < this.selected.length; i++) {
      if (this.selected[i] && this.items[this.selected[i]]) {
        if (!this.binMode) {
          this.items[this.selected[i]].selected = false;
          selToDel.push(i);
        } else {
          if (
            (this.items[uid] && this.items[uid].type === BIN && this.selected[i] !== this.currentBin) ||
            (this.items[uid].type !== BIN && this.selected[i] !== this.currentBin)
          )
            this.items[this.selected[i]].selected = false;
          selToDel.push(i);
        }
      }
    }
    if (!this.binMode || uid !== this.currentBin) this.selected = [];
    else for (let i = selToDel.length - 1; i >= 0; i--) this.selected.splice(selToDel[i], 1);
  }

  addBin(obj) {
    if (!obj) return;

    if (!obj.icon && !this.binState[obj.uid]) obj.icon = CLOSED;

    return this._add({ ...obj, type: BIN });
  }

  addItem(obj) {
    if (!obj) return;

    return this._add({ ...obj, type: ITEM });
  }

  _add(obj) {
    if (!obj) return;

    if (!obj.parent) obj.parent = ROOT;

    if (!obj.uid) obj.uid = codec64.uId('');
    obj.selected = false;
    this.items[obj.uid] = obj;

    if (!this.itemsOrder[obj.parent]) this.itemsOrder[obj.parent] = [];
    this.itemsOrder[obj.parent].push(obj.uid);

    return obj.uid;
  }

  removeSelected() {
    if (!this.selected || this.selected.length === 0) return;

    for (let i = 0; i < this.selected.length; i++) {
      this.remove(this.selected[i]);
    }
    this.clearSelection();
    this.updateTree();
  }

  remove(uid) {
    if (!uid || !this.items || !this.items[uid]) return;

    if (this.items[uid].type === BIN) {
      let tItems = this.sift(uid);
      for (let i = 0; i < tItems.length; i++) {
        this.remove(tItems[i].uid);
      }
      delete this.items[uid];
    } else {
      if (this._onRemove) this._onRemove(DeepCopy(this.items[uid]));
      delete this.items[uid];
    }
  }

  updateSelection() {
    this.scrollToSelected();
  }

  updateTree(recalculate = true) {
    const count = Object.keys(this.items).length;

    if (recalculate) {
      this.orderedItems = [];
      this.maxIdent = 0;
      this.countAmount(ROOT);
      this.prepareView();
      this.scrollBar.amount = this.linesAmount;
    }

    this.linesAmount = 0;

    this.linesStart = this.scrollBar.value;

    this.linesEnd = this.linesStart + this.linesCount;

    if (this.linesEnd > count) {
      this.scrollBar.value = Math.max(0, count - this.linesCount);
      this.linesStart = this.scrollBar.value;
      this.linesEnd = this.linesStart + this.linesCount;
    }

    this.scrollBar.visibles = this.linesCount;

    this.renderView();
  }

  scrollToSelected() {
    if (!this.selected || !this.selected.length) return;
    const item = this.items[this.selected[0]];
    if (!item) return;
    this.scrollBar.value = item.index;
    this.updateTree(false);
  }

  sift(parent, all) {
    let tItems = [];
    Object.keys(this.items).forEach((uid, i) => {
      let it;
      if (this.itemsOrder && this.itemsOrder[parent]) {
        it = this.items[this.itemsOrder[parent][i]];
        if (it) {
          const papi = this.items[it.parent];
          if (papi) it.branchParent = papi.branchParent;
          else it.branchParent = it.uid;
        }
      }
      if (!all && it && it.parent !== parent) return;
      tItems.push(it);
    });
    return tItems;
  }

  countAmount(parent, ident, itemsOnly) {
    if (!this.items) return;
    if (!ident) {
      ident = 0;
    }

    const tItems = this.sift(parent);

    for (let i = 0; i < tItems.length; i++) {
      const it = tItems[i];
      if (!it) continue;

      this.orderedItems.push(it.uid);
      it.index = this.linesAmount;
      it.ident = ident;
      it.itemsOnly = itemsOnly;

      this.maxIdent = Math.max(this.maxIdent, ident);

      this.linesAmount++;

      if (it.type === BIN) {
        if (it.icon === OPEN || this.binState[it.uid]) {
          this.countAmount(it.uid, ident + 1);
        } else if (this.binMode) {
          this.countAmount(it.uid, 0, true);
        }
      }
    }
  }

  prepareView() {
    this.getLinesCount();

    this.cont.innerHTML = '';
    this.rows = [];
    this.icons = [];
    this.captions = [];
    this.columns = [];

    for (let i = 0; i < this.linesCount; i++) {
      this.rows[i] = new Panel(this.itemsView);

      const p = this.rows[i];
      p.width = 'auto';
      p.height = ITEMS_HEIGHT + 'rem';
      p.position = 'relative';
      p.draggable = false;

      this.icons[i] = new Label(p);
      const ic = this.icons[i];
      ic.position = 'relative';
      ic.width = '1rem';
      ic.height = null;
      ic.marginRight = 5;

      this.captions[i] = new Label(p);
      const cap = this.captions[i];
      cap.position = 'relative';
      cap.height = null;
      cap.width = `calc(100% - ${20 + this.maxIdent}rem)`;
      cap.pointerEvents = 'none';

      this.columns[i] = [];
      let columnsWidth = 0;

      for (let c = 0; c < ITEM_COLUMNS; c++) {
        this.columns[i][c] = new Label(p);
        const l = this.columns[i][c];
        l.left = 2 + 2 * c + 'rem';
        l.height = null;
        l.width = 'auto';
        columnsWidth += l.cont.offsetWidth;
      }
    }
  }

  renderView() {
    if (!this.items) return;

    // display items

    window['itemsView'] = this.itemsView; // debugger - remove in prod

    for (let rowIndex = 0; rowIndex < this.linesCount; rowIndex++) {
      const i = rowIndex + this.linesStart;

      const it = this.items[this.orderedItems[i]];

      this.rows[rowIndex].cont.classList.remove('ch-treeView-item-selected');
      this.rows[rowIndex].cont.classList.remove('ch-treeView-item');
      this.rows[rowIndex].backgroundColor = null;
      this.rows[rowIndex].color = null;
      this.rows[rowIndex].state = '';

      for (let c = 0; c < ITEM_COLUMNS; c++) {
        const l = this.columns[rowIndex][c];
        l.color = null;
      }

      if (!it) {
        this.rows[rowIndex].draggable = false;
        this.captions[rowIndex].text = '';
        this.captions[rowIndex].hint = '';
        this.captions[rowIndex].state = '';
        this.icons[rowIndex].text = '';
        this.icons[rowIndex].hint = '';
        this.icons[rowIndex].state = '';
        for (let c = 0; c < ITEM_COLUMNS; c++) {
          const l = this.columns[rowIndex][c];
          l.text = '';
          l.hint = '';
          l.state = '';
        }
        continue;
      }

      let ident = it.ident;
      let itemsOnly = it.itemsOnly;

      let view = this.itemsView;
      if (it.type === BIN && !itemsOnly) {
        view = this.binsView;
      } else {
        if (this.binMode) {
          ident = 0;
          if ((this.selected && it.parent != this.currentBin) || it.type === BIN) continue;
        }
      }

      if (this.itemsOrder[it.uid] && !this.itemsOrder[it.uid].length) continue;

      const p = this.rows[rowIndex];
      it.panel = p;
      p.draggable = true;

      if (it.selected) p.cont.classList.add('ch-treeView-item-selected');
      else {
        p.cont.classList.remove('ch-treeView-item-selected');
        p.cont.classList.add('ch-treeView-item');
      }
      p.state = { uid: it.uid };

      const ic = this.icons[rowIndex];

      if (it.type === BIN) {
        p.backgroundColor = '#0008';
        ic.html = it.icon === CLOSED ? this._data.iconClosed : this._data.iconOpen;
        if (!this.itemsOrder[it.uid]) ic.html = this._data.iconEmpty;
      } else {
        ic.html = it.icon || '';
      }
      ic.marginLeft = `calc(0.5rem + ${ident * 1}rem`;

      ic.state = { uid: it.uid, role: 'icon' };
      if (ic.cont.children[0]) {
        ic.cont.children[0].style.pointerEvents = 'none';
      }

      const cap = this.captions[rowIndex];

      cap.html = it.caption;
      cap.hint = it.hint || it.caption;
      cap.state = { uid: it.uid };

      //TODO: add sizable header with columns
      if (it.columns) {
        const uid = it.uid;

        for (let c = 0; c < it.columns.length; c++) {
          const l = this.columns[rowIndex][c];
          if (it.changedColumn && it.changedColumn[c]) l.color = 'orange';

          l.html = it.columns[c].html;
          l.hint = it.columns[c].hint || '';
          l.state = { uid: it.uid, col: { uid: it.uid, i: c } };
        }
      }
    }
  }

  updateColumn({ uid, column, data }) {
    if (data.html) this.items[uid].columns[column].html = data.html;
    if (data.hint) this.items[uid].columns[column].hint = data.hint;
  }

  set iconOpen(v) {
    this._data.iconOpen = v;
  }

  get iconOpen() {
    return this._data.iconOpen;
  }

  set iconClosed(v) {
    this._data.iconClosed = v;
  }

  get iconClosed() {
    return this._data.iconClosed;
  }

  set onSelect(func) {
    if (typeof func !== 'function') return;
    this._onSelect = func;
  }

  set onDblClicked(func) {
    if (typeof func !== 'function') return;
    this._onDblClick = func;
  }

  set onDropped(func) {
    if (typeof func !== 'function') return;
    this._onDrop = func;
  }

  set onRemove(func) {
    if (typeof func !== 'function') return;
    this._onRemove = func;
  }

  set binMode(v) {
    this._data.binMode = v;
    this.cont.innerHTML = '';
    if (v) {
      this.cont.classList.remove('ch-treeView');
      this._view = new ContainerSized();
      this._view.split = {
        parent: this,
        num: 2,
        direction: OR_HORIZONTAL,
        minSizes: [50, 50],
      };
      this._view.parts = [30, 70];
      this._view.part(0).cont.classList.add('ch-treeView');
      this._view.part(1).cont.classList.add('ch-treeView');
      this.binsView = this._view.part(0);
      this.itemsView = this._view.part(1);
    } else {
      this.cont.classList.add('ch-treeView');
      this.binsView = this.itemsView = this;
      if (this.currentBin && this.items && this.items[this.currentBin]) {
        if (this.selected && this.selected.indexOf(this.currentBin) < 0) this.selected.push(this.currentBin);
        this.items[this.currentBin].select = true;
      }
    }

    this.updateTree();
  }

  get binMode() {
    return this._data.binMode;
  }

  set multiselect(op) {
    this._data.multiselect = op;
  }

  get multiselect() {
    return this._data.multiselect;
  }

  set type(txt) {
    this._data.type = txt;
  }

  get type() {
    return this._data.type;
  }

  store() {
    return this.sift(ROOT, true);
  }

  restore(arr) {
    if (!arr) return;
    this.items = [];
    for (let i = 0; i < arr.length; i++) {
      this.items[arr[i].uid] = arr[i];
    }

    this.updateTree();
  }
}

module.exports = {
  ITEMS_HEIGHT,
  ITEM_COLUMNS,
  ROOT,
  OPEN,
  CLOSED,
  BIN,
  ITEM,
  ON,
  TOP,
  BOTTOM,
  FORBIDDEN,
  TreeView,
};
