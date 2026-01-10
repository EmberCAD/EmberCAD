//@ts-ignore
//@ts-nocheck
import { SNAP_TO_GRID } from '../../../App/views/TopTools/DefaultTool';
import { IElementProperties } from '../../../App/views/Work/ElementProperties';
import { DefaultLaserSettings, ElementLaserType } from '../../../App/views/Work/Work';
import { DeepCopy } from '../../../lib/api/cherry/api';
import { codec64 } from '../../../lib/api/cherry/codec64';
import { applyStrokeFill, getElementColor, checkImageInArea, readUni, writeUni } from '../../../modules/helpers';
import { Counters, E_KIND_GROUP, E_KIND_IMAGE, E_KIND_RASTER, E_KIND_TEXT } from '../CanvasElement';
import {
  CENTER_GRID,
  CURRENT_THEME,
  ELEMENTS,
  MIRROR_SCALARS,
  OBJECTS_LAYER,
  SCALE,
  ScaleHandle,
  Snapping,
  SNAP_ANGLE,
  SNAP_GRID,
  SNAP_HANDLE,
  VECTORS,
  CURRENT_UNIT,
  IMAGES,
  Unit,
  WORKING_AREA,
} from '../LaserCanvas';

const TOLERANCE = 4;
const SELECT_EVENT = true;
export const SELECT = 'SELECT';

export default class Select {
  selectionLayer: any;
  rect: any;
  initPosition: any;
  mouseDown: boolean;
  private _color: any;
  objectsLayer: any;
  selectedItems = [];
  hitOptions: any;
  selectionGroup: any;
  selectionClone: any;
  angle: number;
  mouseMove: boolean;
  units: any;
  duplicates: any;
  rotation: number;

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  constructor(private paper) {
    this.selectionLayer = new this.paper.Layer();
    this.hitOptions = {
      bounds: false,
      curves: false,
      stroke: true,
      fill: true,
    };
    this.selectionGroup = new this.paper.Group();
    this.selectionGroup.uid = SELECT;
    this.selectionGroup.applyMatrix = true;

    this.units = window[CURRENT_UNIT];
  }

  select(item: any) {
    if (item.sel) return;

    if (!this.selectionGroup.parent || this.selectionGroup.parent !== window[OBJECTS_LAYER]) {
      window[OBJECTS_LAYER].addChild(this.selectionGroup);
    }
    this.selectionGroup.visible = true;

    item.startPosition = item.position;
    item.startBounds = item.bounds;
    item.currentParent = item.parent.uid;
    if (item.type === E_KIND_RASTER) item = this.selectRaster(item);
    item.strokeColor = window[CURRENT_THEME].object.selected;
    item.strokeWidth = 1;
    item.strokeScaling = false;
    if (item.kind === E_KIND_TEXT) {
      const fillColor =
        item.laserSettings && item.laserSettings.laserType === ElementLaserType.Fill ? 'rgba(0,0,0,.5)' : null;
      applyStrokeFill(item, item.strokeColor, fillColor);
    }
    window['select'] = item;
    this.selectionGroup.addChild(item);
    if (!this.selectedItems) this.selectedItems = [];
    item.sel = true;
    if (item.kind == E_KIND_GROUP) this.selectChildren(item);
    this.selectedItems.push(item);
    this.setupSelection();
  }

  private selectChildren(item: any) {
    const children = item.children;
    for (let i = 0; i < children.length; i++) {
      const item = children[i];
      item.sel = true;
      if (item.kind === E_KIND_TEXT) {
        item.strokeColor = window[CURRENT_THEME].object.selected;
        const fillColor =
          item.laserSettings && item.laserSettings.laserType === ElementLaserType.Fill ? 'rgba(0,0,0,.5)' : null;
        applyStrokeFill(item, item.strokeColor, fillColor);
      }
      if (item.kind === E_KIND_GROUP) this.selectChildren(item);
    }
  }

