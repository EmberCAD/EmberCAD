//@ts-ignore
//@ts-nocheck

import { CURRENT_UNIT, Unit } from '../../../components/LaserCanvas/LaserCanvas';

export const TOOL_NAME = 'DEFAULT_TOOL';

export default class DefaultPowerTools {
  label: any;
  private _view: any;
  separator: any;
  combineB: any;
  combineXB: any;
  offsetMargin: any;
  offsetB: any;

  ////////////////////////////////////////////////////////////////////

  constructor(private topTool) {}

  /////////////////////////////////////////////////////////////////////

  private initView() {
    const unitHint = window[CURRENT_UNIT] === Unit.Metric ? 'mm' : 'in';
    this.label = this.topTool.addLabel('No Selection');

    this.separator = this.topTool.addSeparator();
    this.separator.hide();

    this.combineB = this.topTool.addButton('Outline', 'Merge all and create outline');
    this.combineB.hide();

    this.combineXB = this.topTool.addButton('Combine', 'Merge when intersect only');
    this.combineXB.hide();

    this.offsetB = this.topTool.addButton('Offset', 'Make outline around the objects with given distance');
    this.offsetB.hide();

    this.offsetMargin = this.topTool.addLabelInput('Distance:', 5, unitHint);
    this.offsetMargin.input.width = '3rem';
    this.offsetMargin.isNumeric = true;
    this.offsetMargin.hide();

    this.events();
  }

  private events() {
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

  showNoSelection() {
    this.label.show();
    this.hideTextActions();
  }

  hideNoSelection() {
    this.label.hide();
    this.hideTextActions();
  }

  showTextActions() {
    this.label.hide();
    this.separator.show();
    this.combineB.show();
    this.combineXB.show();
    this.offsetB.show();
    this.offsetMargin.show();
  }

  hideTextActions() {
    this.separator.hide();
    this.combineB.hide();
    this.combineXB.hide();
    this.offsetB.hide();
    this.offsetMargin.hide();
  }

  get viewName() {
    return TOOL_NAME;
  }

  set view(view: any) {
    this._view = view;
    this.initView();
  }
}
