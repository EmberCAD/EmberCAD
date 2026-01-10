// @ts-ignore
// @ts-nocheck
import { tr } from '../../lib/api/cherry/langs';
import { getElementColor } from '../../modules/helpers';
import CanvasElement, { Counters, E_KIND_ELLIPSE } from './CanvasElement';

export default class CanvasCircle extends CanvasElement {
  constructor(protected paper, private x, private y?, private w?, private h?) {
    super(paper);
    this.init();
  }
  private init() {
    if (this.x && this.x.x !== undefined) {
      this.y = this.x.y;
      this.w = this.x.w;
      this.h = this.x.h;
      this.x = this.x.x;
    }
    this.element = this.paper.Path.Ellipse(this.x, this.y, this.w, this.h);
    this.element.strokeScaling = false;
    this.element.opacity = 1;
    this.element.sel = false;

    this.update();
  }
}
