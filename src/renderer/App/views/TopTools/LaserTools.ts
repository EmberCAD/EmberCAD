//@ts-ignore
//@ts-nocheck
import { CURRENT_ORIGIN, CURRENT_UNIT, Origins, Unit } from '../../../components/LaserCanvas/LaserCanvas';
import { readUni, writeUni } from '../../../modules/helpers';
import TopTools from './TopTools';

export const TOOL_NAME = 'LASER_TOOL';
export const HOME_ON_STARTUP = 'HOME_ON_STARTUP';
export const AREA_WIDTH = 'AREA_WIDTH';
export const AREA_HEIGHT = 'AREA_HEIGHT';

const UNIT_NAMES = ['Metric (mm)', 'Imperial (in)'];
const CORNER_NAMES = ['Top Left', 'Top Right', 'Bottom Left', 'Bottom Right'];
export const SELECT_DEVICE = 'Select laser device';

export default class LaserTools {
  areaL: any;
  areaWidth: any;
  areaHeight: any;
  unitsL: any;
  homeL: any;
  homeS: any;
  autoHome: any;
  unitsS: any;
  getAreaB: any;
  selectLaserD: any;
  ////////////////////////////////////////////////////////////////////

  constructor(private topTool) {
    // this.init();
  }

  /////////////////////////////////////////////////////////////////////

  private initView() {
    this.areaL = this.topTool.addLabel('Device:');

    this.selectLaserD = this.topTool.addSelect();
    this.selectLaserD.width = '10rem';
    this.selectLaserD.marginRight = '1rem';
    this.selectLaserD.text = SELECT_DEVICE;

    this.topTool.addSeparator();

    this.areaL = this.topTool.addLabel('Work Area');
    this.areaL.marginLeft = '.5rem';

    this.areaWidth = this.topTool.addLabelInput('Width:');
    this.areaHeight = this.topTool.addLabelInput('Height:');

    this.areaWidth.isNumeric = true;
    this.areaHeight.isNumeric = true;

    this.getAreaB = this.topTool.addButton('Get from device');

    this.topTool.addSeparator();

    this.homeL = this.topTool.addLabel('Home:');
    this.homeS = this.topTool.addSelect();
    this.homeS.items = CORNER_NAMES;
    this.homeS.width = '8rem';
    this.homeS.itemIndex = 2;
    this.homeS.marginRight = '0.5rem';
    this.autoHome = this.topTool.addCheckBox('Homing', true);
    this.autoHome.marginRight = '0.5rem';

    this.topTool.addSeparator();

    this.unitsL = this.topTool.addLabel('Units:');
    this.unitsS = this.topTool.addSelect();
    this.unitsS.items = UNIT_NAMES;
    this.unitsS.width = '8rem';
    this.unitsS.itemIndex = 0;
    this.unitsS.marginRight = '0.5rem';

    this.fillProps();
    this.events();
  }

  /////////////////////////////////////////////////////////////////////

  fillProps() {
    const origin = Number(localStorage.getItem(CURRENT_ORIGIN) || undefined);
    let idx = 0;
    if (origin !== undefined) {
      if (origin === Origins.TopLeft) idx = 0;
      if (origin === Origins.TopRight) idx = 1;
      if (origin === Origins.BottomLeft) idx = 2;
      if (origin === Origins.BottomRight) idx = 3;
      this.homeS.itemIndex = idx;
    }
    ///
    const unit = Number(localStorage.getItem(CURRENT_UNIT) || undefined);
    if (unit !== undefined) {
      this.unitsS.itemIndex = unit === Unit.Metric ? 0 : 1;
    }
    ///
    let homing = localStorage.getItem(HOME_ON_STARTUP);
    if (homing === null) homing = true;
    this.autoHome.checked = JSON.parse(homing);
    ///

    this.areaWidth.input.text = readUni(Number(localStorage.getItem(AREA_WIDTH)) || readUni(350));
    this.areaHeight.input.text = readUni(Number(localStorage.getItem(AREA_HEIGHT)) || readUni(350));
  }

  /////////////////////////////////////////////////////////////////////

  private events() {
    this.homeS.onChange = () => {
      const idx = this.homeS.itemIndex;
      let origin = Origins.BottomLeft;
      if (idx === 0) origin = Origins.TopLeft;
      if (idx === 1) origin = Origins.TopRight;
      if (idx === 2) origin = Origins.BottomLeft;
      if (idx === 3) origin = Origins.BottomRight;
      if (typeof this.onSetHome === 'function') this.onSetHome(origin);
    };

    //////

    this.unitsS.onChange = () => {
      const idx = this.unitsS.itemIndex;
      localStorage.setItem(CURRENT_UNIT, idx);
      if (typeof this.onSetUnit === 'function') this.onSetUnit(idx === 0 ? Unit.Metric : Unit.Imperial);
    };

    this.areaWidth.onChange = () => {
      this.validateWorkArea(this.areaWidth.input);
      localStorage.setItem(AREA_WIDTH, writeUni(this.areaWidth.input.text));
      if (typeof this.onSetAreaSize === 'function') this.onSetAreaSize();
    };

    this.areaHeight.onChange = () => {
      this.validateWorkArea(this.areaHeight.input);
      localStorage.setItem(AREA_HEIGHT, writeUni(this.areaHeight.input.text));
      if (typeof this.onSetAreaSize === 'function') this.onSetAreaSize();
    };

    this.getAreaB.onClick = () => {
      if (typeof this.onGetWorkAreaSize === 'function') this.onGetWorkAreaSize();
    };

    this.autoHome.onChanged = () => {
      localStorage.setItem(HOME_ON_STARTUP, this.autoHome.checked);
      if (typeof this.onHomingChange === 'function') this.onHomingChange();
    };
  }

  validateWorkArea(input: any) {
    const text = input.text;
    let no = writeUni(Number(text) || 0);
    if (no < 10) no = 10;
    if (no > 2000) no = 2000;
    input.text = readUni(no);
  }

  /////////////////////////////////////////////////////////////////////

  setWorkAreaWidth(w) {
    this.areaWidth.input.text = readUni(w);
    localStorage.setItem(AREA_WIDTH, w);
    if (typeof this.onSetAreaSize === 'function') this.onSetAreaSize();
  }

  setWorkAreaHeight(h) {
    this.areaHeight.input.text = readUni(h);
    localStorage.setItem(AREA_HEIGHT, h);
    if (typeof this.onSetAreaSize === 'function') this.onSetAreaSize();
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
