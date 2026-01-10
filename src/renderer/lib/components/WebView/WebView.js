class WebView extends Component {
  constructor(id) {
    super(id);
    this._init();
    this._events();
    this.defaults();
  }

  _init() {
    this.customProps = [
      {
        name: 'url',
        default: '',
      },
    ];

    this.onEvents = [...this.onEvents, 'onDomReady', 'onStartLoading', 'onDidStopLoading', 'onDidFinishLoad', 'onDidFailLoad'];

    this.cont.classList.add('ch-webviewCont');
    this.cont.setAttribute('type', 'webview');

    this.webView = crEl(
      'webview',
      {
        class: this.baseClass + ' ch-flex100 ch-eventsDisabled',
        uid: this.uid,
      },
      this.cont,
    );
    /////
    this._redefineStyles({
      styles: ['backgroundColor', 'background'],
      targetElement: this.webView,
      doDelete: true,
      unitConvert: false,
    });

    /// defaults
  }

  defaults() {
    this.domReady = false;
    this.design = false;
    this.width = 1000;
    this.height = 500;
    this.background = cherryOptions.background.paper;
  }

  _events() {
    this.webView.addEventListener('dom-ready', () => {
      this.domReady = true;
      this.webView.insertCSS(`
      ::-webkit-scrollbar {
        width: ${cherryOptions.scrollBar.size};
        height: ${cherryOptions.scrollBar.size};
        background: ${cherryOptions.scrollBar.background}!important;
      }

      ::-webkit-scrollbar-track-piece:start {
        background: transparent !important;
      }

      ::-webkit-scrollbar-track-piece:end {
        background: transparent !important;
      }

      ::-webkit-scrollbar-track {
        background-color: ${cherryOptions.scrollBar.background}!important;
        border-radius: 10px;
      }

      ::-webkit-scrollbar-thumb {
        background-color: ${cherryOptions.scrollBar.handle}!important;
        border-radius: ${cherryOptions.scrollBar.borderRadius};
      }

      ::-webkit-scrollbar-corner {
        background-color: ${cherryOptions.scrollBar.background};
      }

      `);
      if (typeof this.onReady == 'function') this.onDomReady();
    });
    this.webView.addEventListener('did-start-loading', () => {
      if (typeof this.onStartLoading == 'function') this.onStartLoading();
    });
    this.webView.addEventListener('did-stop-loading', () => {
      if (typeof this.onDidStopLoading == 'function') this.onDidStopLoading();
    });
    this.webView.addEventListener('did-finish-load', () => {
      if (typeof this.onDidFinishLoad == 'function') this.onDidFinishLoad();
    });
    this.webView.addEventListener('did-fail-load', () => {
      if (typeof this.onDidFailLoad == 'function') this.onDidFailLoad();
    });
  }

  set url(url) {
    this._data.url = url;
    this.webView.src = url;
  }

  get url() {
    return this.domReady ? this.webView.getURL() || '' : '';
  }

  set design(op) {
    this.designClass = op ? ' ch-flex100 ch-eventsDisabled' : ' ch-flex100 ch-eventsEnabled';
    this.webView.className = this.baseClass + this.designClass;
    this._design = op;
  }

  get design() {
    return this._design;
  }
}

module.exports = WebView;
