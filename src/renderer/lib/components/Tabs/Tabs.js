class Tabs extends Component {
  constructor(id) {
    super(id);

    this._init();
    this._events();
  }

  _init() {
    this.baseClass = 'ch-tabs ch-flex100';
    this.align = alClient;
    this.mainSplit = new Container2(this);
    this.mainSplit.parts = [30, '%'];
    this.viewManager = new ViewManager();
  }

  _events() {
    this.mainSplit.topPart.cont.addEventListener('click', (e) => {
      const index = e.target.getAttribute('index');
      if (index) {
        this.select(index);
      }
    });
  }

  render() {
    const items = this.items || [];
    this.tabs = [];
    this.viewManager.clear();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const view = new View(this.mainSplit.bottomPart);
      const tab = crDiv(
        {
          class: 'ch-tabItem',
          index: i,
        },
        this.mainSplit.topPart.cont,
      );
      tab.innerText = CHERRIES.autotranslate ? tr(item) : item;
      this.tabs[i] = { view, tab };
      this.viewManager.addView({
        ident: i,
        view: this.tabs[i].view,
      });
    }

    this.select(0);
  }

  select(tabIndex) {
    this.viewManager.switchTo(tabIndex);
    this.deselect();
    this.tabs[tabIndex].tab.setAttribute('selected', '');
  }

  deselect() {
    for (let i = 0; i < this.items.length; i++) {
      this.tabs[i].tab.removeAttribute('selected');
    }
  }

  set items(arr) {
    if (!arr) return;
    this._data.items = arr;
    this.render();
  }

  get items() {
    return this._data.items;
  }
}

module.exports = Tabs;
