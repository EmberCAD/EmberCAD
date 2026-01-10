//@ts-ignore
//@ts-nocheck

import { CURRENT_UNIT, Snapping, Unit } from '../../../components/LaserCanvas/LaserCanvas';
import { OR_HORIZONTAL } from '../../../lib/api/declare_common';
import CheckBox from '../../../lib/components/CheckBox/CheckBox';
import Container2 from '../../../lib/components/Container2/Container2';
import LabelInput from '../../../lib/components/LabelInput/LabelInput';
import { ICallback } from '../../../modules/ICallback';
import { readUni, writeUni } from '../../../modules/helpers';
import Snapper from './Snapper';

export interface IElementProperties {
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  angle?: number;
  shear?: number;
  snapping?: Snapping;
  changed?: any;
  link?: boolean;
}

export default class ElementProperties {
  props: IElementProperties;
  _unit: Unit;
  split: Container2;
  snapper: Snapper;
  proportional = true;

  onChange: ICallback<IElementProperties>;
  xProp: LabelInput;
  yProp: LabelInput;
  angleProp: LabelInput;
  wProp: LabelInput;
  hProp: LabelInput;
  shearProp: LabelInput;
  splitRight: Container2;
  splitRightRight: any;
  propCb: CheckBox;

  constructor(private parent) {
    this.init();
    this.events();
  }

  private init() {
    this.split = new Container2(this.parent);
    this.split.direction = OR_HORIZONTAL;
    this.split.parts = [80, '%'];
    this.split.leftPart.paddingTop = '0.5rem';
    this.split.leftPart.justifyContent = 'center';
    this.split.rightPart.paddingTop = '0.5rem';

    this.splitRight = new Container2(this.split.rightPart);
    this.splitRight.direction = OR_HORIZONTAL;
    this.splitRight.parts = [100, '%'];

    this.splitRightRight = new Container2(this.splitRight.rightPart);
    this.splitRightRight.direction = OR_HORIZONTAL;
    this.splitRightRight.parts = [110, '%'];

    // this.split.rightPart.paddingTop = '0.5rem';
    this.splitRight.leftPart.flexDirection = 'column';
    this.splitRightRight.leftPart.flexDirection = 'column';

    this.splitRight.leftPart.justifyContent = 'right';

    this.snapper = new Snapper(this.split.leftPart);

    ////

    this.xProp = new LabelInput(this.splitRight.leftPart);
    this.yProp = new LabelInput(this.splitRight.leftPart);
    this.angleProp = new LabelInput(this.splitRight.leftPart);
    this.wProp = new LabelInput(this.splitRightRight.leftPart);
    this.hProp = new LabelInput(this.splitRightRight.leftPart);
    this.shearProp = new LabelInput(this.splitRightRight.leftPart);
    this.shearProp.hide();

    this.xProp.label.text = 'X:';
    this.yProp.label.text = 'Y:';
    this.angleProp.label.text = 'R:';

    this.xProp.label.hint = 'X Position';
    this.yProp.label.hint = 'Y Position';
    this.angleProp.label.hint = 'Rotate';
    this.angleProp.marginTop = '1rem';

    this.wProp.label.text = 'W:';
    this.hProp.label.text = 'H:';
    this.shearProp.label.text = 'S:';
    this.wProp.label.hint = 'Width';
    this.hProp.label.hint = 'Height';
    this.shearProp.label.hint = 'Shear';
    this.shearProp.marginTop = '1rem';

    ////

    this.propCb = new CheckBox(this.splitRightRight.rightPart);
    this.propCb.left = '1rem';
    this.propCb.top = '1rem';
    this.propCb.html = '<i class="fa-solid fa-lock"></i>';
    this.propCb.hint = 'Lock ascpect ratio';
    this.clear();
  }

  ///////////////////////////////////////////////////////////////////////

  private events() {
    this.xProp.onChange = this.yProp.onChange = (opt) => {
      this.onChangeCB(opt);
    };

    this.angleProp.onChange = (opt) => {
      this.onChangeCB({ ...opt, input: 'angle' });
    };

    this.shearProp.onChange = (opt) => {
      this.onChangeCB({ ...opt, input: 'shear' });
    };

    this.wProp.onChange = (opt) => {
      this.onChangeCB({ ...opt, input: 'w' });
    };

    this.hProp.onChange = (opt) => {
      this.onChangeCB({ ...opt, input: 'h' });
    };
  }

  ///////////////////////////////////////////////////////////////////////

  private onChangeCB(opt?) {
    if (!opt) opt = {};
    if (typeof this.onChange === 'function') {
      if (opt.changed)
        this.onChange({
          x: Number(writeUni(this.xProp.input.text)),
          y: Number(writeUni(this.yProp.input.text)),
          width: Number(writeUni(this.wProp.input.text)) || 1,
          height: Number(writeUni(this.hProp.input.text)) || 1,
          angle: Number(this.angleProp.input.text),
          shear: Number(this.shearProp.input.text),
          changed: opt.input,
          link: this.propCb.checked,
        });
      if (opt.blur) {
        switch (opt.input) {
          case 'angle':
            this.angleProp.input.text = 0;
            break;

          case 'shear':
            this.shearProp.input.text = 0;
            break;
        }
      }
    }
  }

  clear() {
    this.xProp.disabled = true;
    this.yProp.disabled = true;
    this.wProp.disabled = true;
    this.hProp.disabled = true;
    this.angleProp.disabled = true;
    this.shearProp.disabled = true;

    this.xProp.input.text = '';
    this.yProp.input.text = '';
    this.wProp.input.text = '';
    this.hProp.input.text = '';
    this.angleProp.input.text = '';
    this.shearProp.input.text = '';
    this.snapper.clearAnchors();
    // this.parent.opacity = 0.5;

    this.xProp.input.input.focus();
    this.xProp.input.input.blur();
  }

  fillProps(obj: IElementProperties) {
    this.xProp.disabled = false;
    this.yProp.disabled = false;
    this.wProp.disabled = false;
    this.hProp.disabled = false;
    this.angleProp.disabled = false;
    this.shearProp.disabled = false;

    this.parent.opacity = 1;

    this.xProp.input.text = roundPoint(obj.x);
    this.yProp.input.text = roundPoint(obj.y);
    this.wProp.input.text = roundPoint(obj.width);
    this.hProp.input.text = roundPoint(obj.height);
    this.angleProp.input.text = round(obj.angle, 2);
    this.shearProp.input.text = round(obj.shear, 2);
  }

  get unit() {
    return window[CURRENT_UNIT];
  }

  get unitText() {
    return this.unit === Unit.Metric ? 'mm' : 'in';
  }
}

function roundPoint(num) {
  return readUni(num);
}

function round(num, places) {
  const div = 10 ** places;
  return Math.round(num * div) / div;
}
