import { crDiv, numberToPx } from "../../api/cherry/api";
import { isMac, isWeb, mainProcess } from "../Application/Application";
import { tr } from "../../api/cherry/langs";
import { isWindows } from "../Application/Application";

const _CH_WIN_MAXIMIZE = `
<svg width="110%"  viewBox="0 0 160 160" version="1.1" xmlns="http://www.w3.org/2000/svg" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;max-width:2rem;margin-top:0.2rem;">
    <g transform="matrix(1,0,0,1,-63.3221,-86.7622)">
        <g>
            <g transform="matrix(1.13357,0,0,1.16275,-17.6337,-25.0025)">
                <rect x="71.417" y="96.121" width="141.147" height="137.605" style="fill-opacity:0;"/>
            </g>
            <g transform="matrix(278.793,0,0,278.793,73.6239,266.953)">
                <path d="M0.156,-0.527C0.133,-0.527 0.115,-0.521 0.102,-0.508C0.089,-0.495 0.082,-0.477 0.082,-0.453L0.082,-0.277C0.082,-0.246 0.089,-0.224 0.102,-0.211C0.115,-0.198 0.133,-0.191 0.156,-0.191L0.34,-0.191C0.366,-0.191 0.385,-0.198 0.398,-0.211C0.411,-0.224 0.418,-0.246 0.418,-0.277L0.418,-0.453C0.418,-0.477 0.411,-0.495 0.398,-0.508C0.385,-0.521 0.366,-0.527 0.34,-0.527L0.156,-0.527ZM0.445,-0.262C0.445,-0.23 0.438,-0.207 0.422,-0.191C0.404,-0.173 0.379,-0.164 0.348,-0.164L0.152,-0.164C0.121,-0.164 0.096,-0.173 0.078,-0.191C0.063,-0.207 0.055,-0.23 0.055,-0.262L0.055,-0.457C0.055,-0.488 0.063,-0.512 0.078,-0.527C0.096,-0.546 0.121,-0.555 0.152,-0.555L0.348,-0.555C0.379,-0.555 0.404,-0.546 0.422,-0.527C0.438,-0.512 0.445,-0.488 0.445,-0.457L0.445,-0.262Z" style="fill:white;fill-rule:nonzero;fill-opacity:0.8;"/>
            </g>
        </g>
    </g>
</svg>
`;

const _CH_WIN_RESTORE = `
<svg width="110%" viewBox="0 0 160 160" version="1.1" xmlns="http://www.w3.org/2000/svg"  style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;max-width:2rem;margin-top:0.2rem;">
    <g transform="matrix(1,0,0,1,-236.341,-86.7622)">
        <g transform="matrix(1,0,0,1,53.1197,6.82968)">
            <g transform="matrix(1.13357,0,0,1.16275,102.265,-31.8322)">
                <rect x="71.417" y="96.121" width="141.147" height="137.605" style="fill-opacity:0;"/>
            </g>
            <g transform="matrix(1,0,0,1,-7.30498,-7.34692)">
                <g transform="matrix(241.443,0,0,241.443,203.557,261.758)">
                    <path d="M0.156,-0.527C0.133,-0.527 0.115,-0.521 0.102,-0.508C0.089,-0.495 0.082,-0.477 0.082,-0.453L0.082,-0.277C0.082,-0.246 0.089,-0.224 0.102,-0.211C0.115,-0.198 0.133,-0.191 0.156,-0.191L0.34,-0.191C0.366,-0.191 0.385,-0.198 0.398,-0.211C0.411,-0.224 0.418,-0.246 0.418,-0.277L0.418,-0.453C0.418,-0.477 0.411,-0.495 0.398,-0.508C0.385,-0.521 0.366,-0.527 0.34,-0.527L0.156,-0.527ZM0.445,-0.262C0.445,-0.23 0.438,-0.207 0.422,-0.191C0.404,-0.173 0.379,-0.164 0.348,-0.164L0.152,-0.164C0.121,-0.164 0.096,-0.173 0.078,-0.191C0.063,-0.207 0.055,-0.23 0.055,-0.262L0.055,-0.457C0.055,-0.488 0.063,-0.512 0.078,-0.527C0.096,-0.546 0.121,-0.555 0.152,-0.555L0.348,-0.555C0.379,-0.555 0.404,-0.546 0.422,-0.527C0.438,-0.512 0.445,-0.488 0.445,-0.457L0.445,-0.262Z" style="fill:white;fill-rule:nonzero;;fill-opacity:0.8;"/>
                </g>
                <path d="M230.12,132.546C230.623,126.7 232.462,122.19 235.636,119.015C240.037,114.614 246.011,112.413 253.556,112.413L300.713,112.413C308.258,112.413 314.231,114.614 318.632,119.015C322.405,122.788 324.291,128.446 324.291,135.991L324.291,183.148C324.291,190.693 322.405,196.352 318.632,200.125C315.459,203.298 311.468,205.327 306.661,206.213L306.661,199.079C309.206,198.296 311.31,197.073 312.973,195.409C316.117,192.265 317.689,186.921 317.689,179.376L317.689,136.935C317.689,131.276 316.117,126.874 312.973,123.731C309.83,120.587 305.114,119.015 298.826,119.015L254.499,119.015C248.84,119.015 244.439,120.587 241.295,123.731C239.017,126.009 237.564,128.948 236.937,132.546L230.12,132.546Z" style="fill:white;fill-rule:nonzero;;fill-opacity:0.8;"/>
            </g>
        </g>
    </g>
</svg>
`;

