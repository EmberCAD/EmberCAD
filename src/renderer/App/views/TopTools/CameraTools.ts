//@ts-ignore
//@ts-nocheck
import TopTools from './TopTools';

export const TOOL_NAME = 'CAMERA_TOOL';

const SELECT_CAMERA = 'Select camera';
const OPACITY = [100, 90, 75, 50, 25, 10];

export default class CameraTools {
  cameraS: any;
  activeC: any;
  opacityS: any;
  ////////////////////////////////////////////////////////////////////

  constructor(private topTool) {}

  /////////////////////////////////////////////////////////////////////

  private initView() {
    this.topTool.addLabel('Camera:');

    this.cameraS = this.topTool.addSelect();
    this.cameraS.width = '11rem';
    this.cameraS.marginRight = '0.5rem';

    this.activeC = this.topTool.addCheckBox('Active', false);
    this.activeC.marginRight = '0.5rem';
    this.activeC.enabled = false;

    this.topTool.addSeparator();

    this.topTool.addLabel('Opacity:');

    this.opacityS = this.topTool.addSelect();
    this.opacityS.marginRight = '0.5rem';
    this.opacityS.items = OPACITY;
    this.opacityS.itemIndex = 0;

    this.events();
  }

  /////////////////////////////////////////////////////////////////////

  setCameras(items) {
    if (!items.length) {
      this.cameraS.items = ['No camera found'];
      this.activeC.enabled = false;
      this.cameraS.itemIndex = 0;
      return;
    }
    this.cameraS.items = items.map((item) => item.label);
    this.activeC.enabled = true;
    if (!this.cameraS.text) {
      this.cameraS.text = SELECT_CAMERA;
      this.activeC.enabled = false;
    }
  }

  /////////////////////////////////////////////////////////////////////

  private events() {
    this.activeC.onChanged = () => {
      if (this.cameraS.itemIndex < 0) return;
      if (typeof this.onActivate === 'function') this.onActivate(this.activeC.checked);
    };

    this.cameraS.onChange = () => {
      this.activeC.enabled = true;
      this.activeC.checked = true;
      if (typeof this.onSelectCamera == 'function') this.onSelectCamera(this.cameraS.itemIndex);
    };

    this.cameraS.onClick = () => {
      if (typeof this.onSelectClick == 'function') this.onSelectClick();
    };

    this.opacityS.onChange = () => {
      if (typeof this.onSelectOpacity == 'function') this.onSelectOpacity(OPACITY[this.opacityS.itemIndex] / 100);
    };
  }

  /////////////////////////////////////////////////////////////////////

  get active() {
    return this.activeC.checked;
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
