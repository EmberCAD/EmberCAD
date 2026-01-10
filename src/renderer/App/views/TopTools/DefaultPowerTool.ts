export const TOOL_NAME = 'DEFAULT_TOOL';

export default class DefaultPowerTools {
  label: any;
  private _view: any;

  ////////////////////////////////////////////////////////////////////

  constructor(private topTool) {}

  /////////////////////////////////////////////////////////////////////

  private initView() {
    this.label = this.topTool.addLabel('No Selection');
  }

  get viewName() {
    return TOOL_NAME;
  }

  set view(view: any) {
    this._view = view;
    this.initView();
  }
}