  selectRaster(item: any) {
    this.setupRasterPosition(item);
    window[ELEMENTS][item.uid].raster.sel = true;
    window[ELEMENTS][item.uid].rasterSel.visible = true;
    window[ELEMENTS][item.uid].raster.visible = false;
    return window[ELEMENTS][item.uid].rasterSel;
  }

  private setupRasterPosition(item: any) {
    if (!window[ELEMENTS][item.uid].raster) {
      window[ELEMENTS][item.uid].raster = window[VECTORS][item.uid].raster;
    }
    if (!window[ELEMENTS][item.uid].rasterSel) {
      window[ELEMENTS][item.uid].rasterSel = window[VECTORS][item.uid].rasterSel;
    }

    window[ELEMENTS][item.uid].raster.pivot = item.bounds.center;
    window[ELEMENTS][item.uid].rasterSel.pivot = item.bounds.center;
    window[ELEMENTS][item.uid].rasterSel.position = item.position;
    window[ELEMENTS][item.uid].raster.position = item.position;
    window[ELEMENTS][item.uid].raster.type = item.type;
    window[ELEMENTS][item.uid].rasterSel.type = item.type;
    window[ELEMENTS][item.uid].raster.bounds = item.bounds;
    window[ELEMENTS][item.uid].rasterSel.startPosition = item.startPosition;
    window[ELEMENTS][item.uid].rasterSel.startBounds = item.startBounds;
    window[ELEMENTS][item.uid].raster.startPosition = item.startPosition;
    window[ELEMENTS][item.uid].raster.startBounds = item.startBounds;
  }

  setupSelection() {
    this.selectionGroup.pivot = this.selectionGroup.bounds.center;

    this.selectionGroup.startBounds = this.selectionGroup.bounds;
    this.selectionGroup.startPosition = this.selectionGroup.position;
    this.angle = 0;
  }

