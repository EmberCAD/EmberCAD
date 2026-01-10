//@ts-ignore
//@ts-nocheck
import { mmToInch, readUni } from '../../../modules/helpers';
import { DPI_IN, DPI_OUT } from './ImageTools';
export const TOOL_NAME = 'POWER_TOOL';

export default class PowerIntervalTools {
  separator2: any;
  lPower: any;
  constantPower: any;
  minPower: any;
  maxPower: any;
  separator3: any;
  dpiIn: any;
  interval: any;
  dpiOut: any;
  separator4: any;
  overscan: any;
  overscanValue: any;
  overscanMargin: any;
  separator5: any;
  negative: any;
  private _element: any;
  private _view: any;

  constructor(private topTool) {
    this.initView();
  }

  private initView() {
    this.lPower = this.topTool.addLabel('Power:');
    this.constantPower = this.topTool.addCheckBox('Constant', false);

    this.minPower = this.topTool.addLabelInput('Min:', 15, '%');
    this.maxPower = this.topTool.addLabelInput('Max:', 100, '%');

    this.minPower.isNumeric = true;
    this.maxPower.isNumeric = true;

    this.separator3 = this.topTool.addSeparator();

    this.dpiIn = this.topTool.addLabel(DPI_IN);
    this.dpiIn.hint = 'Source image current resolution';

    this.interval = this.topTool.addLabelInput('Interval:', readUni(0.4), 'mm');
    this.interval.hint = 'Line spacing emitted by laser (mm)';
    this.interval.isNumeric = true;

    this.dpiOut = this.topTool.addLabelInput(DPI_OUT);
    this.dpiOut.hint = 'Resolution on laser material';

    this.separator4 = this.topTool.addSeparator();

    this.overscan = this.topTool.addCheckBox('Overscan:', false);
    this.overscanValue = this.topTool.addLabelInput('', 2.5, '%');
    this.overscanValue.isNumeric = true;

    this.overscan.hint = this.overscanValue.input.hint = 'Overscan distance % of speed';
    this.overscanMargin = this.topTool.addLabel('2.5');

    // this.separator5 = this.topTool.addSeparator();

    // this.negative = this.topTool.addCheckBox('Negative', false);

    this.fillOptionsVisible(false);

    this.events();
  }

  /////////////////////////////////////////////////////////////////////

  fillOptionsVisible(op: boolean) {
    if (op) {
      this.separator3.show();
      this.dpiIn.show();
      this.interval.show();
      this.separator4.show();
      this.dpiOut.show();
      this.overscan.show();
      this.overscanValue.show();
      this.overscanMargin.show();
      // this.separator5.show();
      // this.negative.show();
    } else {
      this.separator3.hide();
      this.dpiIn.hide();
      this.interval.hide();
      this.separator4.hide();
      this.dpiOut.hide();
      this.overscan.hide();
      this.overscanValue.hide();
      this.overscanMargin.hide();
      // this.separator5.hide();
      // this.negative.hide();
    }
  }

  events() {
    this.constantPower.onChanged = () => {
      this.update();
    };
    this.interval.onChange = (opt) => {
      if (opt.changed) {
        const v = Number(this.interval.input.text); //writeUni(Number(this.interval.input.text));
        if (v < 0.07) this.interval.input.text = 0.07;
        if (v > 100) this.interval.input.text = 100;
        this.update();
      }
    };

    this.dpiOut.onChange = (opt) => {
      if (opt.changed) {
        let v = Number(this.dpiOut.input.text);

        if (v < 1) {
          v = 1;
          this.dpiOut.input.text = v;
        }
        if (v > 357) {
          v = 357;
          this.dpiOut.input.text = v;
        }
        this.interval.input.text = Math.round((25.4 / v) * 1e4) / 1e4;

        this.update();
      }
    };

    this.constantPower.onChanged = () => {
      this.update();
    };

    this.minPower.onChange = (opt) => {
      if (opt.changed) {
        let v = Number(this.minPower.input.text);
        let vx = Number(this.maxPower.input.text);
        if (v < 0) {
          this.minPower.input.text = v;
        }
        if (v > vx) {
          v = vx;
          this.minPower.input.text = v;
        }

        this.update();
      }
    };

    this.maxPower.onChange = (opt) => {
      if (opt.changed) {
        let v = Number(this.minPower.input.text);
        let vx = Number(this.maxPower.input.text);
        if (vx < v) {
          vx = v;
          this.maxPower.input.text = vx;
        }
        if (vx > 100) {
          vx = 100;
          this.maxPower.input.text = vx;
        }

        this.update();
        if (typeof this.onPowerChange === 'function') this.onPowerChange(vx);
      }
    };

    this.overscanValue.onChange = (opt) => {
      if (opt.changed) {
        let v = Number(this.overscanValue.input.text);

        if (v < 0) {
          this.overscanValue.input.text = 0;
        }
        if (v > 50) {
          this.overscanValue.input.text = 50;
        }
      }
      this.update();
    };

    this.overscan.onChanged = () => {
      this.update();
    };
    ////
  }

  /////////////////////////////////////////////////////////////////////

  update() {
    this._element.laserSettings.constantPower = this.constantPower.checked;
    this._element.laserSettings.minPower = Number(this.minPower.input.text);
    this._element.laserSettings.power = Number(this.maxPower.input.text);
  }

  /////////////////////////////////////////////////////////////////////

  setupOverscanMargin() {
    if (!this.element) return;
    const percent = Number(this.overscanValue.input.text) / 100;
    const speedInMMpSec = Number(this.element.laserSettings.speed);
    this.overscanMargin.text = readUni(speedInMMpSec * percent);
  }

  /////////////////////////////////////////////////////////////////////

  fillProps(laserSettings) {
    if (!this.element) return;

    const DPIin = Math.round(this.element.width / (this.element.bounds.width / 25.4)) || '---';
    const DPIout = Math.round(1 / mmToInch(laserSettings.fill.lineInterval));

    this.constantPower.checked = laserSettings.constantPower;

    this.minPower.input.text = laserSettings.minPower;
    this.maxPower.input.text = laserSettings.power;
    this.dpiIn.text = `${DPI_IN} ${DPIin}`;
    this.interval.input.text = laserSettings.fill.lineInterval;
    this.dpiOut.input.text = DPIout;
    this.overscan.checked = laserSettings.fill.overscan;
    this.overscanValue.input.text = laserSettings.fill.overscanValue;

    this.setupOverscanMargin();
  }

  set element(value) {
    this._element = value;
  }

  get element() {
    return this._element;
  }

  get viewName() {
    return TOOL_NAME;
  }

  set view(view: any) {
    this._view = view;
    this.initView();
  }
}
