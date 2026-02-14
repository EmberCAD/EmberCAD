//@ts-ignore
//@ts-nocheck

import { DeepCopy, crEl } from '../../lib/api/cherry/api';
import Paper from 'paper';
import fs from 'fs';
import path from 'path';
import CavasTheme from './CanvasTheme/CanvasTheme';
import html2canvas from 'html2canvas';
import { isMac } from '../../lib/components/Application/Application';
import { PaperOffset } from './PaperOffset';
import Toolbox, { ToolboxMode } from './Tools/Toolbox';
import { SELECT } from './Tools/Select';
import CanvasVector from './CanvasVector';
import { IElementProperties } from '../../App/views/Work/ElementProperties';
import { E_KIND_GROUP, E_KIND_IMAGE, E_KIND_TEXT, E_KIND_VECTOR } from './CanvasElement';
import CanvasImage from './CanvasImage';
import { checkImageInArea, getElementColor, readUni, weld, writeUni } from '../../modules/helpers';
import { AREA_HEIGHT, AREA_WIDTH } from '../../App/views/TopTools/LaserTools';
import { SNAP_TO_GRID } from '../../App/views/TopTools/DefaultTool';
import { CURRENT_MOD, MOD_LASER, MOD_WORK } from '../../App/App';
import { project } from 'paper/dist/paper-core';
import Editor, { DefaultTextSettings } from '../../modules/Editor/Editor';
import { codec64 } from '../../lib/api/cherry/codec64';
import { DefaultLaserSettings } from '../../App/views/Work/Work';
import {
  DEFAULT_LAYER_ID,
  ensureLayerData,
  findClosestLayer,
  getLayerById,
  isTextCarrier,
  isTextProxy,
  isTextRoot,
  setLayerData,
  TEXT_ROLE_CARRIER,
  TEXT_ROLE_PROXY,
  TEXT_ROLE_ROOT,
} from '../../modules/layers';

const BASE_SCALE = 'BASE_SCALE';
const OFFSET = 'OFFSET';
const FULLCIRCLE = Math.PI * 2;
const CLEAR = true;

export const OBJECTS_LAYER = 'OBJECTS_LAYER';
export const CURRENT_THEME = 'CURRENT_THEME';
export const MIRROR_SCALARS = 'MIRROR_SCALARS';
export const ORIGIN_SCALARS = 'ORIGIN_SCALARS';
export const SCALE = 'SCALE';
export const CENTER_GRID = 'CENTER_GRID';
export const SNAPPING = 'SNAPPING';
export const SNAP_HANDLE = 'SNAP_HANDLE';
export const SNAP_GRID = 'SNAP_GRID';
export const SNAP_ANGLE = 'SNAP_ANGLE';
export const CURRENT_LAYER_FILL = 'CURRENT_LAYER_FILL';
export const CURRENT_LAYER_ID = 'CURRENT_LAYER_ID';
export const ELEMENTS = 'ELEMENTS';
export const HISTORY = 'HISTORY';
export const VECTORS = 'VECTORS';
export const IMAGES = 'IMAGES';
export const CURRENT_UNIT = 'CURRENT_UNIT';
export const CURRENT_ORIGIN = 'CURRENT_ORIGIN';
export const WORKING_AREA = 'WORKING_AREA';
export const PREVIEW_OPACITY = 0.5;

export enum Origins {
  TopLeft,
  TopRight,
  BottomRight,
  BottomLeft,
}

export enum Snapping {
  NW,
  N,
  NE,
  W,
  Center,
  E,
  SW,
  S,
  SE,
}

export enum ScaleHandle {
  None = -1,
  Center,
  N,
  NE,
  E,
  SE,
  S,
  SW,
  W,
  NW,
  Angle,
}

export enum MouseAction {
  Default,
  MovingObject,
  Scrolling,
  ScalingHover,
  Scaling,
  Rotation,
}

export enum Unit {
  Metric,
  Imperial,
}

const INIT_ORIGIN = Origins.BottomLeft;
const INIT_UNIT = Unit.Metric;
const INIT_SNAP_GRID = 5;
const INIT_SNAP_ANGLE = 15;

export default class LaserCanvas {
  canvas: any;
  width: any;
  height: any;
  scale: number;
  scalars: any;
  mirrorScalars: any;
  paper: any;
  bgColor: string;
  circ: any;
  offset: { x: number; y: number };
  prevOffset: { x: number; y: number };
  centerGrid: any;
  prevScaling: any;
  baseScale: number;
  elements = [];
  resizeTimer: NodeJS.Timeout;
  resizeObserwer: ResizeObserver;
  group: any;
  mouseDown = false;
  mouseAction = MouseAction.Default;

  gridLayer: any;
  objectsLayer: any;

  gcanvas: any;
  gcodeLines = [];
  private _origin: number;
  gridLines: any;
  offsetMousePosition: { x: number; y: number };
  scales: any;
  canvasScale: any;
  canvasSelection: any;
  canvasPosition: any;
  paperAux: paper.PaperScope;
  ctxScale: any;
  currentUnit: Unit;
  currentTheme: any;
  canvasTheme: any;
  workingArea: any;

  laserCursor: any;
  toolbox: any;
  selec: any;
  selectionBounds: any;
  ctxSel: any;
  ctxPos: any;
  handles: {};
  handleSize = 6;
  canvasBounds: any;
  sizeHandle: ScaleHandle;
  scaleMousePosition: { x: any; y: any };
  scaleItem = { x: 0, y: 0 };
  currentPoint: any;

  currentSnapGrid = INIT_SNAP_GRID;
  currentSnapAngle = INIT_SNAP_ANGLE;

