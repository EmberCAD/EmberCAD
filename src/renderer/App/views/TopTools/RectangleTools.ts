//@ts-ignore
//@ts-nocheck

import CanvasRectangle, { CornerStyle } from '../../../components/LaserCanvas/CanvasRectangle';
import { CURRENT_UNIT, MIRROR_SCALARS, SNAP_GRID, Unit } from '../../../components/LaserCanvas/LaserCanvas';
import { readUni, writeUni } from '../../../modules/helpers';

export const TOOL_NAME = 'RECTANGLE_TOOL';
const CORNERS_STYLES = ['None', 'Rounded', 'Straight', 'Concave', 'Cutout'];
const CORNER_NAMES = ['TL', 'TR', 'BL', 'BR'];

export default class RectangleTools {
  toolName: any;
  private _view: any;
  singleRadius: any;
  singleCornerStyle: any;
  corners: any;
  lCorner: any;
  singleCornerRadius: never[];
  private _element: any;
  lPower: any;
  constantPower: any;
  minPower: any;
  maxPower: any;
  powerIntervalTools: PowerIntervalTools;

  ////////////////////////////////////////////////////////////////////

  constructor(private topTool, private paper) {}

  /////////////////////////////////////////////////////////////////////

  private initView() {
    this.toolName = this.topTool.addLabel('Rectangle');
    this.topTool.addSeparator();

    this.singleRadius = this.topTool.addCheckBox('Single radius', true);
    this.topTool.addSeparator();

    this.lCorner = this.topTool.addLabel('Corner:');
    this.singleCornerStyle = this.topTool.addSelect();
    this.singleCornerStyle.items = CORNERS_STYLES;
    this.singleCornerStyle.itemIndex = 0;
    this.singleCornerRadius = this.topTool.addInput('', window[CURRENT_UNIT] === Unit.Metric ? 'mm' : 'in');

    this.corners = [];
    let separator;
    for (let i = 0; i < CORNER_NAMES.length; i++) {
      const idx = CORNER_NAMES[i];

      const lCorner = this.topTool.addLabel(`${idx}:`);
      const cornerStyle = this.topTool.addSelect();
      cornerStyle.items = CORNERS_STYLES;
      cornerStyle.itemsIndex = 0;
      const radius = this.topTool.addInput('', 'mm');
      cornerStyle.idx = idx;
      radius.idx = idx;
      if (i < 3) separator = this.topTool.addSeparator();
      this.corners[idx] = { lCorner, cornerStyle, radius, separator };
    }

    this.showSingle(true);

    this.events();
  }

  /////////////////////////////////////////////////////////////////////

  private events() {
    this.singleRadius.onChanged = () => {
      if (!this.singleRadius.checked) {
        const radius = this._element.data.corners['TL'].radius;
        const style = CORNERS_STYLES.indexOf(this._element.data.corners['TL'].style);
        for (let i = 0; i < CORNER_NAMES.length; i++) {
          const idx = CORNER_NAMES[i];
          if (!this.corners[idx].radius.text && this.corners[idx].cornerStyle.itemIndex !== '') {
            this.corners[idx].radius.text = radius;
            this.corners[idx].cornerStyle.itemIndex = style;
            this._element.data.corners[idx].radius = radius;
            this._element.data.corners[idx].style = this._element.data.corners['TL'].style;
          }
        }
      }
      this.showSingle(this.singleRadius.checked);
    };

    this.singleCornerStyle.onChange = () => {
      const radius = Number(this.singleCornerRadius.text) || 0;
      const style = this.singleCornerStyle.text;
      this._element.data.corners['TL'].style = style;

      const DEFAULT_RADIUS = window[SNAP_GRID];

      if (this.singleCornerStyle.text !== CornerStyle.None && !radius) {
        this.singleCornerRadius.text = DEFAULT_RADIUS;
        this._element.data.corners['TL'].radius = DEFAULT_RADIUS;
      }
      if (this.singleCornerStyle.text === CornerStyle.None) {
        this.singleCornerRadius.text = '';
        this._element.data.corners['TL'].radius = '';
      }
      this.update();
    };

    this.singleCornerRadius.onChange = () => {
      const radius = Number(this.singleCornerRadius.text) || 0;
      this._element.data.corners['TL'].radius = radius;
      if (radius === 0) this.singleCornerStyle.itemIndex = 0;
      this.update();
    };

    ////

    for (let i = 0; i < CORNER_NAMES.length; i++) {
      const idx = CORNER_NAMES[i];

      this.corners[idx].radius.onChange = () => {
        const radius = Number(this.corners[idx].radius.text) || 0;
        this._element.data.corners[idx].radius = radius;
        if (!radius) this._element.data.corners[idx].style = CornerStyle.None;
        this.update();
      };

      this.corners[idx].cornerStyle.onChange = () => {
        const radius = Number(this.corners[idx].radius.text) || 0;
        const DEFAULT_RADIUS = window[SNAP_GRID];

        this._element.data.corners[idx].style = this.corners[idx].cornerStyle.text;
        if (this.corners[idx].cornerStyle.text !== CornerStyle.None && !radius)
          this.corners[idx].radius.text = DEFAULT_RADIUS;

        this.update();
      };
    }

    /////

    this.powerIntervalTools.onPowerChange = (vx) => {
      if (typeof this.onPowerChange === 'function') this.onPowerChange(vx);
    };
  }

