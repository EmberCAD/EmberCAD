//@ts-ignore
//@ts-nocheck
import { Snapping, Unit } from '../../../components/LaserCanvas/LaserCanvas';
import { remToPixels } from '../../../lib/api/cherry/api';
import { OR_HORIZONTAL } from '../../../lib/api/declare_common';
import CheckBox from '../../../lib/components/CheckBox/CheckBox';
import Container2 from '../../../lib/components/Container2/Container2';
import LabelInput from '../../../lib/components/LabelInput/LabelInput';
import { ICallback } from '../../../modules/ICallback';

export interface IElementSettings {
  name?: string;
  speed?: number;
  power?: number;
  passes?: number;
  constantPower?: boolean;
  minPower?: number;
  output?: boolean;
  air?: boolean;
  fill?: {
    floodFill: boolean;
    bidirectional: boolean;
    overscan: boolean;
    overscanValue: number;
    crosshatch: boolean;
    rampOuterEdge: boolean;
    rampLength: number;
    lineInterval: number;
    scanAngle: number;
  };
  image?: {
    brightnes: number;
    contrast: number;
    gamma: number;
    dither: string;
    negative: boolean;
    crop: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  zoffset?: number;
  zstep?: number;
  kerfOffset?: number;
}

export default class ElementSettings {
  split: Container2;
  name: LabelInput;
  splitBottom: Container2;
  speed: LabelInput;
  passes: LabelInput;
  constantPower: CheckBox;
  powerSingle: LabelInput;
  minPower: LabelInput;
  maxPower: LabelInput;

  constructor(private parent) {
    this.init();
    this.events();
  }

  private init() {
    this.split = new Container2(this.parent);
    this.split.parts = ['0rem', '%'];
    // this.split.leftPart.paddingTop = '0.5rem';
    // this.split.leftPart.justifyContent = 'center';
    // this.split.rightPart.paddingTop = '0.5rem';

    this.splitBottom = new Container2(this.split.bottomPart);
    this.splitBottom.parts = ['2rem', '%'];

    // this.splitRightRight = new Container2(this.splitRight.rightPart);
    // this.splitRightRight.direction = OR_HORIZONTAL;
    // this.splitRightRight.parts = [100, '%'];

    this.parent.padding = '0.5rem';
    this.parent.paddingTop = '0.75rem';

    this.name = new LabelInput(this.split.topPart);
    this.name.label.text = 'Name';
    this.name.input.width = '15rem';
    this.name.numeric = false;
    this.name.display = 'none';

    this.speed = new LabelInput(this.splitBottom.topPart);
    this.speed.label.text = 'Speed';
    this.speed.marginRight = '.5rem';

    this.passes = new LabelInput(this.splitBottom.topPart);
    this.passes.label.text = 'Passes';
    this.passes.marginRight = '.5rem';

    this.constantPower = new CheckBox(this.splitBottom.bottomPart);
    this.constantPower.text = 'Constant';
    this.constantPower.marginRight = '.5rem';

    this.powerSingle = new LabelInput(this.splitBottom.bottomPart);
    this.powerSingle.label.text = 'Power';
    this.powerSingle.input.width = '3rem';
    this.powerSingle.marginRight = '.5rem';
    this.powerSingle.numeric = true;

    this.minPower = new LabelInput(this.splitBottom.bottomPart);
    this.minPower.label.text = 'Min';
    this.minPower.input.width = '3rem';
    this.minPower.marginRight = '.5rem';
    this.minPower.numeric = true;

    this.maxPower = new LabelInput(this.splitBottom.bottomPart);
    this.maxPower.label.text = 'Max';
    this.maxPower.input.width = '3rem';
    this.maxPower.marginRight = '.5rem';
    this.maxPower.numeric = true;

    this.clear();
  }

