import Container3 from '../Container3/Container3';
import Container2 from '../Container2/Container2';
import { crEl, numberToPx, pxToNumber } from '../../api/cherry/api';
import ScrollBar from '../ScrollBar/ScrollBar';
import { OR_HORIZONTAL, OR_VERTICAL } from '../../api/declare_common';
import Component from '../Component/Component';
import { cherryOptions } from '../../themes/darkResolve';
import { tr } from '../../api/cherry/langs.js';
import Panel from '../Panel/Panel';
import Label from '../Label/Label';

export default class ListView extends Component {
  constructor(id) {
    super(id);

    this._init();
    this._events();
    this.defaults();
  }

  _init() {
    this.cont.classList.add('ch-listView');
    this.cont.setAttribute('type', 'ListView');
    this.baseClass = 'ch-listView ch-flex100';

    ///

    this.rowHeightPx = App.lineHeight * 1.5;
    const scrollBarSize = pxToNumber(cherryOptions.scrollBar.size);

    //

    this.splitV = new Container3(this);
    this.splitV.divide = {
      direction: OR_VERTICAL
    };
    this.splitV.parts = [this.rowHeightPx, '%', scrollBarSize];

    this.headerRow = this.splitV.part(0);
    this.headerRow.height = numberToPx(this.rowHeightPx);
    this.headerRow.cont.classList.add('ch-listViewHeader');

    this.splitV.part(0).cont.setAttribute('designswitch', '');
    this.splitV.part(1).cont.setAttribute('designswitch', '');
    this.splitV.part(2).cont.setAttribute('designswitch', '');

    ///

    this.splitH = new Container2(this.splitV.centerPart);
    this.splitH.divide = {
      direction: OR_HORIZONTAL
    };
    this.splitH.parts = ['%', scrollBarSize];

    this.splitH.part(0).cont.setAttribute('designswitch', '');
    this.splitH.part(1).cont.setAttribute('designswitch', '');

    this.splitH.part(1).position = 'absolute';
    this.splitH.part(1).right = 0;
    this.splitH.part(1).zIndex = 1;

    ///

    this.table = crEl(
      'table',
      {
        class: 'ch-listViewTable'
      },
      this.splitV.part(1).cont
    );

    ///

    this.items = [];
    this._options = {};
    this.multiselect = false;

    this.scrollV = new ScrollBar(this.splitH.part(1));
    this.scrollV.orientation = OR_VERTICAL;

    this.scrollH = new ScrollBar(this.splitV.part(2));

    this.addResizeObserver();
  }

  defaults() {
    this.width = 300;
    this.height = 500;
    this.rowTop = this.topItem = 0;
    this.columns = [];
    this.selected = [];
    this.multiselect = false;
    this.autoClearSelection = false;
    this.rowHeight = this.rowHeightPx;
  }

