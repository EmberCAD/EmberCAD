//@ts-ignore
//@ts-nocheck

import { SNAPPING, Snapping } from '../../../components/LaserCanvas/LaserCanvas';
import Panel from '../../../lib/components/Panel/Panel';
import { ICallback } from '../../../modules/ICallback';

const SNAP_OPACITY = 0.2;

export default class Snapper {
  _snapping: Snapping;
  field: Panel;
  anchors: never[];

  onChange: ICallback<any>;

  constructor(private parent) {
    this.init();
    this.events();
  }

  private init() {
    this.field = new Panel(this.parent);
    this.field.width = 60;
    this.field.height = 60;
    this.field.backgroundColor = '#5556';
    this.initAnchors();
  }

  initAnchors() {
    this.anchors = [];
    let snap = 0;
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const anchor = new Anchor(this.field);
        anchor.snap = snap++;
        anchor.anchor.position = 'absolute';
        anchor.anchor.left = x * 24;
        anchor.anchor.top = y * 24;
        anchor.onClick = (snap) => {
          this.snapping = snap;
          this.clearAnchors();
          anchor.selected = true;
          if (typeof this.onChange === 'function') this.onChange(this.snapping);
        };
        this.anchors.push(anchor);
      }
    }
  }

  clearAnchors() {
    for (let i = 0; i < this.anchors.length; i++) {
      this.anchors[i].selected = false;
    }
  }

  private events() {}

  set snapping(snap: Snapping) {
    this.anchors[snap].selected = true;
    this._snapping = snap;
  }

  get snapping() {
    return this._snapping;
  }
}

class Anchor {
  anchor: Panel;
  private _snap: number;
  private _selected: boolean;
  constructor(private parent) {
    this.init();
    this.events();
  }
  private init() {
    this.anchor = new Panel(this.parent);
    this.anchor.width = 12;
    this.anchor.height = 12;
    this.anchor.opacity = SNAP_OPACITY;
    this.anchor.backgroundColor = '#ddd';
  }

  set selected(op: boolean) {
    this._selected = op;
    this.anchor.opacity = op ? 1 : SNAP_OPACITY;
  }
  private events() {
    this.anchor.onClick = () => {
      if (typeof this.onClick === 'function') this.onClick(this.snap);
    };
  }

  get() {
    return this._selected;
  }

  set snap(no: number) {
    this._snap = no;
  }

  get snap() {
    return this._snap;
  }
}
