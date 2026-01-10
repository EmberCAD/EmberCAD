//@ts-ignore
//@ts-nocheck
import { CURRENT_UNIT, Unit } from '../../../components/LaserCanvas/LaserCanvas';
import { readUni } from '../../../modules/helpers';
import { DPI_IN, DPI_OUT } from './ImageTools';
import TopTools from './TopTools';

export const TOOL_NAME = 'DEFAULT_TOOL';

export const SNAP_TO_GRID = 'SNAP_TO_GRID';
const OffetJoinOptions = ['miter', 'bevel', 'round'];
const OffetCapOptions = ['butt', 'round'];

export enum OffsetJoin {
  Miter,
  Bevel,
  Round,
}

export enum OffsetCap {
  Butt,
  Round,
}

export default class DefaultTools {
  label: any;
  private _view: any;
  snapC: any;
  separator: any;
  groupB: Button;
  unGroupB: any;
  combineB: any;
  combineXB: any;
  offsetMargin: any;
  offsetB: any;
  separator2: any;
  defSeparator: any;
  separator3: any;
  dpiIn: any;
  interval: any;
  dpiOut: any;
  overscan: any;
  overscanMargin: any;
  overscanValue: any;
  negative: any;
  separator4: any;
  separator5: any;
  ////////////////////////////////////////////////////////////////////

  constructor(private topTool) {}

  /////////////////////////////////////////////////////////////////////

  private initView() {
    const unitHint = window[CURRENT_UNIT] === Unit.Metric ? 'mm' : 'in';

    this.snapC = this.topTool.addCheckBox('Snap to grid', this.snapEnabled);
    this.snapC.marginRight = '0.5rem';

    this.defSeparator = this.topTool.addSeparator();
    this.defSeparator.hide();

    this.groupB = this.topTool.addButton('Group');
    this.groupB.hide();

    this.unGroupB = this.topTool.addButton('Ungroup');
    this.unGroupB.hide();

    this.separator = this.topTool.addSeparator();
    this.separator.hide();

    this.combineB = this.topTool.addButton('Outline', 'Merge all and create outline');
    this.combineB.hide();

    this.combineXB = this.topTool.addButton('Combine', 'Merge when intersect only');
    this.combineXB.hide();

    this.separator2 = this.topTool.addSeparator();
    this.separator2.hide();

    this.offsetB = this.topTool.addButton('Offset', 'Make outline around the objects with given distance');
    this.offsetB.hide();

    this.offsetMargin = this.topTool.addLabelInput('Distance:', 5, unitHint);
    this.offsetMargin.input.width = '3rem';
    this.offsetMargin.isNumeric = true;
    this.offsetMargin.hide();

    this.events();
  }

  /////////////////////////////////////////////////////////////////////

  showGroup() {
    this.defSeparator.show();
    this.groupB.show();
  }
  /////////////////////////////////////////////////////////////////////

  showUnGroup() {
    this.defSeparator.show();
    this.separator.show();
    this.separator2.show();
    this.unGroupB.show();
    this.combineB.show();
    this.combineXB.show();

    this.offsetMargin.show();
    this.offsetB.show();
  }
  /////////////////////////////////////////////////////////////////////

  hideGrouping() {
    this.defSeparator.hide();
    this.separator.hide();
    this.separator2.hide();

    this.groupB.hide();
    this.unGroupB.hide();
    this.combineB.hide();
    this.combineXB.hide();

    this.offsetMargin.hide();
    this.offsetB.hide();
  }

  /////////////////////////////////////////////////////////////////////

  private events() {
    this.snapC.onChanged = () => {
      localStorage.setItem(SNAP_TO_GRID, this.snapC.checked);
    };

    this.groupB.onClick = () => {
      if (typeof this.onGroup === 'function') this.onGroup();
    };

    this.unGroupB.onClick = () => {
      if (typeof this.onUnGroup === 'function') this.onUnGroup();
    };

    this.combineB.onClick = () => {
      if (typeof this.onCombine === 'function') this.onCombine();
    };

    this.combineXB.onClick = () => {
      if (typeof this.onCombine === 'function') this.onCombine(true);
    };

    this.offsetB.onClick = () => {
      if (typeof this.onOffset === 'function') this.onOffset({ distance: 5, cap: 'round', join: 'round' });
    };
  }

  /////////////////////////////////////////////////////////////////////

  get snapEnabled() {
    return JSON.parse(localStorage.getItem(SNAP_TO_GRID) || 'true');
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
