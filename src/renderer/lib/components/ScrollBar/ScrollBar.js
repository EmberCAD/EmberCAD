import { crDiv, numberToPx } from '../../api/cherry/api';
import { OR_HORIZONTAL, OR_VERTICAL } from '../../api/declare_common';
import Component from '../Component/Component';

const SILENT = true;

export default class ScrollBar extends Component {
  constructor(id) {
    super(id);
    this._init();
    this._events();
    this.defaults();
  }

  _init() {
    this.customProps = [
      'width',
      'height',
      'handleColor',
      'incremental',
      'orientation',
      'value',
      'min',
      'max',
      'amount',
      'visibles',
    ];
    // this.props['orientation'] = [OR_HORIZONTAL, OR_VERTICAL];

    this.baseClass = 'ch-scrollBarHandle';
    this.cont.className = 'ch-scrollBar';
    this.handle = crDiv(
      {
        class: this.baseClass, //+ " ch-eventsDisabled",
        handle: 'true',
      },
      this.cont,
    );
  }

  _events() {
    this.handle.addEventListener('mousedown', (e) => {
      this.mouseDown = true;
    });

    this.cont.addEventListener('mousedown', (e) => {
      if (this.design) return;
      let pos = this.getPos(e);
      this.rectH = this.handle.getBoundingClientRect();

      this.initOff = {
        x: pos.x - this.rectH.left,
        y: pos.y - this.rectH.top,
      };

      if (!e.target.getAttribute('handle')) {
        if (this.incremental) {
          let less =
            this.orientation == OR_HORIZONTAL
              ? this.rect.left + pos.x < this.rectH.left + this.rectH.width
              : this.rect.top + pos.y < this.rectH.top + this.rectH.height;

          less ? (this.value -= this.visibles) : (this.value += this.visibles);
        } else {
          this.initOff = {
            x: this.rectH.width / 2 - this.rect.left,
            y: this.rectH.height / 2 - this.rect.top,
          };
          this.mouseDown = true;
          this.setPosition(e);
        }
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.mouseDown) return;
      this.setPosition(e);
    });

    document.addEventListener('mouseup', (e) => {
      this.mouseDown = false;
    });
  }

  defaults() {
    this.width = '100%';
    this.height = '100%';
    this.min = 0;
    this.max = 100;
    this.amount = 10;
    this.value = 0;
    this.visibles = 10;
    this.orientation = OR_HORIZONTAL;
    this.offset = {
      x: 0,
      y: 0,
    };
    this.incremental = true;
    this.enabled = true;
  }

  setPosition(e) {
    if (this.design) return;
    let pos = this.getPos(e);
    let x = pos.x - this.initOff.x - this.rect.left;
    let y = pos.y - this.initOff.y - this.rect.top;
    let rw = this.rect.width;
    let rh = this.rect.height;
    let rwh = this.rectH.width;
    let rhh = this.rectH.height;
    if (x < 0) x = 0;
    if (x > rw - rwh) x = rw - rwh;
    if (y < 0) y = 0;
    if (y > rh - rhh) y = rh - rhh;
    if (this.orientation == OR_HORIZONTAL) this.handle.style.left = x + 'px';
    else this.handle.style.top = y + 'px';
    this.value =
      this.orientation == OR_HORIZONTAL
        ? x / ((rw - rwh) / (this.amount - this.visibles))
        : y / ((rh - rhh) / (this.amount - this.visibles));
    this.update();
  }

