//@ts-ignore
//@ts-nocheck
import View from '../View';
import LaserCanvas, {
  ELEMENTS,
  HISTORY,
  IMAGES,
  MIRROR_SCALARS,
  MouseAction,
  Origins,
  PREVIEW_OPACITY,
  Snapping,
} from '../../../components/LaserCanvas/LaserCanvas';
import OptionApp from '../../../lib/components/OptionApp/OptionApp';
import { OR_VERTICAL } from '../../../lib/api/declare_common';

import { ToolboxMode, availableTools } from '../../../components/LaserCanvas/Tools/Toolbox';
import LabelPanel from '../../../components/LabelPanel/LabelPanel';
import Container2 from '../../../lib/components/Container2/Container2';
import ContainerSized from '../../../lib/components/ContainerSized/ContainerSized';

import { TreeView, BIN, BOTTOM, ROOT } from '../../../lib/components/TreeView/TreeView';
import { SELECT } from '../../../components/LaserCanvas/Tools/Select';
import ElementProperties, { IElementProperties } from './ElementProperties';
import {
  E_KIND_CURVE,
  E_KIND_ELLIPSE,
  E_KIND_GROUP,
  E_KIND_IMAGE,
  E_KIND_RECTANGLE,
  E_KIND_TEXT,
  E_KIND_VECTOR,
} from '../../../components/LaserCanvas/CanvasElement';
import { tr } from '../../../lib/api/cherry/langs';
import { DeepCopy } from '../../../lib/api/cherry/api';
import Button from '../../../lib/components/Button/Button';
import ElementSettings, { IElementSettings } from './ElementSettings';
import History from './History';
import DesignerIcons from '../TopIcons/DesignerIcons';
import LaserTools, { AREA_HEIGHT, AREA_WIDTH } from '../TopTools/LaserTools';
import { CURRENT_MOD, MOD_LASER, MOD_WORK } from '../../App';
import { ImagePreview } from '../../../modules/GCode/ImageG';
import { applyStrokeFill, checkImageInArea, getElementColor } from '../../../modules/helpers';
import {
  DEFAULT_LAYER_ID,
  ensureLayerData,
  getDefaultLayerOrder,
  getLayerById,
  getLayerUiColor,
  getLayerId,
  isTextCarrier,
  isTextProxy,
  isTextRoot,
  isToolLayer,
  LAYER_ORDER_KEY,
  LAYER_PALETTE,
} from '../../../modules/layers';

export enum ElementLaserType {
  Unassigned = 0,
  Line,
  Fill,
  Mixed,
  Image,
}

const OUTPUT_OPACITY = 0;
const FILL_OPACITY = 0.5;

export const DefaultLaserSettings = {
  laserType: ElementLaserType.Line,
  speed: 600,
  power: 20,
  passes: 1,
  output: true,
  includeInFrame: true,
  air: true,
  constantPower: true,
  minPower: 15,
  fill: {
    floodFill: false,
    bidirectional: true,
    overscan: true,
    overscanValue: 2.5,
    crosshatch: false,
    rampOuterEdge: false,
    rampLength: 1.25,
    lineInterval: 0.2,
    linesPerInch: 100,
    scanAngle: 0,
  },
  image: {
    brightnes: 0,
    contrast: 0,
    gamma: 2.22,
    dither: 'Original',
    negative: false,
    crop: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  },
  zoffset: 0,
  zstep: 0,
  kerfOffset: 0,
  changedColumn: [],
};

const LaserType = [
  {
    icon: '<i class="fa-regular fa-circle-question"></i>',
    hint: 'Unassigned',
  },
  {
    icon: '<i class="fa-regular fa-star"></i>',
    hint: 'Line',
  },
  {
    icon: '<i class="fa-solid fa-star"></i>',
    hint: 'Fill',
  },
  {
    icon: '<i class="fa-regular fa-star-half-stroke"></i>',
    hint: 'Mixed',
  },
  {
    icon: '<i class="fa-regular fa-star-half-stroke"></i>',
    hint: 'Image',
  },
  {
    icon: '<i class="fa-solid fa-hand-holding-hand"></i>',
    hint: 'Auxialry',
  },
];

const NON_OUTPUT_OPACITY = 0.35;

const COL_FIRE = 1;
const COL_STAR = 2;
const COL_EYE = 3;
const COL_AIR = 4;
const COL_TOOL_FRAME = 0;
const COL_TOOL_EYE = 1;

export default class Work extends View {
  private canvas: any;
  width: number;
  offset: any;
  height: number;
  centerx: number;
  gridColor1: any;
  gridColor2: string;
  centery: any;
  bgColor: string;

  tools: any;
  currentTool: string;
  engravesList: TreeView;
  elEngraves: any;
  cutList: TreeView;
  elCuts: any;
  unassignedList: TreeView;
  elUnassigned: any;
  rightSide: Container2;
  propertiesLP: LabelPanel;
  rightSideTop: Container2;
  jobs: LabelPanel;
  elements: LabelPanel;
  elementsSplit: ContainerSized;
  elIcons: never[];
  elementProperties: Details;
  currentSnapping: any;
  icFoldsAll: any;
  settingsLP: any;
  elementSettings: any;
  settingsUid: undefined;
  history: any;
  defaultTopTools: any;
  imageTools: any;
  rectangleTools: any;
  textTools: any;
  private _topTools: any;
  private _topIcons: any;
  designerIcons: DesignerIcons;
  laserTools: any;
  cameraTools: any;
  private frame: any;
  camera: any;
  private _topToolsAux: //@ ts-nocheck
  any;
  defaultPowerTopTools: any;
  layerPalette: any;
  layerButtons: any = {};
  layerOrder: string[] = [];
  layerItemsMap: Record<string, any[]> = {};
  centerSplit: Container2;
  canvasHost: HTMLDivElement;
  paletteHost: HTMLDivElement;
  private _treeSyncLock = 0;

