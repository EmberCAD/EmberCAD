const __AppIcon = `<svg width="100%" height="100%" viewBox="0 0 428 427" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;">
<g transform="matrix(1,0,0,1,-1547.78,-67.1494)">
    <g id="color" transform="matrix(1,0,0,1,1384.33,-83.4103)">
        <g id="Layer1">
            <g transform="matrix(1,0,0,1,-958.848,-698.988)">
                <path d="M1443.64,859.548C1496.81,859.548 1539.97,902.712 1539.97,955.878L1539.97,1148.54C1539.97,1201.71 1496.81,1244.87 1443.64,1244.87L1335.42,1244.87C1314.88,1258.08 1290.43,1265.74 1264.22,1265.74C1191.41,1265.74 1132.29,1206.63 1132.29,1133.82C1132.29,1106.64 1140.53,1081.36 1154.65,1060.36L1154.65,955.878C1154.65,902.712 1197.82,859.548 1250.98,859.548L1443.64,859.548Z" style="fill:none;stroke:rgb(130,130,130);stroke-width:20px;"/>
            </g>
            <g transform="matrix(1.13304,0,0,1.13304,-127.327,-168.405)">
                <circle cx="381.89" cy="532.407" r="116.433" style="fill:none;stroke:rgb(130,130,130);stroke-width:17.65px;"/>
            </g>
            <path d="M351.237,352.711C351.237,352.711 399.128,195.198 531.835,176.871" style="fill:none;stroke:rgb(130,130,130);stroke-width:20px;"/>
        </g>
    </g>
</g>
</svg>`;

class LaunchPad {
  constructor() {
    this._iconSize = 150;
    localStorage.removeItem(__CHERRYLAUNCH__);

    this.render();
  }

  render() {
    App.form.clear();
    this.addBottomPanel();

    if (isWeb) {
      this.dirWeb();
    } else {
      this.prepareDirectory();
      this.dir();
    }
  }

  async dirWeb() {
    this.apps = JSON.parse(await loadJSON(path.join(APPROOT, 'dir.json')));
    this.showApps();
  }

  dir() {
    this.apps = JSON.parse(fs.readFileSync(path.join(APPROOT, 'dir.json')));
    this.showApps();
  }

  prepareDirectory() {
    let files = [];
    this.apps = [];
    files = fs.readdirSync(APPROOT);
    for (let i = 0; i < files.length; i++) {
      let name = files[i];
      let stat = fs.statSync(path.join(APPROOT, name));
      let isDir = stat.isDirectory() ? 1 : 0;
      if (isDir && name !== __LAUNCHPAD__ && name !== __TRASHCAN__) {
        this.apps.push(name);
      }
    }
    fs.writeFileSync(path.join(APPROOT, 'dir.json'), JSON.stringify(this.apps), 'utf8');
  }

  async showApps() {
    let platform = isWeb ? 'web' : 'desktop';
    for (let i = 0; i < this.apps.length; i++) {
      let info = await this.getAppInfo(this.apps[i]);

      try {
        if (info) info = JSON.parse(info);
      } catch (error) {
        log(error);
        info = null;
      }
      info = info || {
        application: {},
      };
      if (!info.application.hidden)
        if (
          (info.application.type && info.application.type === platform) ||
          (!isWeb && info.application.type !== 'webonly') ||
          (isWeb && info.application.type === 'webonly')
        ) {
          let appIcon = new LaunchAppIcon();
          appIcon.size = this._iconSize;
          appIcon.hint = info.application.description;
          appIcon.onMouseEnter = (e) => {
            appIcon.backgroundColor = 'var(--cherry-background-default)';
          };
          appIcon.onMouseLeave = (e) => {
            appIcon.backgroundColor = null;
          };
          appIcon.label.text = info.application.name || this.apps[i];
          appIcon.state = {
            app: this.apps[i],
          };
        }
    }

    App.form.onClick = (e) => {
      if (e.target.dataset.state) {
        localStorage.setItem(__CHERRYLAUNCH__, JSON.parse(e.target.dataset.state).app);

        location.reload();
      }
    };
  }

  getAppInfo(appname) {
    let fname = path.join(APPROOT, appname, 'info.json');
    try {
      if (isWeb) {
        return loadJSON(fname);
      } else {
        return fs.readFileSync(fname, 'utf8');
      }
    } catch (error) {
      log('No app info:', appname);
    }
  }

  addBottomPanel() {
    this.bottomPanel = new Panel();
    this.bottomPanel.align = alBottom;
    this.bottomPanel.height = '2rem';
    this.bottomPanel.color = 'var(--cherry-primary-main)';
    this.bottomPanel.backgroundColor = 'var(--cherry-background-paper)';
    App.hinter.display = this.bottomPanel;
  }

  set iconSize(v) {
    this._iconSize = v;
    this.render();
  }
}

class LaunchAppIcon extends Panel {
  constructor(id) {
    super(id);
  }

  _init() {
    this.position = 'relative';
    this.margin = 20;
    this.padding = 10;
    this.width = 200;
    this.height = 200;
    this.alignItems = 'center';
    this.flexDirection = 'column';
    this.borderRadius = 15;

    this.icon = new Panel(this);
    this.icon.borderRadius = 15;
    this.icon.padding = 5;
    this.icon.width = this.icon.height = '60%';
    this.icon.position = 'relative';
    this.icon.cont.innerHTML = __AppIcon;
    this.icon.pointerEvents = 'none';

    this.label = new Label(this);
    this.label.position = 'relative';
    this.label.textAlign = 'center';
    this.label.marginTop = 5;
    this.label.pointerEvents = 'none';
    this.label.height = 'auto';
  }

  set size(v) {
    this.width = v;
    this.height = v;
  }
}

module.exports = LaunchPad;