  update(isSilent = false) {
    if (!this.handle) return;
    this.prevValue = -1;
    let min = this._data.min;
    let max = this._data.max;
    let values = max - min;
    let visible = this._data.visibles;
    let amount = this._data.amount;
    let position = this._data.value;
    let barSize = this._data.orientation == OR_HORIZONTAL ? this.rect.width : this.rect.height;
    let scale = barSize / (values || 1);
    let viewport = amount - visible;
    let handleSize = barSize - viewport * scale;
    let handlePos = ((barSize - handleSize) / viewport) * position;

    if (handleSize < 30) handleSize = 30;

    if (handlePos + handleSize > barSize) handlePos = barSize - handleSize;
    if (handlePos < 0) handlePos = barSize;

    this.scale = scale;
    if (viewport > 0) this.handle.style.display = null;
    else this.handle.style.display = 'none';
    this._data.orientation == OR_HORIZONTAL
      ? (this.handle.style.width = handleSize + 'px')
      : (this.handle.style.height = handleSize + 'px');
    if (!this.mouseDown)
      if (this._data.orientation == OR_HORIZONTAL) {
        this.handle.style.left = handlePos + 'px';
        this.handle.style.top = '0px';
      } else {
        this.handle.style.left = '0px';
        this.handle.style.top = handlePos + 'px';
      }

    if (!isSilent) this.onChangeCB();
  }

  set handleColor(v) {
    this._data.handleColor = v;
    this.handle.style.background = v;
  }

  get handleColor() {
    return this._data.handleColor;
  }

  set incremental(v) {
    this._data.incremental = v;
  }

  get incremental() {
    return this._data.incremental;
  }

  set width(v) {
    this._data.width = v;
    this.cont.style.width = numberToPx(v);
  }
  set height(v) {
    this._data.height = v;
    this.cont.style.height = numberToPx(v);
  }

  get width() {
    return this._data.width;
  }
  get height() {
    return this._data.height;
  }

  // set barWidth(v) {
  //     this._data.barWidth = v;
  //     this.update();
  // }
  // set barHeight(v) {
  //     this._data.barHeight = v;
  //     this.update();

  // }
  // get barWidth() {
  //     return this._data.barWidth;
  // }
  // get barHeight() {
  //     return this._data.barHeight;
  // }

  set radius(v) {
    this._data.radius = v;
    this.handle.style.borderRadius = this.cont.style.borderRadius = numberToPx(v);
  }

  set orientation(v) {
    if (!this.handle) return;

    this._data.orientation = v;
    this.handle.style.width = null;
    this.handle.style.height = null;
    let tw = this.width;
    let th = this.height;
    if (v == OR_HORIZONTAL && th > tw) {
      this.width = th;
      this.height = tw;
    }
    if (v == OR_VERTICAL && tw > th) {
      this.height = tw;
      this.width = th;
    }
    this.update(SILENT);
  }

  get orientation() {
    return this._data.orientation;
  }

  set max(v) {
    if (v < this.min) v = this.min;
    if (v > this.amount - this.min) v = this.amount - this.min;
    this._data.max = v;
    this.update(SILENT);
  }
  get max() {
    return this._data.max;
  }

  set min(v) {
    if (v > this.max) v = this.max;
    if (v < 0) v = 0;
    this._data.min = v;
    this.update(SILENT);
  }
  get min() {
    return this._data.min;
  }

  set amount(v) {
    if (v < 0) v = 0;
    if (v > this.max - this.min) this._data.max = v - this.min;
    this._data.amount = v;
    this.update(SILENT);
  }

  get amount() {
    return this._data.amount;
  }

  set visibles(v) {
    this._data.visibles = v;
    this.update(SILENT);
  }

  get visibles() {
    return this._data.visibles;
  }

  set value(v) {
    if (v > this.amount - this.visibles) v = this.amount - this.visibles;
    if (v > this.max - this.min) v = this.max - this.min;
    if (v < 0) v = 0;
    this._data.value = v + this.min;
    if (this.prevValue === v) return;
    this.prevValue = v;

    this.update(SILENT);
  }

  get value() {
    return Math.floor(this._data.value);
  }

  set design(op) {
    this._design = op;
    this.designClass = op ? ' ch-eventsDisabled' : ' ch-eventsEnabled';
    this.handle.className = this.baseClass + this.designClass;
  }

  get design() {
    return this._design;
  }

  onChangeCB() {
    if (typeof this.onChange == 'function') this.onChange(this.value);
  }
}
