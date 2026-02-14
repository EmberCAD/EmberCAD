//@ts-ignore
//@ts-nocheck

import CanvasRectangle from '../../../components/LaserCanvas/CanvasRectangle';
import { OBJECTS_LAYER, PREVIEW_OPACITY, VECTORS } from '../../../components/LaserCanvas/LaserCanvas';
import { SELECT } from '../../../components/LaserCanvas/Tools/Select';
import { DeepCopy } from '../../../lib/api/cherry/api';
import { codec64 } from '../../../lib/api/cherry/codec64';
import { ImagePreview, reduceOptions, reduceRGB } from '../../../modules/GCode/ImageG';
import { inchToMm, mmToInch, readUni, writeUni } from '../../../modules/helpers';
import { CURRENT_MOD, MOD_WORK } from '../../App';
import { DefaultLaserSettings } from '../Work/Work';
import PowerIntervalTools from './PowerIntervalTools';
import TopTools from './TopTools';

export const TOOL_NAME = 'IMAGE_TOOL';
const EDGE_NAMES = ['T', 'R', 'B', 'L'];
export const DPI_IN = 'DPI In:';
export const DPI_OUT = 'DPI Out:';

export default class ImageTools {
  lFilename: any;
  private _view: any;
  lSize: any;
  bReplace: any;
  private _element: any;
  interval: any;
  bAddFrame: any;
  dither: any;
  lPower: any;
  constantPower: any;
  minPower: any;
  maxPower: any;
  overscan: any;
  overscanValue: any;
  negative: any;
  dpiIn: any;
  dpiOut: any;
  overscanMargin: any;
  ////////////////////////////////////////////////////////////////////

  constructor(private topTool) {
    // this.init();
  }

  /////////////////////////////////////////////////////////////////////

  private initView() {
    this.lFilename = this.topTool.addLabel('Image');
    this.topTool.addSeparator();

    // this.lSize = this.topTool.addLabel('1920 x 1080');
    // this.topTool.addSeparator();

    // this.bReplace = this.topTool.addButton('Replace image');
    // this.topTool.addSeparator();

    this.bAddFrame = this.topTool.addButton('Add frame');
    this.topTool.addSeparator();

    this.dither = this.topTool.addSelect();
    this.dither.items = [
      'Original',
      'Grayscale',
      'Jarvis',
      'Stucki',
      'Dither',
      'Dither2',
      'Atkinson',
      'Burkes',
      'Sierra',
      'TwoSierra',
      'SierraLite',
    ];
    this.dither.itemIndex = 0;

    this.topTool.addSeparator();

    // this.lPower = this.topTool.addLabel('Power:');
    // this.constantPower = this.topTool.addCheckBox('Constant', false);

    // this.minPower = this.topTool.addLabelInput('Min:', 15, '%');
    // this.maxPower = this.topTool.addLabelInput('Max:', 100, '%');

    // this.minPower.isNumeric = true;
    // this.maxPower.isNumeric = true;

    // this.topTool.addSeparator();

    // this.lQuality = this.topTool.addLabel('Quality:');
    // this.qualitySelect = this.topTool.addSelect();
    // this.qualitySelect.items = ['Normal - 0.1 mm', 'Draft - 0.2 mm', 'Coarse - 0.4 mm'];
    // this.qualitySelect.itemsIndex = 0;
    // this.dpiIn = this.topTool.addLabel(DPI_IN);
    // this.dpiIn.hint = 'Source image current resolution';

    // this.interval = this.topTool.addLabelInput('Interval:', readUni(0.4), 'mm');
    // this.interval.hint = 'Line spacing emitted by laser (mm)';
    // this.interval.isNumeric = true;

    // this.dpiOut = this.topTool.addLabelInput(DPI_OUT);
    // this.dpiOut.hint = 'Resolution on laser material';

    // this.topTool.addSeparator();
    // this.overscan = this.topTool.addCheckBox('Overscan:', false);
    // this.overscanValue = this.topTool.addLabelInput('', 2.5, '%');
    // this.overscanValue.isNumeric = true;

    // this.overscan.hint = this.overscanValue.input.hint = 'Overscan distance % of speed';
    // this.overscanMargin = this.topTool.addLabel('2.5');

    // this.topTool.addSeparator();

    this.negative = this.topTool.addCheckBox('Negative', false);

    this.events();
  }

  /////////////////////////////////////////////////////////////////////

