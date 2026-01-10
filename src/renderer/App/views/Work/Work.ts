//@ts-ignore
//@ts-nocheck
import View from '../View';
import LaserCanvas, {
  CURRENT_THEME,
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

import { TreeView, BIN, ITEM, BOTTOM, ROOT } from '../../../lib/components/TreeView/TreeView';
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
import { applyStrokeFill, checkImageInArea } from '../../../modules/helpers';

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
  air: true,
  constantPower: false,
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

const LS_SETTINGS = 1; // columns in cutItems
const LS_AIR = 2;
const LS_OUTPUT = 3;

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

  constructor(private par: any) {
    super(par, 'Work');

    this._init();
    this._events();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private _init() {
    this.canvas = new LaserCanvas(this.workView.centerPart.cont);
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
    this.elCuts.text = 'Elements';

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
    this.cutList.binMode = false;
    this.cutList.multiselect = true;
    this.cutList.type = ElementLaserType.Line;

    /////////////

    this.settingsLP = new LabelPanel(this.rightSideTop.bottomPart);
    this.settingsLP.text = 'Element Settings';

    /////////////

    this.elementSettings = new ElementSettings(this.settingsLP.body);

    /////////////

    this.elementProperties = new ElementProperties(this.propertiesLP.body);
    this.initSnapper();

    /////////////
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

  private handleText() {
    this.canvas.onStartEdit = () => {
      this._topTools.showView(this.textTools);
    };

    this.canvas.onEndEditText = (el, replace = false) => {
      this.canvas.paper.activate();
      this.updateLists();

      const mx = this.canvas.mirrorScalars.x;
      const my = this.canvas.mirrorScalars.y;

      if (this.canvas.editor.originalElementPosition) {
        el.position = this.canvas.editor.originalElementPosition;
      } else {
        el.pivot = [mx < 0 ? el.bounds.right : el.bounds.left, my < 0 ? el.bounds.bottom : el.bounds.top];
        el.position = [
          mx < 0
            ? this.canvas.editor.startPoint.endX - el.data.textSettings.left
            : this.canvas.editor.startPoint.x + el.data.textSettings.left,
          my < 0
            ? this.canvas.editor.startPoint.endY - el.data.textSettings.top
            : this.canvas.editor.startPoint.y + el.data.textSettings.top,
        ];
      }

      if (Number(this.tools.currentSelection) === ToolboxMode.Text) {
        this.tools.select(ToolboxMode.Select);
      }
      this.canvas.editor.textTools.resetText();
      this.canvas.editor.element = undefined;

      this.canvas.toolbox.select.select(el);
      this.canvas.toolbox.select.updateSelection(true);
    };
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
      this.cutList.unselectAll();

      this.clearProps();
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
      this.selectElements(selected);
    };

    this.cutList.onColumnClick = (column) => {
      if (column.i === 0 && this.canvas.elements[column.uid].kind === E_KIND_IMAGE) return;
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

      if (target.type === ITEM) {
        for (let i = 0; i < sources.length; i++) {
          const sourceUid = sources[i];
          if (sourceUid !== targetUid && this.cutList.items[sourceUid].type !== BIN) {
            const sourceItem = this.canvas.elements[sourceUid];
            const targetItem = this.canvas.elements[targetUid];
            if (cover !== BOTTOM) {
              sourceItem.insertBelow(targetItem);
            } else {
              sourceItem.insertAbove(targetItem);
            }
          }
        }
      }

      if (target.type === BIN) {
        for (let i = 0; i < sources.length; i++) {
          const sourceUid = sources[i];
          if (sourceUid !== targetUid) {
            const sourceItem = this.canvas.elements[sourceUid];
            const targetItem = this.canvas.elements[targetUid];
            targetItem.addChild(sourceItem);
          }
        }
      }

      this.updateLists();
      this.history.commit('Reorder elements');
    };

    ////////////////////////////////////////////
    this.cutList.onDblClicked = (e) => {
      const el = e.target;
      const col = e.state.col;
      const clickX = e.event.offsetX;

      const speed = el.querySelector('[ls="speed"]');
      const power = el.querySelector('[ls="power"]');
      const passes = el.querySelector('[ls="passes"]');
      this.settingsUid = undefined;

      if (!speed || !power || !passes) return;

      const uid = e.state.uid;

      this.settingsUid = uid;

      const element = this.canvas.elements[uid];
      const laserSettings = element.laserSettings;
      const name = element.uname;
      this.elementSettings.fillProps({ ...laserSettings, name });

      this.selectElements([element]);

      this.elementSettings.name.input.input.select();

      if (col && clickX >= speed.offsetLeft && clickX <= speed.offsetLeft + speed.offsetWidth) {
        this.elementSettings.speed.input.input.select();
      }

      if (col && clickX >= power.offsetLeft && clickX <= power.offsetLeft + power.offsetWidth) {
        this.elementSettings.power.input.input.select();
      }

      if (col && clickX >= passes.offsetLeft && clickX <= passes.offsetLeft + passes.offsetWidth) {
        this.elementSettings.passes.input.input.select();
      }
    };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private handleSettings() {
    this.elementSettings.onChange = (sets) => {
      let selected;

      const isInSelection = this.cutList.selected.includes(this.settingsUid);

      if (this.settingsUid && !isInSelection) {
        selected = [];
        selected.push(this.settingsUid);
      } else {
        selected = this.cutList.selected;
      }

      if (!selected.length) return;

      let update = false;

      for (let i = 0; i < selected.length; i++) {
        const settingsUid = selected[i];
        if (!settingsUid || !this.canvas.elements[settingsUid]) continue;
        if (sets.changed === 'name' && sets.name) {
          this.canvas.elements[settingsUid].uname = sets.name;
          this.settingsUid = undefined;

          update = true;
        } else {
          let { power, speed, passes } = sets;

          if (sets.changed === 'power') this.canvas.elements[settingsUid].laserSettings.power = power;
          if (sets.changed === 'speed') this.canvas.elements[settingsUid].laserSettings.speed = speed;
          if (sets.changed === 'passes') this.canvas.elements[settingsUid].laserSettings.passes = passes;
        }
      }
      this.canvas.isPreviewChanged = true;

      this.handleUnselectAll();

      this.updateLists();

      if (sets.changed !== 'name') this.toggleColumn(this.settingsUid, LS_SETTINGS);

      if (selected && selected.length) {
        for (let i = 0; i < selected.length; i++) {
          this.canvas.toolbox.select.select(this.canvas.elements[selected[i]]);
        }
      }
      this.canvas.toolbox.select.updateSelection();
      this.handleOnSelect();
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

      if (el && el.uid && el.type !== BIN) {
        if (el.kind === E_KIND_IMAGE) {
          if (checkImageInArea(el)) {
            ImagePreview(el);
          }
        }
        this.canvas.elements[el.uid].sel = false;
        this.canvas.toolbox.select.select(this.canvas.elements[el.uid]);
      }

      if (el && el.uid && el.type === BIN && this.canvas.elements[el.groupId]) {
        this.canvas.elements[el.groupId].sel = false;
        this.canvas.toolbox.select.select(this.canvas.elements[el.groupId]);
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
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private updateColumns(uid) {
    const firstChildUid = this.cutList.itemsOrder[uid][0];
    for (let c = 0; c < 4; c++) {
      const isBin = this.cutList.items[firstChildUid].type === BIN;
      if (isBin && this.cutList.itemsOrder[firstChildUid]) {
        const nextChildUid = this.cutList.itemsOrder[firstChildUid][0];
        this.parentUpdate(nextChildUid, c);
      } else {
        this.parentUpdate(firstChildUid, c);
      }
    }
    this.cutList.updateTree(false);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private async toggleColumn(uid, column) {
    let payload;

    if (!this.canvas.elements[uid]) return;

    if (column === 0) {
      let type = this.canvas.elements[uid].laserSettings.laserType + 1;
      if (type > ElementLaserType.Fill) type = ElementLaserType.Line;
      this.canvas.elements[uid].laserSettings.laserType = type;
      payload = {
        type,
      };
    }

    if (column === 1) {
      const { speed, power, passes } = this.canvas.elements[uid].laserSettings;
      this.canvas.elements[uid].laserSettings = {
        ...this.canvas.elements[uid].laserSettings,
        speed,
        power,
        passes,
      };

      payload = {
        speed,
        power,
        passes,
      };
    }

    if (column === 2) {
      const air = !this.canvas.elements[uid].laserSettings.air;
      this.canvas.elements[uid].laserSettings.air = air;
      payload = {
        air,
      };
    }

    if (column === 3) {
      const output = !this.canvas.elements[uid].laserSettings.output;
      this.canvas.elements[uid].laserSettings.output = output;

      payload = {
        output,
      };
    }

    if (this.cutList.items[uid] && this.cutList.items[uid].type === BIN) {
      if (!this.cutList.items[uid].changedColumn) this.cutList.items[uid].changedColumn = [];

      this.canvas.elements[uid].laserSettings.changedColumn[column] = false;
      this.cutList.items[uid].changedColumn[column] = false;

      const children = this.cutList.itemsOrder[uid];
      this.updateItem(uid, column);

      this.childrenUpdate(children, uid, column, payload);
      this.parentUpdate(uid, column);

      this.cutList.updateTree();
      this.history.commit('Update laser settings');

      return;
    }

    if (this.cutList.items[uid].selected) {
      for (let i = 0; i < this.cutList.selected.length; i++) {
        const cuid = this.cutList.selected[i];
        if (column === 0) {
          this.canvas.elements[cuid].laserSettings.laserType = payload.type;
        }

        if (column === 1) {
          this.canvas.elements[cuid].laserSettings = {
            ...this.canvas.elements[cuid].laserSettings,
            ...payload,
          };
        }

        if (column === 2) {
          this.canvas.elements[cuid].laserSettings.air = payload.air;
        }

        if (column === 3) {
          this.canvas.elements[cuid].laserSettings.output = payload.output;
        }
        this.updateItem(cuid, column);
      }
    } else {
      if (column === 0) {
        this.canvas.elements[uid].laserSettings.laserType = payload.type;
      }

      if (column === 1) {
        this.canvas.elements[uid].laserSettings = {
          ...this.canvas.elements[uid].laserSettings,
          ...payload,
        };
      }

      if (column === 2) {
        this.canvas.elements[uid].laserSettings.air = payload.air;
      }

      if (column === 3) {
        this.canvas.elements[uid].laserSettings.output = payload.output;
      }

      this.updateItem(uid, column);
    }

    this.parentUpdate(uid, column);

    this.cutList.updateTree();
    this.history.commit('Update laser settings');
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  childrenUpdate(children: any, uid: any, column, payload: any) {
    for (let i = 0; i < children.length; i++) {
      const iuid = children[i];
      const item = this.cutList.items[iuid];

      if (item.parent !== uid) break;
      if (item.type === 'bin') {
        const children = this.cutList.itemsOrder[iuid];
        item.changedColumn[column] = false;
        this.childrenUpdate(children, iuid, column, payload);
      }

      this.cutList.items[iuid].columns[column] = DeepCopy(this.cutList.items[uid].columns[column]);

      if (column === 0) {
        this.canvas.elements[iuid].laserType = payload.type;
        this.canvas.elements[iuid].fillColor = payload.fillColor;
        this.canvas.elements[iuid].strokeColor = payload.strokeColor;
      }
      if (column === 1) {
        const { speed, power, passes } = payload;
        this.canvas.elements[iuid].laserSettings.speed = speed;
        this.canvas.elements[iuid].laserSettings.power = power;
        this.canvas.elements[iuid].laserSettings.passes = passes;
      }
      if (column === 2) {
        this.canvas.elements[iuid].laserSettings.air = payload.air;
      }
      if (column === 3) {
        this.canvas.elements[iuid].opacity = payload.opacity;
        this.canvas.elements[iuid].laserSettings.output = payload.output;
      }

      this.updateItem(iuid, column);
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private parentUpdate(uid: any, column: any) {
    let parentUid = this.cutList.items[uid].parent;
    let parent = this.cutList.items[parentUid];

    if (parent) {
      if (!parent.changedColumn) parent.changedColumn = [];

      this.checkForSame(parentUid, column);

      parentUid = this.cutList.items[parentUid].parent;
      parent = this.cutList.items[parentUid];
      if (parent) {
        this.parentUpdate(parentUid, column);
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  checkForSame(uid, column) {
    const children = this.cutList.itemsOrder[uid];
    if (!children || !children.length) return;

    let same = true;
    if (children.length > 1)
      for (let i = 0; i < children.length - 1; i++) {
        const uid1 = children[i];
        const uid2 = children[i + 1];
        if (this.cutList.items[uid1].columns[column]) {
          const col1 = this.cutList.items[uid1].columns[column].html;
          const col2 = this.cutList.items[uid2].columns[column].html;
          const changed1 = this.canvas.elements[uid1].laserSettings.changedColumn[column] || false;
          const changed2 = this.canvas.elements[uid2].laserSettings.changedColumn[column] || false;

          if (col1 !== col2 || changed1 !== changed2) {
            same = false;
            break;
          }
        }
      }

    if (uid !== ROOT) {
      let parentUid;
      parentUid = this.cutList.items[uid].parent;

      if (parentUid !== ROOT) parent = this.cutList.items[parentUid];

      const cuid = children[0];
      const ccolumn = DeepCopy(this.cutList.items[children[0]].columns[column]);

      const element = this.canvas.elements[uid];
      element.laserSettings.changedColumn[column] = !same;
      this.cutList.items[uid].columns[column] = ccolumn;

      if (column === 0) {
        if (same) {
          element.laserSettings.laserType = this.canvas.elements[cuid].laserSettings.laserType;
        } else {
          element.laserSettings.laserType = ElementLaserType.Mixed;
        }
      }

      if (column === 1) {
        if (same) {
          const { speed, power, passes } = this.canvas.elements[cuid].laserSettings;
          element.laserSettings.speed = speed;
          element.laserSettings.power = power;
          element.laserSettings.passes = passes;
        }
      }

      if (column === 2) {
        element.laserSettings.air = same ? this.canvas.elements[cuid].laserSettings.air : true;
      }

      if (column === 3) {
        element.laserSettings.output = same ? this.canvas.elements[cuid].laserSettings.output : true;
      }

      this.checkForSame(parentUid || ROOT, column);
      this.updateItem(uid, column);
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  handleSelectAll() {
    this.cutList.selectAll();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  handleUnselectAll() {
    this.cutList.unselectAll();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private handleOnSelect() {
    this.cutList.clearSelection(ROOT, true);
    this.cutList.updateSelection();

    this.clearProps();

    const selectedItems = this.canvas.toolbox.select.selectedItems;
    if (!selectedItems || !selectedItems.length) {
      this.updateTopTools(selectedItems);
      return;
    }

    this.initSnapper();
    if (selectedItems.length) {
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        this.cutList.addSelection(item.uid);
      }
    }
    this.cutList.updateSelection();
    this.fillProps(true);
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
      if (selectedItem.kind === E_KIND_RECTANGLE) {
        this._topTools.showView(this.rectangleTools);
        this._topToolsAux.showView(this.rectangleTools.powerIntervalTools);
        this.rectangleTools.powerIntervalTools.fillOptionsVisible(
          selectedItem.laserSettings.laserType === ElementLaserType.Fill,
        );
        this.rectangleTools.element = selectedItem;
      }
      if (selectedItem.kind === E_KIND_IMAGE) {
        this._topTools.showView(this.imageTools);
        this._topToolsAux.showView(this.imageTools.powerIntervalTools);
        this.imageTools.powerIntervalTools.fillOptionsVisible(true);
        this.imageTools.element = selectedItem;
      }
      if (selectedItem.kind === E_KIND_TEXT) {
        this._topTools.showView(this.textTools);
        this.textTools.element = selectedItem;
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

    const mixedSettings =
      (selectedItems[0].parent ? selectedItems[0].parent.laserSettings : null) || selectedItems[0].laserSettings;

    const laserSettings = selectedItems.length === 1 ? selectedItems[0].laserSettings : mixedSettings;
    sets.name = selectedItems[0].uname;
    sets.speed = laserSettings.speed;
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
    this.canvas.elements = [];

    this.cutList.clear();
    const elements = this.canvas.objectsLayer;
    if (elements.children) this.addElement(elements.children, ROOT);

    const selected = this.canvas.toolbox.select.selectionGroup;

    if (selected && selected.children) this.addElement(selected.children, ROOT);

    this.cutList.updateTree();
    this.icFoldsAll.enabled = Object.keys(this.cutList.itemsOrder).length > 1;

    window[ELEMENTS] = this.canvas.elements;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  addElement(children, parent) {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child.bounds.width || !child.bounds.height) {
        continue;
      }
      if (child.uid === SELECT) {
        continue;
      }
      if (child.uid) this.canvas.elements[child.uid] = child;

      let normalizedParent = child.currentParent;
      if (normalizedParent && typeof normalizedParent === 'object') {
        normalizedParent =
          typeof normalizedParent.uid === 'string' && normalizedParent.uid !== SELECT ? normalizedParent.uid : null;
      }
      if (child.currentParent !== normalizedParent) {
        child.currentParent = normalizedParent || null;
      }

      const parentItem = child.parent;
      const parentUid =
        parentItem && typeof parentItem.uid === 'string' && parentItem.uid !== SELECT ? parentItem.uid : null;

      if (!parentItem || parentItem.uid !== SELECT) {
        if (child.currentParent !== parentUid) {
          child.currentParent = parentUid || null;
        }
      }

      if (!child.laserSettings) {
        child.laserSettings = DeepCopy(DefaultLaserSettings);
      }
      if (child.laserSettings.laserType === undefined) {
        child.laserSettings.laserType = child.type === E_KIND_IMAGE ? ElementLaserType.Image : ElementLaserType.Line;
      }

      const laserType = this.getType(child.laserSettings.laserType);
      const laserParameters = this.getParameters(child);
      const laserAir = this.getAir(child);
      const laserOutput = this.getOutput(child);
      child.opacity = child.laserSettings.output ? (window[CURRENT_MOD] === MOD_WORK ? 1 : PREVIEW_OPACITY) : 0;
      if (child.kind === E_KIND_IMAGE) {
        if (!window[IMAGES]) window[IMAGES] = [];
        window[IMAGES][child.uid] = child;
        if (!child.originalContext) {
          ImagePreview(child);
        }
      }
      if (child.kind === E_KIND_TEXT) {
        const isFill = child.laserSettings.laserType === ElementLaserType.Fill;
        const fillColor = isFill ? 'rgba(0,0,0,.5)' : null;
        const strokeColor = child.sel
          ? window[CURRENT_THEME].object.selected
          : isFill
          ? 'rgba(0,0,0,.5)'
          : window[CURRENT_THEME].object.strokeColor;
        child.fillColor = fillColor;
        child.strokeColor = strokeColor;
        applyStrokeFill(child, strokeColor, fillColor);
      }
      const columns = [
        {
          ...laserType,
        },
        {
          ...laserParameters,
        },
        {
          ...laserAir,
        },
        {
          ...laserOutput,
        },
      ];
      let color = '';
      if (child.data.strokeColor)
        color = `<span style="margin-right:0.5rem;min-width:1.5rem;background-color:${child.data.strokeColor}"></span>`;
      const hasRenderableChildren = child.children && child.children.length && child.kind !== E_KIND_TEXT;
      if (hasRenderableChildren) {
        const papa = this.cutList.addBin({
          caption: color + (child.uname || tr(E_KIND_GROUP)),
          parent,
          kind: child.kind,
          groupId: child.children[0].parent.uid,
          uid: child.children[0].parent.uid,
          columns,
          changedColumn: child.laserSettings.changedColumn,
        });
        this.addElement(child.children, papa);
      } else {
        let icon = this.elIcons[child.kind];
        if (!(child.uname || child.kind)) continue;
        if (child.kind === E_KIND_GROUP)
          this.cutList.addBin({
            parent,
            caption: color + (child.uname || child.kind),
            hint: child.kind,
            uid: child.uid,
            groupId: child.uid,
            selected: child.sel,
            columns,
          });
        else {
          this.cutList.addItem({
            icon,
            parent,
            caption: color + (child.uname || child.kind),
            hint: child.kind,
            uid: child.uid,
            selected: child.sel,
            columns,
          });
        }
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private updateItem(uid, column) {
    const child = this.canvas.elements[uid];
    const laserType = this.getType(child.laserSettings.laserType);
    const laserParameters = this.getParameters(child);
    const laserAir = this.getAir(child);
    const laserOutput = this.getOutput(child);

    if (column === 0) {
      this.cutList.updateColumn({ uid, column, data: { ...laserType } });
      const isFill = child.laserSettings.laserType === ElementLaserType.Fill;
      const fillColor =
        child.laserSettings.laserType !== ElementLaserType.Mixed ? (isFill ? 'rgba(0,0,0,.5)' : null) : undefined;
      if (fillColor !== undefined) {
        child.fillColor = fillColor;
      }

      let strokeColor;
      if (child.kind !== E_KIND_GROUP) {
        strokeColor = child.sel
          ? window[CURRENT_THEME].object.selected
          : isFill
          ? 'rgba(0,0,0,.5)'
          : window[CURRENT_THEME].object.strokeColor;
        child.strokeColor = strokeColor;
      }

      if (child.kind === E_KIND_TEXT) {
        const textStroke =
          strokeColor !== undefined
            ? strokeColor
            : child.sel
            ? window[CURRENT_THEME].object.selected
            : isFill
            ? 'rgba(0,0,0,.5)'
            : window[CURRENT_THEME].object.strokeColor;
        applyStrokeFill(child, textStroke, fillColor);
      }
    }

    if (column === 1) this.cutList.updateColumn({ uid, column, data: { ...laserParameters } });

    if (column === 2) this.cutList.updateColumn({ uid, column, data: { ...laserAir } });

    if (column === 3) {
      this.cutList.updateColumn({ uid, column, data: { ...laserOutput } });
      child.opacity = child.laserSettings.output;
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private getParameters(child) {
    const laserSettings = child.laserSettings;
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

  private getAir(child) {
    const laserSettings = child.laserSettings;
    let op = laserSettings.air;
    let info = `(${op ? tr('On') : tr('Off')})`;
    if (child.children && child.children.length && laserSettings.changedColumn && laserSettings.changedColumn[LS_AIR]) {
      info = `(${tr('mixed')})`;
      op = true;
    }
    return {
      html: op ? '<i class="fa-solid fa-wind"></i>' : '<i style="opacity:0.3" class="fa-solid fa-wind"></i>',
      hint: `${tr('Air')} ${info}`,
    };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private getOutput(child) {
    const laserSettings = child.laserSettings;
    let op = laserSettings.output;
    let info = `(${op ? tr('On') : tr('Off')})`;
    if (
      child.children &&
      child.children.length &&
      laserSettings.changedColumn &&
      laserSettings.changedColumn[LS_OUTPUT]
    ) {
      info = `(${tr('mixed')})`;
      op = true;
    }
    return {
      html: op ? '<i class="fa-regular fa-eye"></i>' : '<i style="opacity:0.3" class="fa-regular fa-eye"></i>',
      hint: `Output ${info}`,
    };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getFrame() {
    if (!this.cutList || !this.cutList.orderedItems.length) return { elements: 0 };
    this.frame = { l: 1e6, r: -1e6, t: 1e6, b: -1e6 };
    let elements = 0;
    for (let i = 0; i < this.cutList.orderedItems.length; i++) {
      const child = this.canvas.elements[this.cutList.orderedItems[i]];
      if (!child.laserSettings.output) continue;
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

    this.defaultTopTools.onUnGroup = () => {
      this.canvas.toolbox.select.ungroup();
    };

    this.defaultTopTools.onCombine = (itresectedOnly?: boolean) => {
      this.canvas.combineElement(itresectedOnly);
    };

    this.defaultTopTools.onOffset = ({ distance, cap, join }) => {
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
    const selectedText = this.canvas.toolbox.select.selectedItems[0];
    return {
      isProhibited: !this.canvas.editor.visible && (!selectedText || selectedText.kind !== E_KIND_TEXT),
      selectedText,
    };
  }
}
