//@ts-ignore
//@ts-nocheck

import ViewManager from '../../../lib/components/Application/ViewManager';
import Button from '../../../lib/components/Button/Button';
import Label from '../../../lib/components/Label/Label';
import View from '../../../lib/components/Application/View';
import './TopIcons.scss';

export default class TopIcons {
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

  addIconButton(html: string, hint: string) {
    const icon = new Button(this.currentView);
    icon.html = `<span class="top-icons">${html}</span>`;
    icon.hint = hint;
    icon.width = 'auto';
    icon.height = '2rem';
    icon.border = 'none';
    icon.marginRight = '0.5rem';
    icon.alignItems = 'center';

    return icon;
  }

  /////////////////////////////////////////////////////////////////////

  addSeparator() {
    const separator = new Label(this.currentView);
    separator.width = '1px';
    separator.height = '90%';
    separator.marginRight = '1rem';
    separator.marginTop = '-.1rem';
    separator.background = 'var(--cherry-background-handle)';
    return separator;
  }
}
