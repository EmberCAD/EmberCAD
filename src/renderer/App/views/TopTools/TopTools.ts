//@ts-ignore
//@ts-nocheck

import View from '../../../lib/components/Application/View';
import ViewManager from '../../../lib/components/Application/ViewManager';
import Button from '../../../lib/components/Button/Button';
import CheckBox from '../../../lib/components/CheckBox/CheckBox';
import Input from '../../../lib/components/Input/Input';
import Label from '../../../lib/components/Label/Label';
import LabelInput from '../../../lib/components/LabelInput/LabelInput';
import Panel from '../../../lib/components/Panel/Panel';
import Select from '../../../lib/components/Select/Select';

const LABEL_OPACITY = 0.6;

export default class TopTools {
  currentView: any;
  viewManager: ViewManager;
  views: any;

  /////////////////////////////////////////////////////////////////////

  constructor(private parent) {
    this.viewManager = new ViewManager();
  }

  /////////////////////////////////////////////////////////////////////

  addTool(tool: any) {
    const name = tool.viewName;
    if (!this.views) this.views = [];

    this.views[name] = new View(this.parent);
    this.views[name].paddingLeft = '1rem';
    this.views[name].paddingTop = '.5rem';

    this.currentView = this.views[name];
    tool.view = this.views[name];

    this.viewManager.addView({
      ident: name,
      view: this.views[name],
    });
  }

  /////////////////////////////////////////////////////////////////////

  showView(tool: any) {
    const name = tool.viewName;

    this.viewManager.switchTo(name);
    this.currentView = this.views[name];
  }

  /////////////////////////////////////////////////////////////////////

  addPanel() {
    const panel = new Panel(this.currentView);
    panel.marginRight = '1rem';
    panel.alignItems = 'center';
    panel.height = '90%';
    panel.opacity = 0.8;

    return panel;
  }
  /////////////////////////////////////////////////////////////////////

  addLabel(txt?: string) {
    const label = new Label(this.currentView);
    label.html = txt;
    label.marginRight = '1rem';
    label.alignItems = 'center';
    label.opacity = LABEL_OPACITY;

    return label;
  }

  /////////////////////////////////////////////////////////////////////

  addLabelInput(txt?: string, value?: string, placeHolder?: string, hint?: string) {
    const labelInput = new LabelInput(this.currentView);
    labelInput.label.text = txt;
    labelInput.label.opacity = LABEL_OPACITY;
    labelInput.input.placeholder = placeHolder;
    labelInput.input.text = value;
    if (hint) {
      labelInput.label.hint = hint;
      labelInput.input.hint = hint;
    } else {
      if (placeHolder) {
        labelInput.label.hint = placeHolder;
        labelInput.input.hint = placeHolder;
      }
    }
    labelInput.marginRight = '1rem';

    return labelInput;
  }
  /////////////////////////////////////////////////////////////////////

  addInput(value?: string, placeHolder?: string) {
    const input = new Input(this.currentView);
    input.text = value;
    input.marginRight = '1rem';
    input.width = '3rem';

    input.placeholder = placeHolder;

    return input;
  }

  /////////////////////////////////////////////////////////////////////

  addButton(txt?: string, hint?: string) {
    const button = new Button(this.currentView);
    button.text = txt;
    if (hint) button.hint = hint;
    button.width = 'auto';
    button.marginRight = '1rem';

    return button;
  }

  /////////////////////////////////////////////////////////////////////

  addIconButton(txt?: string) {}

  /////////////////////////////////////////////////////////////////////

  addCheckBox(txt?: string, checked?: boolean) {
    const checkBox = new CheckBox(this.currentView);
    if (txt) checkBox.text = txt;
    checkBox.top = '0.1rem';
    checkBox.checked = checked || false;
    checkBox.width = 'auto';

    return checkBox;
  }

  /////////////////////////////////////////////////////////////////////

  addSelect(txt?: string, checked?: boolean) {
    const select = new Select(this.currentView);
    select.width = '6rem';

    return select;
  }

  /////////////////////////////////////////////////////////////////////

  addSeparator() {
    const separator = new Label(this.currentView);
    separator.width = '1px';
    separator.height = '90%';
    separator.marginRight = '1rem';
    separator.marginTop = '-.1rem';
    separator.background = 'var(--cherry-background-handle)';
    separator.fontSize = '2rem';
    return separator;
  }
}