  currentLayerFill = null;
  currentLayerId = DEFAULT_LAYER_ID;
  currentCursor: any;
  spaceDown: boolean;
  prevTool: any;
  preview: boolean;
  isPreviewChanged = false;
  canvasPreview: any;
  ctxPreview: any;
  antiSnapDelay: boolean;
  editor: Editor;
  lastSelection: string = '';
  private textEditContext: any = null;

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  constructor(private parent) {
    this.init();
    this.events();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private init() {
    this.canvasTheme = new CavasTheme();
    this.currentTheme = this.canvasTheme.theme;
    window[CURRENT_THEME] = this.currentTheme;

    this.currentSnapGrid = window[CURRENT_UNIT] === Unit.Metric ? 5 : 0.25;
    const origin = localStorage.getItem(CURRENT_ORIGIN);
    if (!origin) localStorage.setItem(CURRENT_ORIGIN, INIT_ORIGIN);

    this.canvas = crEl(
      'canvas',
      {
        utype: 'paper',
        style: 'width:100%;height:100%;position:absolute;top:0;left:0;',
        hidpi: 'off',
        resize: true,
      },
      this.parent,
    );

    this.canvasSelection = crEl(
      'canvas',
      {
        utype: 'selection',
        style: 'width:100%;height:100%;position:absolute;top:0;left:0;pointer-events:none;',
        hidpi: 'off',
        resize: true,
      },
      this.parent,
    );
    this.ctxSel = this.canvasSelection.getContext('2d');

    this.canvasScale = crEl(
      'canvas',
      {
        utype: 'scale',
        style: 'width:100%;height:100%;position:absolute;top:0;left:0;pointer-events:none;',
        hidpi: 'off',
        resize: true,
      },
      this.parent,
    );
    this.ctxScale = this.canvasScale.getContext('2d');
    window['scalectx'] = this.ctxScale;
    this.canvasPosition = crEl(
      'canvas',
      {
        utype: 'position',
        style: 'width:100%;height:100%;position:absolute;top:0;left:0;pointer-events:none;',
        hidpi: 'off',
        resize: true,
      },
      this.parent,
    );
    this.ctxPos = this.canvasPosition.getContext('2d');

    this.canvasPreview = crEl(
      'canvas',
      {
        utype: 'preview',
        style: 'width:100%;height:100%;position:absolute;top:0;left:0;pointer-events:none;',
        hidpi: 'off',
        resize: true,
      },
      this.parent,
    );

    this.ctxPreview = this.canvasPreview.getContext('2d');

    this.baseScale = 0;
    this.scale = 1;
    window[SCALE] = this.scale;

    this.scalars = {
      x: 1,
      y: 1,
    };
    this.mirrorScalars = {
      x: 1,
      y: 1,
    };

    this.paper = new Paper.PaperScope();
    this.paper.setup(this.canvas);
    this.paper.activate();

    this.bgColor = this.currentTheme.background;
    this.canvas.style.background = this.bgColor;
    this.currentLayerId = DEFAULT_LAYER_ID;
    this.currentLayerFill = getLayerById(this.currentLayerId).color;
    window[CURRENT_LAYER_ID] = this.currentLayerId;
    window[CURRENT_LAYER_FILL] = this.currentLayerFill;

    this.offsetMousePosition = {
      x: 0,
      y: 0,
    };
    this.offset = {
      x: 0,
      y: 0,
    };

    this.gridLayer = new this.paper.Layer();
    this.objectsLayer = new this.paper.Layer();

    this.gridLayer.name = CENTER_GRID;
    this.objectsLayer.name = OBJECTS_LAYER;

    ////////////////////////////

    this.origin = this.origin;
    this.setUnit(Number(localStorage.getItem(CURRENT_UNIT)) || INIT_UNIT);
    this.currentSnapping = this.snapping;
    this.restore();

    ////////////////////////////
    ////////////////////////////

    window['paper'] = this.paper;

    this.paper.centerView = () => {
      if (!this.centerGrid) return;
      const pvb = this.paper.view.bounds;
      const cgb = this.centerGrid.bounds;
      const x = pvb.x + (pvb.width - cgb.width) / 2;
      const y = pvb.y + (pvb.height - cgb.height) / 2;
      this.paper.view.scrollBy(-x + this.offset.x, -y + this.offset.y);
    };

    this.paper.zoomFit = () => {
      if (!this.centerGrid) return;

      const pvb = this.canvas;
      const cgb = this.centerGrid.bounds;

      const scale = Math.min(pvb.height, pvb.width) / Math.max(cgb.height, cgb.width);

      this.baseScale = Math.log(scale);
      this.scale = Math.pow(2, this.baseScale);
      window[SCALE] = this.scale;

      this.resize();
    };

    this.paper.zoomSelect = () => {
      const selectedItems = this.toolbox.select.selectedItems;
      if (!selectedItems.length) return;
      const select = window['select'].bounds;

      const pvb = this.canvas;

      const scale = Math.min(pvb.height, pvb.width) / Math.max(select.height, select.width);

      this.baseScale = Math.log(scale + 2);
      this.scale = Math.pow(2, this.baseScale);
      window[SCALE] = this.scale;

      this.paper.view.setCenter(select.center);

      this.resize();
    };

    this.paper.zoomFrame = (frame) => {
      const select = {
        width: frame.r - frame.l,
        height: frame.b - frame.t,
        center: {
          x: frame.l + (frame.r - frame.l) / 2,
          y: frame.t + (frame.b - frame.t) / 2,
        },
      };

      const pvb = this.canvas;

      const scale = Math.min(pvb.height, pvb.width) / Math.max(select.height, select.width);

      this.baseScale = Math.log(scale + 2);
      this.scale = Math.pow(2, this.baseScale);
      window[SCALE] = this.scale;

      this.paper.view.setCenter(select.center);

      this.resize();
    };

    this.resize();
    this.initDraw();

    ////////////////

    this.editor = new Editor(this.parent);
    this.editor.weld = true;
    this.paper.activate();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private events() {
    this.canvas.addEventListener('wheel', (e) => {
      if (isMac && !e.ctrlKey) {
        this.offset.x = e.deltaX / this.scale;
        this.offset.y = -e.deltaY / this.scale;

        if (this.offset.x > 500) this.offset.x = 500;
        if (this.offset.x < -500) this.offset.x = -500;

        localStorage.setItem(
          OFFSET,
          JSON.stringify({
            x: this.paper.view.center.x,
            y: this.paper.view.center.y,
          }),
        );

        this.offsetMousePosition = { x: e.deltaX, y: e.deltaY };
        this.resize();
        return;
      }

      const oldScale = Math.pow(2, this.prevScaling || this.baseScale);

      this.baseScale += 0.1 * (e.deltaY > 0 ? -1 : 1);
      this.prevScaling = this.baseScale;

      if (this.baseScale <= -3.1) {
        this.baseScale = -3.1;
        return;
      }
      if (this.baseScale > 10) {
        this.baseScale = 10;
        return;
      }

      const oldCenter = this.paper.view.center;
      const mousePosition = this.paper.view.viewToProject(e.offsetX, e.offsetY);
      this.scale = Math.pow(2, this.baseScale);

      window[SCALE] = this.scale;

      this.offset.x = (mousePosition.x - oldCenter.x) * (1 - oldScale / this.scale);
      this.offset.y = (mousePosition.y - oldCenter.y) * (1 - oldScale / this.scale);

      if (e.ctrlKey) this.offset = { x: 0, y: 0 };

      localStorage.setItem(BASE_SCALE, JSON.stringify({ scale: this.scale, baseScale: this.baseScale }));

      this.resize();
    });

    /////////////////////////////////////////////////////////////

    this.canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    this.canvas.addEventListener('drop', async (e) => {
      e.preventDefault();
      const data = e.dataTransfer;
      const files = data.files;

      if (!files.length) return;

      if (typeof this.onBeforeDrop === 'function') this.onBeforeDrop();

      await this.import(files, e);
    });
    /////////////////////////////////////////////////////////////

    this.paper.view.onMouseMove = (e) => {
      if (this.editor.visible) return;

      e.event.preventDefault();

      this.currentPoint = e.point;

      this.handlePosition();
      this.handleScrollingMouseMove(e);

      if (this.spaceDown) return;

      switch (this.toolbox.tool) {
        case ToolboxMode.Select:
          this.handleSelectToolMouseMove(e);
          break;

        case ToolboxMode.Rectangle:
        case ToolboxMode.Circle:
          this.handleToolMouseMove(e);
          break;
      }
    };

    ///////////////////////////////////////////    ///////////////////////////////////////////

    this.paper.view.onKeyDown = (e) => {
      if (this.editor.visible) return;

      const ev = e.event;
      const ctrl = ev.ctrlKey || ev.metaKey;
      const shift = ev.shift;
      e.point = this.currentPoint;

      if (ev.code === 'Space') {
        if (!this.currentCursor) {
          this.currentCursor = this.paper.view.element.style.cursor;
        }
        this.spaceDown = true;
        this.paper.view.element.style.cursor = 'grab';
      }

      switch (this.toolbox.tool) {
        case ToolboxMode.Select:
          if (ctrl) this.updateScaleItem(e);
          if (this.mouseAction === MouseAction.Scaling)
            this.toolbox.scale(this.sizeHandle, this.scaleItem, this.scale, e);
          break;

        case ToolboxMode.Rectangle:
        case ToolboxMode.Circle:
          if ((ctrl || shift) && this.mouseDown) this.handleToolMouseMove(e);
          break;

        case ToolboxMode.Location:
          break;
      }
    };

    this.paper.view.onKeyUp = (e) => {
      if (this.editor.visible) return;

      const ev = e.event;
      const ctrl = ev.ctrlKey || ev.metaKey;
      e.point = this.currentPoint;

      if (this.spaceDown) {
        if (this.currentCursor === 'grab') this.currentCursor = null;
        this.paper.view.element.style.cursor = this.currentCursor;
        this.spaceDown = false;
        this.currentCursor = null;
      }

      switch (this.toolbox.tool) {
        case ToolboxMode.Select:
          if (ctrl) this.updateScaleItem(e);
          if (this.mouseAction === MouseAction.Scaling)
            this.toolbox.scale(this.sizeHandle, this.scaleItem, this.scale, e);
          break;

        case ToolboxMode.Rectangle:
        case ToolboxMode.Circle:
          this.handleToolMouseMove(e);
          break;

        case ToolboxMode.Location:
          break;
      }
    };

    ///////////////////////////////////////////    //////////////////////////////////////////

    this.paper.view.onDoubleClick = (e) => {
      const hit = this.toolbox.checkHit(e.point);
      if (!hit || !hit.item || !hit.item.opacity) return;
      const textItem = this.findTextAncestor(hit.item);
      if (!textItem) return;
      this.startTextEditSession(textItem);
    };
    ///////////////////////////////////////////    //////////////////////////////////////////

    this.paper.view.onMouseDown = async (e) => {
      if (this.editor.visible) return;
      document.activeElement.blur();
      const mod = window[CURRENT_MOD];

      this.mouseDown = true;
      this.handleScrollingMouseDown(e);

      if (e.event.button === 0 && this.spaceDown) {
        this.offsetMousePosition = { x: e.event.clientX, y: e.event.clientY };
        return;
      }
      this.currentSnapGrid = window[CURRENT_UNIT] === Unit.Metric ? 5 : writeUni(0.25);

      window[SNAP_GRID] = this.currentSnapGrid;
      window[CURRENT_LAYER_ID] = this.currentLayerId;
      window[CURRENT_LAYER_FILL] = this.currentLayerFill;

      switch (this.toolbox.tool) {
        case ToolboxMode.Select:
          if (mod === MOD_WORK) this.handleSelectToolMouseDown(e);
          break;

        case ToolboxMode.Text:
          if (mod === MOD_WORK) this.handleTextToolMouseDown(e);
          break;

        case ToolboxMode.Rectangle:
        case ToolboxMode.Circle:
          this.handleToolMouseDown(e);
          break;

        case ToolboxMode.Location:
          if (mod === MOD_LASER) this.handleLocationToolMouseDown(e);
          break;
      }
    };

    ///////////////////////////////////////////    ///////////////////////////////////////////

    this.canvas.addEventListener('mouseleave', () => {
      this.updatePosition({ justClear: true });
    });

    ///////////////////////////////////////////    ///////////////////////////////////////////

    this.toolbox.onElementCreated = (element) => {
      this.applyLayerToElement(element, this.currentLayerId);
      this.elements[element.uid] = element;
      this.isPreviewChanged = true;

      if (typeof this.onElementCreated === 'function') this.onElementCreated({ uids: [element] });
    };

    ///////////////////////////////////////////    ///////////////////////////////////////////

    this.toolbox.onSelect = () => {
      const selected = this.toolbox.select.selectedItems
        .map((item) => item.uid)
        .sort()
        .join(',');
      if (this.lastSelection === selected) return;
      this.lastSelection = selected;

      if (typeof this.onSelect === 'function') this.onSelect();
    };

    ///////////////////////////////////////////    ///////////////////////////////////////////

    this.toolbox.onRemove = () => {
      if (typeof this.onRemove === 'function') this.onRemove();
    };

    this.toolbox.onDuplicate = (uids) => {
      if (typeof this.onDuplicate === 'function') this.onDuplicate(uids);
    };

    ///////////////////////////////////////////    ///////////////////////////////////////////

    document.addEventListener('mouseup', (e) => {
      this.mouseDown = false;

      this.paper.view.element.style.cursor = null;
      this.spaceDown = false;
      this.currentCursor = null;

      if (this.editor.visible) return;

      if (typeof this.onEndAction === 'function' && this.mouseAction !== MouseAction.Default) {
        if (this.mouseAction === MouseAction.Rotation) this.updateAngles();
        this.onEndAction(this.mouseAction);
      }

      this.mouseAction = MouseAction.Default;
      this.sizeHandle = ScaleHandle.None;
      this.offsetMousePosition = { x: e.clientX, y: e.clientY };

      switch (this.toolbox.tool) {
        case ToolboxMode.Select:
          this.handleSelectToolMouseUp(e);
          break;

        case ToolboxMode.Rectangle:
        case ToolboxMode.Circle:
          this.handleToolMouseUp();
          break;
      }

      this.resetMouseActions();
    });

    this.paper.view.onMouseUp = (e) => {
      if (this.editor.visible) return;

      this.toolbox.onMouseUp(e);
    };

    ///////////////////////////////////

    this.toolbox.onUpdateSelection = (bounds) => {
      this.selectionBounds = bounds;
      this.updateSelection();
    };

    this.toolbox.onUnselectAll = () => {
      if (this.selectionBounds) {
        this.selectionBounds = null;
        this.handles = {};
        this.updateSelection();
        this.resetMouseActions();
        if (typeof this.onUnselectAll === 'function') this.onUnselectAll();
      }
    };

    ///////////////////////////////////

    this.handleEditorEvents();

    ///////////////////////////////////

    this.resizeObserwer = new ResizeObserver((entities) => {
      this.resize();
    });
    this.resizeObserwer.observe(this.canvas);

    ///////////////////////////////////
  }

  ////////////////////////////////////////////////////////////////////////////////

  private setEditorStartPointFromCanvas(x: number, y: number) {
    const mapped = this.projectToEditorPoint(x, y);
    this.editor.startPoint = {
      x: mapped.x,
      y: mapped.y,
      endX: x,
      endY: y,
    };
  }

  private projectToEditorPoint(x: number, y: number) {
    const mx = this.mirrorScalars.x;
    const my = this.mirrorScalars.y;
    const width = this.centerGrid?.bounds?.width || this.workingArea?.width || 0;
    const height = this.centerGrid?.bounds?.height || this.workingArea?.height || 0;
    return {
      x: mx < 0 ? width - x : x,
      y: my < 0 ? height - y : y,
    };
  }

  private syncEditorViewFromMain() {
    if (!this.editor || !this.editor.paper || !this.editor.paper.view || !this.paper || !this.paper.view) return;
    const center = this.paper.view.center;
    const mappedCenter = this.projectToEditorPoint(center.x, center.y);
    this.editor.paper.activate();
    this.editor.paper.view.scaling = {
      x: this.scale,
      y: this.scale,
    };
    this.editor.paper.view.setViewSize(this.width, this.height);
    this.editor.paper.view.center = new this.editor.paper.Point(mappedCenter.x, mappedCenter.y);
    this.paper.activate();
  }

  private findTextAncestor(item: any) {
    let current = item;
    while (current) {
      if (isTextRoot(current) || isTextCarrier(current) || isTextProxy(current) || current.kind === E_KIND_TEXT) {
        return current;
      }
      current = current.parent;
    }
    return null;
  }

  private makeTextLinkId() {
    return codec64.uId('text_');
  }

  private getTextProxy(item: any) {
    if (!item) return null;
    if (isTextProxy(item)) return item;
    if (isTextRoot(item)) {
      const children = item.children || [];
      for (let i = 0; i < children.length; i++) {
        if (isTextProxy(children[i])) return children[i];
      }
    }
    const proxyUid = item?.data?.proxyUid;
    if (proxyUid && this.elements[proxyUid]) return this.elements[proxyUid];
    return item.kind === E_KIND_TEXT && !isTextCarrier(item) && !isTextRoot(item) ? item : null;
  }

  private getTextCarrier(item: any) {
    if (!item) return null;
    if (isTextCarrier(item)) return item;
    if (isTextRoot(item)) {
      const children = item.children || [];
      for (let i = 0; i < children.length; i++) {
        if (isTextCarrier(children[i])) return children[i];
      }
    }
    const carrierUid = item?.data?.carrierUid;
    if (carrierUid && this.elements[carrierUid]) return this.elements[carrierUid];
    return null;
  }

  private getTextRoot(item: any) {
    if (!item) return null;
    if (isTextRoot(item)) return item;
    const rootUid = item?.data?.textRootUid;
    if (rootUid && this.elements[rootUid]) return this.elements[rootUid];
    let current = item.parent;
    while (current) {
      if (isTextRoot(current)) return current;
      current = current.parent;
    }
    return null;
  }

  private removeTextLinkArtifacts(context: any) {
    if (!context) return;
    const removeByUid = (uid: string) => {
      if (!uid) return;
      const entry = this.elements[uid];
      if (entry && entry.remove) entry.remove();
      if (this.elements[uid]) delete this.elements[uid];
    };
    removeByUid(context.rootUid);
    removeByUid(context.proxyUid);
    removeByUid(context.carrierUid);
  }

  private createTextCarrier(proxy: any, textSettings: any, layerId: string, layerColor: string, linkId: string) {
    const center = proxy?.position || new this.paper.Point(0, 0);
    const carrier = new this.paper.Path.Circle({
      center,
      radius: 0.1,
    });
    carrier.kind = E_KIND_TEXT;
    carrier.uid = codec64.uId('text_carrier_');
    carrier.userGroup = false;
    carrier.uname = 'Text Carrier';
    carrier.visible = false;
    carrier.opacity = 0;
    // Carrier must follow group transforms; keep it hidden/non-output instead of locked.
    carrier.locked = false;
    carrier.strokeColor = null;
    carrier.fillColor = null;
    carrier.laserSettings = DeepCopy(DefaultLaserSettings);
    carrier.laserSettings.output = false;
    carrier.laserSettings.includeInFrame = false;
    if (!carrier.data) carrier.data = {};
    carrier.data.textRole = TEXT_ROLE_CARRIER;
    carrier.data.textLinkId = linkId;
    carrier.data.textSettings = DeepCopy(textSettings || {});
    carrier.data.layerId = layerId;
    carrier.data.layerColor = layerColor;
    return carrier;
  }

  private createTextRoot(proxy: any, carrier: any, layerId: string, layerColor: string, linkId: string) {
    const root = new this.paper.Group([proxy, carrier]);
    root.kind = E_KIND_TEXT;
    root.uid = codec64.uId('text_root_');
    root.type = E_KIND_GROUP;
    root.userGroup = false;
    root.uname = 'Text';
    root.laserSettings = DeepCopy(proxy?.laserSettings || DefaultLaserSettings);
    if (!root.data) root.data = {};
    root.data.textRole = TEXT_ROLE_ROOT;
    root.data.textLinkId = linkId;
    root.data.layerId = layerId;
    root.data.layerColor = layerColor;
    root.data.proxyUid = proxy.uid;
    root.data.carrierUid = carrier.uid;
    root.data.textSettings = DeepCopy(proxy?.data?.textSettings || carrier?.data?.textSettings || {});
    return root;
  }

  private stampTextPair(proxy: any, carrier: any, root: any, linkId: string) {
    if (!proxy.data) proxy.data = {};
    if (!carrier.data) carrier.data = {};
    if (!root.data) root.data = {};
    proxy.data.textRole = TEXT_ROLE_PROXY;
    proxy.data.textLinkId = linkId;
    proxy.data.carrierUid = carrier.uid;
    proxy.data.textRootUid = root.uid;
    proxy.data.textLogicalUid = root.uid;
    proxy.inGroup = true;
    carrier.data.textRole = TEXT_ROLE_CARRIER;
    carrier.data.textLinkId = linkId;
    carrier.data.proxyUid = proxy.uid;
    carrier.data.textRootUid = root.uid;
    carrier.data.textLogicalUid = root.uid;
    carrier.inGroup = true;
    root.data.textRole = TEXT_ROLE_ROOT;
    root.data.textLinkId = linkId;
    root.data.proxyUid = proxy.uid;
    root.data.carrierUid = carrier.uid;
    root.data.textRootUid = root.uid;
    root.data.textLogicalUid = root.uid;
    root.data.textSettings = DeepCopy(proxy?.data?.textSettings || carrier?.data?.textSettings || {});
  }

  private ensureTextRootForProxy(proxy: any) {
    if (!proxy || !proxy.uid) return null;
    if (!proxy.data) proxy.data = {};
    if (!proxy.data.textSettings) return null;
    const layerId = proxy?.data?.layerId || this.currentLayerId;
    const layerColor = proxy?.data?.layerColor || this.currentLayerFill;

    let carrier = this.getTextCarrier(proxy);
    let root = this.getTextRoot(proxy);
    let linkId = proxy?.data?.textLinkId || this.makeTextLinkId();
    if (carrier && carrier?.data?.proxyUid && carrier.data.proxyUid !== proxy.uid) {
      carrier = null;
      linkId = this.makeTextLinkId();
    }
    if (root && root?.data?.proxyUid && root.data.proxyUid !== proxy.uid) {
      root = null;
      linkId = this.makeTextLinkId();
    }
    if (!carrier) {
      carrier = this.createTextCarrier(proxy, proxy.data.textSettings, layerId, layerColor, linkId);
      this.elements[carrier.uid] = carrier;
    }
    if (!root) {
      const previousParent = proxy.parent && proxy.parent.uid !== SELECT ? proxy.parent : this.objectsLayer;
      root = this.createTextRoot(proxy, carrier, layerId, layerColor, linkId);
      previousParent.addChild(root);
      root.inGroup = previousParent.uid !== this.objectsLayer.uid;
      this.elements[root.uid] = root;
    } else {
      if (proxy.parent !== root) root.addChild(proxy);
      if (carrier.parent !== root) root.addChild(carrier);
    }
    carrier.data.textSettings = DeepCopy(proxy.data.textSettings || carrier.data.textSettings || {});
    // Normalize legacy carriers that may keep stale/oversized geometry from older grouping behavior.
    // Carrier is metadata-only and should not affect selection bounds.
    if (carrier.removeSegments) {
      carrier.removeSegments();
      const marker = new this.paper.Path.Circle({
        center: proxy.position,
        radius: 0.1,
        insert: false,
      });
      carrier.addSegments(marker.segments);
      carrier.closed = true;
      marker.remove();
    }
    carrier.position = proxy.position;
    carrier.locked = false;
    this.applyLayerToElement(carrier, layerId, layerColor, false);
    carrier.laserSettings.output = false;
    carrier.laserSettings.includeInFrame = false;
    carrier.visible = false;
    carrier.opacity = 0;
    this.applyLayerToElement(root, layerId, layerColor, false);
    this.stampTextPair(proxy, carrier, root, linkId);
    this.elements[proxy.uid] = proxy;
    this.elements[carrier.uid] = carrier;
    this.elements[root.uid] = root;
    return root;
  }

  ensureTextLinkPairs() {
    const entries = this.elements || {};
    const uids = Object.keys(entries);
    const seenLink = {};
    for (let i = 0; i < uids.length; i++) {
      const item = entries[uids[i]];
      if (!item || item.uid === SELECT) continue;
      if (isTextCarrier(item)) continue;
      if (isTextRoot(item)) continue;
      if (item.kind === E_KIND_TEXT || isTextProxy(item)) {
        const root = this.ensureTextRootForProxy(item);
        const linkId = item?.data?.textLinkId;
        if (linkId) seenLink[linkId] = true;
        if (root?.data?.textLinkId) seenLink[root.data.textLinkId] = true;
      }
    }
    const cleanupUids = Object.keys(entries);
    for (let i = 0; i < cleanupUids.length; i++) {
      const item = entries[cleanupUids[i]];
      if (!isTextCarrier(item) && !isTextRoot(item)) continue;
      const linkId = item?.data?.textLinkId;
      const proxyUid = item?.data?.proxyUid || item?.data?.carrierUid;
      if (proxyUid && this.elements[proxyUid]) continue;
      if (linkId && seenLink[linkId]) continue;
      if (item.remove) item.remove();
      delete this.elements[item.uid];
    }
  }

  private getTextStartPointForItem(textItem: any) {
    const textSettings = textItem?.data?.textSettings || {};
    const left = Number(textSettings.left) || 0;
    const top = Number(textSettings.top) || 0;
    const mx = this.mirrorScalars.x;
    const my = this.mirrorScalars.y;
    const b = textItem?.bounds;
    const leftEdge = b ? b.left : textItem.position.x;
    const rightEdge = b ? b.right : textItem.position.x;
    const topEdge = b ? b.top : textItem.position.y;
    const bottomEdge = b ? b.bottom : textItem.position.y;
    return {
      x: mx < 0 ? rightEdge - left : leftEdge - left,
      y: my < 0 ? bottomEdge - top : topEdge - top,
    };
  }

  private startTextEditSession(textItem?: any) {
    if (textItem && textItem.kind === E_KIND_TEXT) {
      const proxy = this.getTextProxy(textItem) || textItem;
      const root = this.getTextRoot(textItem) || this.ensureTextRootForProxy(proxy);
      const carrier = this.getTextCarrier(textItem) || this.getTextCarrier(root);
      const start = this.getTextStartPointForItem(proxy);
      this.setEditorStartPointFromCanvas(start.x, start.y);
      this.selectionBounds = null;
      this.toolbox.select.unselectAll();
      const editParent = root?.parent && root.parent.uid !== SELECT ? root.parent : this.objectsLayer;
      this.textEditContext = {
        linkId: root?.data?.textLinkId || carrier?.data?.textLinkId || proxy?.data?.textLinkId || this.makeTextLinkId(),
        rootUid: root?.uid,
        carrierUid: carrier?.uid,
        proxyUid: proxy?.uid,
        parentUid: editParent?.uid,
      };
      const source = carrier || proxy;
      const editable = {
        uid: source?.uid,
        position: { x: proxy.position.x, y: proxy.position.y },
        data: {
          textSettings: DeepCopy(source?.data?.textSettings || proxy?.data?.textSettings || {}),
          layerId: proxy?.data?.layerId || source?.data?.layerId || this.currentLayerId,
          layerColor: proxy?.data?.layerColor || source?.data?.layerColor || this.currentLayerFill,
          textLinkId: this.textEditContext.linkId,
          rootUid: this.textEditContext.rootUid,
          carrierUid: this.textEditContext.carrierUid,
          proxyUid: this.textEditContext.proxyUid,
        },
        remove: () => {},
      };
      this.removeTextLinkArtifacts(this.textEditContext);
      this.editor.edit(editable as any);
    } else {
      this.textEditContext = null;
      this.editor.edit();
    }
    this.resize();
  }

  getTextPlacementForCommit(textElement: any) {
    if (this.editor?.originalElementPosition) {
      return {
        useOriginalPosition: true,
        position: this.editor.originalElementPosition,
      };
    }

    const mx = this.mirrorScalars.x;
    const my = this.mirrorScalars.y;
    const textSettings = textElement?.data?.textSettings || {};
    const left = Number(textSettings.left) || 0;
    const top = Number(textSettings.top) || 0;
    const startPoint = this.editor?.startPoint || { x: 0, y: 0, endX: 0, endY: 0 };
    const pivot = [
      mx < 0 ? textElement.bounds.right : textElement.bounds.left,
      my < 0 ? textElement.bounds.bottom : textElement.bounds.top,
    ];
    const position = [
      mx < 0 ? startPoint.endX - left : startPoint.x + left,
      my < 0 ? startPoint.endY - top : startPoint.y + top,
    ];

    return {
      useOriginalPosition: false,
      pivot,
      position,
    };
  }

  replaceElement(textItem: any) {
    if (!textItem || !textItem.uid) return;
    const root = this.getTextRoot(textItem);
    const source = root || textItem;
    this.startTextEditSession(textItem);
    this.editor.textSettings = source.data.textSettings;
    this.editor.endEdit();
  }

  resolveTextSelection(item: any) {
    if (!item) return null;
    if (isTextRoot(item)) return item;
    const proxy = this.getTextProxy(item);
    if (proxy) {
      return this.getTextRoot(proxy) || this.ensureTextRootForProxy(proxy);
    }
    return this.getTextRoot(item) || null;
  }

  convertTextToPath(textItem: any) {
    const root = this.resolveTextSelection(textItem);
    if (!root) return null;
    const proxy = this.getTextProxy(root);
    if (!proxy) return null;
    const parent = root.parent && root.parent.uid !== SELECT ? root.parent : this.objectsLayer;
    const parentUid = parent?.uid;
    const wasInGroup = !!root.inGroup;

    const vector = proxy.clone();
    const reassignUid = (node: any) => {
      if (!node) return;
      node.uid = codec64.uId(node.userGroup ? 'group_' : 'element_');
      const children = node.children || [];
      for (let i = 0; i < children.length; i++) reassignUid(children[i]);
    };
    reassignUid(vector);
    if (!vector.data) vector.data = {};
    delete vector.data.textRole;
    delete vector.data.textLinkId;
    delete vector.data.carrierUid;
    delete vector.data.proxyUid;
    delete vector.data.textRootUid;
    delete vector.data.textLogicalUid;
    delete vector.data.textSettings;
    vector.kind = E_KIND_VECTOR;
    vector.type = E_KIND_VECTOR;
    vector.userGroup = true;
    vector.inGroup = false;
    vector.strokeScaling = false;
    vector.uname = (root.uname || 'Text') + ' Path';
    if (vector.children && vector.children.length) {
      for (let i = 0; i < vector.children.length; i++) {
        const child = vector.children[i];
        if (!child.data) child.data = {};
        delete child.data.textRole;
        delete child.data.textLinkId;
        delete child.data.carrierUid;
        delete child.data.proxyUid;
        delete child.data.textRootUid;
        delete child.data.textLogicalUid;
        child.inGroup = true;
      }
    }

    (parent || this.objectsLayer).addChild(vector);
    vector.inGroup = wasInGroup;
    if (parentUid) vector.currentParent = parentUid;
    this.elements[vector.uid] = vector;

    const context = {
      rootUid: root.uid,
      proxyUid: proxy.uid,
      carrierUid: this.getTextCarrier(root)?.uid,
    };
    this.removeTextLinkArtifacts(context);
    return vector;
  }

  ////////////////////////////////////////////////////////////////////////////////

  handleEditorEvents() {
    this.editor.onEndEditText = async (el, silentFlag) => {
      if (!el) return;

      this.paper.activate();
      const text = new CanvasVector(this.paper);
      await text.loadText(el.clone({ insert: false }));
      const proxy = text.vector;
      proxy.kind = E_KIND_TEXT;
      proxy.userGroup = false;
      proxy.data.textRole = TEXT_ROLE_PROXY;
      proxy.data.textSettings = el.data.textSettings;
      const sourceSettings = el.laserSettings ? DeepCopy(el.laserSettings) : DeepCopy(DefaultLaserSettings);
      proxy.laserSettings = sourceSettings;
      const sourceLayerId = el?.data?.editLayerId || el?.data?.layerId || this.currentLayerId;
      const sourceLayerColor = el?.data?.editLayerColor || el?.data?.layerColor || this.currentLayerFill;
      this.applyLayerToElement(proxy, sourceLayerId, sourceLayerColor);

      const linkId = el?.data?.editTextLinkId || this.textEditContext?.linkId || this.makeTextLinkId();
      const carrier = this.createTextCarrier(proxy, el.data.textSettings, sourceLayerId, sourceLayerColor, linkId);
      const root = this.createTextRoot(proxy, carrier, sourceLayerId, sourceLayerColor, linkId);
      this.stampTextPair(proxy, carrier, root, linkId);

      this.elements[proxy.uid] = proxy;
      this.elements[carrier.uid] = carrier;
      this.elements[root.uid] = root;
      const parentUid = this.textEditContext?.parentUid;
      const parent = (parentUid && this.elements[parentUid]) || this.objectsLayer;
      parent.addChild(root);
      root.inGroup = parent.uid !== this.objectsLayer.uid;

      el.remove();
      this.textEditContext = null;

      if (typeof this.onEndEditText === 'function') this.onEndEditText(root, silentFlag);
    };
  }

  ////////////////////////////////////////////////////////////////////////////////

  async offsetElement({ distance, cap, join }) {
    const el = new this.paper.Group(
      weld(
        new this.paper.Group(
          PaperOffset.offset(weld(window['select'].clone({ insert: false }), this.paper), distance, {
            cap,
            join,
            insert: false,
          }),
        ),
        this.paper,
      ),
    );
    el.kind = E_KIND_VECTOR;
    el.userGroup = true;
    const combined = new CanvasVector(this.paper);
    await combined.loadCombine(el, 'Offset');
    const element = combined.vector;
    element.kind = E_KIND_VECTOR;
    element.userGroup = true;
    this.elements[element.uid] = element;
    this.objectsLayer.addChild(element);

    if (typeof this.onEndEdit === 'function') this.onEndEdit(element);
  }

  ////////////////////////////////////////////////////////////////////////////////

  async combineElement(x) {
    const el = new this.paper.Group(weld(window['select'].clone({ insert: false }), this.paper, x));
    const combined = new CanvasVector(this.paper);
    await combined.loadCombine(el);
    const element = combined.vector;
    element.kind = E_KIND_VECTOR;
    element.userGroup = true;
    this.elements[element.uid] = element;
    this.objectsLayer.addChild(element);

    if (typeof this.onEndEdit === 'function') this.onEndEdit(element);
  }

  ////////////////////////////////////////////////////////////////////////////////

  handleTextToolMouseDown(e: any) {
    if (e.event.button !== 0) return;
    const { x, y } = this.calculateSnap(e);
    this.setEditorStartPointFromCanvas(x, y);
    this.startTextEditSession();

    if (typeof this.onStartEdit === 'function') this.onStartEdit();
  }

  /////////////////////////////////////////////////////////////////////////////////

  async importFiles(filePaths: string[]) {
    if (!filePaths || !filePaths.length) return;
    const files = filePaths.map((filePath) => ({
      path: filePath,
      name: path.basename(filePath),
      type: '',
    }));
    await this.import(files);
  }

  /////////////////////////////////////////////////////////////////////////////////

  private async import(files: any, e?: any) {
    this.toolbox.select.unselectAll();

    this.objectsLayer.activate();

    let uid;
    let uids = [];
    let addUid = false;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dir = path.dirname(file.path);
      const ext = path.extname(file.path).toLowerCase();
      const name = file.name;
      const type = file.type.toLowerCase();
      const fileName = path.resolve(dir, name);

      if (ext === '.svg' || type.indexOf('svg') > -1) {
        const svg = new CanvasVector(this.paper);
        await svg.loadSVG(fileName);
        this.initPosition(svg, e);
        uid = svg.uid;
        addUid = true;
      }

      if (ext === '.dxf' || type.indexOf('dxf') > -1) {
        const dxf = new CanvasVector(this.paper);
        await dxf.loadDXF(fileName);
        this.initPosition(dxf, e);
        uid = dxf.uid;

        addUid = true;
      }

      if (ext === '.pdf' || type.indexOf('pdf') > -1 || ext === '.ai') {
        const pdf = new CanvasVector(this.paper);
        await pdf.loadPDF(fileName);
        this.initPosition(pdf, e);
        uid = pdf.uid;

        addUid = true;
      }

      if (
        ext === '.jpg' ||
        type.indexOf('jpg') > -1 ||
        ext === '.jpeg' ||
        type.indexOf('jpeg') > -1 ||
        ext === '.png' ||
        type.indexOf('png') > -1 ||
        ext === '.jfif' ||
        type.indexOf('jfif') > -1 ||
        ext === '.webp' ||
        type.indexOf('webp') > -1 ||
        ext === '.bmp' ||
        type.indexOf('bmp') > -1
      ) {
        const image = new CanvasImage(this.paper);
        await image.loadImage(fileName, type);
        this.initPosition(image.element, e);
        uid = image.uid;

        addUid = true;
      }

      if (addUid) {
        addUid = false;
        uids.push(uid);
      }
    }

    if (uids.length) {
      this.isPreviewChanged = true;

      if (typeof this.onElementDropped === 'function') this.onElementDropped({ uids });
    }
  }

  /////////////////////////////////////////////////////////////////////////////

  updateAngles() {
    const selectedItems = this.toolbox.select.selectedItems;
    if (!selectedItems || !selectedItems.length) return;
    for (let i = 0; i < selectedItems.length; i++) {
      const child = selectedItems[i];
      child.data.prevRotation = child.data.rotation;
      child.data.rotation = this.toolbox.select.rotation;
    }
  }

  /////////////////////////////////////////////////////////////////////////////

  private initPosition(element: CanvasVector | CanvasImage, e?) {
    this.elements[element.uid] = element;

    let x = this.workingArea.width / 2;
    let y = this.workingArea.height / 2;
    const position = this.paper.view.projectToView(x, y);
    x = position.x;
    y = position.y;

    if (e) {
      x = e.offsetX;
      y = e.offsetY;
    }

    element.position = this.paper.view.viewToProject(x, y);
    this.toolbox.select.slectedItems = element.rasterized ? element : element.element.children;
    this.toolbox.select.group();
    const grouped = this.toolbox.select.selectedItems && this.toolbox.select.selectedItems[0];
    if (grouped) {
      this.assignImportedLayers(grouped);
    } else {
      this.applyLayerToElement(element, this.currentLayerId, this.currentLayerFill);
    }
  }

  setActiveLayer(layerId: string, layerColor?: string) {
    const layer = getLayerById(layerId);
    this.currentLayerId = layer.id;
    this.currentLayerFill = layerColor || layer.color;
    window[CURRENT_LAYER_ID] = this.currentLayerId;
    window[CURRENT_LAYER_FILL] = this.currentLayerFill;
  }

  private resolveImportedColor(item: any) {
    if (!item) return null;
    const cssColor = item?.data?.strokeColor || item?.data?.fillColor;
    return cssColor || null;
  }

  private assignImportedLayers(root: any) {
    if (!root) return;
    const drawable = [];
    const walk = (item) => {
      if (!item) return;
      const hasUid = !!item.uid;
      if (hasUid) {
        drawable.push(item);
      }
      if (item.children && item.children.length) {
        for (let i = 0; i < item.children.length; i++) walk(item.children[i]);
      }
    };
    walk(root);
    if (!drawable.length) return;

    let colored = 0;
    for (let i = 0; i < drawable.length; i++) {
      const item = drawable[i];
      const sourceColor = this.resolveImportedColor(item);
      if (!sourceColor) continue;
      const layer = findClosestLayer(sourceColor, true);
      this.applyLayerToElement(item, layer.id, layer.color, false);
      colored++;
    }

    if (!colored) {
      this.applyLayerToElement(root, this.currentLayerId, this.currentLayerFill, true);
      return;
    }

    for (let i = 0; i < drawable.length; i++) {
      const item = drawable[i];
      if (!item?.data?.layerId) this.applyLayerToElement(item, this.currentLayerId, this.currentLayerFill, false);
    }
  }

  applyLayerToElement(item: any, layerId: string, layerColor?: string, recursive = true) {
    if (!item) return;
    const layer = getLayerById(layerId);
    const color = layerColor || layer.color;

    ensureLayerData(item, layer.id);
    setLayerData(item, layer.id, color);

    if (isTextCarrier(item)) {
      item.strokeColor = null;
      item.fillColor = null;
      item.visible = false;
      item.opacity = 0;
    } else if (!isTextRoot(item)) {
      if (item.strokeColor !== undefined) item.strokeColor = getElementColor(item);
      if (item.fillColor !== undefined) {
        const laserType = item?.laserSettings?.laserType;
        item.fillColor = laserType === 2 ? getElementColor(item) : null;
      }
    }

    if (!recursive || !item.children || !item.children.length) return;
    for (let i = 0; i < item.children.length; i++) {
      this.applyLayerToElement(item.children[i], layer.id, color, true);
    }
  }

  private savePNG() {
    let baseFormat = 'png';
    let fname = this.currentTheme.name + '.png';
    html2canvas(this.canvas.parentElement).then(function (canvas) {
      console.log(canvas);
      const url = canvas.toDataURL(`image/${baseFormat}`);
      const base64Data = url.replace(/^data:image\/jpeg;base64,/, '').replace(/^data:image\/png;base64,/, '');

      fs.writeFileSync(fname, base64Data, 'base64', function (err) {
        console.log(err);
      });
    });
  }

  setUnit(unit: Unit) {
    window[CURRENT_UNIT] = unit;
    window[SNAP_GRID] = this.currentUnit = unit;
    localStorage.setItem(CURRENT_UNIT, unit);
    this.update();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  setParentView(element: any, preview = false) {
    if (this.editor.visible) {
      this.editor.endEdit(true);
    }
    const NO_OFFSET = false;
    this.parent = element;
    element.appendChild(this.canvas);
    element.appendChild(this.canvasSelection);
    element.appendChild(this.canvasScale);
    element.appendChild(this.canvasPosition);
    element.appendChild(this.canvasPreview);
    this.preview = preview;
    if (preview) {
      this.prevTool = this.toolbox.tool;
      this.setTool(ToolboxMode.None);
      this.objectsLayer.strokeColor = '#999';
      this.objectsLayer.opacity = 1;

      this.laserCursor.opacity = 1;
      this.imagesVisible(false);
    } else {
      this.imagesVisible(true);
      this.objectsLayer.opacity = 1;
      this.laserCursor.opacity = 0.5;
      this.objectsLayer.strokeColor = window[CURRENT_THEME].object.strokeColor;
      this.setTool(this.prevTool || ToolboxMode.Select);
      this.objectsLayer.activate();
    }
    this.resize(NO_OFFSET);
  }

  imagesVisible(op) {
    const images = window[IMAGES];
    if (!images) return;
    Object.keys(images).forEach((uid) => {
      const image = images[uid];
      if (image.visible === false) {
        image.opacity = 0;
        return;
      }
      image.opacity = image.laserSettings.output ? (op ? 1 : 0.1) : 0.35;
    });
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private output2Array = function (target) {
    return {
      write: function (cmd) {
        target.push(cmd);
      },
    };
  };

  handleToolMouseUp() {
    this.toolbox.onMouseUp();
  }

  handleToolMouseMove(e: any) {
    this.toolbox.onMouseMove(e);
  }

  handleToolMouseDown(e: any) {
    if (e.event.button !== 0) return;
    this.toolbox.onMouseDown(e);
  }

  private updateScaleItem(e: any) {
    if (this.scaleMousePosition) {
      this.scaleItem.x = e.event.offsetX - this.scaleMousePosition.x;
      this.scaleItem.y = e.event.offsetY - this.scaleMousePosition.y;
      this.isPreviewChanged = true;
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  handlePosition() {
    this.updatePosition();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private handleScrollingMouseMove(e: any) {
    if (this.mouseDown && this.spaceDown) {
      this.offset.x = e.event.clientX - this.offsetMousePosition.x;
      this.offset.y = e.event.clientY - this.offsetMousePosition.y;

      localStorage.setItem(
        OFFSET,
        JSON.stringify({
          x: this.paper.view.center.x,
          y: this.paper.view.center.y,
        }),
      );

      this.offsetMousePosition = { x: e.event.clientX, y: e.event.clientY };

      this.paper.activate();
      this.paper.view.scrollBy(
        (-this.offset.x * this.mirrorScalars.x) / this.scale,
        (-this.offset.y * this.mirrorScalars.y) / this.scale,
      );
      this.syncEditorViewFromMain();

      this.addScale();
    }
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private handleScrollingMouseDown(e: any) {
    if (
      this.mouseAction !== MouseAction.ScalingHover &&
      (e.event.button === 1 || (e.event.button === 0 && this.spaceDown))
    ) {
      this.paper.view.element.style.cursor = 'grab';
      this.spaceDown = true;
      this.mouseAction = MouseAction.Scrolling;
      this.offsetMousePosition = {
        x: e.event.clientX,
        y: e.event.clientY,
      };
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private handleSelectToolMouseUp(e) {
    this.scaleMousePosition = {
      x: e.offsetX,
      y: e.offsetY,
    };
    if (this.mouseAction === MouseAction.Rotation) this.updateSelection();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private handleLocationToolMouseDown(e) {
    if (e.event.button) return;
    if (e.point.x < 0 || e.point.y < 0 || e.point.x > this.workingArea.width || e.point.y > this.workingArea.height)
      return;
    let { x, y } = this.calculateSnap(e);
    if (typeof this.onSetLocation === 'function') this.onSetLocation({ x, y });
  }

  private calculateSnap(e: any) {
    let x = e.point.x;
    let y = e.point.y;
    if (this.snapEnabled) {
      x = Math.round(x / this.currentSnapGrid) * this.currentSnapGrid;
      y = Math.round(y / this.currentSnapGrid) * this.currentSnapGrid;
    }
    return { x, y };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  get snapEnabled() {
    return JSON.parse(localStorage.getItem(SNAP_TO_GRID) || 'true');
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private handleSelectToolMouseDown(e) {
    e.event.preventDefault();
    this.triggerAntiSnap();

    if (this.mouseAction === MouseAction.Rotation) {
      this.handleStartAction();
      this.updateSelection({ justClear: true });
    }

    window[SNAPPING] = this.snapping;
    window[SNAP_ANGLE] = this.currentSnapAngle;

    this.scaleMousePosition = {
      x: e.event.offsetX,
      y: e.event.offsetY,
    };

    if (e.event.button === 0 && this.mouseAction === MouseAction.ScalingHover) {
      this.updateScaleItem(e);
      this.mouseAction = MouseAction.Scaling;
      this.handleStartAction();
    }

    if (
      e.event.button === 0 &&
      (this.mouseAction === MouseAction.Default || this.mouseAction === MouseAction.MovingObject)
    ) {
      let scaleCenter = false;
      if (this.sizeHandle === ScaleHandle.Center) scaleCenter = true;
      e.scaleCenter = scaleCenter;

      const currentSelection = this.toolbox.select.selectedItems.length;

      this.mouseAction = MouseAction.MovingObject;
      this.toolbox.onMouseDown(e);

      if (this.toolbox.select.selectedItems.length && !currentSelection) this.handleStartAction();
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private triggerAntiSnap() {
    this.antiSnapDelay = true;
    setTimeout(() => {
      this.antiSnapDelay = false;
    }, 200);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  handleStartAction() {
    if (typeof this.onStartAction === 'function') this.onStartAction(this.mouseAction);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private handleSelectToolMouseMove(e) {
    if (this.antiSnapDelay) return;
    if (this.mouseDown && this.mouseAction === MouseAction.Rotation) {
      this.toolbox.onMouseRotation(e);
      return;
    }

    let hit;

    if (!this.mouseDown) {
      hit = this.toolbox.checkHit(e.point);
      if (hit && !hit.item.opacity) return;
    }

    if (hit && this.mouseAction !== MouseAction.Scaling) {
      this.paper.view.element.style.cursor = 'move';
    } else if (
      this.mouseAction !== MouseAction.Scaling &&
      this.mouseAction !== MouseAction.MovingObject &&
      !this.spaceDown
    )
      this.paper.view.element.style.cursor = null;

    if (
      !this.mouseDown &&
      this.canvasBounds &&
      this.canvasBounds.left &&
      this.mouseAction !== MouseAction.Scaling &&
      this.mouseAction !== MouseAction.MovingObject
    ) {
      const cx = e.event.clientX - this.canvasBounds.left;
      const cy = e.event.clientY - this.canvasBounds.top;

      const hs = this.handleSize * 2;
      const ww = cx + hs;
      const hh = cy + hs;

      this.sizeHandle = ScaleHandle.None;

      if (this.handles && this.handles.n) {
        let nn1 = 'nesw-resize';
        let nn2 = 'nwse-resize';

        if (
          (this.mirrorScalars.y < 0 && this.mirrorScalars.x > 0) ||
          (this.mirrorScalars.y > 0 && this.mirrorScalars.x < 0)
        ) {
          nn1 = 'nwse-resize';
          nn2 = 'nesw-resize';
        }

        if (
          cx >= this.handles.n.xx &&
          cx <= this.handles.n.xx + hs &&
          cy >= this.handles.n.yy &&
          cy <= this.handles.n.yy + hs
        ) {
          this.paper.view.element.style.cursor = 'ns-resize';
          this.sizeHandle = ScaleHandle.N;
        }

        if (
          cx >= this.handles.ne.xx &&
          cx <= this.handles.ne.xx + hs &&
          cy >= this.handles.ne.yy &&
          cy <= this.handles.ne.yy + hs
        ) {
          this.paper.view.element.style.cursor = nn1;
          this.sizeHandle = ScaleHandle.NE;
        }

        if (
          cx >= this.handles.e.xx &&
          cx <= this.handles.e.xx + hs &&
          cy >= this.handles.e.yy &&
          cy <= this.handles.e.yy + hs
        ) {
          this.paper.view.element.style.cursor = 'ew-resize';
          this.sizeHandle = ScaleHandle.E;
        }

        if (
          cx >= this.handles.se.xx &&
          cx <= this.handles.se.xx + hs &&
          cy >= this.handles.se.yy &&
          cy <= this.handles.se.yy + hs
        ) {
          this.paper.view.element.style.cursor = nn2;
          this.sizeHandle = ScaleHandle.SE;
        }

        if (
          cx >= this.handles.s.xx &&
          cx <= this.handles.s.xx + hs &&
          cy >= this.handles.s.yy &&
          cy <= this.handles.s.yy + hs
        ) {
          this.paper.view.element.style.cursor = 'ns-resize';
          this.sizeHandle = ScaleHandle.S;
        }

        if (
          cx >= this.handles.sw.xx &&
          cx <= this.handles.sw.xx + hs &&
          cy >= this.handles.sw.yy &&
          cy <= this.handles.sw.yy + hs
        ) {
          this.paper.view.element.style.cursor = nn1;
          this.sizeHandle = ScaleHandle.SW;
        }

        if (
          cx >= this.handles.w.xx &&
          cx <= this.handles.w.xx + hs &&
          cy >= this.handles.w.yy &&
          cy <= this.handles.w.yy + hs
        ) {
          this.paper.view.element.style.cursor = 'ew-resize';
          this.sizeHandle = ScaleHandle.W;
        }

        if (
          cx >= this.handles.nw.xx &&
          cx <= this.handles.nw.xx + hs &&
          cy >= this.handles.nw.yy &&
          cy <= this.handles.nw.yy + hs
        ) {
          this.paper.view.element.style.cursor = nn2;
          this.sizeHandle = ScaleHandle.NW;
        }

        if (
          cx >= this.handles.cn.xx &&
          cx <= this.handles.cn.xx + hs &&
          cy >= this.handles.cn.yy &&
          cy <= this.handles.cn.yy + hs
        ) {
          this.paper.view.element.style.cursor = 'move';
          this.sizeHandle = ScaleHandle.Center;
          this.mouseAction = MouseAction.Default;
          return;
        }

        if (
          cx >= this.handles.angle.xx &&
          cx <= this.handles.angle.xx + hs &&
          cy >= this.handles.angle.yy &&
          cy <= this.handles.angle.yy + hs
        ) {
          this.paper.view.element.style.cursor = 'pointer';
          this.sizeHandle = ScaleHandle.Angle;
          this.mouseAction = MouseAction.Rotation;
          return;
        }
      }

      if (this.sizeHandle !== ScaleHandle.None) this.mouseAction = MouseAction.ScalingHover;
      else {
        if (!hit && !this.spaceDown) this.paper.view.element.style.cursor = null;
        if (!this.mouseDown) {
          this.mouseAction = MouseAction.Default;
        }
      }
    }

    ///////////////////

    if (this.mouseDown && this.mouseAction === MouseAction.Scaling && this.scaleMousePosition) {
      this.updateScaleItem(e);
      this.toolbox.scale(this.sizeHandle, this.scaleItem, this.scale, e);
    }

    if (this.mouseAction === MouseAction.Default || this.mouseAction === MouseAction.MovingObject) {
      this.toolbox.onMouseMove(e);
    }

    if (typeof this.onMouseMove === 'function') this.onMouseMove(e);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private resetMouseActions() {
    this.mouseAction = MouseAction.Default;
    this.sizeHandle = ScaleHandle.None;
    this.scaleMousePosition = null;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  updateElementProperties(props: IElementProperties) {
    if (!this.selectionBounds) return;

    if (props.link) {
      const ar = this.selectionBounds.width / (this.selectionBounds.height || 1);

      if (props.changed === 'w') {
        props.height = props.width / ar;
      }
      if (props.changed === 'h') {
        props.width = props.height * ar;
      }
    }

    const selectionGroup = this.toolbox.select.selectionGroup;

    if (props.changed === 'w' || props.changed === 'h') {
      selectionGroup.bounds.width = props.width;
      selectionGroup.bounds.height = props.height;
    }

    const mx = this.mirrorScalars.x;
    const my = this.mirrorScalars.y;
    let snap = this.currentSnapping;

    let ms = my < 0;
    let mw = mx < 0;

    if (ms) {
      if (this.currentSnapping === Snapping.N) snap = Snapping.S;
      if (this.currentSnapping === Snapping.S) snap = Snapping.N;
      if (this.currentSnapping === Snapping.NE) snap = Snapping.SE;
      if (this.currentSnapping === Snapping.SE) snap = Snapping.NE;
      if (this.currentSnapping === Snapping.NW) snap = Snapping.SW;
      if (this.currentSnapping === Snapping.SW) snap = Snapping.NW;
    }

    if (mw) {
      if (this.currentSnapping === Snapping.W) snap = Snapping.E;
      if (this.currentSnapping === Snapping.E) snap = Snapping.W;
      if (this.currentSnapping === Snapping.NW) snap = Snapping.NE;
      if (this.currentSnapping === Snapping.NE) snap = Snapping.NW;
      if (this.currentSnapping === Snapping.SW) snap = Snapping.SE;
      if (this.currentSnapping === Snapping.SE) snap = Snapping.SW;
    }

    if (mw && ms) {
      if (this.currentSnapping === Snapping.NE) snap = Snapping.SW;
      if (this.currentSnapping === Snapping.NW) snap = Snapping.SE;
      if (this.currentSnapping === Snapping.SE) snap = Snapping.NW;
      if (this.currentSnapping === Snapping.SW) snap = Snapping.NE;
    }

    const xx = props.x;
    const yy = props.y;

    switch (snap) {
      case Snapping.N:
        selectionGroup.position.x = xx;
        selectionGroup.bounds.top = yy;
        break;

      case Snapping.NE:
        selectionGroup.bounds.right = xx;
        selectionGroup.bounds.top = yy;

        break;

      case Snapping.E:
        selectionGroup.bounds.right = xx;
        selectionGroup.position.y = yy;
        break;

      case Snapping.SE:
        selectionGroup.bounds.right = xx;
        selectionGroup.bounds.bottom = yy;
        break;

      case Snapping.S:
        selectionGroup.position.x = xx;
        selectionGroup.bounds.bottom = yy;
        break;

      case Snapping.SW:
        selectionGroup.bounds.left = xx;
        selectionGroup.bounds.bottom = yy;
        break;

      case Snapping.W:
        selectionGroup.bounds.left = xx;
        selectionGroup.position.y = yy;
        break;

      case Snapping.NW:
        selectionGroup.bounds.left = xx;
        selectionGroup.bounds.top = yy;
        break;

      case Snapping.Center:
        selectionGroup.position.x = xx;
        selectionGroup.position.y = yy;
        break;
    }

    const scalars = (ms && mw) || (!ms && mw);

    for (let i = 0; i < selectionGroup.children.length; i++) {
      const child = selectionGroup.children[i];
      child.rotation =
        child.kind === E_KIND_IMAGE ? (scalars ? props.angle + 180 : props.angle) : -child.data.rotation || 0;
      child.data.rotation = props.angle;
      child.data.prevRotation = 0;
    }

    if (selectionGroup.children.length === 1 && selectionGroup.children[0].kind !== E_KIND_IMAGE) {
      this.toolbox.select.selectionGroup.rotate(-this.toolbox.select.selectionGroup.data.rotation || 0);
      this.toolbox.select.selectionGroup.rotate(props.angle);
    }

    // this.toolbox.select.selectionGroup.skew(props.shear || 0, 0);

    this.selectionBounds = this.toolbox.select.selectionGroup.bounds;
    this.toolbox.select.setupSelection();

    this.updateSelection();
  }

  get currentSelectionBounds() {
    const mx = this.mirrorScalars.x;
    const my = this.mirrorScalars.y;

    let ms = my < 0;
    let mw = mx < 0;

    let bounds = {
      topLeft: this.toolbox.select.selectionGroup.bounds.topLeft,
      topCenter: this.toolbox.select.selectionGroup.bounds.topCenter,
      topRight: this.toolbox.select.selectionGroup.bounds.topRight,

      left: this.toolbox.select.selectionGroup.bounds.left,
      center: this.toolbox.select.selectionGroup.bounds.center,
      right: this.toolbox.select.selectionGroup.bounds.right,

      bottomLeft: this.toolbox.select.selectionGroup.bounds.bottomLeft,
      bottomCenter: this.toolbox.select.selectionGroup.bounds.bottomCenter,
      bottomRight: this.toolbox.select.selectionGroup.bounds.bottomRight,

      top: this.toolbox.select.selectionGroup.bounds.top,
      bottom: this.toolbox.select.selectionGroup.bounds.bottom,

      x: this.toolbox.select.selectionGroup.bounds.x,
      y: this.toolbox.select.selectionGroup.bounds.y,

      width: this.toolbox.select.selectionGroup.bounds.width,
      height: this.toolbox.select.selectionGroup.bounds.height,
    };

    if (ms) {
      bounds = {
        topLeft: this.toolbox.select.selectionGroup.bounds.bottomLeft,
        topCenter: this.toolbox.select.selectionGroup.bounds.bottomCenter,
        topRight: this.toolbox.select.selectionGroup.bounds.bottomRight,

        left: this.toolbox.select.selectionGroup.bounds.left,
        center: this.toolbox.select.selectionGroup.bounds.center,
        right: this.toolbox.select.selectionGroup.bounds.right,

        bottomLeft: this.toolbox.select.selectionGroup.bounds.topLeft,
        bottomCenter: this.toolbox.select.selectionGroup.bounds.topCenter,
        bottomRight: this.toolbox.select.selectionGroup.bounds.topRight,

        top: this.toolbox.select.selectionGroup.bounds.bottom,
        bottom: this.toolbox.select.selectionGroup.bounds.top,

        x: this.toolbox.select.selectionGroup.bounds.x,
        y: this.toolbox.select.selectionGroup.bounds.y,

        width: this.toolbox.select.selectionGroup.bounds.width,
        height: this.toolbox.select.selectionGroup.bounds.height,
      };
    }

    if (mw) {
      bounds = {
        topLeft: this.toolbox.select.selectionGroup.bounds.topRight,
        topCenter: this.toolbox.select.selectionGroup.bounds.topCenter,
        topRight: this.toolbox.select.selectionGroup.bounds.topLeft,

        left: this.toolbox.select.selectionGroup.bounds.right,
        center: this.toolbox.select.selectionGroup.bounds.center,
        right: this.toolbox.select.selectionGroup.bounds.left,

        bottomLeft: this.toolbox.select.selectionGroup.bounds.bottomRight,
        bottomCenter: this.toolbox.select.selectionGroup.bounds.bottomCenter,
        bottomRight: this.toolbox.select.selectionGroup.bounds.bottomLeft,

        x: this.toolbox.select.selectionGroup.bounds.x,
        y: this.toolbox.select.selectionGroup.bounds.y,

        width: this.toolbox.select.selectionGroup.bounds.width,
        height: this.toolbox.select.selectionGroup.bounds.height,
      };

      if (ms && mw) {
        bounds = {
          topLeft: this.toolbox.select.selectionGroup.bounds.bottomRight,
          topCenter: this.toolbox.select.selectionGroup.bounds.bottomCenter,
          topRight: this.toolbox.select.selectionGroup.bounds.bottomLeft,

          left: this.toolbox.select.selectionGroup.bounds.right,
          center: this.toolbox.select.selectionGroup.bounds.center,
          right: this.toolbox.select.selectionGroup.bounds.left,

          bottomLeft: this.toolbox.select.selectionGroup.bounds.topRight,
          bottomCenter: this.toolbox.select.selectionGroup.bounds.topCenter,
          bottomRight: this.toolbox.select.selectionGroup.bounds.topLeft,

          top: this.toolbox.select.selectionGroup.bounds.top,
          bottom: this.toolbox.select.selectionGroup.bounds.bottom,

          x: this.toolbox.select.selectionGroup.bounds.x,
          y: this.toolbox.select.selectionGroup.bounds.y,

          width: this.toolbox.select.selectionGroup.bounds.width,
          height: this.toolbox.select.selectionGroup.bounds.height,
        };
      }
    }

    return bounds;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  updateSelection(opt?) {
    this.ctxSel.clearRect(0, 0, this.canvasSelection.width, this.canvasSelection.height);

    if (opt && opt.justClear) return;
    if (!this.selectionBounds) return;
    const ctx = this.ctxSel;

    const l = this.selectionBounds.left * this.scale;
    const t = this.selectionBounds.top * this.scale;
    const w =
      this.mirrorScalars.x > 0
        ? this.selectionBounds.right - this.selectionBounds.left
        : this.selectionBounds.left - this.selectionBounds.right;
    const h =
      this.mirrorScalars.y < 0
        ? this.selectionBounds.top - this.selectionBounds.bottom
        : this.selectionBounds.bottom - this.selectionBounds.top;
    const r = l + w * this.scale;
    const b = t + h * this.scale;

    const handleSize = this.handleSize;
    const halfHandle = handleSize / 2;

    const handLen = handleSize * 8;

    let xx, yy, ww, hh, ww2, hh2;

    if (this.mirrorScalars.x > 0) xx = l * this.mirrorScalars.x - this.paper.view.bounds.x * this.scale - halfHandle;
    else xx = (this.mirrorScalars.x < 0 ? this.width : 0) + this.paper.view.bounds.x * this.scale - l - halfHandle;

    if (this.mirrorScalars.y > 0) yy = t * this.mirrorScalars.y - this.paper.view.bounds.y * this.scale - halfHandle;
    else yy = (this.mirrorScalars.y < 0 ? this.height : 0) + this.paper.view.bounds.y * this.scale - t - halfHandle;

    xx += halfHandle;
    yy += halfHandle;

    ww = w * this.scale;
    ww2 = (w / 2) * this.scale;

    hh = h * this.scale;
    hh2 = (h / 2) * this.scale;

    ctx.fillStyle = '#0007';
    ctx.strokeStyle = '#fff9';

    if (ww === 0) return;

    let top = yy - handLen;
    let bottom = yy;
    if (this.mirrorScalars.y < 0) {
      top += hh;
      bottom += hh;
    }

    /////

    ctx.strokeStyle = '#fff9';

    ctx.beginPath();
    ctx.arc(xx + ww2, top, handleSize, 0, FULLCIRCLE);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(xx + ww2, bottom);
    ctx.lineTo(xx + ww2, top);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(xx + ww2, top, handleSize, 0, FULLCIRCLE);
    ctx.stroke();

    /////

    ctx.beginPath();
    ctx.arc(xx + ww2, yy + hh2, handleSize, 0, FULLCIRCLE);
    ctx.fill();

    ctx.strokeStyle = '#fff9';
    if (this.currentSnapping === Snapping.Center) ctx.strokeStyle = this.currentTheme.object.selected;

    ctx.beginPath();
    ctx.arc(xx + ww2, yy + hh2, handleSize, 0, FULLCIRCLE);
    ctx.stroke();

    //////

    ctx.beginPath();
    ctx.arc(xx, yy, handleSize, 0, FULLCIRCLE);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(xx + ww, yy, handleSize, 0, FULLCIRCLE);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(xx + ww, yy + hh, handleSize, 0, FULLCIRCLE);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(xx, yy + hh, handleSize, 0, FULLCIRCLE);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(xx + ww2, yy, handleSize, 0, FULLCIRCLE);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(xx + ww, yy + hh2, handleSize, 0, FULLCIRCLE);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(xx, yy + hh2, handleSize, 0, FULLCIRCLE);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(xx + ww2, yy + hh, handleSize, 0, FULLCIRCLE);
    ctx.fill();

    //////

    // console.log(this.mirrorScalars);

    const mx = this.mirrorScalars.x;
    const my = this.mirrorScalars.y;

    let mn = my > 0;
    let ms = my < 0;
    let me = mx > 0;
    let mw = mx < 0;

    const csn = this.currentSnapping === Snapping.N;
    const csne = this.currentSnapping === Snapping.NE;
    const cse = this.currentSnapping === Snapping.E;
    const csse = this.currentSnapping === Snapping.SE;
    const css = this.currentSnapping === Snapping.S;
    const cssw = this.currentSnapping === Snapping.SW;
    const csw = this.currentSnapping === Snapping.W;
    const csnw = this.currentSnapping === Snapping.NW;

    let N = (csn && mn) || (css && ms);
    let E = (cse && me) || (csw && mw);
    let S = (css && mn) || (csn && ms);
    let W = (csw && me) || (cse && mw);

    let NE = (csne && mn && me) || (cssw && ms && mw) || (csse && me && ms) || (csnw && mw && mn);
    let SE = (csse && mn && me) || (csnw && ms && mw) || (cssw && mw && mn) || (csne && me && ms);
    let SW = (cssw && mn && me) || (csne && ms && mw) || (csse && mw && mn) || (csnw && me && ms);
    let NW = (csnw && mn && me) || (csse && ms && mw) || (cssw && me && ms) || (csne && mw && mn);

    // console.table({ N, NE, E, SE, S, SW, W, NW });

    window[SNAP_HANDLE] = Snapping.Center;

    ctx.strokeStyle = '#fff9';
    if (NW) {
      ctx.strokeStyle = this.currentTheme.object.selected;
      window[SNAP_HANDLE] = Snapping.NW;
    }
    ctx.beginPath();
    ctx.arc(xx, yy, handleSize, 0, FULLCIRCLE);
    ctx.stroke();

    ctx.strokeStyle = '#fff9';
    if (NE) {
      ctx.strokeStyle = this.currentTheme.object.selected;
      window[SNAP_HANDLE] = Snapping.NE;
    }

    ctx.beginPath();
    ctx.arc(xx + ww, yy, handleSize, 0, FULLCIRCLE);
    ctx.stroke();

    ctx.strokeStyle = '#fff9';
    if (SE) {
      ctx.strokeStyle = this.currentTheme.object.selected;
      window[SNAP_HANDLE] = Snapping.SE;
    }
    ctx.beginPath();
    ctx.arc(xx + ww, yy + hh, handleSize, 0, FULLCIRCLE);
    ctx.stroke();

    ctx.strokeStyle = '#fff9';
    if (SW) {
      ctx.strokeStyle = this.currentTheme.object.selected;
      window[SNAP_HANDLE] = Snapping.SW;
    }
    ctx.beginPath();
    ctx.arc(xx, yy + hh, handleSize, 0, FULLCIRCLE);
    ctx.stroke();

    ctx.strokeStyle = '#fff9';
    if (N) {
      ctx.strokeStyle = this.currentTheme.object.selected;
      window[SNAP_HANDLE] = Snapping.N;
    }
    ctx.beginPath();
    ctx.arc(xx + ww2, yy, handleSize, 0, FULLCIRCLE);
    ctx.stroke();

    ctx.strokeStyle = '#fff9';
    if (E) {
      ctx.strokeStyle = this.currentTheme.object.selected;
      window[SNAP_HANDLE] = Snapping.E;
    }
    ctx.beginPath();
    ctx.arc(xx + ww, yy + hh2, handleSize, 0, FULLCIRCLE);
    ctx.stroke();

    ctx.strokeStyle = '#fff9';
    if (W) {
      ctx.strokeStyle = this.currentTheme.object.selected;
      window[SNAP_HANDLE] = Snapping.W;
    }
    ctx.beginPath();
    ctx.arc(xx, yy + hh2, handleSize, 0, FULLCIRCLE);
    ctx.stroke();

    ctx.strokeStyle = '#fff9';
    if (S) {
      ctx.strokeStyle = this.currentTheme.object.selected;
      window[SNAP_HANDLE] = Snapping.S;
    }
    ctx.beginPath();
    ctx.arc(xx + ww2, yy + hh, handleSize, 0, FULLCIRCLE);
    ctx.stroke();

    xx -= halfHandle * 2;
    yy -= halfHandle * 2;

    this.handles = {
      n: { xx: xx + ww2, yy },
      ne: { xx: xx + ww, yy },
      e: { xx: xx + ww, yy: yy + hh2 },
      se: { xx: xx + ww, yy: yy + hh },
      s: { xx: xx + ww2, yy: yy + hh },
      sw: { xx, yy: yy + hh },
      w: { xx, yy: yy + hh2 },
      nw: { xx, yy },
      cn: { xx: xx + ww2, yy: yy + hh2 },
      angle: { xx: xx + ww2, yy: top - halfHandle * 2 },
    };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  laserState(state) {
    if (this.laserCursor) {
      this.laserCursor.position = [state.position.x, state.position.y];
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  resize(offset = true) {
    if (!this.centerGrid) return;
    this.paper.activate();
    this.paper.view.scaling = {
      x: this.scale * this.scalars.x,
      y: this.scale * this.scalars.y,
    };

    const bounds = this.paper.view.bounds;
    this.width =
      this.canvas.width =
      this.canvasScale.width =
      this.canvasSelection.width =
      this.canvasPosition.width =
      this.canvasPreview.width =
        this.parent.offsetWidth;

    this.height =
      this.canvas.height =
      this.canvasScale.height =
      this.canvasSelection.height =
      this.canvasPosition.height =
      this.canvasPreview.height =
        this.parent.offsetHeight;

    this.paper.view.setViewSize(this.width, this.height);
    if (offset) {
      this.paper.view.scrollBy(this.offset.x, this.offset.y);
    }

    this.update({ inMotion: false });
    this.canvasBounds = this.canvas.getBoundingClientRect();
    this.debounceResize();

    //////////////// editor

    this.syncEditorViewFromMain();

    if (offset) {
      this.offset = { x: 0, y: 0 };
    }

    ////////////////////////

    if (typeof this.onResize === 'function') this.onResize();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  debounceResize() {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      this.update();
    }, 100);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  update(opt?) {
    if (!this.centerGrid) return;

    this.addGrid();
    this.addScale();
    this.updatePosition({ justClear: true });

    // const elements = Object.keys(this.elements);

    // for (let i = 0; i < elements.length; i++) {
    //   this.elements[elements[i]].update(opt);
    // }
    if (typeof this.drawGCode === 'function') this.drawGCode();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  updatePosition(opt?) {
    const { justClear } = opt || {};
    const ctx = this.ctxPos;

    ctx.clearRect(0, 0, this.canvasPosition.width, this.canvasPosition.height);
    if (justClear) return;

    const position = this.paper.view.projectToView(this.currentPoint);

    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(position.x, 0);
    ctx.lineTo(position.x, 20);

    ctx.moveTo(position.x, this.canvasPosition.height);
    ctx.lineTo(position.x, this.canvasPosition.height - 20);

    ctx.moveTo(0, position.y);
    ctx.lineTo(20, position.y);

    ctx.moveTo(this.canvasPosition.width, position.y);
    ctx.lineTo(this.canvasPosition.width - 20, position.y);

    ctx.stroke();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  addScale() {
    const cml = 16;
    const cmlh = 14;
    const cmmm = 10;

    this.ctxScale.fillStyle = '#0003';

    this.ctxScale.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctxScale.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctxScale.clearRect(cml, cml, this.width - 2 * cml, this.height - 2 * cml);

    ///////////////////////////////////////////////////

    this.ctxScale.font = this.currentTheme.scale.font;
    this.ctxScale.fillStyle = this.currentTheme.scale.fillStyle;

    const gridWidth = this.centerGrid.bounds.width;
    const gridHeight = this.centerGrid.bounds.height;

    const metricDivider = this.currentUnit === Unit.Metric ? 10 : 25.4;

    const xdiv = Math.floor(gridWidth / metricDivider);
    const xdiv16 = Math.floor(gridWidth / (metricDivider / 16));
    const ydiv = Math.floor(gridHeight / metricDivider);
    const ydiv16 = Math.floor(gridHeight / (metricDivider / 16));

    const mm = this.scale;
    const cm = metricDivider * mm;

    const mmdivx = gridWidth;
    const mmdivy = gridHeight;

    let skip = 1;
    let xx;
    let yy;

    ///////////////////////////////////////////////////

    if (cm < 32) skip = 2;
    if (cm < 16) skip = 4;
    if (cm < 8) skip = 8;
    if (cm < 4) skip = 20;

    for (let x = 0; x <= xdiv; x++) {
      if (skip > 1 && x % skip !== 0) continue;
      const txt = (this.currentUnit === Unit.Metric ? metricDivider : 1) * x;
      const w = this.ctxScale.measureText(txt).width / 2;
      if (this.mirrorScalars.x > 0) xx = x * cm * this.mirrorScalars.x - this.paper.view.bounds.x * this.scale;
      else xx = (this.mirrorScalars.x < 0 ? this.width : 0) + this.paper.view.bounds.x * this.scale - x * cm;

      this.ctxScale.fillText(txt, xx - w, 35);
      this.ctxScale.fillText(txt, xx - w, this.height - 26);
    }

    for (let y = 0; y <= ydiv; y++) {
      if (skip > 1 && y % skip !== 0) continue;
      const txt = (this.currentUnit === Unit.Metric ? metricDivider : 1) * y;
      const w = this.ctxScale.measureText(txt).width;
      if (this.mirrorScalars.y > 0) yy = y * cm * this.mirrorScalars.y - this.paper.view.bounds.y * this.scale;
      else yy = (this.mirrorScalars.y < 0 ? this.height : 0) + this.paper.view.bounds.y * this.scale - y * cm;
      this.ctxScale.fillText(txt, 25, yy + 5);
      this.ctxScale.fillText(txt, this.width - 25 - w, yy + 5);
    }

    ///////////////////////////////////////////////////

    if (cm > 3) {
      this.ctxScale.beginPath();
      this.ctxScale.lineWidth = 1;
      this.ctxScale.strokeStyle = this.currentTheme.scale.strokeColor;

      for (let x = 0; x <= xdiv; x++) {
        if (this.mirrorScalars.x > 0) xx = x * cm * this.mirrorScalars.x - this.paper.view.bounds.x * this.scale;
        else xx = (this.mirrorScalars.x < 0 ? this.width : 0) + this.paper.view.bounds.x * this.scale - x * cm;
        this.ctxScale.moveTo(xx, 0);
        this.ctxScale.lineTo(xx, cml);

        this.ctxScale.moveTo(xx, this.height - cml);
        this.ctxScale.lineTo(xx, this.height);
      }

      for (let y = 0; y <= ydiv; y++) {
        if (this.mirrorScalars.y > 0) yy = y * cm * this.mirrorScalars.y - this.paper.view.bounds.y * this.scale;
        else yy = (this.mirrorScalars.y < 0 ? this.height : 0) + this.paper.view.bounds.y * this.scale - y * cm;
        this.ctxScale.moveTo(0, yy);
        this.ctxScale.lineTo(cml, yy);

        this.ctxScale.moveTo(this.width - cml, yy);
        this.ctxScale.lineTo(this.width, yy);
      }
      this.ctxScale.stroke();
    }

    ///////////////////////////////////////////////////

    if (this.currentUnit === Unit.Metric) {
      if (mm > 3) {
        this.ctxScale.lineWidth = '1';
        for (let x = 0; x <= mmdivx; x++) {
          this.ctxScale.strokeStyle = this.currentTheme.scale.auxLine.strokeColor;
          if (x % 5 === 0) this.ctxScale.strokeStyle = this.currentTheme.scale.mainLine.strokeColor;
          if (x % 10 === 0) continue;
          if (this.mirrorScalars.x > 0) xx = x * mm * this.mirrorScalars.x - this.paper.view.bounds.x * this.scale;
          else xx = (this.mirrorScalars.x < 0 ? this.width : 0) + this.paper.view.bounds.x * this.scale - x * mm;
          this.ctxScale.beginPath();
          this.ctxScale.moveTo(xx, 0);
          this.ctxScale.lineTo(xx, cmlh);
          this.ctxScale.moveTo(xx, this.height - cmlh);
          this.ctxScale.lineTo(xx, this.height);
          this.ctxScale.stroke();
        }

        for (let y = 0; y <= mmdivy; y++) {
          this.ctxScale.strokeStyle = this.currentTheme.scale.auxLine.strokeColor;
          if (y % 5 === 0) this.ctxScale.strokeStyle = this.currentTheme.scale.mainLine.strokeColor;
          if (y % 10 === 0) continue;
          if (this.mirrorScalars.y > 0) yy = y * mm * this.mirrorScalars.y - this.paper.view.bounds.y * this.scale;
          else yy = (this.mirrorScalars.y < 0 ? this.height : 0) + this.paper.view.bounds.y * this.scale - y * mm;
          this.ctxScale.beginPath();
          this.ctxScale.moveTo(0, yy);
          this.ctxScale.lineTo(cmlh, yy);
          this.ctxScale.moveTo(this.width - cmlh, yy);
          this.ctxScale.lineTo(this.width, yy);
          this.ctxScale.stroke();
        }
      }
    } else {
      const ii = cm / 16;
      const in2 = 16;
      const in4 = 14;
      const in8 = 10;
      const in16 = 5;
      let iin;
      /////////////////////////////////

      this.ctxScale.beginPath();
      this.ctxScale.lineWidth = '1';
      this.ctxScale.strokeStyle = this.currentTheme.scale.mainLine.strokeColor;

      for (let x = 0; x <= xdiv16; x++) {
        if (this.mirrorScalars.x > 0) xx = x * ii * this.mirrorScalars.x - this.paper.view.bounds.x * this.scale;
        else xx = (this.mirrorScalars.x < 0 ? this.width : 0) + this.paper.view.bounds.x * this.scale - x * ii;

        iin = in16;

        if (x % 2 === 0) {
          iin = in8;
        }
        if (x === 0) continue;

        if (x % 4 === 0) {
          iin = in4;
        }
        if (x % 8 === 0) {
          iin = in2;
        }
        if (x % 16 === 0) continue;

        if (cm < 40 && (iin === in8 || iin === in16)) continue;

        this.ctxScale.moveTo(xx, 0);
        this.ctxScale.lineTo(xx, iin);

        this.ctxScale.moveTo(xx, this.height - 0);
        this.ctxScale.lineTo(xx, this.height - iin);
      }

      ///////

      for (let y = 0; y <= ydiv16; y++) {
        if (this.mirrorScalars.y > 0) yy = y * ii * this.mirrorScalars.y - this.paper.view.bounds.y * this.scale;
        else yy = (this.mirrorScalars.y < 0 ? this.height : 0) + this.paper.view.bounds.y * this.scale - y * ii;

        iin = in16;

        if (y % 2 === 0) {
          iin = in8;
        }
        if (y === 0) continue;

        if (y % 4 === 0) {
          iin = in4;
        }
        if (y % 8 === 0) {
          iin = in2;
        }
        if (y % 16 === 0) continue;

        if (cm < 40 && (iin === in8 || iin === in16)) continue;

        this.ctxScale.moveTo(0, yy);
        this.ctxScale.lineTo(iin, yy);

        this.ctxScale.moveTo(this.width - 0, yy);
        this.ctxScale.lineTo(this.width - iin, yy);
      }

      this.ctxScale.stroke();
    }

    this.updateSelection();
    if (typeof this.drawGCode === 'function') this.drawGCode();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  addGrid() {
    this.gridLayer.activate();
    if (this.gridLines) {
      this.gridLines.remove();
    }

    this.gridLines = new this.paper.Group();

    const gridWidth = this.centerGrid.bounds.width;
    const gridHeight = this.centerGrid.bounds.height;

    const metricDivider = this.currentUnit === Unit.Metric ? 10 : 25.4;

    let bold = 0;
    const xdiv = gridWidth / metricDivider;

    for (let x = 0; x <= xdiv; x++) {
      const p = new this.paper.Path();
      p.strokeColor = this.currentTheme.grid.strokeColor;
      p.strokeWidth = this.currentTheme.grid.thinLine.strokeWidth;
      p.strokeScaling = false;
      p.opacity = this.preview ? PREVIEW_OPACITY : 1;
      if (bold % metricDivider === 0) p.strokeWidth = this.currentTheme.grid.boldLine.strokeWidth;
      bold++;

      const xx = x * metricDivider;
      p.moveTo([xx, 0]);
      p.lineTo([xx, gridHeight]);
      this.gridLines.addChild(p);
    }

    bold = 0;
    const ydiv = gridHeight / metricDivider;
    for (let y = 0; y < ydiv; y++) {
      const p = new this.paper.Path();
      p.strokeColor = this.currentTheme.grid.strokeColor;
      p.strokeWidth = this.currentTheme.grid.thinLine.strokeWidth;
      p.strokeScaling = false;
      p.opacity = this.preview ? PREVIEW_OPACITY : 1;

      if (bold % metricDivider === 0) p.strokeWidth = this.currentTheme.grid.boldLine.strokeWidth;
      bold++;
      p.moveTo([0, y * metricDivider]);
      p.lineTo([gridWidth, y * metricDivider]);
      this.gridLines.addChild(p);
    }

    this.gridLayer.addChild(this.gridLines);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  initDraw() {
    this.width = this.canvas.width = this.parent.offsetWidth;
    this.height = this.canvas.height = this.parent.offsetHeight;
    this.paper.view.setCenter(0, 0);

    this.objectsLayer.activate();
    this.toolbox = new Toolbox(this.paper);
    this.setupGrid({
      width: Number(localStorage.getItem(AREA_WIDTH)) || 350,
      height: Number(localStorage.getItem(AREA_HEIGHT)) || 350,
    });
    setTimeout(() => {
      // const offset = JSON.parse(localStorage.getItem(OFFSET));
      // if (offset)
      //   this.paper.view.scrollBy(
      //     offset.x - this.centerGrid.bounds.width / 2,
      //     offset.y - this.centerGrid.bounds.height / 2,
      //   );
      // else
      this.zoomFit();
    }, 100);
  }

  zoomFit() {
    this.paper.zoomFit();
    this.paper.centerView();

    localStorage.removeItem(OFFSET);
    localStorage.removeItem(BASE_SCALE);
  }

  zoomSelect() {
    this.paper.zoomSelect();
  }

  zoomFrame(obj) {
    if (!obj.elements) return;
    this.paper.zoomFrame(obj.frame);
  }

  zoomIn() {
    this.adjustZoom(1);
  }

  zoomOut() {
    this.adjustZoom(-1);
  }

  private adjustZoom(direction: number) {
    const step = 0.2;
    const previous = this.baseScale;

    this.baseScale += step * direction;
    if (this.baseScale <= -3.1) this.baseScale = -3.1;
    if (this.baseScale > 10) this.baseScale = 10;
    if (this.baseScale === previous) return;

    this.scale = Math.pow(2, this.baseScale);
    window[SCALE] = this.scale;
    this.offset = { x: 0, y: 0 };

    localStorage.setItem(BASE_SCALE, JSON.stringify({ scale: this.scale, baseScale: this.baseScale }));

    this.resize();
  }

  private offsetFillProto() {
    setTimeout(() => {
      const r = this.paper.Path.Rectangle({
        point: [0, 0],
        size: [10, 10],
        fillColor: 'rgb(191, 91, 91, 0.5)',
        strokeColor: 'orange',
      });
      // r.strokeColor = 'white';
      // r.strokeWidth = 1;
      r.strokeScaling = false;
      setTimeout(() => {
        let o = PaperOffset.offset(r, -0.08);
        for (let i = 0; i < 4000; i++) {
          o = PaperOffset.offset(o, -0.08);
          if (!o) break;
        }
      }, 1000);

      // PaperOffset.offsetStroke(r, 10, { cap: 'round' });
    }, 1000);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  setupGrid(rect) {
    this.gridLayer.activate();

    const workingArea = [0, 0, rect.width, rect.height];
    this.workingArea = {
      width: workingArea[2],
      height: workingArea[3],
    };

    window[WORKING_AREA] = this.workingArea;

    if (this.gridLayer) {
      this.gridLayer.removeChildren();
    }

    this.centerGrid = new this.paper.Path.Rectangle(workingArea);
    this.centerGrid.strokeScaling = false;
    this.centerGrid.name = CENTER_GRID;
    this.centerGrid.strokeColor = this.currentTheme.areaFrame.strokeColor;
    const c = new this.paper.Path.Circle(this.paper.view.center, 2);
    c.strokeColor = this.currentTheme.laserCircle.strokeColor;
    c.strokeScaling = false;
    c.name = CENTER_GRID;

    this.paper.view.scrollBy(rect.width / 2, rect.height / 2);
    this.paper.activate();

    this.gridLayer.activate();

    window[CENTER_GRID] = this.centerGrid;

    const lineV = new this.paper.Path();
    lineV.strokeColor = 'red';
    lineV.strokeScaling = false;
    lineV.strokeWidth = 2;
    lineV.moveTo(0, -2);
    lineV.lineTo(0, 2);

    const lineH = new this.paper.Path();
    lineH.strokeColor = 'red';
    lineH.strokeScaling = false;
    lineH.strokeWidth = 2;
    lineH.moveTo(-2, 0);
    lineH.lineTo(2, 0);

    const circle = new this.paper.Path.Circle([0, 0], 2);
    circle.strokeColor = 'red';
    circle.strokeScaling = false;
    circle.strokeWidth = 2;

    this.laserCursor = new this.paper.Group([lineV, lineH, circle]);
    this.laserCursor.name = CENTER_GRID;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  setTool(tool: ToolboxMode) {
    this.currentTool = tool;
    this.toolbox.tool = tool;
    this.toolbox.theme = this.currentTheme;
    window[OBJECTS_LAYER] = this.objectsLayer;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getSVG() {
    return window[OBJECTS_LAYER].exportSVG({
      asString: true,
    });
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  refreshScene(forceViewUpdate = true) {
    if (!this.objectsLayer) return;

    const elements = {};
    const images = {};
    const vectors = {};

    const collect = (item: any) => {
      if (!item) return;
      if (item.uid === SELECT) {
        if (item.children && item.children.length) {
          for (let i = 0; i < item.children.length; i++) {
            collect(item.children[i]);
          }
        }
        return;
      }
      if (item.uid) {
        elements[item.uid] = item;
        if (item.kind === E_KIND_IMAGE) images[item.uid] = item;
        if (item.kind === E_KIND_VECTOR || item.type === E_KIND_VECTOR) vectors[item.uid] = item;
      }

      if (item.children && item.children.length) {
        for (let i = 0; i < item.children.length; i++) {
          collect(item.children[i]);
        }
      }
    };

    const rootChildren = this.objectsLayer.children || [];
    for (let i = 0; i < rootChildren.length; i++) {
      collect(rootChildren[i]);
    }

    this.elements = elements;
    window[ELEMENTS] = elements;
    window[IMAGES] = images;
    window[VECTORS] = vectors;

    this.ensureTextLinkPairs();

    if (forceViewUpdate && this.paper?.view?.update) {
      this.paper.view.update(true);
    }

    if (this.toolbox?.select?.updateSelection) {
      this.toolbox.select.updateSelection(true);
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  set origin(o: Origins) {
    this._origin = o;

    this.paper.view.matrix.reset();
    let snapOrigin;
    switch (o) {
      case Origins.TopLeft:
        snapOrigin = Snapping.NW;
        this.paper.view.scaling = [1, 1];

        this.scalars = {
          x: 1,
          y: 1,
        };
        this.mirrorScalars = {
          x: 1,
          y: 1,
        };
        break;

      case Origins.TopRight:
        snapOrigin = Snapping.NE;

        this.paper.view.scaling = [-1, 1];

        this.scalars = {
          x: 1,
          y: -1,
        };
        this.mirrorScalars = {
          x: -1,
          y: 1,
        };
        break;

      case Origins.BottomRight:
        snapOrigin = Snapping.SE;

        this.paper.view.scaling = [-1, 1];

        this.scalars = {
          x: 1,
          y: 1,
        };
        this.mirrorScalars = {
          x: -1,
          y: -1,
        };
        break;

      case Origins.BottomLeft:
        snapOrigin = Snapping.SW;

        this.scalars = {
          x: 1,
          y: -1,
        };
        this.mirrorScalars = {
          x: 1,
          y: -1,
        };
        break;
    }
    localStorage.setItem(CURRENT_ORIGIN, o);
    this.snapping = snapOrigin;
    window[MIRROR_SCALARS] = this.mirrorScalars;
    window[ORIGIN_SCALARS] = this.scalars;
  }

  get origin() {
    let result = this._origin;
    const origin = Number(localStorage.getItem(CURRENT_ORIGIN));
    if (origin !== undefined) result = origin;
    return result;
  }

  restore() {
    /// scale

    const obj = JSON.parse(localStorage.getItem(BASE_SCALE)) || {};
    this.scale = obj.scale || 1;
    window[SCALE] = this.scale;
    this.baseScale = obj.baseScale || null;

    /// offset
  }

  //////////////////////////////////////////////////

  set laserCursorPosition({ x, y }) {
    this.laserCursor.position = [x, y];
  }

  get laserCursorPosition() {
    return this.laserCursor.position;
  }
  //////////////////////////////////////////////////

  set snapping(snap: Snapping) {
    this.currentSnapping = snap;
    if (snap !== undefined) localStorage.setItem(SNAPPING, snap);
    this.updateSelection();
  }

  get snapping() {
    let result = this.currentSnapping;
    const snap = Number(localStorage.getItem(SNAPPING)) || undefined;
    if (snap !== undefined) result = snap;
    return result;
  }
}