export default class TitleBar {
  constructor(id, mainMenu) {
    this._parent = id;
    this.mainMenu = mainMenu;
    this._init();
    this._events();
  }

  _init() {
    this.cont = crDiv(
      {
        class: "ch-titleBarCont",
      },
      this._parent
    );
    ///
    if (!isMac) {
      this.appIcon = crDiv(
        {
          class: "ch-titleBarAppIcon",
        },
        this.cont
      );
    }
    ///
    this.menubar = crDiv(
      {
        class: "ch-menuBar",
        style: !isMac ? "justify-content:left;" : "",
      },
      this.cont
    );
    ///
    this.titlebar = crDiv(
      {
        class: "ch-titleBar",
        style: !isMac ? "justify-content:left;" : "",
      },
      this.cont
    );
    ///
    this.titleApp = crDiv(
      {
        class: "ch-titleApp",
      },
      this.titlebar
    );
    ///
    if (!isMac) {
      this.winIcons = crDiv(
        {
          class: "ch-titleBarWinIcons",
        },
        this.cont
      );
      this.winMin = crDiv(
        {
          class: "ch-titleBarWinIco",
        },
        this.winIcons
      );
      this.winMax = crDiv(
        {
          class: "ch-titleBarWinIco",
        },
        this.winIcons
      );
      this.winCls = crDiv(
        {
          class: "ch-titleBarWinIcoClose",
          style: "font-size: 1.5rem; padding-top: 0.15rem",
        },
        this.winIcons
      );

      this.winMin.innerHTML = "—";
      this.winMax.innerHTML = "";
      this.winCls.innerHTML = "&times";

      // this.titlebar.style.width = 'calc(100% - 10rem)';
      this.winIcons.style.display = "flex";
    } else {
      this.titlebar.style.left = 0;
      this.titlebar.style.width = "100%";
    }

    this._data = [];
    this.height = "var(--app-title-bar-height)";
    this.visible = true;

    this.updateRestore();
  }

  _events() {
    if (!isMac) {
      this.winMin.addEventListener("click", (e) => {
        mainProcess.win.minimize();
      });
      this.winMax.addEventListener("click", (e) => {
        this.toggleWindow();
      });
      this.winCls.addEventListener("click", (e) => {
        mainProcess.win.close();
      });
    }
    this.cont.addEventListener("dblclick", (e) => {
      this.toggleWindow();
    });
  }

  toggleWindow() {
    if (isWeb) return;
    mainProcess.win.isMaximized()
      ? mainProcess.win.restore()
      : mainProcess.win.maximize();
    this.updateRestore();
  }

  updateRestore() {
    let lefty = 0;
    let leftyIcons = 0;
    let leftyMenu = 0;
    let leftyIconApp = 0;

    if (this.mainMenu) {
      this.menubar.style.display = "flex";
      this.menubar.appendChild(this.mainMenu.cont);

      this.mainMenu.modern = true;
      this.mainMenu.cont.style.width = "auto";
      this.mainMenu.cont.style.background = "none";

      this.titlebar.style.justifyContent = "center";

      if (!isMac) {
        leftyIconApp = this.appIcon.offsetWidth;
        leftyMenu = this.menubar.offsetWidth;
      }

      if (!isMac) {
        leftyIcons = this.winIcons.offsetWidth;
      }
      lefty = leftyIconApp + leftyMenu;
      this.titlebar.style.width =
        this.cont.offsetWidth - lefty - leftyIcons + "px";
    }

    if (!isMac) {
      this.titleApp.style.left =
        (window.innerWidth - this.titleApp.offsetWidth) / 2 - lefty + "px";
    }

    if (isMac) return;

    this.winMax.innerHTML = mainProcess.win.isMaximized()
      ? _CH_WIN_RESTORE
      : _CH_WIN_MAXIMIZE;
  }

  set visible(op) {
    if (op == this._data.visible) return;
    op ? this.show() : this.hide();
  }

  get visible() {
    return this._data.visible;
  }

  hide() {
    this.cont.style.display = "none";
    this._data.visible = false;
    window["CHERRIES"].menuTitleTop = 0;

    if (typeof this.onHide == "function") this.onHide();
  }

  show() {
    this.cont.style.display = null;
    this._data.visible = true;
    if (!window["CHERRIES"]) window["CHERRIES"] = {};
    window["CHERRIES"].menuTitleTop = this.cont.offsetHeight;
    if (typeof this.onShow == "function") this.onShow();
  }

  set height(v) {
    this._data.height = v;
    this.cont.style.height = numberToPx(v);
  }
  get height() {
    return this.visible ? this._data.height : 0;
  }

  set text(v) {
    this.caption = v;
  }

  get text() {
    return this.caption;
  }

  set caption(txt) {
    txt = tr(txt);
    this.titleApp.innerHTML = txt;
    this.updateRestore();
  }

  get caption() {
    return this.titleApp.innerHTML;
  }
}