  _events() {
    this.headerRow.onMouseDown = (e) => {
      if (!e.target.getAttribute('handle')) return;

      this.handleDown = e;
    };

    this.headerRow.onMouseMove = (e) => {
      if (!this.handleDown) return;
      let parent = CHERRIES[this.handleDown.uid].parent;
      let diff = e.pos.x - this.handleDown.pos.x;
      parent.width += diff;
      this.scrollWidth += diff;
      this.handleDown.pos.x = e.pos.x;
      this.setHeaderColumns();
      this.updateScrollBars();
    };

    document.addEventListener('mouseup', (e) => {
      this.handleDown = null;
      this.listMouseDown = null;
    });

    document.addEventListener('mousedown', (e) => {
      if (e.target.parentElement.getAttribute('type') !== 'lvrow' && this.autoClearSelection) {
        this.clearSelection();
        if (typeof this.onClearSelection === 'function') this.onClearSelection();
      }
      if (e.target.getAttribute('uid') !== this.uid) return;
      if (
        (e.target.className && e.target.className.indexOf('scrollBar') >= 0) ||
        (e.target.parentElement && e.target.parentElement.className && e.target.parentElement.className.indexOf('scrollBar') >= 0)
      )
        return;
    });

    ////

    this.scrollH.onChange = (offx) => {
      this.headerRow.cont.scrollLeft = offx;
      this.table.style.left = -offx + 'px';
    };

    this.scrollV.onChange = (offy) => {
      if (this.count > this.visibleRows) {
        this.wheel(offy, true);
      }
    };

    this.splitV.centerPart.onMouseDown = (e) => {
      if (e.button !== 0) return;
      if (e.target.parentElement.getAttribute('type') !== 'lvrow') return;
      let itemidx = this.getIndex(e);
      this.listMouseDown = true;
      if (itemidx >= 0) {
        if (this.multiselect && (e.ctrlKey || e.shiftKey)) {
          if (e.shiftKey && this._lastIndex !== undefined) {
            this.selectRange(itemidx, this._lastIndex);
          } else this.performSelect(itemidx);
        } else {
          this.clearSelection();
          this.performSelect(itemidx);
        }
        this.fillTable();

        this._lastIndex = itemidx;
      }
    };

    this.splitV.centerPart.onMouseMove = (e) => {
      if (!this.listMouseDown) return;
      let itemidx = this.getIndex(e);
      if (itemidx >= 0 && this.multiselect) {
        this.selectRange(itemidx, this._lastIndex);
      }
    };

    this.splitV.centerPart.onMouseUp = () => {
      if (typeof this.onSelect === 'function') this.onSelect(this.getSelected());
    };

    this.splitV.centerPart.onDblClick = (e) => {
      let itemidx = this.getIndex(e);
      if (itemidx >= 0) {
        this.clearSelection();
        this.select(itemidx);
        if (typeof this.onDblClick === 'function') this.onDblClick(itemidx);
      }
    };

    this.onTouchStart = (e) => {
      this.touchY = e.event.touches[0].clientY;
    };

    this.onTouchMove = (e) => {
      let dy = this.touchY - e.event.touches[0].clientY;
      this.touchY = e.event.touches[0].clientY;
      this.wheel(dy);
    };

    this.onMouseWheel = (e) => {
      let dx = e.event.deltaX;
      let dy = e.event.deltaY;

      if (this.count < this.visibleRows) return;
      this.wheel(dy);
    };

    this.onResize = () => {
      this._onResizeUpdate();
    };
  }

  addResizeObserver() {
    this.resizeObserver = new ResizeObserver((entries) => {
      this._onResizeUpdate();
    });
    this.resizeObserver.observe(this.parent.cont);
  }

  selectRange(a, b) {
    a = Number(a);
    b = Number(b);

    let c = a;

    if (a > b) {
      a = b;
      b = c;
    }

    for (let i = a; i <= b; i++) {
      if (this.items[i] && !this.items[i].selected) this.performSelect(i);
    }
    this.fillTable();
  }

  onDblClick() {
    //override/clear super function
  }

  getSelected() {
    return this.selected.map((index) => {
      return { index, columns: this.getItem(index) };
    });
  }

  getIndex(e) {
    let idx = e.target.parentElement.getAttribute('itemidx');
    if (idx > this.items.length - 1) idx = -1;
    return idx;
  }

  getItem(itemidx) {
    if (itemidx < 0 || itemidx >= this.count) return {};
    return this.items[itemidx].map((column, idx) => {
      return { name: this.columns[idx].colName, value: column.caption };
    });
  }

  select(itemidx) {
    this.clearSelection();
    if (itemidx < 0 || itemidx >= this.count) return;

    this.performSelect(itemidx);
    this.fillTable();
  }

  performSelect(itemidx) {
    if (this.items[itemidx]) {
      if (!this.items[itemidx].selected) {
        this.items[itemidx].selected = true;
        this.selected.push(Number(itemidx));
      } else {
        const delIndex = this.selected.indexOf(Number(itemidx));
        if (delIndex >= 0) this.selected.splice(delIndex, 1);
        this.items[itemidx].selected = false;
      }
    }
  }

  clearSelection() {
    for (let i = 0; i < this.selected.length; i++) {
      this.items[this.selected[i]].selected = false;
    }
    this.selected = [];
    this.fillTable();
  }

  wheel(dy, isset) {
    if (isset) this.topItem = dy;
    else {
      dy = dy > 0 ? 1 : -1;
      this.topItem += dy;
      if (this.topItem < 0) this.topItem = 0;
      if (this.topItem > this.count - this.visibleRows) this.topItem = this.count - this.visibleRows;
      this.scrollV.value = this.topItem;
    }
    this.fillTable();
  }

  update() {
    this.fillTable();
    this.updateScrollBars();
  }

