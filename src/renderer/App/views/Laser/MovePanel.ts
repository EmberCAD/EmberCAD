//@ts-ignore
//@ts-nocheck

import { CURRENT_UNIT, Unit } from '../../../components/LaserCanvas/LaserCanvas';
import Button from '../../../lib/components/Button/Button';
import Panel from '../../../lib/components/Panel/Panel';

const STEPS = { 0: [1, 10, 100], 1: ['1/4', '1', '4'] };

export default class MovePanel {
  cont: Panel;
  upB: Button;
  middleP: Panel;
  homeB: Button;
  leftFFB: Button;
  leftFB: Button;
  leftB: Button;
  rightB: Button;
  rightFB: Button;
  rightFFB: Button;
  downB: Button;
  downFB: Button;
  downFFB: Button;
  private _enabled: any;
  upFB: any;
  upFFB: any;
  private _homing: any;
  constructor(private parent) {
    this.init();
    this.events();
  }

  init() {
    this.cont = new Panel(this.parent);
    this.cont.width = '100%';
    this.cont.height = 280;
    this.cont.borderBottom = '1px solid var(--cherry-background-handle)';
    this.cont.marginBottom = '1rem';
    this.cont.flexDirection = 'column';
    this.cont.alignItems = 'center';

    this.upFFB = new Button(this.cont);
    this.upFB = new Button(this.cont);
    this.upB = new Button(this.cont);

    this.upB.text = '1';
    this.upFB.text = '10';
    this.upFFB.text = '100';

    this.upB.width = '2.5rem';
    this.upFB.width = '2.5rem';
    this.upFFB.width = '2.5rem';

    this.upB.marginTop = '.5rem';
    this.upFB.marginTop = '.5rem';
    this.upFFB.marginTop = '.5rem';

    this.middleP = new Panel(this.cont);
    this.middleP.width = '100%';
    this.middleP.height = '3rem';
    this.middleP.justifyContent = 'center';
    this.middleP.alignItems = 'center';
    this.middleP.marginTop = '1rem';
    this.middleP.marginBottom = '1rem';

    this.leftFFB = new Button(this.middleP);
    this.leftFB = new Button(this.middleP);
    this.leftB = new Button(this.middleP);

    this.leftB.text = '1';
    this.leftFB.text = '10';
    this.leftFFB.text = '100';

    this.leftB.width = '2.5rem';
    this.leftFB.width = '2.5rem';
    this.leftFFB.width = '2.5rem';

    this.leftB.marginRight = '.5rem';
    this.leftFB.marginRight = '.5rem';
    this.leftFFB.marginRight = '.5rem';

    this.homeB = new Button(this.middleP);
    this.homeB.html = '<i style="font-size:1.5rem;pointer-events:none;" class="fa-solid fa-house"></i>';
    this.homeB.height = '3rem';
    this.homeB.marginLeft = '.5rem';
    this.homeB.marginRight = '.5rem';

    this.rightB = new Button(this.middleP);
    this.rightFB = new Button(this.middleP);
    this.rightFFB = new Button(this.middleP);

    this.rightB.text = '1';
    this.rightFB.text = '10';
    this.rightFFB.text = '100';

    this.rightB.width = '2.5rem';
    this.rightFB.width = '2.5rem';
    this.rightFFB.width = '2.5rem';

    this.rightB.marginLeft = '.5rem';
    this.rightFB.marginLeft = '.5rem';
    this.rightFFB.marginLeft = '.5rem';

    this.downB = new Button(this.cont);
    this.downFB = new Button(this.cont);
    this.downFFB = new Button(this.cont);

    this.downB.text = '1';
    this.downFB.text = '10';
    this.downFFB.text = '100';

    this.downB.width = '2.5rem';
    this.downFB.width = '2.5rem';
    this.downFFB.width = '2.5rem';

    this.downB.marginBottom = '.5rem';
    this.downFB.marginBottom = '.5rem';
    this.downFFB.marginBottom = '.5rem';

    this.updateUnits();
  }

  ////////////////////////////////////////////////////////////////////////////////////////////

  events() {
    this.homeB.onClick = () => {
      if (typeof this.onHome === 'function') this.onHome();
    };
    ///
    this.upB.onClick = () => {
      this.onUpCB(0);
    };
    this.upFB.onClick = () => {
      this.onUpCB(1);
    };
    this.upFFB.onClick = () => {
      this.onUpCB(2);
    };
    ///
    this.downB.onClick = () => {
      this.onDownCB(0);
    };
    this.downFB.onClick = () => {
      this.onDownCB(1);
    };
    this.downFFB.onClick = () => {
      this.onDownCB(2);
    };
    ///
    this.leftB.onClick = () => {
      this.onLeftCB(0);
    };
    this.leftFB.onClick = () => {
      this.onLeftCB(1);
    };
    this.leftFFB.onClick = () => {
      this.onLeftCB(2);
    };
    ///
    this.rightB.onClick = () => {
      this.onRightCB(0);
    };
    this.rightFB.onClick = () => {
      this.onRightCB(1);
    };
    this.rightFFB.onClick = () => {
      this.onRightCB(2);
    };
  }

  ////////////////////////////////////////////////////////////////////////////////////////////

  updateUnits() {
    const unit = Number(localStorage.getItem(CURRENT_UNIT)) || 0;

    const steps = STEPS[unit];

    this.upB.text = steps[0];
    this.upFB.text = steps[1];
    this.upFFB.text = steps[2];

    this.downB.text = steps[0];
    this.downFB.text = steps[1];
    this.downFFB.text = steps[2];

    this.leftB.text = steps[0];
    this.leftFB.text = steps[1];
    this.leftFFB.text = steps[2];

    this.rightB.text = steps[0];
    this.rightFB.text = steps[1];
    this.rightFFB.text = steps[2];
  }

  ////////////////////////////////////////////////////////////////////////////////////////////

  onUpCB(stepSize: number) {
    if (typeof this.onUp === 'function') this.onUp(stepSize);
  }
  onDownCB(stepSize: number) {
    if (typeof this.onDown === 'function') this.onDown(stepSize);
  }
  onLeftCB(stepSize: number) {
    if (typeof this.onLeft === 'function') this.onLeft(stepSize);
  }
  onRightCB(stepSize: number) {
    if (typeof this.onRight === 'function') this.onRight(stepSize);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////

  set homing(op) {
    this._homing = op;
    this.homeB.enabled = op;
  }

  get homing() {
    return this._homing;
  }

  set enabled(op) {
    this._enabled = op;
    this.homeB.enabled = op;// this.homing ? op : false;

    this.upB.enabled = op;
    this.upFB.enabled = op;
    this.upFFB.enabled = op;

    this.downB.enabled = op;
    this.downFB.enabled = op;
    this.downFFB.enabled = op;

    this.leftB.enabled = op;
    this.leftFB.enabled = op;
    this.leftFFB.enabled = op;

    this.rightB.enabled = op;
    this.rightFB.enabled = op;
    this.rightFFB.enabled = op;
  }
  get eabled() {
    return this._enabled;
  }
}