  constructor(private par: any) {
    super(par, 'Work');

    this._init();
    this._events();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private _init() {
    this.centerSplit = new Container2(this.workView.centerPart);
    this.centerSplit.parts = ['%', '3rem'];
    this.centerSplit.bottomPart.overflow = 'visible';
    this.centerSplit.topPart.overflow = 'hidden';
    this.centerSplit.topPart.cont.style.minHeight = '0';

    this.canvasHost = this.centerSplit.topPart.cont;
    this.paletteHost = this.centerSplit.bottomPart.cont;
    this.paletteHost.classList.add('ec-layer-palette-host');

    this.canvas = new LaserCanvas(this.canvasHost);
    window[ELEMENTS] = this.canvas.elements;

    this.history = new History(this.canvas);
    window[HISTORY] = this.history;

    this.tools = new OptionApp(this.mainView.leftPart, OR_VERTICAL);

    const icons = [];
    icons[ToolboxMode.Select] = '<i class="fa-solid fa-arrow-pointer"></i>';
    // icons[ToolboxMode.Pencil] = '<i class="fa-solid fa-pencil"></i>';
    icons[ToolboxMode.Rectangle] = '<i class="fa-regular fa-square-full"></i>';
    // icons[ToolboxMode.Polygon] = `<span style="color:inherit">${polygon}</span>`;
    icons[ToolboxMode.Circle] = '<i class="fa-regular fa-circle"></i>';
    // icons[ToolboxMode.Nodes] = '<i class="fa-solid fa-draw-polygon"></i>';
    // icons[ToolboxMode.Tabs] = '<i class="fa-solid fa-border-none"></i>';
    icons[ToolboxMode.Text] = '<i class="fa-solid fa-a"></i>';
    // icons[ToolboxMode.Location] = '<i class="fa-solid fa-location-dot"></i>';
    // icons[ToolboxMode.Measure] = '<i class="fa-solid fa-ruler"></i>';
    // icons[ToolboxMode.Line] = '<i class="fa-solid fa-slash"></i>';
    icons[ToolboxMode.Camera] = '<i class="fa-solid fa-video"></i>';

    const tools = [];

    Object.keys(icons).forEach((tool) => {
      tools.push({ t: tool, icon: icons[tool] });
    });

    this.tools.menuItems = tools.map((tool) => ({
      label: `<span style="font-size:1.2rem;pointer-events:none;">${tool.icon}</span>`,
      ident: tool.t,
      hint: availableTools[tool.t], //autotranslate in hinter
    }));

    this.tools.select(ToolboxMode.Select);

    //////////////////////////////////////////////////////////

    this.rightSide = new Container2(this.workView.rightPart);
    this.rightSide.parts = ['%', 150];

    this.propertiesLP = new LabelPanel(this.rightSide.bottomPart, true);
    this.propertiesLP.text = 'Element Properties';

    /////////////

    this.rightSideTop = new Container2(this.rightSide.topPart);
    this.rightSideTop.parts = ['%', 110];

    /////////////

    this.elCuts = new LabelPanel(this.rightSideTop.topPart);
    this.elCuts.text = 'Layers';

    this.icFoldsAll = new Button(this.elCuts.label);
    this.icFoldsAll.position = 'absolute';
    this.icFoldsAll.right = 10;
    this.icFoldsAll.border = 'none';
    this.icFoldsAll.width = 'auto';
    this.icFoldsAll.enabled = false;
    this.icFoldsAll.hint = 'Collapse All';
    this.icFoldsAll.html = '<i class="fa-solid fa-angles-up"></i>';

    /////////////

    this.elIcons = [];

    this.elIcons[E_KIND_RECTANGLE] = '<i class="fa-regular fa-square"></i>';
    this.elIcons[E_KIND_ELLIPSE] = '<i class="fa-regular fa-circle"></i>';
    this.elIcons[E_KIND_CURVE] = '<i class="fa-solid fa-bezier-curve"></i>';
    this.elIcons[E_KIND_VECTOR] = '<i class="fa-solid fa-vector-square"></i>';
    this.elIcons[E_KIND_IMAGE] = '<i class="fa-regular fa-image"></i>';

    /////////////

    this.cutList = new TreeView(this.elCuts.body);
    this.cutList.iconEmpty = '';
    this.cutList.captionWidthRem = 3.2;
    this.cutList.binMode = false;
    this.cutList.multiselect = true;
    this.cutList.type = ElementLaserType.Line;

    /////////////

    this.settingsLP = new LabelPanel(this.rightSideTop.bottomPart);
    this.settingsLP.text = 'Layer Settings';

    /////////////

    this.elementSettings = new ElementSettings(this.settingsLP.body);

    /////////////

    this.elementProperties = new ElementProperties(this.propertiesLP.body);
    this.initSnapper();

    /////////////
    this.initLayerState();
    this.initLayerPalette();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private _events() {
    this.handleCanvas();

    /////////

    this.handleCutList();

    /////////

    this.handleHistory();

    /////////

    this.handleProperties();

    /////////

    this.handleSettings();
    /////////

    this.handleText();
  }

  private initLayerState() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(LAYER_ORDER_KEY) || 'null');
    } catch (error) {
      saved = null;
    }
    const defaults = getDefaultLayerOrder();
    if (!Array.isArray(saved) || !saved.length) {
      this.layerOrder = defaults;
    } else {
      const valid = saved.filter((id) => getLayerById(id));
      const missing = defaults.filter((id) => !valid.includes(id));
      this.layerOrder = [...valid, ...missing];
    }
    window[LAYER_ORDER_KEY] = this.layerOrder.slice();
    if (!this.canvas.objectsLayer.data) this.canvas.objectsLayer.data = {};
    if (Array.isArray(this.canvas.objectsLayer.data.layerOrder) && this.canvas.objectsLayer.data.layerOrder.length) {
      this.layerOrder = this.canvas.objectsLayer.data.layerOrder.slice();
    }
    const def = getLayerById(DEFAULT_LAYER_ID);
    this.canvas.setActiveLayer(def.id, def.color);
  }

  private saveLayerOrder() {
    window[LAYER_ORDER_KEY] = this.layerOrder.slice();
    localStorage.setItem(LAYER_ORDER_KEY, JSON.stringify(this.layerOrder));
    if (!this.canvas.objectsLayer.data) this.canvas.objectsLayer.data = {};
    this.canvas.objectsLayer.data.layerOrder = this.layerOrder.slice();
  }

  private getLayerToolsMap() {
    if (!this.canvas.objectsLayer.data) this.canvas.objectsLayer.data = {};
    if (!this.canvas.objectsLayer.data.layerTools) this.canvas.objectsLayer.data.layerTools = {};
    return this.canvas.objectsLayer.data.layerTools;
  }

  private createLayerTool(layerId: string) {
    const base = DeepCopy(DefaultLaserSettings);
    if (isToolLayer(layerId)) {
      base.output = false;
      base.includeInFrame = true;
    }
    base.visible = true;
    return base;
  }

  private getLayerTool(layerId: string) {
    const tools = this.getLayerToolsMap();
    if (!tools[layerId]) tools[layerId] = this.createLayerTool(layerId);
    const layerTool = tools[layerId];
    if (layerTool.output === undefined) layerTool.output = !isToolLayer(layerId);
    if (layerTool.includeInFrame === undefined) layerTool.includeInFrame = true;
    if (layerTool.visible === undefined) layerTool.visible = true;
    if (layerTool.air === undefined) layerTool.air = true;
    if (layerTool.laserType === undefined) layerTool.laserType = ElementLaserType.Line;
    if (layerTool.speed === undefined) layerTool.speed = DefaultLaserSettings.speed;
    if (layerTool.constantPower === undefined) layerTool.constantPower = !!DefaultLaserSettings.constantPower;
    if (layerTool.minPower === undefined) layerTool.minPower = DefaultLaserSettings.minPower;
    if (layerTool.power === undefined) layerTool.power = DefaultLaserSettings.power;
    if (layerTool.passes === undefined) layerTool.passes = DefaultLaserSettings.passes;
    if (isToolLayer(layerId)) layerTool.output = false;
    return layerTool;
  }

  private applyLayerToolToItems(layerId: string, items: any[]) {
    const layerTool = this.getLayerTool(layerId);
    const seen = {};
    const applyOne = (item: any) => {
      if (!item || !item.uid || seen[item.uid]) return;
      seen[item.uid] = true;
      if (!item.laserSettings) item.laserSettings = DeepCopy(DefaultLaserSettings);
      if (getLayerId(item) === layerId) {
        const textCarrier = isTextCarrier(item);
        item.laserSettings.speed = layerTool.speed;
        item.laserSettings.constantPower = !!layerTool.constantPower;
        item.laserSettings.minPower = layerTool.minPower;
        item.laserSettings.power = layerTool.power;
        item.laserSettings.passes = layerTool.passes;
        item.laserSettings.air = layerTool.air;
        item.laserSettings.laserType = layerTool.laserType;
        item.laserSettings.output = textCarrier ? false : isToolLayer(layerId) ? false : !!layerTool.output;
        item.laserSettings.includeInFrame = textCarrier ? false : !!layerTool.includeInFrame;
        item.visible = textCarrier ? false : !!layerTool.visible;
        this.applyVisualStyle(item);
        item.opacity = this.getElementOpacity(item);
      }
      const children = item.children || [];
      for (let j = 0; j < children.length; j++) applyOne(children[j]);
    };
    for (let i = 0; i < items.length; i++) applyOne(items[i]);
  }

  private initLayerPalette() {
    const parent = this.paletteHost;
    if (!parent) return;
    parent.innerHTML = '';
    parent.style.position = 'relative';
    this.layerPalette = document.createElement('div');
    this.layerPalette.className = 'ec-layer-palette';
    this.layerPalette.style.position = 'absolute';
    this.layerPalette.style.left = '0';
    this.layerPalette.style.right = '0';
    this.layerPalette.style.top = '50%';
    this.layerPalette.style.transform = 'translateY(-50%)';
    this.layerPalette.style.padding = '0 0.35rem';
    parent.appendChild(this.layerPalette);

    this.layerButtons = {};
    for (let i = 0; i < LAYER_PALETTE.length; i++) {
      const layer = LAYER_PALETTE[i];
      const btn = document.createElement('button');
      btn.className = 'ec-layer-btn';
      btn.type = 'button';
      const uiColor = getLayerUiColor(layer.id, layer.color);
      btn.style.background = uiColor;
      if (uiColor === '#ffffff') btn.style.color = '#000000';
      btn.textContent = layer.id;
      btn.title = `Layer ${layer.id}`;
      btn.onclick = () => {
        this.canvas.setActiveLayer(layer.id, layer.color);
        const selected = this.canvas.toolbox.select.selectedItems || [];
        if (selected.length) {
          this.assignSelectionToLayer(layer.id, layer.color);
          this.history.commit('Assign layer');
        } else {
          this.refreshPaletteSelection();
        }
      };
      this.layerPalette.appendChild(btn);
      this.layerButtons[layer.id] = btn;
    }
    this.refreshPaletteSelection();
  }

  private assignSelectionToLayer(layerId: string, layerColor: string, selectedUids?: string[]) {
    const targets = [];
    if (selectedUids && selectedUids.length) {
      for (let i = 0; i < selectedUids.length; i++) {
        const uid = selectedUids[i];
        const item = this.canvas.elements[uid];
        if (item) targets.push(item);
      }
    } else {
      const selected = this.canvas.toolbox.select.selectedItems || [];
      for (let i = 0; i < selected.length; i++) targets.push(selected[i]);
    }

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      this.canvas.applyLayerToElement(target, layerId, layerColor, true);
      const linkedCarrierUid = target?.data?.carrierUid;
      const linkedProxyUid = target?.data?.proxyUid;
      const linkedRootUid = target?.data?.textRootUid;
      if (linkedCarrierUid && this.canvas.elements[linkedCarrierUid]) {
        this.canvas.applyLayerToElement(this.canvas.elements[linkedCarrierUid], layerId, layerColor, false);
      }
      if (linkedProxyUid && this.canvas.elements[linkedProxyUid]) {
        this.canvas.applyLayerToElement(this.canvas.elements[linkedProxyUid], layerId, layerColor, false);
      }
      if (linkedRootUid && this.canvas.elements[linkedRootUid]) {
        this.canvas.applyLayerToElement(this.canvas.elements[linkedRootUid], layerId, layerColor, true);
      }
      this.applyLayerToolToItems(layerId, this.collectLayerToolTargets(target));
    }
    this.updateLists();
    this.handleOnSelect(false);
    this.refreshPaletteSelection();
    this.canvas.isPreviewChanged = true;
  }

  private handleText() {
    this.canvas.onStartEdit = () => {
      this._topTools.showView(this.textTools);
    };

    this.canvas.onEndEditText = (el, replace = false) => {
      this.canvas.paper.activate();
      const textLayerId = (el && el.data && el.data.layerId) || this.canvas.currentLayerId || DEFAULT_LAYER_ID;
      const textLayer = getLayerById(textLayerId);
      this.canvas.applyLayerToElement(el, textLayer.id, textLayer.color, true);
      this.applyLayerToolToItems(textLayer.id, this.collectLayerToolTargets(el));
      const placement = this.canvas.getTextPlacementForCommit(el);
      if (placement.useOriginalPosition) {
        el.position = placement.position;
      } else {
        el.pivot = placement.pivot;
        el.position = placement.position;
      }
      this.updateLists();

      if (Number(this.tools.currentSelection) === ToolboxMode.Text) {
        this.tools.select(ToolboxMode.Select);
      }
      this.canvas.editor.textTools.resetText();
      this.canvas.editor.element = undefined;

      this.canvas.toolbox.select.select(el);
      this.canvas.toolbox.select.updateSelection(true);
      this.canvas.isPreviewChanged = true;
      this.history.commit('Edit text');
    };
  }

  private collectLayerToolTargets(root: any) {
    const result = [];
    const seen = {};
    const collect = (item) => {
      if (!item) return;
      if (item.uid && seen[item.uid]) return;
      if (item.uid) seen[item.uid] = true;
      if (item.laserSettings) result.push(item);
      const linkedCarrierUid = item?.data?.carrierUid;
      const linkedProxyUid = item?.data?.proxyUid;
      const linkedRootUid = item?.data?.textRootUid;
      if (linkedCarrierUid && this.canvas.elements[linkedCarrierUid]) collect(this.canvas.elements[linkedCarrierUid]);
      if (linkedProxyUid && this.canvas.elements[linkedProxyUid]) collect(this.canvas.elements[linkedProxyUid]);
      if (linkedRootUid && this.canvas.elements[linkedRootUid]) collect(this.canvas.elements[linkedRootUid]);
      const children = item.children || [];
      for (let i = 0; i < children.length; i++) collect(children[i]);
    };
    collect(root);
    return result;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private handleHistory() {
    this.history.onApply = ({ selection }) => {
      const items = (selection || [])
        .map((uid) => this.canvas.elements[uid])
        .filter((item) => item);

      this.updateLists();
      this.selectElements(items);
    };

    this.history.commit('Initial state');
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private handleCanvas() {
    this.tools.onClick = (tool) => {
      if (this.canvas.editor.visible) this.canvas.editor.endEdit(true);
      this.setTool(tool);
    };

    //////
    this.canvas.onSelect = () => {
      this.handleOnSelect();
    };

    this.canvas.onRemove = () => {
      this.updateLists();
      this.history.commit('Remove elements');
    };

    this.canvas.onDuplicate = (uids) => {
      this.canvas.isPreviewChanged = true;

      this.handleUnselectAll();
      this.updateLists();
      if (uids && uids.length) {
        for (let i = 0; i < uids.length; i++) {
          this.canvas.toolbox.select.select(uids[i]);
        }
      }
      this.handleOnSelect();
      this.history.commit('Duplicate elements');
    };

    this.canvas.onElementCreated = (elements) => {
      this.updateLists();

      this.history.commit('Create elements');
    };

    this.canvas.onElementDropped = (elements) => {
      this.updateLists();

      this.tools.select(ToolboxMode.Select);
      this.history.commit('Drop elements');
    };

    this.canvas.onMouseMove = (element) => {
      const selectedItems = this.canvas.toolbox.select.selectedItems;
      if (!selectedItems || !selectedItems.length) return;
      if (this.canvas.mouseDown) {
        this.fillProps();
      }
    };

    this.canvas.onEndAction = (action) => {
      if (!this.canvas.toolbox.select.selectedItems.length) return;
      this.canvas.isPreviewChanged = true;

      this.fillProps();

      if (action === MouseAction.MovingObject || action === MouseAction.Rotation || action === MouseAction.Scaling) {
        this.history.commit('Transform elements');
      }
    };

    ////
    this.icFoldsAll.onClick = () => {
      this.cutList.foldAll();
    };

    ////
    this.canvas.toolbox.select.onGroup = (group) => {
      this.canvas.isPreviewChanged = true;

      const uid = group.uid;

      this.handleUnselectAll();

      this.updateLists();
      this.canvas.toolbox.select.select(group);
      this.handleOnSelect();

      this.updateColumns(uid);
      this.history.commit('Group elements');
    };

    this.canvas.toolbox.select.onUngroup = (ungroup) => {
      this.canvas.isPreviewChanged = true;

      this.handleUnselectAll();
      this.updateLists();
      if (ungroup && ungroup.length) {
        for (let i = 0; i < ungroup.length; i++) {
          this.canvas.toolbox.select.select(ungroup[i]);
        }
      }
      this.handleOnSelect();
      this.history.commit('Ungroup elements');
    };

    this.canvas.toolbox.select.onAltSelect = () => {
      this.cutList.unfoldAll();
      this.handleOnSelect();
    };

    this.canvas.onUnselectAll = () => {
      this.runWithTreeSyncLock(() => this.cutList.unselectAll());

      this.clearProps();
      this.updateTopTools([]);
    };

    this.canvas.onEndEdit = (el) => {
      const mx = this.canvas.mirrorScalars.x;
      const my = this.canvas.mirrorScalars.y;
      el.scaling = [mx, my];
      this.updateLists();
      this.handleUnselectAll();
      this.canvas.toolbox.select.select(el);
      this.canvas.toolbox.select.updateSelection(true);
      this.canvas.isPreviewChanged = true;
      this.history.commit('Edit text');
    };
  }

  private setTool(tool: any) {
    tool = Number(tool);
    this.currentTool = tool;
    this.canvas.setTool(tool);
    this.updateTopTools();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private handleCutList() {
    this.cutList.onSelect = (selected) => {
      if (this.isTreeSyncLocked()) return;
      this.runWithTreeSyncLock(() => {
        this.selectElements(selected || []);
      });
      this.handleOnSelect();
    };

    this.cutList.onColumnClick = (column) => {
      this.canvas.isPreviewChanged = true;
      this.toggleColumn(column.uid, column.i);
    };

    this.cutList.onDropped = (el) => {
      this.canvas.isPreviewChanged = true;
      const sources = this.cutList.selected;
      const target = el.target;
      const cover = el.cover;
      if (!target) return;
      const targetUid = target.uid;

      if (target.type === BIN) {
        const sourceBins = sources.filter((uid) => this.cutList.items[uid] && this.cutList.items[uid].type === BIN);
        if (sourceBins.length) {
          const localOrder = this.layerOrder.slice();
          const moved = sourceBins.filter((uid) => localOrder.includes(uid));
          const keep = localOrder.filter((uid) => !moved.includes(uid));
          let targetIndex = keep.indexOf(targetUid);
          if (targetIndex < 0) targetIndex = keep.length;
          if (cover === BOTTOM) targetIndex++;
          targetIndex = Math.max(0, Math.min(targetIndex, keep.length));
          keep.splice(targetIndex, 0, ...moved);
          this.layerOrder = keep;
          this.saveLayerOrder();
        }
      }

      this.updateLists();
      this.history.commit('Reorder elements');
    };

    ////////////////////////////////////////////
    this.cutList.onDblClicked = (e) => {
      this.settingsUid = undefined;

      const uid = e.state.uid;

      this.settingsUid = uid;

      const laserSettings = this.getLayerTool(uid);
      const name = `Layer ${uid}`;
      this.elementSettings.fillProps({ ...laserSettings, name });
      this.elementSettings.setLaserControlsVisible(!isToolLayer(uid));

      this.selectElements([{ uid, type: BIN, layerId: uid }]);
      if (!isToolLayer(uid)) this.elementSettings.speed.input.input.select();
    };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private handleSettings() {
    this.elementSettings.onChange = (sets) => {
      if (sets.changed === 'name') return;
      const selectedLayerIds = this.getSelectedLayerIds();
      let targetLayerIds = selectedLayerIds;
      if (this.settingsUid && !selectedLayerIds.includes(this.settingsUid)) {
        targetLayerIds = [this.settingsUid];
      }
      if (!targetLayerIds.length) return;

      const savedIndex = this.cutList.scrollBar.value;
      const selectedItems = (this.canvas.toolbox.select.selectedItems || []).slice();

      for (let i = 0; i < targetLayerIds.length; i++) {
        const layerId = targetLayerIds[i];
        if (isToolLayer(layerId)) continue;
        const layerTool = this.getLayerTool(layerId);
        const layerItems = this.getItemsForLayer(layerId);
        const { power, speed, passes, minPower, constantPower } = sets;
        if (sets.changed === 'power') layerTool.power = power;
        if (sets.changed === 'speed') layerTool.speed = speed;
        if (sets.changed === 'passes') layerTool.passes = passes;
        if (sets.changed === 'minPower') layerTool.minPower = minPower;
        if (sets.changed === 'constantPower') layerTool.constantPower = !!constantPower;
        this.applyLayerToolToItems(layerId, layerItems);
      }
      this.canvas.isPreviewChanged = true;
      this.updateLists();
      this.cutList.scrollBar.value = savedIndex;
      this.canvas.toolbox.select.unselectAll();
      for (let i = 0; i < selectedItems.length; i++) {
        const selected = selectedItems[i];
        const item = selected && selected.uid ? this.canvas.elements[selected.uid] : null;
        if (!item) continue;
        item.sel = false;
        this.canvas.toolbox.select.select(item);
      }
      this.canvas.toolbox.select.updateSelection();
      this.handleOnSelect(false);
      this.cutList.updateTree(false);

      this.history.commit('Update element settings');
    };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private handleProperties() {
    this.elementProperties.snapper.onChange = (snap: Snapping) => {
      this.canvas.snapping = snap;
      this.currentSnapping = snap;
      this.fillProps();
    };

    this.elementProperties.onChange = (props: IElementProperties) => {
      const scalar = window[MIRROR_SCALARS].x * window[MIRROR_SCALARS].y;

      props.angle = (360 - ((scalar * props.angle) % 360)) % 360;

      this.canvas.updateElementProperties(props);
      this.canvas.toolbox.select.updateSelection();
      this.handleOnSelect();
      this.fillProps();
      this.history.commit('Update element properties');
    };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  undo() {
    this.history.undo();
  }

  redo() {
    this.history.redo();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private selectElements(selected: any) {
    this.canvas.toolbox.select.unselectAll();

    this.clearProps();

    if (selected.length) this.initSnapper();

    for (let i = 0; i < selected.length; i++) {
      const el = selected[i];

      if (el && el.uid && el.type === BIN && (el.layerId || this.cutList.items?.[el.uid]?.layerId)) {
        const layerId = el.layerId || this.cutList.items[el.uid].layerId;
        if (!layerId) continue;
        const layerItems = this.getItemsForLayer(layerId);
        for (let j = 0; j < layerItems.length; j++) {
          const item = layerItems[j];
          if (!item || !item.uid) continue;
          if (item.kind === E_KIND_IMAGE && checkImageInArea(item)) {
            ImagePreview(item);
          }
          item.sel = false;
          this.canvas.toolbox.select.select(item);
        }
        continue;
      }

      if (el && el.uid && el.type !== BIN) {
        if (el.kind === E_KIND_IMAGE) {
          if (checkImageInArea(el)) {
            ImagePreview(el);
          }
        }
        const target = this.canvas.elements[el.uid];
        if (!target) continue;
        target.sel = false;
        this.canvas.toolbox.select.select(target);
      }
    }

    this.handleOnSelect();
    this.canvas.toolbox.select.updateSelection();

    // if (selected.length === 1) {
    //   this.textTools.element = this.canvas.toolbox.select.selectedItems[0];
    //   this.fillProps(true);
    // }
  }

  private clearProps() {
    this.elementProperties.clear();
    this.elementSettings.clear();
    this.elementSettings.setLaserControlsVisible(true);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private updateColumns(uid) {
    this.updateLists();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private async toggleColumn(uid, column, commitHistory = true) {
    const targetLayerIds = this.getTargetLayerIdsForUid(uid);
    if (!targetLayerIds.length) return;
    let hasChanges = false;

    for (let i = 0; i < targetLayerIds.length; i++) {
      const layerId = targetLayerIds[i];
      const items = this.getItemsForLayer(layerId);
      const layerTool = this.getLayerTool(layerId);
      if (isToolLayer(layerId)) {
        if (column === COL_TOOL_FRAME) {
          layerTool.includeInFrame = !layerTool.includeInFrame;
          hasChanges = true;
        } else if (column === COL_TOOL_EYE) {
          layerTool.visible = !layerTool.visible;
          hasChanges = true;
        }
      } else {
        if (column === COL_FIRE) {
          layerTool.output = !layerTool.output;
          hasChanges = true;
        } else if (column === COL_STAR) {
          let type = (layerTool.laserType || ElementLaserType.Line) + 1;
          if (type > ElementLaserType.Fill) type = ElementLaserType.Line;
          layerTool.laserType = type;
          hasChanges = true;
        } else if (column === COL_EYE) {
          layerTool.visible = !layerTool.visible;
          hasChanges = true;
        } else if (column === COL_AIR) {
          layerTool.air = !layerTool.air;
          hasChanges = true;
        }
      }
      if (items.length) this.applyLayerToolToItems(layerId, items);
    }

    if (!hasChanges) return;
    this.canvas.isPreviewChanged = true;
    this.updateLists();
    this.handleOnSelect(false);
    if (commitHistory) this.history.commit('Update laser settings');
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  handleSelectAll() {
    this.cutList.selectAll();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  handleUnselectAll() {
    this.runWithTreeSyncLock(() => this.cutList.unselectAll());
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private handleOnSelect(scrollToSelection = true) {
    if (this.isTreeSyncLocked()) return;

    this.clearProps();

    const selectedItems = this.canvas.toolbox.select.selectedItems;
    if (!selectedItems || !selectedItems.length) {
      this.elementSettings.setLaserControlsVisible(true);
      this.syncTreeSelection([], false);
      this.updateTopTools(selectedItems);
      return;
    }

    this.initSnapper();
    const selectedLayerIds = this.getLayerIdsFromItems(selectedItems);
    this.syncTreeSelection(selectedLayerIds, scrollToSelection);
    const layerId = getLayerId(selectedItems[0]);
    const layer = getLayerById(layerId);
    this.canvas.setActiveLayer(layer.id, layer.color);
    this.refreshPaletteSelection();
    this.fillProps(true);
    this.elementSettings.setLaserControlsVisible(!isToolLayer(layerId));
  }

  private runWithTreeSyncLock(handler: () => void) {
    this._treeSyncLock++;
    try {
      handler();
    } finally {
      this._treeSyncLock = Math.max(0, this._treeSyncLock - 1);
    }
  }

  private isTreeSyncLocked() {
    return this._treeSyncLock > 0;
  }

  private syncTreeSelection(selectedLayerIds: string[], scrollToSelection = true) {
    if (!this.cutList || !this.cutList.items) return;
    this.runWithTreeSyncLock(() => {
      this.cutList.clearSelection(ROOT, true);
      const seen = {};
      for (let i = 0; i < selectedLayerIds.length; i++) {
        const layerId = selectedLayerIds[i];
        if (!layerId || seen[layerId]) continue;
        seen[layerId] = true;
        if (!this.cutList.items[layerId]) continue;
        this.cutList.addSelection(layerId);
      }
      this.cutList.updateTree(false);
      if (scrollToSelection) this.cutList.updateSelection();
    });
  }

  private getLayerIdsFromItems(items: any[]) {
    const layerIds = [];
    const seen = {};
    for (let i = 0; i < (items || []).length; i++) {
      const item = items[i];
      if (!item) continue;
      const layerId = getLayerId(item);
      if (!layerId || seen[layerId]) continue;
      seen[layerId] = true;
      layerIds.push(layerId);
    }
    return layerIds;
  }

  private getSelectedLayerIds() {
    const selected = this.cutList.selected || [];
    const layerIds = [];
    const seen = {};
    for (let i = 0; i < selected.length; i++) {
      const uid = selected[i];
      const item = this.cutList.items[uid];
      if (!item || !item.layerId) continue;
      if (seen[item.layerId]) continue;
      seen[item.layerId] = true;
      layerIds.push(item.layerId);
    }
    return layerIds;
  }

  private getItemsForLayer(layerId: string) {
    const items = this.layerItemsMap[layerId];
    if (Array.isArray(items)) return items;
    const fallback = [];
    const elements = this.canvas.elements || {};
    const uids = Object.keys(elements);
    for (let i = 0; i < uids.length; i++) {
      const item = elements[uids[i]];
      if (!item || !item.uid || item.uid === SELECT) continue;
      if (isTextProxy(item) || isTextCarrier(item)) continue;
      if (!this.isLayerTargetItem(item)) continue;
      if (getLayerId(item) === layerId) fallback.push(item);
    }
    return fallback;
  }

  private getTargetLayerIdsForUid(uid: string) {
    const selectedLayerIds = this.getSelectedLayerIds();
    if (selectedLayerIds.includes(uid)) return selectedLayerIds;
    const treeItem = this.cutList.items[uid];
    if (treeItem && treeItem.layerId) return [treeItem.layerId];
    const layer = getLayerById(uid);
    if (layer && layer.id === uid) return [uid];
    return [];
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  updateTopTools(selectedItems = []) {
    if (this.canvas.editor.visible) return;
    const mod = window[CURRENT_MOD];

    if (this.canvas.toolbox.tool === ToolboxMode.Camera) {
      if (this.camera.cameraTools.active) this.camera.play();
    } else {
      this.camera.pause();
    }

    if (mod === MOD_LASER) {
      setTimeout(() => {
        if (this.canvas.toolbox.tool === ToolboxMode.Device) {
          this._topTools.showView(this.laserTools);
        }

        if (this.canvas.toolbox.tool === ToolboxMode.Location) {
          this._topTools.showView(this.defaultTopTools);
          this._topToolsAux.showView(this.defaultPowerTopTools);
        }

        if (this.canvas.toolbox.tool === ToolboxMode.Camera) {
          this._topTools.showView(this.cameraTools);
        }
      });
      return;
    }
    this.imageTools.resetImage();

    this._topTools.showView(this.defaultTopTools);
    this._topToolsAux.showView(this.defaultPowerTopTools);
    if (selectedItems.length) this.defaultPowerTopTools.hideNoSelection();
    else this.defaultPowerTopTools.showNoSelection();

    this.defaultTopTools.hideGrouping();
    this.designerIcons.hideExtraTools();
    if (selectedItems.length >= 1) {
      this.designerIcons.showExtraTools();
    }

    if (this.canvas.toolbox.tool === ToolboxMode.Camera) {
      this._topTools.showView(this.cameraTools);
    }

    if (selectedItems.length === 1) {
      const selectedItem = selectedItems[0];
      const textSelected = this.canvas.resolveTextSelection ? this.canvas.resolveTextSelection(selectedItem) : null;
      if (selectedItem.kind === E_KIND_RECTANGLE) {
        this._topTools.showView(this.rectangleTools);
        this.rectangleTools.element = selectedItem;
      }
      if (selectedItem.kind === E_KIND_IMAGE) {
        this._topTools.showView(this.imageTools);
        if (this.imageTools?.powerIntervalTools) {
          this._topToolsAux.showView(this.imageTools.powerIntervalTools);
        }
        this.imageTools.element = selectedItem;
      }
      if (selectedItem.kind === E_KIND_TEXT || textSelected) {
        const textItem = textSelected || selectedItem;
        this._topTools.showView(this.textTools);
        this.textTools.element = textItem;
        this.defaultPowerTopTools.showTextActions();
        return;
      }
      if (selectedItem.userGroup) {
        this.defaultTopTools.showUnGroup();
      }
    }
    if (selectedItems.length > 1) {
      this.defaultTopTools.showGroup();
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  fillProps(isMousedown = false) {
    const selectedItems = this.canvas.toolbox.select.selectedItems;

    if (!selectedItems || !selectedItems.length) {
      if (isMousedown) this.updateTopTools(selectedItems);
      return;
    }
    const bounds = this.canvas.currentSelectionBounds;

    const props: IElementProperties = {
      width: bounds.width,
      height: bounds.height,
    };

    switch (this.canvas.currentSnapping) {
      case Snapping.N:
        props.x = bounds.center.x;
        props.y = bounds.topCenter.y;
        break;

      case Snapping.NE:
        props.x = bounds.right;
        props.y = bounds.topCenter.y;
        break;

      case Snapping.E:
        props.x = bounds.right;
        props.y = bounds.center.y;
        break;

      case Snapping.SE:
        props.x = bounds.right;
        props.y = bounds.bottomCenter.y;
        break;

      case Snapping.S:
        props.x = bounds.center.x;
        props.y = bounds.bottomCenter.y;
        break;

      case Snapping.SW:
        props.x = bounds.left;
        props.y = bounds.bottomCenter.y;
        break;

      case Snapping.W:
        props.x = bounds.left;
        props.y = bounds.center.y;
        break;

      case Snapping.NW:
        props.x = bounds.left;
        props.y = bounds.topCenter.y;
        break;

      case Snapping.Center:
        props.x = bounds.center.x;
        props.y = bounds.center.y;
        break;

      default:
        break;
    }

    props.angle = 0;
    props.shear = 0;

    if (selectedItems.length === 1) {
      let angle = 0;

      if (selectedItems[0].data) angle = selectedItems[0].data.rotation || 0;
      const scalar = window[MIRROR_SCALARS].x * window[MIRROR_SCALARS].y;
      if (selectedItems[0].data.prevRotation) angle = angle + selectedItems[0].data.prevRotation;
      props.angle = (360 - ((scalar * angle) % 360)) % 360;
      if (props.angle === 360) props.angle = 0;
    }

    this.elementProperties.fillProps(props);

    ////////////////////////

    const sets: IElementSettings = {};

    const layerId = getLayerId(selectedItems[0]);
    const laserSettings = this.getLayerTool(layerId);
    sets.name = selectedItems[0].uname;
    sets.speed = laserSettings.speed;
    sets.constantPower = laserSettings.constantPower === undefined ? true : !!laserSettings.constantPower;
    sets.minPower = laserSettings.minPower;
    sets.power = laserSettings.power;
    sets.passes = laserSettings.passes;

    this.elementSettings.fillProps(sets);

    if (isMousedown) this.updateTopTools(selectedItems);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private initSnapper() {
    this.currentSnapping = this.canvas.snapping;
    if (this.currentSnapping !== undefined) {
      this.elementProperties.snapper.snapping = this.currentSnapping;
      return;
    }
    console.log(this.canvas.origin);
    switch (this.canvas.origin) {
      case Origins.BottomLeft:
        this.elementProperties.snapper.snapping = Snapping.SW;
        break;

      case Origins.TopLeft:
        this.elementProperties.snapper.snapping = Snapping.NW;
        break;

      case Origins.TopRight:
        this.elementProperties.snapper.snapping = Snapping.NE;
        break;

      case Origins.BottomRight:
        this.elementProperties.snapper.snapping = Snapping.SE;
        break;
    }
    this.canvas.snapping = this.elementProperties.snapper.snapping;
    this.currentSnapping = this.elementProperties.snapper.snapping;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  updateLists() {
    if (this.canvas && typeof this.canvas.ensureTextLinkPairs === 'function') {
      this.canvas.ensureTextLinkPairs();
    }
    const projectLayerOrder = this.canvas?.objectsLayer?.data?.layerOrder;
    if (Array.isArray(projectLayerOrder) && projectLayerOrder.length) {
      this.layerOrder = projectLayerOrder.slice();
    }
    if (!this.canvas.objectsLayer.data) this.canvas.objectsLayer.data = {};
    this.canvas.objectsLayer.data.layerOrder = this.layerOrder.slice();

    const nextElements = {};
    this.cutList.clear();

    const allItems = [];
    const seen = {};
    const isBetterCandidate = (prev: any, next: any) => {
      if (!prev) return true;
      if (!next) return false;
      const prevDrawable = this.isLayerTargetItem(prev);
      const nextDrawable = this.isLayerTargetItem(next);
      return !prevDrawable && nextDrawable;
    };
    const collectItems = (item) => {
      if (!item) return;
      if (item.uid === SELECT) {
        const selectedChildren = item.children || [];
        for (let i = 0; i < selectedChildren.length; i++) collectItems(selectedChildren[i]);
        return;
      }
      if (item.uid) {
        if (!seen[item.uid]) {
          seen[item.uid] = true;
          nextElements[item.uid] = item;
          allItems.push(item);
        } else if (isBetterCandidate(nextElements[item.uid], item)) {
          const prev = nextElements[item.uid];
          nextElements[item.uid] = item;
          const index = allItems.indexOf(prev);
          if (index >= 0) allItems[index] = item;
        }
      }
      const children = item.children || [];
      for (let i = 0; i < children.length; i++) collectItems(children[i]);
    };

    const rootChildren = (this.canvas.objectsLayer && this.canvas.objectsLayer.children) || [];
    for (let i = 0; i < rootChildren.length; i++) collectItems(rootChildren[i]);

    const selectionChildren = (this.canvas.toolbox.select.selectionGroup && this.canvas.toolbox.select.selectionGroup.children) || [];
    for (let i = 0; i < selectionChildren.length; i++) collectItems(selectionChildren[i]);

    const layerBuckets = {};
    const layerAllBuckets = {};
    for (let i = 0; i < allItems.length; i++) {
      const child = allItems[i];
      if (!this.isLayerTargetItem(child) && !isTextCarrier(child) && !isTextRoot(child)) continue;
      this.ensureItemLayer(child);
      child.opacity = this.getElementOpacity(child);
      const layerId = getLayerId(child);
      if (!layerAllBuckets[layerId]) layerAllBuckets[layerId] = [];
      layerAllBuckets[layerId].push(child);
      if (!this.isListItem(child)) continue;
      if (!layerBuckets[layerId]) layerBuckets[layerId] = [];
      layerBuckets[layerId].push(child);
    }

    const usedLayers = this.layerOrder.filter((layerId) => layerAllBuckets[layerId] && layerAllBuckets[layerId].length);
    const usedSet = {};
    for (let i = 0; i < usedLayers.length; i++) usedSet[usedLayers[i]] = true;
    const remaining = Object.keys(layerAllBuckets)
      .filter((layerId) => !usedSet[layerId])
      .sort((a, b) => getLayerById(a).index - getLayerById(b).index);
    const orderedLayers = [...usedLayers, ...remaining];

    this.layerItemsMap = {};
    for (let i = 0; i < orderedLayers.length; i++) {
      const layerId = orderedLayers[i];
      const items = layerAllBuckets[layerId] || [];
      this.applyLayerToolToItems(layerId, items);
      this.layerItemsMap[layerId] = items.slice();
      const listItems = layerBuckets[layerId] || [];
      const layerColumns = this.getLayerColumns(layerId, listItems);
      const layerDef = getLayerById(layerId);
      const label = isToolLayer(layerId) ? `Tool ${layerDef.id}` : layerDef.id;
      this.cutList.addBin({
        caption: `<span class="ec-layer-chip" style="background:${getLayerUiColor(layerDef.id, layerDef.color)}"></span>${label}`,
        parent: ROOT,
        kind: 'Layer',
        uid: layerId,
        layerId,
        columns: layerColumns,
      });
    }

    this.cutList.updateTree();
    this.icFoldsAll.enabled = false;
    const selectedItems = this.canvas.toolbox.select.selectedItems || [];
    const selectedLayerIds = this.getLayerIdsFromItems(selectedItems);
    this.syncTreeSelection(selectedLayerIds, false);
    this.refreshPaletteSelection();

    this.canvas.elements = nextElements;
    window[ELEMENTS] = nextElements;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private isListItem(child) {
    if (!child || !child.uid || child.uid === SELECT) return false;
    if (isTextProxy(child)) return false;
    if (isTextCarrier(child)) return false;
    if (child.kind !== E_KIND_IMAGE) {
      if (!child.bounds || !child.bounds.width || !child.bounds.height) return false;
    }
    if (child.kind === E_KIND_CURVE) return false;
    if (child.children && child.children.length) {
      const allowComposite =
        isTextRoot(child) ||
        child.kind === E_KIND_TEXT ||
        child.kind === E_KIND_VECTOR ||
        child.kind === E_KIND_IMAGE ||
        child.kind === E_KIND_GROUP;
      if (!allowComposite) return false;
    }
    return true;
  }

  private isLayerTargetItem(child: any) {
    if (!child || !child.uid || child.uid === SELECT) return false;
    if (isTextCarrier(child)) return false;
    if (child.kind === E_KIND_IMAGE) return true;
    const bounds = child.bounds;
    return !!(bounds && bounds.width && bounds.height);
  }

  private ensureItemLayer(child) {
    if (isTextCarrier(child)) {
      child.visible = false;
      if (!child.laserSettings) child.laserSettings = DeepCopy(DefaultLaserSettings);
      child.laserSettings.output = false;
      child.laserSettings.includeInFrame = false;
      return ensureLayerData(child, this.canvas.currentLayerId || DEFAULT_LAYER_ID);
    }
    if (!child.laserSettings) {
      child.laserSettings = DeepCopy(DefaultLaserSettings);
    }
    if (typeof child.visible !== 'boolean') child.visible = true;
    if (child.laserSettings.laserType === undefined) {
      child.laserSettings.laserType = child.type === E_KIND_IMAGE ? ElementLaserType.Image : ElementLaserType.Line;
    }
    if (child.laserSettings.includeInFrame === undefined) child.laserSettings.includeInFrame = true;
    const layer = ensureLayerData(child, this.canvas.currentLayerId || DEFAULT_LAYER_ID);
    const layerTool = this.getLayerTool(layer.id);
    child.laserSettings.speed = layerTool.speed;
    child.laserSettings.constantPower = !!layerTool.constantPower;
    child.laserSettings.minPower = layerTool.minPower;
    child.laserSettings.power = layerTool.power;
    child.laserSettings.passes = layerTool.passes;
    child.laserSettings.air = layerTool.air;
    child.laserSettings.laserType = layerTool.laserType;
    child.laserSettings.includeInFrame = layerTool.includeInFrame;
    child.laserSettings.output = isToolLayer(layer.id) ? false : !!layerTool.output;
    child.visible = !!layerTool.visible;
    this.applyVisualStyle(child);
    if (child.kind === E_KIND_IMAGE) {
      if (!window[IMAGES]) window[IMAGES] = [];
      window[IMAGES][child.uid] = child;
      if (!child.originalContext) ImagePreview(child);
    }
    return layer;
  }

  private applyVisualStyle(child) {
    if (!child) return;
    if (isTextCarrier(child)) return;
    if (isTextRoot(child)) {
      const proxyUid = child?.data?.proxyUid;
      const proxy = proxyUid ? this.canvas?.elements?.[proxyUid] : null;
      if (proxy) this.applyVisualStyle(proxy);
      return;
    }
    const strokeColor = getElementColor(child);
    const isFill = child.laserSettings && child.laserSettings.laserType === ElementLaserType.Fill;
    if (child.strokeColor !== undefined) child.strokeColor = strokeColor;

    if (child.kind === E_KIND_TEXT) {
      const fillColor = isFill ? strokeColor : null;
      applyStrokeFill(child, strokeColor, fillColor);
      return;
    }

    if (child.fillColor !== undefined) child.fillColor = isFill ? strokeColor : null;
  }

  private getLayerColumns(layerId, items) {
    const layerTool = this.getLayerTool(layerId);
    if (isToolLayer(layerId)) {
      return [this.getFrameToggle(layerTool), this.getVisibility(layerTool)];
    }
    return [
      this.getParameters(layerTool),
      this.getOutput(layerTool),
      this.getType(layerTool.laserType || ElementLaserType.Line),
      this.getVisibility(layerTool),
      this.getAir(layerTool),
    ];
  }

  private refreshPaletteSelection() {
    const ids = Object.keys(this.layerButtons || {});
    const currentId = this.canvas.currentLayerId || DEFAULT_LAYER_ID;
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const button = this.layerButtons[id];
      if (!button) continue;
      if (id === currentId) button.classList.add('active');
      else button.classList.remove('active');
    }
  }

  private getParameters(laserSettings) {
    return {
      html: `<span style="pointer-events:none"><span ls="speed">${laserSettings.speed} </span>/<span ls="power"> ${laserSettings.power} </span>/<span ls="passes"> ${laserSettings.passes} </span></span>`,
      hint: `${tr('Speed')} / ${tr('Power')} / ${tr('Pass Count')}`,
    };
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private getType(op) {
    return {
      html: LaserType[op].icon,
      hint: LaserType[op].hint,
    };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private getAir(laserSettings) {
    const op = !!laserSettings.air;
    const info = `(${op ? tr('On') : tr('Off')})`;
    return {
      html: op ? '<i class="fa-solid fa-wind"></i>' : '<i style="opacity:0.3" class="fa-solid fa-wind"></i>',
      hint: `${tr('Air')} ${info}`,
    };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private getVisibility(source) {
    const visible = source?.visible !== false;
    return {
      html: visible
        ? '<i class="fa-regular fa-eye"></i>'
        : '<i style="opacity:0.3" class="fa-regular fa-eye-slash"></i>',
      hint: `${tr('Visibility')} (${visible ? tr('On') : tr('Off')})`,
    };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private getOutput(laserSettings) {
    const op = !!laserSettings.output;
    const info = `(${op ? tr('On') : tr('Off')})`;
    return {
      html: op ? '<i class="fa-solid fa-fire"></i>' : '<i style="opacity:0.3" class="fa-solid fa-fire"></i>',
      hint: `Output ${info}`,
    };
  }

  private getFrameToggle(source) {
    const includeInFrame = source?.includeInFrame !== false;
    return {
      html: includeInFrame
        ? '<i class="fa-regular fa-object-group"></i>'
        : '<i style="opacity:0.3" class="fa-regular fa-object-group"></i>',
      hint: `${tr('Include In Frame')} (${includeInFrame ? tr('On') : tr('Off')})`,
    };
  }

  private getElementOpacity(child) {
    if (isTextCarrier(child)) return 0;
    if (child.visible === false) return 0;
    if (isToolLayer(getLayerId(child))) return NON_OUTPUT_OPACITY;
    if (!child.laserSettings || !child.laserSettings.output) return NON_OUTPUT_OPACITY;
    return window[CURRENT_MOD] === MOD_WORK ? 1 : PREVIEW_OPACITY;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getFrame() {
    const elementsMap = this.canvas?.elements || {};
    const uids = Object.keys(elementsMap);
    if (!uids.length) return { elements: 0 };
    this.frame = { l: 1e6, r: -1e6, t: 1e6, b: -1e6 };
    let elements = 0;
    for (let i = 0; i < uids.length; i++) {
      const uid = uids[i];
      const child = elementsMap[uid];
      if (!this.isListItem(child)) continue;
      if (!child || child.visible === false) continue;
      if (child.laserSettings.includeInFrame === false) continue;
      elements++;
      this.frame = {
        l: Math.min(this.frame.l, child.bounds.left),
        r: Math.max(this.frame.r, child.bounds.right),
        t: Math.min(this.frame.t, child.bounds.top),
        b: Math.max(this.frame.b, child.bounds.bottom),
      };
    }

    if (this.frame.t < 0) this.frame.t = 0;
    if (this.frame.l < 0) this.frame.l = 0;
    if (this.frame.r < 0) this.frame.r = 0;
    if (this.frame.b < 0) this.frame.b = 0;

    if (this.frame.l > this.canvas.workingArea.width) this.frame.l = this.canvas.workingArea.width;
    if (this.frame.t > this.canvas.workingArea.height) this.frame.t = this.canvas.workingArea.height;
    if (this.frame.r > this.canvas.workingArea.width) this.frame.r = this.canvas.workingArea.width;
    if (this.frame.b > this.canvas.workingArea.height) this.frame.b = this.canvas.workingArea.height;

    return { frame: this.frame, elements };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  set topIcons(topIcons) {
    this._topIcons = topIcons;
    this.designerIcons = new DesignerIcons(topIcons);

    topIcons.addTool(this.designerIcons);
    topIcons.showView(this.designerIcons);
    this.handleExtraTools();
  }

  set topTools(topTools) {
    this._topTools = topTools;

    topTools.showView(this.defaultTopTools);

    ///////////////////////////

    this.handleDefaultTools();
    this.handleLaserTools();
    this.handleImageTools();
    this.handleRectangleTools();
    this.handleTextTools();
  }

  set topToolsAux(topToolsAux) {
    this._topToolsAux = topToolsAux;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  handleDefaultTools() {
    this.defaultTopTools.onGroup = () => {
      this.canvas.toolbox.select.group();
    };

    this.defaultTopTools.onUnGroup = () => {
      this.canvas.toolbox.select.ungroup();
    };

    this.defaultTopTools.onCombine = (itresectedOnly?: boolean) => {
      this.canvas.combineElement(itresectedOnly);
    };

    this.defaultTopTools.onOffset = ({ distance, cap, join }) => {
      this.canvas.offsetElement({ distance, cap, join });
    };

    this.defaultPowerTopTools.onCombine = (itresectedOnly?: boolean) => {
      this.canvas.combineElement(itresectedOnly);
    };

    this.defaultPowerTopTools.onOffset = ({ distance, cap, join }) => {
      this.canvas.offsetElement({ distance, cap, join });
    };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  handleLaserTools() {
    this.laserTools.onSetHome = (origin) => {
      this.canvas.canvasScale.style.opacity = 0;
      setTimeout(() => {
        this.canvas.origin = origin;
        this.canvas.zoomFit();
        setTimeout(() => {
          this.canvas.canvasScale.style.opacity = 1;
        }, 100);
      }, 100);
    };

    ///////////////////////////

    this.laserTools.onHomingChange = () => {
      if (typeof this.onHomingChange === 'function') this.onHomingChange();
    };

    ///////////////////////////

    this.laserTools.onGetWorkAreaSize = () => {
      if (typeof this.onGetWorkAreaSize === 'function') this.onGetWorkAreaSize();
    };

    ///////////////////////////

    this.laserTools.onSetUnit = (unit) => {
      this.canvas.canvasScale.style.opacity = 0;
      setTimeout(() => {
        this.canvas.setUnit(unit);
        this.canvas.zoomFit();
        setTimeout(() => {
          this.canvas.canvasScale.style.opacity = 1;
          this.laserTools.fillProps();
        }, 100);
      }, 100);
      if (typeof this.onSetUnit === 'function') this.onSetUnit(unit);
    };

    ///////////////////////////

    this.laserTools.onSetAreaSize = () => {
      this.canvas.paper.view.setCenter(0, 0);

      this.canvas.setupGrid({
        width: Number(localStorage.getItem(AREA_WIDTH)) || 350,
        height: Number(localStorage.getItem(AREA_HEIGHT)) || 350,
      });
      this.canvas.zoomFit();
    };
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  handleImageTools() {
    this.imageTools.onPowerChange = (power: number) => {
      this.fillProps();
      this.updateLists();
      this.handleOnSelect();
    };

    ///////////////////////////

    this.imageTools.onAddFrame = ({ parent, frame }) => {
      this.handleUnselectAll();

      if (parent.inGroup) {
        frame.inGroup = true;
        frame.currentParent = parent.parent.uid;
        parent.parent.addChild(frame);
        this.canvas.elements[frame.uid] = frame;
        this.canvas.toolbox.select.select(parent.parent);
      } else {
        this.canvas.toolbox.select.select(parent);
        this.canvas.toolbox.select.select(frame);
        this.canvas.toolbox.select.group(parent.uname);
      }
      this.updateLists();
      this.handleOnSelect();
    };
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  handleRectangleTools() {
    this.rectangleTools.onPowerChange = (power: number) => {
      this.fillProps();
      this.updateLists();
      this.handleOnSelect();
    };
  }

  handleTextTools() {
    this.textTools.onSelectFont = ({ file, fontFamily, fontSubFamily, variation }) => {
      const editorStatus = this.editorStatus;

      if (editorStatus.isProhibited) return;

      if (this.canvas.editor.visible) {
        this.canvas.editor.setFont({ file, fontFamily, fontSubFamily, variation });
      } else {
        editorStatus.selectedText.data.textSettings.font = { file, fontFamily, fontSubFamily, variation };
        this.canvas.replaceElement(editorStatus.selectedText);
      }
    };

    this.textTools.onSizeChange = (size: number) => {
      const editorStatus = this.editorStatus;
      if (editorStatus.isProhibited) return;

      if (this.canvas.editor.visible) {
        this.canvas.editor.size = size;
      } else {
        this.canvas.replaceElement(editorStatus.selectedText);
      }
    };

    this.textTools.onAlign = (align) => {
      const editorStatus = this.editorStatus;

      if (editorStatus.isProhibited) return;

      if (this.canvas.editor.visible) {
        this.canvas.editor.alignX = align;
      } else {
        editorStatus.selectedText.data.textSettings.align = align;
        editorStatus.selectedText.data.textSettings.startPoint = [];
        this.canvas.replaceElement(editorStatus.selectedText);
      }
    };

    this.textTools.onCaseChange = (op: boolean) => {
      const editorStatus = this.editorStatus;
      if (editorStatus.isProhibited) return;

      if (this.canvas.editor.visible) {
        this.canvas.editor.upperCase = op;
      } else {
        this.canvas.replaceElement(editorStatus.selectedText);
      }
    };

    this.textTools.onCombineChange = (op: boolean) => {
      const editorStatus = this.editorStatus;
      if (editorStatus.isProhibited) return;

      if (this.canvas.editor.visible) {
        this.canvas.editor.weld = op;
      } else {
        this.canvas.replaceElement(editorStatus.selectedText);
      }
    };

    this.textTools.onSpaceXChange = (v: number) => {
      const editorStatus = this.editorStatus;
      if (editorStatus.isProhibited) return;

      if (this.canvas.editor.visible) {
        this.canvas.editor.spaceX = v;
      } else {
        this.canvas.replaceElement(editorStatus.selectedText);
      }
    };

    this.textTools.onSpaceYChange = (v: number) => {
      const editorStatus = this.editorStatus;
      if (editorStatus.isProhibited) return;

      if (this.canvas.editor.visible) {
        this.canvas.editor.spaceY = v;
      } else {
        this.canvas.replaceElement(editorStatus.selectedText);
      }
    };

    this.textTools.onConvertToPath = () => {
      if (this.canvas.editor.visible) return;
      const editorStatus = this.editorStatus;
      if (editorStatus.isProhibited) return;
      const converted = this.canvas.convertTextToPath(editorStatus.selectedText);
      if (!converted) return;
      this.canvas.isPreviewChanged = true;
      this.updateLists();
      this.handleUnselectAll();
      this.canvas.toolbox.select.select(converted);
      this.handleOnSelect();
      this.history.commit('Convert text to path');
    };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  handleExtraTools() {
    this.designerIcons.onUndo = () => {
      this.undo();
    };

    this.designerIcons.onRedo = () => {
      this.redo();
    };

    this.designerIcons.onDuplicate = () => {
      this.canvas.toolbox.select.duplicate();
    };

    this.designerIcons.onRemove = () => {
      this.canvas.toolbox.select.remove();
      this.handleUnselectAll();
    };

    this.designerIcons.onZoomFit = () => {
      this.canvas.zoomFit();
    };

    this.designerIcons.onZoomIn = () => {
      this.canvas.zoomIn();
    };

    this.designerIcons.onZoomOut = () => {
      this.canvas.zoomOut();
    };

    this.designerIcons.onFlipH = () => {
      const selectedItem = this.canvas.toolbox.select.selectedItems;
      if (!selectedItem || !selectedItem.length) return;
      for (let i = 0; i < selectedItem.length; i++) {
        const item = selectedItem[i];
        item.pivot = item.bounds.center;
        item.scaling = [-1, 1];
      }
    };

    this.designerIcons.onFlipV = () => {
      const selectedItem = this.canvas.toolbox.select.selectedItems;
      if (!selectedItem || !selectedItem.length) return;
      for (let i = 0; i < selectedItem.length; i++) {
        const item = selectedItem[i];
        item.pivot = item.bounds.center;
        item.scaling = [1, -1];
      }
    };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  get editorStatus() {
    const selectedItem = this.canvas.toolbox.select.selectedItems[0];
    const selectedText =
      (this.canvas.resolveTextSelection && this.canvas.resolveTextSelection(selectedItem)) ||
      (selectedItem && selectedItem.kind === E_KIND_TEXT ? selectedItem : null);
    return {
      isProhibited: !this.canvas.editor.visible && (!selectedText || selectedText.kind !== E_KIND_TEXT),
      selectedText,
    };
  }
}