  /////////////////////////////////////////////////////////////////////

  showSingle(op) {
    for (let i = 0; i < CORNER_NAMES.length; i++) {
      const idx = CORNER_NAMES[i];
      this.corners[idx].lCorner.visible = !op;
      this.corners[idx].cornerStyle.visible = !op;
      this.corners[idx].radius.visible = !op;
      if (i < 3) this.corners[idx].separator.visible = !op;
    }
    this.singleRadius.checked = op;
    this.lCorner.visible = op;
    this.singleCornerStyle.visible = op;
    this.singleCornerRadius.visible = op;
    if (this._element) {
      this.singleCornerStyle.itemIndex = CORNER_NAMES.indexOf(this._element.data.corners['TL'].style);
      this._element.data.isSingle = op;
      this.update();
    }
  }

  /////////////////////////////////////////////////////////////////////

  update() {
    if (this._element.data.rotation !== undefined) {
      let rotation = this._element.data.rotation;
      if (this._element.data.prevRotation) {
        rotation = this._element.data.prevRotation + this._element.data.rotation;
        this._element.data.prevRotation = rotation;
      }
      this._element.rotation = -rotation;
      this._element.data.rotation = rotation;
    }
    const bounds = this._element.bounds;
    const rectangle = new CanvasRectangle(this.paper, bounds.x, bounds.y, bounds.width, bounds.height);
    if (this.singleRadius.checked) {
      rectangle.radius = Number(writeUni(this.singleCornerRadius.input.value) || 0);
      rectangle.corner = this._element.data.corners['TL'].style;
    } else {
      const corners = this.setOrder(this._element.data.corners);

      rectangle.radius = corners.radius;
      rectangle.corner = corners.style;
    }

    const rect = rectangle.element;

    this._element.copyContent(rect);

    this._element.rotation = this._element.data.rotation;
    this._element.data.prevRotation = 0;

    rect.remove();
  }
  /////////////////////////////////////////////////////////////////////

  setOrder(corners: any) {
    const m = window[MIRROR_SCALARS];
    const mh = m.x < 0;
    const mv = m.y < 0;

    let order = ['TL', 'TR', 'BR', 'BL'];

    if (mh) {
      order = ['TR', 'TL', 'BL', 'BR'];
    }
    if (mv) {
      order = ['BL', 'BR', 'TR', 'TL'];
    }

    if (mh && mv) {
      order = ['BR', 'BL', 'TL', 'TR'];
    }

    const styles = [];
    const radiuses = [];
    for (let i = 0; i < order.length; i++) {
      const ord = order[i];

      const corner = corners[ord];
      radiuses.push(Number(writeUni(corner.radius)));
      styles.push(corner.style);
    }

    return { radius: radiuses, style: styles };
  }

  /////////////////////////////////////////////////////////////////////

  fillProps() {
    const data = this._element.data;
    const laserSettings = this._element.laserSettings;

    this.powerIntervalTools.fillProps(laserSettings);

    if (data.isSingle !== undefined) {
      if (data.isSingle) {
        this.singleCornerStyle.itemIndex = CORNERS_STYLES.indexOf(data.corners['TL'].style);
        this.singleCornerRadius.text = data.corners['TL'].radius;

        if (Number(this.singleCornerRadius.text) === 0) this.singleCornerStyle.itemIndex = 0;
      } else {
        for (let i = 0; i < CORNER_NAMES.length; i++) {
          const idx = CORNER_NAMES[i];
          this.corners[idx].radius.text = data.corners[idx].radius;
          this.corners[idx].cornerStyle.itemIndex = Number(CORNERS_STYLES.indexOf(data.corners[idx].style));
        }
      }
    } else {
      data.isSingle = true;
      this.singleCornerStyle.itemIndex = 0;
      this.singleCornerRadius.text = '';
      for (let i = 0; i < CORNER_NAMES.length; i++) {
        const idx = CORNER_NAMES[i];
        this.corners[idx].radius.text = '';
        this.corners[idx].cornerStyle.itemIndex = 0;
      }
    }

    this.showSingle(data.isSingle);
  }

  /////////////////////////////////////////////////////////////////////

  set element(element) {
    this._element = element;
    this.powerIntervalTools.element = element;

    this.fillProps();
  }

  get element() {
    return this._element;
  }

  /////////////////////////////////////////////////////////////////////

  get viewName() {
    return TOOL_NAME;
  }

  set view(view: any) {
    this._view = view;
    this.initView();
  }
}