  private events() {
    this.name.onChange = (opt) => {
      this.onChangeCB({ ...opt, input: 'name' });
    };

    this.speed.onChange = (opt) => {
      this.onChangeCB({ ...opt, input: 'speed' });
      if (opt.changed) this.passes.input.input.select();
    };

    this.passes.onChange = (opt) => {
      this.onChangeCB({ ...opt, input: 'passes' });
    };

    this.constantPower.onChanged = () => {
      this.togglePowerModeVisibility();
      this.onChangeCB({ changed: true, input: 'constantPower' });
    };

    this.minPower.onChange = (opt) => {
      this.onChangeCB({ ...opt, input: 'minPower' });
      if (opt.changed) this.maxPower.input.input.select();
    };

    this.maxPower.onChange = (opt) => {
      this.onChangeCB({ ...opt, input: 'power' });
    };

    this.powerSingle.onChange = (opt) => {
      this.onChangeCB({ ...opt, input: 'power' });
    };
  }

  private onChangeCB(opt?) {
    if (!opt) opt = {};
    if (typeof this.onChange === 'function') {
      if (opt.changed) {
        const setting = {
          name: this.name.input.text,
          speed: Number(this.speed.input.text),
          constantPower: !!this.constantPower.checked,
          minPower: Number(this.minPower.input.text),
          power: Number(this.constantPower.checked ? this.powerSingle.input.text : this.maxPower.input.text),
          passes: Number(this.passes.input.text),
          changed: opt.input,
        };

        let { name, speed, constantPower, minPower, power, passes, changed } = setting;

        if (speed < 0 || speed > 100000) {
          speed = Number(this.speed.initText);
          this.speed.input.text = speed;
        }

        if (power < 0 || power > 100) {
          const fallbackPower = Number(
            this.constantPower.checked ? this.powerSingle.initText : this.maxPower.initText,
          );
          power = fallbackPower;
          if (this.constantPower.checked) this.powerSingle.input.text = power;
          else this.maxPower.input.text = power;
        }

        if (minPower < 0 || minPower > 100) {
          minPower = Number(this.minPower.initText || 0);
          this.minPower.input.text = minPower;
        }

        if (!constantPower && minPower > power) {
          minPower = power;
          this.minPower.input.text = minPower;
        }

        if (passes < 1 || passes > 1000) {
          passes = Number(this.passes.initText);
          this.passes.input.text = passes;
        }

        this.onChange({
          name,
          speed,
          constantPower,
          minPower,
          power,
          passes,
          changed,
        });
      }
    }
  }

  ///////////////////////////////////////////////////////////////////////

  clear() {
    this.parent.opacity = 0.5;

    this.speed.input.text = '';
    this.minPower.input.text = '';
    this.maxPower.input.text = '';
    this.powerSingle.input.text = '';
    this.passes.input.text = '';
    this.constantPower.checked = true;

    this.speed.disabled = true;
    this.minPower.disabled = true;
    this.maxPower.disabled = true;
    this.powerSingle.disabled = true;
    this.passes.disabled = true;
    this.constantPower.disabled = true;
    this.togglePowerModeVisibility();
  }

  ///////////////////////////////////////////////////////////////////////

  fillProps(obj: IElementSettings) {
    this.parent.opacity = 1;

    this.speed.disabled = false;
    this.minPower.disabled = false;
    this.maxPower.disabled = false;
    this.powerSingle.disabled = false;
    this.passes.disabled = false;
    this.constantPower.disabled = false;

    this.speed.input.text = obj.speed;
    this.constantPower.checked = obj.constantPower === undefined ? true : !!obj.constantPower;
    this.minPower.input.text = obj.minPower !== undefined ? obj.minPower : '';
    this.maxPower.input.text = obj.power;
    this.powerSingle.input.text = obj.power;
    this.passes.input.text = obj.passes;
    this.togglePowerModeVisibility();
  }

  setLaserControlsVisible(visible: boolean) {
    this.splitBottom.topPart.display = visible ? 'flex' : 'none';
    this.splitBottom.bottomPart.display = visible ? 'flex' : 'none';
  }

  private togglePowerModeVisibility() {
    const isConstant = !!this.constantPower.checked;
    this.powerSingle.display = isConstant ? 'flex' : 'none';
    this.minPower.display = isConstant ? 'none' : 'flex';
    this.maxPower.display = isConstant ? 'none' : 'flex';
  }
}
