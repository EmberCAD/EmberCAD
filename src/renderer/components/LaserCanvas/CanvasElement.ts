// @ts-ignore
// @ts-nocheck
import { codec64 } from '../../lib/api/cherry/codec64';
import { ELEMENTS } from './LaserCanvas';

const DPI = 288;
export const E_KIND_RASTER = 'Raster';
export const E_KIND_VECTOR = 'Vector';
export const E_KIND_CURVE = 'Curve';
export const E_KIND_RECTANGLE = 'Rectangle';
export const E_KIND_ELLIPSE = 'Ellipse';
export const E_KIND_GROUP = 'Group';
export const E_KIND_IMAGE = 'Image';
export const E_KIND_TEXT = 'Text';

export const Counters = {
  Groups: 0,
  Vectors: 0,
  Curves: 0,
  Images: 0,
  Rectangles: 0,
  Ellipses: 0,
};

export default class CanvasElement {
  visible = true;
  angle = 0;
  size = { width: 1, height: 1 };
  rotation = 0;
  opacity = 1;
  freeze = false;
  rasterized = false;
  element: any;
  raster: any;
  rasterSel: any;
  uid: string;

  constructor(protected paper) {
    this.uid = codec64.uId('element_');
  }

  update(opt?) {
    this.element.type = 'element';
    this.element.sel = false;
    this.element.laserSettings = [];
    return;
    let { inMotion } = opt || { inMotion: false };
    this.element.opacity = 1;
    if (inMotion) {
      this.element.strokeWidth = 1; //DPI / 100 / this.paper.view.scaling.x + 0.5;
    } else {
      this.element.strokeWidth = 1;
    }

    if (inMotion) {
      if (this.raster) {
        this.raster.remove();
        this.makeRaster();
        this.raster.opacity = 1;
      } else {
        this.makeRaster();
      }
      this.element.opacity = 0;
    } else {
      if (this.raster) this.raster.opacity = 0;
    }
  }

  makeRaster() {
    this.raster = this.element.rasterize(DPI);
  }

  set fillColor(val) {
    this.element.fillColor = val;
    this.update();
  }
  set strokeColor(val) {
    this.element.strokeColor = val;
    this.update();
  }

  get position() {
    return this.element.position;
  }

  set position(pos) {
    if (this.raster) this.raster.position = pos;
    else this.vector.position = pos;

    // this.rasterized.position = pos;
  }

  setSize(w, h) {
    this.element.bounds.width = w;
    this.element.bounds.height = h;
  }
}
