//@ts-ignore
//@ts-nocheck

import CheckBox from '../../../lib/components/CheckBox/CheckBox';
import { crDiv } from '../../../modules/dom';
import './Preview.scss';

export const SHOW_RAPID = 'SHOW_RAPID';

export default class Preview {
  cont: any;
  timeline: any;
  timelineHead: any;
  mousedown: boolean;
  initPos: { x: any; y: any };
  private _position: any;
  posx = 0;
  private _visible: any;
  showRapidC: CheckBox;
  constructor(private parent) {
    this.init();
    this.events();
  }

  init() {
    this.cont = crDiv(this.parent, {
      class: 'preview-transport',
    });

    this.timeline = crDiv(this.cont, {
      class: 'transport-timeline',
    });

    this.timelineHead = crDiv(this.timeline, {
      class: 'transport-timeline-head',
    });

    this.showRapidC = new CheckBox(this.parent);
    this.showRapidC.hide();

    this.showRapidC.zIndex = 10;
    this.showRapidC.position = 'absolute';
    this.showRapidC.top = null;
    this.showRapidC.left = null;
    this.showRapidC.bottom = '3rem';
    this.showRapidC.text = 'Show rapid moves';

    if (localStorage.getItem(SHOW_RAPID) === null) localStorage.setItem(SHOW_RAPID, true);
    this.showRapidC.checked = JSON.parse(localStorage.getItem(SHOW_RAPID));
  }

  events() {
    this.timelineHead.addEventListener('mousedown', (e) => {
      this.mousedown = true;
      e.preventDefault();
      this.initPos = { x: e.clientX - this.posx };
    });

    document.addEventListener('mouseup', (e) => {
      if (!this.mousedown) return;
      e.preventDefault();
      this.mousedown = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.mousedown) return;
      e.preventDefault();

      this.posx = e.clientX - this.initPos.x;

      if (this.posx < 0) this.posx = 0;
      if (this.posx > this.timeline.offsetWidth) this.posx = this.timeline.offsetWidth;
      this._position = this.posx / this.timeline.offsetWidth;
      this.update();
      if (typeof this.onChange === 'function') this.onChange(this._position);
    });

    this.showRapidC.onChanged = () => {
      localStorage.setItem(SHOW_RAPID, this.showRapidC.checked);
      if (typeof this.onChange === 'function') this.onChange(this._position);
    };
  }

  private update() {
    this.timelineHead.style.left = this._position * this.timeline.offsetWidth + 'px';
  }

  set position(x) {
    this._position = x;
    this.posx = x * this.timeline.offsetWidth;
    this.update();
  }

  get position() {
    return this._position;
  }

  hide() {
    this.visible = false;
  }

  show() {
    this.visible = true;
  }

  set visible(op) {
    this._visible = op;
    this.cont.style.display = op ? null : 'none';
    this.showRapidC.visible = op;
  }

  get visible() {
    return this._visible;
  }
}
