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
  output?: boolean;
  air?: boolean;
  minPower?: number;
  constantPower?: boolean;
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
  power: LabelInput;
  passes: LabelInput;

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

    this.name = new LabelInput(this.split.topPart);
    this.name.label.text = 'Name';
    this.name.input.width = '15rem';
    this.name.numeric = false;
    this.name.display = 'none';

    this.speed = new LabelInput(this.splitBottom.topPart);
    this.speed.label.text = 'Speed';
    this.speed.marginRight = '.5rem';

    this.power = new LabelInput(this.splitBottom.topPart);
    this.power.label.text = 'Power';
    this.power.marginRight = '.5rem';

    this.passes = new LabelInput(this.splitBottom.topPart);
    this.passes.label.text = 'Passes';

    this.clear();
  }

  private events() {
    this.name.onChange = (opt) => {
      this.onChangeCB({ ...opt, input: 'name' });
    };

    this.speed.onChange = (opt) => {
      this.onChangeCB({ ...opt, input: 'speed' });
      if (opt.changed) this.power.input.input.select();
    };

    this.power.onChange = (opt) => {
      this.onChangeCB({ ...opt, input: 'power' });
      if (opt.changed) this.passes.input.input.select();
    };

    this.passes.onChange = (opt) => {
      this.onChangeCB({ ...opt, input: 'passes' });
    };
  }

  private onChangeCB(opt?) {
    if (!opt) opt = {};
    if (typeof this.onChange === 'function') {
      if (opt.changed) {
        const setting = {
          name: this.name.input.text,
          speed: Number(this.speed.input.text),
          power: Number(this.power.input.text),
          passes: Number(this.passes.input.text),
          changed: opt.input,
        };

        let { name, speed, power, passes, changed } = setting;

        if (speed < 0 || speed > 100000) {
          speed = Number(this.speed.initText);
          this.speed.input.text = speed;
        }

        if (power < 0 || power > 100) {
          power = Number(this.power.initText);
          this.power.input.text = power;
        }

        if (passes < 1 || passes > 1000) {
          passes = Number(this.passes.initText);
          this.passes.input.text = passes;
        }

        this.onChange({
          name,
          speed,
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
    this.power.input.text = '';
    this.passes.input.text = '';

    this.speed.disabled = true;
    this.power.disabled = true;
    this.passes.disabled = true;
  }

  ///////////////////////////////////////////////////////////////////////

  fillProps(obj: IElementSettings) {
    this.parent.opacity = 1;

    this.speed.disabled = false;
    this.power.disabled = false;
    this.passes.disabled = false;

    this.speed.input.text = obj.speed;
    this.power.input.text = obj.power;
    this.passes.input.text = obj.passes;
  }

  setLaserControlsVisible(visible: boolean) {
    this.splitBottom.topPart.display = visible ? 'flex' : 'none';
  }
}