  updateScrollBars() {
    this.scrollH.amount = this.scrollWidth;
    this.scrollH.visibles = this.headerRow.width;
    this.scrollH.visible = this.scrollWidth > this.headerRow.width;

    this.scrollV.amount = this.count;
    this.scrollV.visibles = this.visibleRows;
  }

  _onResizeUpdate() {
    this.tableInit();
    this.updateScrollBars();
  }

  setHeaderColumns() {
    let scrollWidth = 0;
    if (this.columns)
      for (let j = 0; j < this.columns.length; j++) {
        let w = this.columns[j].width;
        if (j == this.columns.length - 1)
          if (this.splitH.part(0).width > this.scrollWidth) {
            w += this.splitH.part(0).width - this.scrollWidth;
          }
        if (j < this.columns.length - 1 && this.table && this.table.children[0]) {
          this.table.children[0].children[j].style.width = w + 'px';
        }

        scrollWidth += w;
      }
    this.table.style.width = Math.max(this.splitH.part(0).width, scrollWidth) + 'px';
    this.scrollWidth = scrollWidth;
  }

  fillTable() {
    this.setHeaderColumns();
    for (let i = 0; i < this.table.children.length; i++) {
      let index = i + this.topItem;
      let item = this.items[index];
      let row = this.table.children[i];
      row.setAttribute('itemidx', index);
      row.setAttribute('type', 'lvrow');
      if (item && item.selected) row.setAttribute('selected', '');
      else row.removeAttribute('selected');
      if (this.columns)
        for (let j = 0; j < this.columns.length; j++) {
          let col = row.children[j];
          let cap = '';
          if (item && item[j]) {
            if (item[j].align) col.align = item[j].align;
            cap = item[j].caption;
            col.innerHTML = cap;
          }
        }
    }
  }

  tableInit() {
    let tabHeight = this.splitV.part(1).height;
    this.table.style.top = 0;
    this.table.style.left = 0;
    this.table.style.width = this.scrollWidth + 'px';
    this.table.style.height = tabHeight + 'px';

    this.visibleRows = Math.floor(tabHeight / (this.rowHeight || 1));

    this.table.innerHTML = '';
    for (let i = 0; i < this.visibleRows; i++) {
      let tr = crEl('tr', {}, this.table);
      tr.style.height = this.rowHeight + 'px';
      let td = crEl('td', {}, tr);
      if (i == 0) {
        td.style.width = this.splitH.part(0).width + 'px';
      }
      if (this.columns)
        for (let j = 0; j < this.columns.length - 1; j++) {
          let td = crEl('td', {}, tr);
        }
    }
    this.fillTable();
  }

  set design(op) {
    super.design = op;
    this.scrollV.pointerEvents = op ? 'none' : 'all';
  }

  // get design() {
  //   return this._design;
  // }

  set header(arr) {
    if (!arr) return;
    if (!arr.length) return;

    this.columns = [];
    this.scrollWidth = 0;
    this.headerRow.text = '';

    for (let i = 0; i < arr.length; i++) {
      let w = arr[i].width;
      let l = tr(arr[i].label);
      this.scrollWidth += w;
      let col = new Panel(this.headerRow);
      col.position = 'relative';
      col.height = '100%';
      col.width = w;

      let handle = new Panel(col);
      handle.width = 1;
      handle.height = '100%';
      handle.right = 0;
      handle.backgroundColor = 'var(--listview-header-handle-bg)';
      handle.cursor = 'col-resize';
      handle.setAttribute('handle', true);
      handle.opacity = '0.3';

      let label = new Label(col);
      col.colName = l;
      label.height = '100%';
      label.left = 6;
      label.text = l;
      label.alignItems = 'center';
      label.color = 'var(--listview-header-handle-bg)';
      label.marginTop = '0.05rem';

      this.columns.push(col);
    }
    this.tableInit();
    this.updateScrollBars();
  }

  get header() {
    return this.columns;
  }

  set options(obj) {
    if (!obj) return;
    const { multiselect, sortable } = obj;

    this.multiselect = multiselect;
    this.sortable = sortable;
  }

  get options() {
    return this._options;
  }

  add(arr) {
    this.items.push(arr);
  }

  clear() {
    this.items = [];
    this.selected = [];
    this.topItem = 0;
    this.tableInit();
    this.updateScrollBars();
  }

  get count() {
    return this.items.length;
  }

  set rowHeight(v) {
    this._data.rowHeight = v;
    this.tableInit();
  }

  get rowHeight() {
    return this._data.rowHeight;
  }
}
