import { tr } from '../../lib/api/cherry/langs';
import CanvasElement, { Counters, E_KIND_RECTANGLE } from './CanvasElement';

export enum CornerStyle {
  None = 'None',
  Rounded = 'Rounded',
  Straight = 'Straight',
  Concave = 'Concave',
  Cutout = 'Cutout',
}

export default class CanvasRectangle extends CanvasElement {
  private corners: any;
  private _radius: any;
  private _corner: any;

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

    this.corners = {};

    this.corners['TL'] = { radius: 0, style: CornerStyle.Rounded };
    this.corners['TR'] = { radius: 0, style: CornerStyle.Rounded };
    this.corners['BR'] = { radius: 0, style: CornerStyle.Rounded };
    this.corners['BL'] = { radius: 0, style: CornerStyle.Rounded };

    this.element = this.rect(this.x, this.y, this.w, this.h);
    this.setup();

    this.update();
  }

  private setup() {
    this.element.strokeScaling = false;
    this.element.opacity = 1;
    this.element.uid = this.uid;
    this.element.kind = E_KIND_RECTANGLE;
    this.element.data.corners = this.corners;
  }

  rect(x, y, w, h) {
    const rpath = new this.paper.Path();
    rpath.closed = true;

    const mr = Math.min(w / 2, h / 2);

    let rtl = this.corners['TL'].radius || 0;
    let rtr = this.corners['TR'].radius || 0;
    let rbr = this.corners['BR'].radius || 0;
    let rbl = this.corners['BL'].radius || 0;

    if (rtl > mr) rtl = mr;
    if (rtr > mr) rtr = mr;
    if (rbr > mr) rbr = mr;
    if (rbl > mr) rbl = mr;

    //////////

    if (rtl) {
      rpath.add(new this.paper.Point(x + rtl, y));
    } else {
      rpath.add(new this.paper.Point(x, y));
    }

    //////////

    if (rtr && this.corners['TR'].style !== CornerStyle.None) {
      if (this.corners['TR'].style === CornerStyle.Rounded || this.corners['TR'].style === CornerStyle.Concave) {
        let through;

        const from = new this.paper.Point(x + w - rtr, y);

        if (this.corners['TR'].style === CornerStyle.Rounded)
          through = new this.paper.Point(x + w - rtr / Math.PI, y + rtr / Math.PI);
        else through = new this.paper.Point(x + w - rtr + rtr / Math.PI, y + rtr - rtr / Math.PI);

        const to = new this.paper.Point(x + w, y + rtr);
        const corner = new this.paper.Path.Arc(from, through, to);
        rpath.join(corner);
      } else {
        if (this.corners['TR'].style === CornerStyle.Straight) {
          rpath.add(new this.paper.Point(x + w - rtr, y));
          rpath.add(new this.paper.Point(x + w, y + rtr));
        } else {
          rpath.add(new this.paper.Point(x + w - rtr, y));
          rpath.add(new this.paper.Point(x + w - rtr, y + rtr));
          rpath.add(new this.paper.Point(x + w, y + rtr));
        }
      }
    } else {
      rpath.add(new this.paper.Point(x + w, y));
    }

    //////////

    if (rbr && this.corners['BR'].style !== CornerStyle.None) {
      if (this.corners['BR'].style === CornerStyle.Rounded || this.corners['BR'].style === CornerStyle.Concave) {
        let through;

        const from = new this.paper.Point(x + w, y + h - rbr);

        if (this.corners['BR'].style === CornerStyle.Rounded)
          through = new this.paper.Point(x + w - rbr / Math.PI, y + h - rbr / Math.PI);
        else through = new this.paper.Point(x + w - rbr + rbr / Math.PI, y + h - rbr + rbr / Math.PI);

        const to = new this.paper.Point(x + w - rbr, y + h);
        const corner = new this.paper.Path.Arc(from, through, to);
        rpath.join(corner);
      } else {
        if (this.corners['BR'].style === CornerStyle.Straight) {
          rpath.add(new this.paper.Point(x + w, y + h - rbr));
          rpath.add(new this.paper.Point(x + w - rbr, y + h));
        } else {
          rpath.add(new this.paper.Point(x + w, y + h - rbr));
          rpath.add(new this.paper.Point(x + w - rbr, y + h - rbr));
          rpath.add(new this.paper.Point(x + w - rbr, y + h));
        }
      }
    } else {
      rpath.add(new this.paper.Point(x + w, y + h));
    }

    //////////

    if (rbl && this.corners['BL'].style !== CornerStyle.None) {
      if (this.corners['BL'].style === CornerStyle.Rounded || this.corners['BL'].style === CornerStyle.Concave) {
        let through;

        const from = new this.paper.Point(x + rbl, y + h);

        if (this.corners['BL'].style === CornerStyle.Rounded)
          through = new this.paper.Point(x + rbl / Math.PI, y + h - rbl / Math.PI);
        else through = new this.paper.Point(x + rbl - rbl / Math.PI, y + h - rbl + rbl / Math.PI);

        const to = new this.paper.Point(x, y + h - rbl);
        const corner = new this.paper.Path.Arc(from, through, to);
        rpath.join(corner);
      } else {
        if (this.corners['BL'].style === CornerStyle.Straight) {
          rpath.add(new this.paper.Point(x + rbl, y + h));
          rpath.add(new this.paper.Point(x, y + h - rbl));
        } else {
          rpath.add(new this.paper.Point(x + rbl, y + h));
          rpath.add(new this.paper.Point(x + rbl, y + h - rbl));
          rpath.add(new this.paper.Point(x, y + h - rbl));
        }
      }
    } else {
      rpath.add(new this.paper.Point(x, y + h));
    }

    //////////

    if (rtl && this.corners['TL'].style !== CornerStyle.None) {
      if (this.corners['TL'].style === CornerStyle.Rounded || this.corners['TL'].style === CornerStyle.Concave) {
        let through;

        const from = new this.paper.Point(x, y + rtl);

        if (this.corners['TL'].style === CornerStyle.Rounded)
          through = new this.paper.Point(x + rtl / Math.PI, y + rtl / Math.PI);
        else through = new this.paper.Point(x + rtl - rtl / Math.PI, y + rtl - rtl / Math.PI);

        const to = new this.paper.Point(x + rtl, y);
        const corner = new this.paper.Path.Arc(from, through, to);
        rpath.join(corner);
      } else {
        if (this.corners['TL'].style === CornerStyle.Straight) {
          rpath.add(new this.paper.Point(x, y + rtl));
          rpath.add(new this.paper.Point(x + rtl, y));
        } else {
          rpath.add(new this.paper.Point(x, y + rtl));
          rpath.add(new this.paper.Point(x + rtl, y + rtl));
          rpath.add(new this.paper.Point(x + rtl, y));
        }
      }
    } else {
      rpath.add(new this.paper.Point(x, y));
    }

    return rpath;
  }

  set radius(n: any) {
    this._radius = n;
    const strokeColor = this.element.strokeColor;
    if (typeof n === 'number') {
      this.corners['TL'].radius = n;
      this.corners['TR'].radius = n;
      this.corners['BR'].radius = n;
      this.corners['BL'].radius = n;
      this.element = this.element.replaceWith(this.rect(this.x, this.y, this.w, this.h));
    } else {
      this.corners['TL'].radius = n[0] || 0;
      this.corners['TR'].radius = n[1] || 0;
      this.corners['BR'].radius = n[2] || 0;
      this.corners['BL'].radius = n[3] || 0;
      this.element = this.element.replaceWith(this.rect(this.x, this.y, this.w, this.h));
    }
    this.setup();
    this.element.strokeColor = strokeColor;
  }

  get radius() {
    return this._radius;
  }

  set corner(n: any) {
    this._corner = n;
    const strokeColor = this.element.strokeColor;
    if (typeof n === 'string') {
      this.corners['TL'].style = n;
      this.corners['TR'].style = n;
      this.corners['BR'].style = n;
      this.corners['BL'].style = n;
      this.element = this.element.replaceWith(this.rect(this.x, this.y, this.w, this.h));
    } else {
      this.corners['TL'].style = n[0] || CornerStyle.Rounded;
      this.corners['TR'].style = n[1] || CornerStyle.Rounded;
      this.corners['BR'].style = n[2] || CornerStyle.Rounded;
      this.corners['BL'].style = n[3] || CornerStyle.Rounded;
      this.element = this.element.replaceWith(this.rect(this.x, this.y, this.w, this.h));
    }
    this.setup();
    this.element.strokeColor = strokeColor;
  }

  get corner() {
    return this._corner;
  }
}
