import LabelPanel from '../../../components/LabelPanel/LabelPanel';
import Container2 from '../../../lib/components/Container2/Container2';
import { crEl } from '../../../modules/dom';
import View from '../View';

export default class Settings extends View {
  constructor(parent) {
    super(parent, 'Control');
    this._init();
  }

  private _init() {
    // this.mainView.rightPart.width = '100%';
    // this.mainView.leftPart.hide();
    // this.workView.centerPart.background = 'black';
    // const video = crEl('video', this.workView.centerPart.cont, { class: 'control-camera' });
    // this.rightSide = new Container2(this.workView.rightPart);
    // this.rightSide.parts = ['%', 580];
    // /////////////
    // this.laserLP = new LabelPanel(this.rightSide.bottomPart);
    // this.laserLP.text = 'Laser';
    // this.laserLP.body.flexDirection = 'column';
    // this.laserLP.body.alignItems = 'center';
    // selectCamera();
  }
}