  private events() {
    this.bAddFrame.onClick = () => {
      const frame = this.addFrame();
      if (typeof this.onAddFrame === 'function') this.onAddFrame({ frame, parent: this.element });
    };

    this.dither.onChange = () => {
      this.update();
    };

    this.negative.onChanged = () => {
      this.update();
    };
  }

  /////////////////////////////////////////////////////////////////////

  private update(isChanged = true) {
    if (isChanged) {
      this._element.laserSettings.fill.lineInterval = Number(this.powerIntervalTools.interval.input.text) || 0.1;
      this._element.laserSettings.fill.linesPerInch = Number(this.powerIntervalTools.dpiOut.input.text) || 127;
      this._element.laserSettings.image.dither = this.dither.items[this.dither.itemIndex];
      this._element.laserSettings.fill.overscan = this.powerIntervalTools.overscan.checked;
      this._element.laserSettings.fill.overscanValue = Number(this.powerIntervalTools.overscanValue.input.text) || 2.5;
      this._element.laserSettings.image.negative = this.negative.checked;
      let dither = this.dither.items[this.dither.itemIndex];
      setTimeout(() => {
        if (dither === 'Dither') dither = 'FloydSteinberg';
        if (dither === 'Dither2') dither = 'FalseFloydSteinberg';
        ImagePreview(this._element);
      }, 100);
    }
    this.fillProps();
  }

  /////////////////////////////////////////////////////////////////////

  fillProps() {
    const laserSettings = this._element.laserSettings;
    // const DPIin = Math.round(this.element.width / (this.element.bounds.width / 25.4));
    // const DPIout = Math.round(1 / mmToInch(laserSettings.fill.lineInterval));

    this.powerIntervalTools.fillProps(laserSettings);

    this.dither.itemIndex = this.dither.items.indexOf(laserSettings.image.dither);
    // this.constantPower.checked = laserSettings.constantPower;

    // this.minPower.input.text = laserSettings.minPower;
    // this.maxPower.input.text = laserSettings.power;
    // this.dpiIn.text = `${DPI_IN} ${DPIin}`;
    // this.interval.input.text = laserSettings.fill.lineInterval;
    // this.dpiOut.input.text = DPIout;
    // this.overscan.checked = laserSettings.fill.overscan;
    // this.overscanValue.input.text = laserSettings.fill.overscanValue;
    this.negative.checked = laserSettings.image.negative;
    // this.setupOverscanMargin();
  }

  /////////////////////////////////////////////////////////////////////

  addFrame() {
    const rect = new CanvasRectangle(
      this.paper,
      this.element.bounds.left - 0.1,
      this.element.bounds.top - 0.1,
      this.element.bounds.width + 0.2,
      this.element.bounds.height + 0.2,
    );

    rect.element.inGroup = this.element.inGroup;

    rect.element.uid = codec64.uId('element_');
    rect.element.uname = 'Frame';
    rect.element.laserSettings = DeepCopy(DefaultLaserSettings);
    rect.element.strokeColor = 'white';

    if (!window[VECTORS]) window[VECTORS] = [];
    window[VECTORS][rect.uid] = rect.element;
    window[OBJECTS_LAYER].addChild(rect.element);
    return rect.element;
  }

  /////////////////////////////////////////////////////////////////////

  set element(element) {
    this._element = element;
    this.powerIntervalTools.element = element;

    if (this.powerIntervalTools && typeof this.powerIntervalTools.fillOptionsVisible === 'function') {
      this.powerIntervalTools.fillOptionsVisible(true);
    }
    if (this.powerIntervalTools && typeof this.powerIntervalTools.powerOptionsVisible === 'function') {
      this.powerIntervalTools.powerOptionsVisible(false);
    }

    this.update(false);
  }

  get element() {
    return this._element;
  }

  /////////////////////////////////////////////////////////////////////

  resetImage() {
    if (this.powerIntervalTools && typeof this.powerIntervalTools.fillOptionsVisible === 'function') {
      this.powerIntervalTools.fillOptionsVisible(false);
    }
    if (this.powerIntervalTools && typeof this.powerIntervalTools.powerOptionsVisible === 'function') {
      this.powerIntervalTools.powerOptionsVisible(true);
    }
    this._element = undefined;
  }

  /////////////////////////////////////////////////////////////////////

  get paper() {
    return window['paper'];
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
