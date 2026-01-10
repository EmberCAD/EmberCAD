const SPLITTER_PREFIX = 'CHSPLITTER_';
const Split = require('../Split/Split');

export default class Splitter {
  constructor(ids, options) {
    this.onDragEnd = this.saveState.bind(this);
    options.onDragEnd = this.onDragEnd;
    this.Split = Split(ids, options);

    this.initIds = ids;
    this.currIds = ids;
    this.options = options;
    this.minSizes = options.minSize;
    this.initSizes = options.sizes;
    this.numSizes = []; //options.sizes; // for each option diffrent sizes - STORE IN PREFS!
    this.combi = '';
    this.hidden = [];
    for (let i = 0; i < ids.length; i++) {
      this.hidden[i] = false;
      this.combi += 'x';
    }
    this.numSizes[this.combi] = this.initSizes;
    this.loadState();
  }

  visible(idx, op, isRestoring) {
    if (!this.initIds[idx]) return;
    let newIds = [];
    let minSize = [];
    let sizes = [];
    let options = this.options;
    let gid = this.initIds[idx];
    let combi = ''; // combinations of hidden/visible for storage
    let prevCombi = '';
    for (let i = 0; i < this.initIds.length; i++) !this.hidden[i] ? (prevCombi += 'x') : (prevCombi += 'o');

    this.hidden[idx] = !op;

    op ? (gid.style.display = 'flex') : (gid.style.display = 'none');

    for (let i = 0; i < this.initIds.length; i++)
      if (!this.hidden[i]) {
        newIds.push(this.initIds[i]);
        minSize.push(this.minSizes[i]);
        combi += 'x';
      } else combi += 'o';

    if (!isRestoring) {
      this.combi = combi;
      this.numSizes[prevCombi] = this.Split.getSizes();
      if (this.numSizes[combi] == undefined) {
        this.numSizes[combi] = [];
        for (let i = 0; i < newIds.length; i++) this.numSizes[combi].push(100 / (newIds.length || 1));
      }
    }

    for (let i = 0; i < newIds.length; i++) {
      sizes.push(Number(this.numSizes[combi][i]));
    }

    options.sizes = sizes;
    options.minSize = minSize;
    options.onDragEnd = this.onDragEnd;
    this.currIds = newIds;
    this.Split.destroy();
    this.Split = Split(newIds, options);

    if (!isRestoring) this.saveState();
  }

  saveState() {
    const sizes = this.getAllSizes();
    const splitId = this.options.splitId;
    if (splitId) {
      localStorage.setItem(SPLITTER_PREFIX + splitId, JSON.stringify({ sizes, current: this.combi }));
    }
  }

  loadState() {
    const splitId = this.options.splitId;
    const state = JSON.parse(localStorage.getItem(SPLITTER_PREFIX + splitId));
    if (state && state.current) {
      this.combi = state.combi;
      this.setAllSizes(state.sizes);
      for (let i = 0; i < state.current.length; i++) {
        if (state.current[i] === 'o') this.visible(i, 0, true);
      }
      setTimeout(() => {
        this.setSizes(this.numSizes[state.current]);
      });
    }
  }

  showGutter(num) {
    this.Split.gutterVis(true, num);
  }

  hideGutter(num) {
    this.Split.gutterVis(false, num);
  }

  getAllSizes() {
    this.numSizes[this.combi] = this.Split.getSizes();
    return Object.entries(this.numSizes);
  }

  setAllSizes(set) {
    for (let i = 0; i < set.length; i++) {
      this.numSizes[set[i][0]] = set[i][1];
    }
  }

  getSizes() {
    return this.Split.getSizes();
  }

  setSizes(sizes) {
    if (!sizes || !sizes.length) return;
    this.Split.setSizes(sizes);
  }
}
