// @ts-ignore
// @ts-nocheck
import { tr } from '../../../lib/api/cherry/langs';
import { getElementColor, writeUni } from '../../../modules/helpers';
import CanvasCircle from '../CanvasCircle';
import { Counters, E_KIND_ELLIPSE } from '../CanvasElement';
import { CURRENT_LAYER_FILL, OBJECTS_LAYER, SNAP_GRID } from '../LaserCanvas';

export default class Circle {
  initPosition: any;
  mouseDown: boolean;
  initRect: { x: any; y: any; w: number; h: number };
  rect: CanvasCircle;
  initBounds: any;
  constructor(private paper) {}

  onMouseDown(e) {
    window[OBJECTS_LAYER].activate();
    const { x, y } = this.snap(e.point.x, e.point.y, e.event.altKey);

    this.initPosition = { x, y };

    this.initRect = { x, y, w: 1, h: 1 };
    this.mouseDown = true;
  }

  private snap(x, y, altKey, tolerance?) {
    let snap = 1;
    if (!altKey) {
      snap = window[SNAP_GRID];
    } else {
      tolerance = 0;
    }
    let sx = Math.round(x / snap) * snap;
    let sy = Math.round(y / snap) * snap;

    if (tolerance) {
      if (x > sx - tolerance / 2 && x < sx + tolerance / 2) x = sx;
      if (y > sy - tolerance / 2 && y < sy + tolerance / 2) y = sy;
    } else {
      if (!altKey) {
        x = sx;
        y = sy;
      }
    }

    return { x, y };
  }

  onMouseMove(e) {
    if (!this.mouseDown) return;

    const ctrl = e.event.ctrlKey || e.event.metaKey;
    const shift = e.event.shiftKey;

    let xx = e.point.x - this.initPosition.x;
    let yy = e.point.y - this.initPosition.y;

    if (shift) {
      const ss = Math.max(xx, yy);
      yy = xx = ss;
    }

    const size = this.snap(xx, yy, e.event.altKey, window[SNAP_GRID] / 2);
    let w = size.x;
    let h = size.y;

    if (this.rect) this.rect.element.remove();

    this.rect = new CanvasCircle(this.paper, this.initRect);
    if (!this.initBounds) this.initBounds = this.rect.element.bounds;
    if (ctrl) {
      w *= 2;
      h *= 2;
      const nx = this.initPosition.x - w / 2;
      const ny = this.initPosition.y - h / 2;

      this.rect.element.position.x = nx + 0.5;
      this.rect.element.position.y = ny + 0.5;
    }

    this.rect.setSize(w || 1, h || 1);
    this.rect.element.strokeColor = getElementColor(this.rect.element);
    this.rect.element.fillColor = null;
  }

  onMouseUp() {
    if (!this.mouseDown) return;
    this.mouseDown = false;
    if (!this.rect) return;

    if (this.rect.element.bounds.width && this.rect.element.bounds.height) {
      const instance = this.rect.element.clone();
      instance.uid = this.rect.uid;
      instance.type = this.rect.element.type;
      instance.kind = E_KIND_ELLIPSE;
      instance.uname = this.rect.element.uname;
      instance.uname = tr(E_KIND_ELLIPSE) + ' ' + ++Counters.Ellipses;

      this.rect.element.remove();
      if (typeof this.onElementCreated === 'function') this.onElementCreated(instance);
    }
  }
}