  unselect(item: any) {
    item.startPosition = item.position;
    item.startBounds = item.bounds;

    if (item.type === E_KIND_RASTER) item = this.unSelectRaster(item);
    if (item.type === E_KIND_IMAGE) checkImageInArea(item);
    const isFill = item.laserSettings && item.laserSettings.laserType === ElementLaserType.Fill;
    const fillColor = isFill ? 'rgba(0,0,0,.5)' : null;

    if (item.kind !== E_KIND_GROUP) {
      const strokeColor = isFill ? 'rgba(0,0,0,.5)' : getElementColor(item);
      item.strokeColor = strokeColor;
      if (isFill || item.kind === E_KIND_TEXT) {
        item.fillColor = fillColor;
      }
      if (item.kind === E_KIND_TEXT) {
        applyStrokeFill(item, strokeColor, fillColor);
      }
    } else {
      this.unselectChildren(item);
    }

    const items = this.selectionGroup.children || this.selectionGroup.curves;
    if (this.selectionGroup && items.length) {
      const parent = window[ELEMENTS][item.currentParent] || window[OBJECTS_LAYER];
      if (parent.uid !== SELECT) parent.addChild(item);
    }
    item.sel = false;
    item.pivot = item.bounds.center;
    this.setupSelection();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  unSelectRaster(item: any) {
    this.setupRasterPosition(item);
    window[ELEMENTS][item.uid].vector.sel = false;
    window[ELEMENTS][item.uid].rasterSel.sel = false;
    window[ELEMENTS][item.uid].raster.sel = false;
    window[ELEMENTS][item.uid].raster.visible = true;
    window[ELEMENTS][item.uid].rasterSel.visible = false;
    return window[ELEMENTS][item.uid].raster;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  hideSelection() {
    this.selectionGroup.strokeColor = window[CURRENT_THEME].object.strokeColor;
    if (typeof this.onUpdateSelection === 'function') this.onUpdateSelection([]);
  }

  unhideSelection() {
    this.selectionGroup.strokeColor = window[CURRENT_THEME].object.selected;
    if (typeof this.onUpdateSelection === 'function') this.onUpdateSelection(this.selectionGroup.bounds);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  onMouseDown(e) {
    this.pointsNo = 0;

    window[OBJECTS_LAYER].addChild(this.selectionGroup);

    this.initPosition = e.point;
    this.mouseDown = true;

    let hit = this.checkHit(this.initPosition);
    let hitItem;

    if (hit) {
      hitItem = hit.item;
      if (e.event.altKey && hitItem.inGroup) {
        this.unselectAll();
        // hitItem.sel = false;
        this.select(hitItem);
        this.onAltSelect();
        return;
      }
      if (!hitItem.opacity) return;
      if (hitItem.inGroup) hitItem = this.getParent(hitItem);
    }

    if (e.scaleCenter) {
      return;
    }

    if (hit && (e.event.shiftKey || e.event.ctrlKey)) {
      const sel = e.event.ctrlKey ? !hitItem.sel : true;
      if (sel) {
        this.select(hitItem);
        this.onUpdateSelectionCB(SELECT_EVENT);
      } else this.unselect(hitItem);
    } else {
      if ((hit && !hitItem.sel) || (!hit && !e.event.shiftKey && !e.event.ctrlKey)) {
        this.unselectAll();
        if (hit) {
          this.select(hitItem);
        } else {
          if (typeof this.onUnselectAll === 'function') this.onUnselectAll();
        }
        this.onUpdateSelectionCB(SELECT_EVENT);
      } else {
        if (hit) {
          this.select(hitItem);
          this.onUpdateSelectionCB(SELECT_EVENT);
        }
      }
    }
  }

  private onUpdateSelectionCB(with_event) {
    if (typeof this.onUpdateSelection === 'function') this.onUpdateSelection(this.selectionGroup.bounds);
    if (with_event && typeof this.onSelect === 'function') this.onSelect();
  }

  updateSelection(with_event?) {
    this.onUpdateSelectionCB(with_event);
  }

  getParent(item: any): any {
    if (item.inGroup && item.parent && item.parent.uid !== SELECT) item = this.getParent(item.parent);
    return item;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  selectGroup(item) {
    this.select(item);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  onMouseMove(e) {
    if (!this.mouseDown) return;
    this.mouseMove = true;

    if (this.selectedItems.length && !this.rect && !e.event.shiftKey && !e.event.ctrlKey) {
      if (this.selectedItems.length) {
        this.snap(e);

        this.onUpdateSelectionCB();
      }
    } else {
      if (this.rect) this.rect.remove();
      const x = this.initPosition.x;
      const y = this.initPosition.y;
      const w = e.point.x - x;
      const h = e.point.y - y;
      let rect = [x, y, w, h];

      this.rect = new this.paper.Path.Rectangle(rect);
      this.rect.strokeScaling = false;
      this.rect.strokeColor = this.color;
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  onMouseUp(e) {
    e.scaleCenter = null;
    this.mouseDown = this.mouseMove = false;

    if (!this.initPosition) return;
    const x = this.initPosition.x;
    const y = this.initPosition.y;
    const w = e.point.x - x;
    const h = e.point.y - y;
    let rect = [x, y, w, h];

    let option: any = {
      inside: rect,
    };

    if (w < 0) {
      rect = [e.point.x, e.point.y, Math.abs(w), Math.abs(h)];
      option = { overlapping: rect };
    }

    if (w > 0 && h < 0) {
      rect = [x, e.point.y, Math.abs(w), Math.abs(h)];
      option = { inside: rect };
    }

    if (w < 0 && h > 0) {
      rect = [e.point.x, y, Math.abs(w), Math.abs(h)];
      option = { overlapping: rect };
    }

    let with_event;

    if (this.rect) {
      this.rect.remove();

      this.rect = null;

      if (this.mirrorScalars.x < 0) {
        if (option.overlapping) {
          option.overlapping = null;
          option.inside = rect;
        } else {
          option.overlapping = rect;
          option.inside = null;
        }
      }

      option.opacity = function (value) {
        return value > 0.5;
      };

      let inside = window[OBJECTS_LAYER].getItems(option);
      let insideSel = this.selectionGroup.getItems(option);
      if (inside.length) {
        with_event = SELECT_EVENT;
        for (let i = 0; i < inside.length; i++) {
          const item = inside[i];

          if (
            !item.userGroup &&
            (!item.type || item.name === CENTER_GRID || item.name === OBJECTS_LAYER || item.inGroup)
          )
            continue;

          const sel = e.event.ctrlKey && !e.event.shiftKey ? (item.sel = !item.sel) : true;
          if (sel) {
            this.select(item);
          } else {
            this.unselect(item);
          }
        }
      }

      if (insideSel.length) {
        with_event = SELECT_EVENT;

        for (let i = 0; i < insideSel.length; i++) {
          const item = insideSel[i];

          if (!item.type || item.name === CENTER_GRID || item.name === OBJECTS_LAYER || item.inGroup) continue;

          const sel = e.event.ctrlKey && !e.event.shiftKey ? (item.sel = !item.sel) : true;
          if (sel) {
            this.select(item);
          } else {
            this.unselect(item);
          }
        }
      }
    } else {
      this.setupSelection();
    }

    this.onUpdateSelectionCB(with_event);
  }

  get snapGrid() {
    return window[SNAP_GRID];
  }

  get snapAngle() {
    return window[SNAP_ANGLE];
  }

  get snapHandle() {
    return window[SNAP_HANDLE];
  }

  get snapEnabled() {
    return JSON.parse(localStorage.getItem(SNAP_TO_GRID) || 'true');
  }

  private snap(e: any) {
    let xx = this.selectionGroup.startPosition.x + e.point.x - this.initPosition.x;
    let yy = this.selectionGroup.startPosition.y + e.point.y - this.initPosition.y;
    let snapGrid = this.snapGrid;
    if (!this.snapEnabled) snapGrid = window[CURRENT_UNIT] === Unit.Metric ? 0.1 : 0.09921875;
    if (!e.event.altKey) {
      if (this.snapHandle === Snapping.N) {
        yy = this.selectionGroup.startBounds.top + e.point.y - this.initPosition.y;
        xx = Math.floor(xx / snapGrid) * snapGrid;
        yy = Math.floor(yy / snapGrid) * snapGrid;
        this.selectionGroup.position.x = xx;
        this.selectionGroup.bounds.top = yy;
      }

      if (this.snapHandle === Snapping.NE) {
        xx = this.selectionGroup.startBounds.right + e.point.x - this.initPosition.x;
        yy = this.selectionGroup.startBounds.top + e.point.y - this.initPosition.y;
        xx = Math.floor(xx / snapGrid) * snapGrid;
        yy = Math.floor(yy / snapGrid) * snapGrid;
        this.selectionGroup.bounds.right = xx;
        this.selectionGroup.bounds.top = yy;
      }

      if (this.snapHandle === Snapping.E) {
        xx = this.selectionGroup.startBounds.right + e.point.x - this.initPosition.x;
        yy = this.selectionGroup.startPosition.y + e.point.y - this.initPosition.y;
        xx = Math.floor(xx / snapGrid) * snapGrid;
        yy = Math.floor(yy / snapGrid) * snapGrid;
        this.selectionGroup.bounds.right = xx;
        this.selectionGroup.position.y = yy;
      }

      if (this.snapHandle === Snapping.SE) {
        xx = this.selectionGroup.startBounds.right + e.point.x - this.initPosition.x;
        yy = this.selectionGroup.startBounds.bottom + e.point.y - this.initPosition.y;
        xx = Math.floor(xx / snapGrid) * snapGrid;
        yy = Math.floor(yy / snapGrid) * snapGrid;
        this.selectionGroup.bounds.right = xx;
        this.selectionGroup.bounds.bottom = yy;
      }

      if (this.snapHandle === Snapping.S) {
        yy = this.selectionGroup.startBounds.bottom + e.point.y - this.initPosition.y;
        xx = Math.floor(xx / snapGrid) * snapGrid;
        yy = Math.floor(yy / snapGrid) * snapGrid;
        this.selectionGroup.position.x = xx;
        this.selectionGroup.bounds.bottom = yy;
      }

      if (this.snapHandle === Snapping.SW) {
        xx = this.selectionGroup.startBounds.left + e.point.x - this.initPosition.x;
        yy = this.selectionGroup.startBounds.bottom + e.point.y - this.initPosition.y;
        xx = Math.floor(xx / snapGrid) * snapGrid;
        yy = Math.floor(yy / snapGrid) * snapGrid;
        this.selectionGroup.bounds.left = xx;
        this.selectionGroup.bounds.bottom = yy;
      }

      if (this.snapHandle === Snapping.W) {
        xx = this.selectionGroup.startBounds.left + e.point.x - this.initPosition.x;
        xx = Math.floor(xx / snapGrid) * snapGrid;
        yy = Math.floor(yy / snapGrid) * snapGrid;
        this.selectionGroup.bounds.left = xx;
        this.selectionGroup.position.y = yy;
      }

      if (this.snapHandle === Snapping.NW) {
        xx = this.selectionGroup.startBounds.left + e.point.x - this.initPosition.x;
        yy = this.selectionGroup.startBounds.top + e.point.y - this.initPosition.y;
        xx = Math.floor(xx / snapGrid) * snapGrid;
        yy = Math.floor(yy / snapGrid) * snapGrid;
        this.selectionGroup.bounds.left = xx;
        this.selectionGroup.bounds.top = yy;
      }

      if (this.snapHandle === Snapping.Center) {
        xx = Math.floor(xx / snapGrid) * snapGrid;
        yy = Math.floor(yy / snapGrid) * snapGrid;
        this.selectionGroup.position.x = xx;
        this.selectionGroup.position.y = yy;
      }
    } else {
      this.selectionGroup.position.x = xx;
      this.selectionGroup.position.y = yy;
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  filterSubGroups(items) {
    let result = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.userGroup) {
        const sub = this.filterSubGroups(item.children);
        if (sub.length) result = result.concat(sub);
        continue;
      }
      result.push(item);
    }
    return result;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  group(name?) {
    if (this.selectedItems.length < 2) return;
    window[OBJECTS_LAYER].addChild(this.selectionGroup);
    const group = new this.paper.CompoundPath({ fillRule: 'evenodd' });
    group.userGroup = true;
    group.uid = codec64.uId('group_');
    group.kind = E_KIND_GROUP;
    group.uname = E_KIND_GROUP + ' ' + ++Counters.Groups;
    group.laserSettings = DeepCopy(DefaultLaserSettings);

    const items = this.filterSubGroups(this.selectedItems);

    const ids = [];
    for (let i = 0; i < items.length; i++) {
      let item = items[i];

      if (i === items.length - 1) {
        group.laserSettings = DeepCopy(DefaultLaserSettings);
        group.laserSettings.laserType = item.laserSettings.laserType;
        group.currentParent = item.currentParent;
      }
      item.data.prevRotation = 0;
      group.addChild(item);
      item.sel = false;
      item.inGroup = true;

      ids.push(item.uid);
    }
    if (ids.length < 2) return;
    group.sel = true;
    group.name = 'user_group';
    if (name) group.uname = name;
    this.selectedItems = [];
    this.selectedItems.push(group);
    this.selectionGroup.addChild(group);
    this.selectionGroup.userGroup = true;
    if (typeof this.onGroup === 'function') this.onGroup(group);
    this.onUpdateSelectionCB();
  }

  removeEmptyGroups(children) {
    for (let i = 0; i < children.length; i++) {
      const group = children[i];

      if (group.children && !group.children.length) group.remove();
      if (group.children && group.children.length) this.removeEmptyGroups(group.children);
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  ungroup() {
    if (this.selectedItems.length !== 1) return;
    window[OBJECTS_LAYER].addChild(this.selectionGroup);

    const item = this.selectedItems[0];
    const items = item.children;
    const parentGroup = item.currentParent;

    if (!item.userGroup || !items || !items.length) return;

    item.userGroup = false;
    const ungroup = [];

    for (let i = 0; i < items.length; i++) {
      const child = items[i];
      if (!child.laserSettings) child.laserSettings = DeepCopy(DefaultLaserSettings);
      child.sel = false;
      child.inGroup = false;
      child.strokeScaling = false;
      child.strokeColor = window[CURRENT_THEME].object.selected;
      child.fillColor = child.laserSettings.laserType === 1 ? null : child.fillColor;
      child.type = 'ungroup';
      child.currentParent = parentGroup;
      child.data.prevRotation = item.data.rotation;
      this.selectionGroup.addChildren(child);
      ungroup.push(child);
    }
    ungroup.sel = true;
    ungroup.currentParent = parentGroup;

    this.selectionGroup.addChildren(ungroup);
    this.selectedItems = ungroup;
    const rem = item.remove();
    if (typeof this.onUngroup === 'function') this.onUngroup(ungroup);
    this.updateSelection(true);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  onMouseRotation(e) {
    let angle =
      Math.floor(
        (Math.atan2(e.point.y - this.selectionGroup.position.y, e.point.x - this.selectionGroup.position.x) * 180) /
          Math.PI,
      ) +
      90 * window[MIRROR_SCALARS].y;

    let snapAngle = this.snapAngle;
    if (!this.snapEnabled) snapAngle = 1;

    angle = Math.floor(angle / snapAngle) * snapAngle;
    this.selectionGroup.rotate(-this.angle);
    this.angle = angle;
    this.rotation = angle;
    this.selectionGroup.rotate(angle);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private unselectAll() {
    for (let i = 0; i < this.selectedItems.length; i++) {
      const item = this.selectedItems[i];
      this.unselect(item);
    }
    this.selectedItems = [];
  }

  private unselectChildren(item: any) {
    const children = item.children;
    for (let i = 0; i < children.length; i++) {
      const item = children[i];
      if (item.kind === E_KIND_GROUP) this.unselectChildren(item);
      else {
        item.sel = false;
        const isFill = item.laserSettings && item.laserSettings.laserType === ElementLaserType.Fill;
        const fillColor = isFill ? 'rgba(0,0,0,.5)' : null;
        const strokeColor = isFill ? 'rgba(0,0,0,.5)' : getElementColor(item);
        item.strokeColor = strokeColor;
        if (isFill || item.kind === E_KIND_TEXT) {
          item.fillColor = fillColor;
        }
        if (item.kind === E_KIND_TEXT) {
          applyStrokeFill(item, strokeColor, fillColor);
        }
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  checkHit(point) {
    const items = window[OBJECTS_LAYER].children || window[OBJECTS_LAYER].curves;
    if (!window[OBJECTS_LAYER] || !items.length) return;
    const scale = window[SCALE] || 1;
    this.hitOptions.tolerance = TOLERANCE / scale;
    const hit =
      window[OBJECTS_LAYER].hitTest(point, this.hitOptions) || this.selectionGroup.hitTest(point, this.hitOptions);
    return hit;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  scale(scaleHandle, sizeItem, scale, e) {
    if (!this.selectedItems.length) return;

    const ev = e.event;
    const shift = ev.shiftKey;
    const alt = ev.altKey;
    const ctrl = ev.ctrlKey || ev.metaKey;
    const MUL = 2;
    let SG = this.snapGrid;
    if (!this.snapEnabled) SG = window[CURRENT_UNIT] === Unit.Metric ? 0.1 : 0.09921875;

    let x = sizeItem.x / scale;
    let y = sizeItem.y / scale;

    if (!alt) {
      x = Math.floor(x / SG) * SG;
      y = Math.floor(y / SG) * SG;
    }

    let newWidth, newHeight;

    const wmsx = window[MIRROR_SCALARS].x;
    const wmsy = window[MIRROR_SCALARS].y;

    let xx = x * wmsx;
    let yy = y * wmsy;

    let xxx = x * wmsx;
    let yyy = y * wmsy;

    const item = this.selectionGroup;
    item.applyMatrix = true;

    let sbw = item.startBounds.width / (ctrl ? MUL : 1);
    let sbh = item.startBounds.height / (ctrl ? MUL : 1);
    let sbt = item.startBounds.top;
    let sbr = item.startBounds.right;
    let sbb = item.startBounds.bottom;
    let sbl = item.startBounds.left;

    let nwe = sbw + xx;
    let nww = sbw - xx;

    let nhs = sbh + yy;
    let nhn = sbh - yy;

    let dw = 0;
    let de = 0;
    let dn = 0;
    let ds = 0;

    if (!alt) {
      de = sbl - Math.floor(sbl / SG) * SG;
      dw = sbr - Math.floor(sbr / SG) * SG;

      dn = sbb - Math.floor(sbb / SG) * SG;
      ds = sbt - Math.floor(sbt / SG) * SG;

      nwe = Math.floor((sbw + xxx) / SG) * SG + SG * wmsx;
      nww = Math.floor((sbw - xxx) / SG) * SG;

      nhs = Math.floor((sbh + yyy) / SG) * SG + SG * wmsy;
      nhn = Math.floor((sbh - yyy) / SG) * SG;

      // xx = Math.floor(xx / SG) * SG;
      // yy = Math.floor(yy / SG) * SG;
    }

    switch (scaleHandle) {
      case ScaleHandle.E:
        newWidth = nwe * (ctrl ? MUL : 1) - de;
        if (newWidth > 0) {
          item.bounds.width = newWidth;
        }
        if (ctrl) item.bounds.center = item.startBounds.center;
        else item.bounds.left = item.startBounds.left;
        break;

      case ScaleHandle.W:
        newWidth = nww * (ctrl ? MUL : 1) + dw;

        if (newWidth > 0) {
          item.bounds.width = newWidth;
          item.bounds.right = item.startBounds.right;
        }
        if (ctrl) item.bounds.center = item.startBounds.center;
        else item.bounds.right = item.startBounds.right;
        break;

      case ScaleHandle.N:
        newHeight = nhn * (ctrl ? MUL : 1) + dn;
        if (newHeight > 0) {
          item.bounds.height = newHeight;
          item.bounds.bottom = item.startBounds.bottom;
        }
        if (ctrl) item.bounds.center = item.startBounds.center;
        else item.bounds.bottom = item.startBounds.bottom;
        break;

      case ScaleHandle.S:
        newHeight = nhs * (ctrl ? MUL : 1) - ds;
        if (newHeight > 0) item.bounds.height = newHeight;
        if (ctrl) item.bounds.center = item.startBounds.center;
        else item.bounds.top = item.startBounds.top;
        break;

      case ScaleHandle.NE:
        newHeight = nhn * (ctrl ? MUL : 1) - dn;
        if (newHeight > 0) {
          item.bounds.height = newHeight;
          item.bounds.bottom = item.startBounds.bottom;
        }
        newWidth = nwe * (ctrl ? MUL : 1) - de;
        if (!shift) newWidth = (item.startBounds.width / item.startBounds.height) * newHeight;
        if (newWidth > 0) item.bounds.width = newWidth;
        if (ctrl) item.bounds.center = item.startBounds.center;
        else item.bounds.bottom = item.startBounds.bottom;
        break;

      case ScaleHandle.SE:
        newHeight = nhs * (ctrl ? MUL : 1) + ds;
        if (newHeight > 0) item.bounds.height = newHeight;
        newWidth = nwe * (ctrl ? MUL : 1) - de;
        if (!shift) newWidth = (item.startBounds.width / item.startBounds.height) * newHeight;

        if (newWidth > 0) item.bounds.width = newWidth;
        if (ctrl) item.bounds.center = item.startBounds.center;
        else item.bounds.top = item.startBounds.top;
        break;

      case ScaleHandle.NW:
        newHeight = nhn * (ctrl ? MUL : 1) - dn;
        if (newHeight > 0) {
          item.bounds.height = newHeight;
          item.bounds.bottom = item.startBounds.bottom;
        }
        newWidth = nww * (ctrl ? MUL : 1) + dw;
        if (!shift) newWidth = (item.startBounds.width / item.startBounds.height) * newHeight;

        if (newWidth > 0) {
          item.bounds.width = newWidth;
          item.bounds.right = item.startBounds.right;
        }
        if (ctrl) item.bounds.center = item.startBounds.center;
        else item.bounds.right = item.startBounds.right;
        break;

      case ScaleHandle.SW:
        newHeight = nhs * (ctrl ? MUL : 1) + ds;
        if (newHeight > 0) item.bounds.height = newHeight;
        newWidth = nww * (ctrl ? MUL : 1) + dw;
        if (!shift) newWidth = (item.startBounds.width / item.startBounds.height) * newHeight;
        if (newWidth > 0) {
          item.bounds.width = newWidth;
          item.bounds.right = item.startBounds.right;
        }
        if (ctrl) item.bounds.center = item.startBounds.center;
        else item.bounds.right = item.startBounds.right;
        break;
    }
    this.onUpdateSelectionCB();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  remove() {
    if (!this.selectedItems.length) return;
    for (let i = 0; i < this.selectedItems.length; i++) {
      const item = this.selectedItems[i];
      if (item.type === E_KIND_RASTER) {
        if (window[ELEMENTS][item.uid]) {
          if (window[ELEMENTS][item.uid].vector) window[ELEMENTS][item.uid].vector.remove();
          window[ELEMENTS][item.uid].remove();
        }
        if (window[VECTORS][item.uid]) window[VECTORS][item.uid].remove();
      }
      item.remove();
    }
    this.selectedItems = [];
    this.onUpdateSelectionCB();
    if (typeof this.onRemove === 'function') this.onRemove();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  duplicate() {
    if (!this.selectedItems.length) return;
    this.duplicates = [];
    for (let i = 0; i < this.selectedItems.length; i++) {
      const item = this.selectedItems[i];
      this.cloneItem(item);
    }
    if (typeof this.onDuplicate === 'function') this.onDuplicate(this.duplicates);
    this.updateSelection(true);
  }

  cloneItem(item: any, parent?: any, original?: any) {
    const uid = codec64.uId(item.userGroup ? 'group_' : 'element_');
    let dup = item;

    if (!parent) {
      dup = item.clone();
      item.sel = false;
      dup.sel = false;
      original = item;
      parent = uid;
      this.duplicates.push(dup);
    }
    dup.currentParent = parent;
    dup.uid = uid;
    dup.laserSettings = DeepCopy(original.laserSettings);
    dup.uname = original.uname + ' copy';
    if (original.inGroup) dup.inGroup = original.inGroup;
    dup.userGroup = original.userGroup;
    // dup.startBounds = DeepCopy(original.startBounds);
    // dup.startPosition = DeepCopy(original.startPosition);
    dup.kind = original.kind;
    if (original.type) dup.type = original.type;
    if (dup.kind === E_KIND_IMAGE) {
      if (!window[IMAGES]) window[IMAGES] = [];
      window[IMAGES][dup.uid] = dup;
    }
    if (dup.kind === E_KIND_GROUP && dup.children && dup.children.length) {
      let orig = original;
      for (let i = 0; i < dup.children.length; i++) {
        const child = dup.children[i];
        child.uid = codec64.uId(child.userGroup ? 'group_' : 'element_');
        child.inGroup = true;
        if (orig.kind === E_KIND_GROUP) orig = item.children[i];
        this.cloneItem(child, parent, orig);
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  set color(col) {
    this._color = col;
  }

  get color() {
    return this._color;
  }

  get mirrorScalars() {
    return window[MIRROR_SCALARS];
  }
}
