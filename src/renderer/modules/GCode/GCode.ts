//@ts-ignore
//@ts-nocheck
import { DefaultLaserSettings, ElementLaserType } from '../../App/views/Work/Work';
import { E_KIND_IMAGE, E_KIND_RASTER, E_KIND_TEXT, E_KIND_VECTOR } from '../../components/LaserCanvas/CanvasElement';
import {
  CURRENT_THEME,
  ELEMENTS,
  MIRROR_SCALARS,
  VECTORS,
  WORKING_AREA,
} from '../../components/LaserCanvas/LaserCanvas';
import { DeepCopy } from '../../lib/api/cherry/api';
import { FillToGcode, ImagePreview, ImageToGCode } from './ImageG';
import { DEFAULT_LAYER_ID, getDefaultLayerOrder, getLayerId, isToolLayer, LAYER_ORDER_KEY } from '../layers';

const ROUND = 1000;
export const DEFAULT_DIAMETER = 0.1;

export default class GCode {
  GCodeLines = []; // for laser
  GCodeSimLines = []; // for sim - all points - curves and lines as curves
  GCodeShape = [];
  GCodeShapes = [];
  GCodeElements = [];

  private _toolDiameter: number;
  lastPoint: any;
  sortedShapes: any;
  GCodePrefix: any;
  GCodeSufix: any;
  mirrorScalars: any;
  cutDistance: number;
  cutSteps = [];
  rapidSteps: number;
  prevGX: string;
  prevLineG: string;
  prevGY: any;
  prevLastPoint: { x: number; y: number };
  startPoint: { x: number; y: number };
  cleanupTable: never[];
  progs: number;

  constructor(private paper) {}
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  clear() {
    this.GCodeLines = [];
    this.GCodeSimLines = [];
    this.GCodeShapes = [];
    this.GCodeElements = [];
    this.GCodePrefix = [];
    this.GCodeSufix = [];
    this.lastPoint = { x: 0, y: 0 };
    this.cutSteps = [];

    this.initGCode();
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  initGCode() {
    this.GCodePrefix.push('; EmberCAD v' + window['mainApp'].version);
    this.GCodePrefix.push('G00 G17 G40 G21 G54');
    this.GCodePrefix.push('G90');
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  async addElements(item: any) {
    if (!item || !item.children || !item.children.length) return;

    this.progs = 0;
    this.rapidSteps = 0;
    this.GCodeSimLines = [];
    this.prevLastPoint = this.startPoint;

    this.cleanupTable = [];
    this.GCodeElements = [];

    const buckets = {};
    const layerTools = (item && item.data && item.data.layerTools) || {};
    const collect = (child) => {
      if (!child || child.visible === false) return;
      if (child.children && child.children.length) {
        for (let i = 0; i < child.children.length; i++) collect(child.children[i]);
      }
      const layerId = getLayerId(child) || DEFAULT_LAYER_ID;
      const layerTool = layerTools[layerId];
      const outputEnabled = isToolLayer(layerId) ? false : layerTool ? !!layerTool.output : !!child?.laserSettings?.output;
      const layerVisible = layerTool ? layerTool.visible !== false : child.visible !== false;
      if (!child.laserSettings || !outputEnabled || !layerVisible) return;
      if (isToolLayer(layerId)) return;
      if (child.children && child.children.length && child.kind !== E_KIND_TEXT && child.kind !== E_KIND_IMAGE) return;
      if (!buckets[layerId]) buckets[layerId] = [];
      buckets[layerId].push(child);
    };
    for (let i = 0; i < item.children.length; i++) collect(item.children[i]);

    const configuredOrder = Array.isArray(window[LAYER_ORDER_KEY]) ? window[LAYER_ORDER_KEY] : getDefaultLayerOrder();
    const orderedLayers = configuredOrder
      .filter((layerId) => buckets[layerId] && buckets[layerId].length)
      .concat(Object.keys(buckets).filter((layerId) => !configuredOrder.includes(layerId)));

    for (let l = 0; l < orderedLayers.length; l++) {
      const layerId = orderedLayers[l];
      const layerItems = buckets[layerId];
      this.GCodeShapes = [];
      for (let i = 0; i < layerItems.length; i++) {
        const child = layerItems[i];
        const b = child.bounds;
        if (b.left < 0 || b.top < 0 || b.right > this.workingArea.width || b.bottom > this.workingArea.height) continue;
        await this.addPoints(child);
      }

      if (!this.GCodeShapes.length) continue;

      this.sortShapes();
      this.findPathForSorted();
      this.GCodeElements.push(this.GCodeShapes.slice());
      const lastShape = this.GCodeShapes[this.GCodeShapes.length - 1];
      if (lastShape && lastShape.points && lastShape.points.length) {
        this.lastPoint = lastShape.points[lastShape.points.length - 1].position;
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  async addShape(item: any) {
    if (!item) return;

    await this.addPoints(item);

    if (!this.GCodeShapes.length) return;

    this.sortShapes();
    this.findPathForSorted();

    let lastIndex = this.GCodeShapes.length - 1;

    const last = this.GCodeShapes[lastIndex];

    this.lastPoint = last.points[last.points.length - 1].position;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  sortShapes() {
    if (!this.GCodeShapes || !this.GCodeShapes.length) {
      this.sortedShapes = [];
      return;
    }

    const shapes = this.GCodeShapes.slice();
    const len = shapes.length;
    const indegree = new Array(len).fill(0);
    const unlocks = new Array(len).fill(0).map(() => []);

    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const aInB = this.isShapeInside(shapes[i], shapes[j]);
        const bInA = this.isShapeInside(shapes[j], shapes[i]);
        if (aInB && !bInA) {
          indegree[j]++;
          unlocks[i].push(j);
        } else if (bInA && !aInB) {
          indegree[i]++;
          unlocks[j].push(i);
        }
      }
    }

    const available: number[] = [];
    for (let i = 0; i < len; i++) {
      if (indegree[i] === 0) available.push(i);
    }

    const used = new Array(len).fill(false);
    const ordered = [];
    let lastPoint = this.lastPoint || this.startPoint || { x: 0, y: 0 };

    while (ordered.length < len) {
      let pool = available.filter((idx) => !used[idx]);
      if (!pool.length) {
        pool = [];
        for (let i = 0; i < len; i++) {
          if (!used[i]) pool.push(i);
        }
      }
      if (!pool.length) break;

      let bestIdx = pool[0];
      let bestDist = Number.MAX_SAFE_INTEGER;
      let bestEnd = lastPoint;
      for (let i = 0; i < pool.length; i++) {
        const idx = pool[i];
        const meta = this.getShapeDistanceMeta(shapes[idx], lastPoint);
        if (meta.dist < bestDist) {
          bestDist = meta.dist;
          bestIdx = idx;
          bestEnd = meta.endPoint || lastPoint;
        }
      }

      used[bestIdx] = true;
      ordered.push(shapes[bestIdx]);
      lastPoint = bestEnd;

      for (let i = 0; i < unlocks[bestIdx].length; i++) {
        const to = unlocks[bestIdx][i];
        indegree[to] = Math.max(0, indegree[to] - 1);
        if (indegree[to] === 0 && !used[to] && !available.includes(to)) {
          available.push(to);
        }
      }
    }

    this.sortedShapes = ordered;
    this.GCodeShapes = ordered.slice();
  }

  private isShapeInside(inner: any, outer: any) {
    if (!inner?.bounds || !outer?.bounds) return false;
    const EPS = 1e-6;
    const b1 = inner.bounds;
    const b2 = outer.bounds;
    return (
      b1.x > b2.x + EPS &&
      b1.y > b2.y + EPS &&
      b1.x + b1.w < b2.x + b2.w - EPS &&
      b1.y + b1.h < b2.y + b2.h - EPS
    );
  }

  private getShapeDistanceMeta(shape: any, lastPoint: any) {
    const fallback = {
      dist: Number.MAX_SAFE_INTEGER,
      endPoint: lastPoint || { x: 0, y: 0 },
    };

    if (!shape || !shape.points || !shape.points.length || !lastPoint) return fallback;

    if (shape.kind !== E_KIND_IMAGE && !shape.fill) {
      const points = shape.points.slice(1);
      if (!points.length) return fallback;

      if (shape.closed) {
        const found = this.findNearestPoint(points, lastPoint);
        const nearest = points[found.nearestIndex]?.position || lastPoint;
        return { dist: found.dist, endPoint: nearest };
      }

      const endPoints = [points[0], points[points.length - 1]];
      const found = this.findNearestPoint(endPoints, lastPoint);
      const startIndex = found.nearestIndex || 0;
      const endIndex = startIndex === 0 ? 1 : 0;
      const endPoint = endPoints[endIndex]?.position || endPoints[startIndex]?.position || lastPoint;
      return { dist: found.dist, endPoint };
    }

    const first = shape.points[0]?.position;
    const last = shape.points[shape.points.length - 1]?.position;
    if (!first || !last) return fallback;
    return {
      dist: Math.abs(this.distance(lastPoint.x, lastPoint.y, first.x, first.y)),
      endPoint: last,
    };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  calculatePointsOnLine(A, B) {
    const deltaX = B.x - A.x;
    const deltaY = B.y - A.y;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const dividor = Math.round(distance / (this.toolDiameter || DEFAULT_DIAMETER));

    const step = distance / (dividor + 1);

    const points = [];
    for (let i = 1; i <= dividor; i++) {
      const pointX = A.x + (deltaX * i * step) / distance;
      const pointY = A.y + (deltaY * i * step) / distance;
      points.push({ position: { x: pointX, y: pointY }, rapid: true });
    }

    return points;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  findPathForSorted() {
    if (!this.GCodeShapes.length) return;

    for (let i = 0; i < this.GCodeShapes.length; i++) {
      const GCShape = this.GCodeShapes[i];

      if (!GCShape) continue;

      if (i > 0) this.prevLastPoint = this.lastPoint;

      if (GCShape.kind !== E_KIND_IMAGE && !GCShape.fill) {
        let points = GCShape.points.slice(1);

        const closed = GCShape.closed;

        if (!closed) {
          points = [points[0], points[points.length - 1]];
        }

        const found = this.findNearestPoint(points, this.prevLastPoint);
        let nearestIndex = found.nearestIndex;

        this.lastPoint = points[points.length - 1].position;
        let G0;
        let G1;

        if (closed) {
          if (nearestIndex) {
            const half1 = points.slice(nearestIndex);
            const half2 = points.slice(0, nearestIndex);
            half1[0].position.tip = 'pm';
            half2[half2.length - 1].position.tip = 'pm';

            G0 = DeepCopy(half1[0]);
            G0.g = 'G0';

            G1 = DeepCopy(half1[0]);
            G1.g = 'G1';
            GCShape.points = [G0, ...half1, ...half2, G1];

            this.lastPoint = G1.position;
          } else {
            G0 = DeepCopy(points[0]);
            G0.g = 'G0';
            GCShape.points = [G0, ...points];
            this.lastPoint = points[points.length - 1].position;
          }
        } else {
          let points2 = GCShape.points.slice(1);

          const firstPoint = points[nearestIndex].position;
          const firstSegment = GCShape.firstSegment;
          if (firstPoint.x !== firstSegment.x || firstPoint.y !== firstSegment.y) points2 = points2.reverse();
          G0 = DeepCopy(points2[0]);
          G0.g = 'G0';

          GCShape.points = [G0, ...points2];
          this.lastPoint = points2[points2.length - 1].position;
        }
      } else {
        this.lastPoint = GCShape.points[GCShape.points.length - 1].position;
      }
      const firstPosition = GCShape.points[0].position;

      const rapidPoints = this.calculatePointsOnLine(this.prevLastPoint, firstPosition);
      this.rapidSteps += rapidPoints.length;

      this.GCodeSimLines = this.GCodeSimLines.concat(rapidPoints);
      this.GCodeSimLines = this.GCodeSimLines.concat(GCShape.points);
    }
    this.prevLastPoint = this.lastPoint;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  findNearestShape() {
    if (!this.GCodeShapes.length) return;

    let lastPoint = this.lastPoint;

    let dist;
    let prevDist = Number.MAX_SAFE_INTEGER;
    let shapeIndex = 0;

    let nearestIndex;
    let length;
    for (let i = 0; i < this.GCodeShapes.length; i++) {
      let points;
      const GCShape = this.GCodeShapes[i];
      if (GCShape.kind !== E_KIND_IMAGE && !GCShape.fill) {
        const closed = GCShape.closed;

        points = GCShape.points.slice(1);

        if (!closed) {
          points = [points[0], points[points.length - 1]];
        }
        const found = this.findNearestPoint(points, lastPoint);
        dist = found.dist;

        if (dist < prevDist) {
          nearestIndex = found.nearestIndex;
          length = points.length;
          shapeIndex = i;
          prevDist = dist;
          this.lastPoint = points[points.length - 1].position;
        }
      } else {
        nearestIndex = GCShape.points[0].position;
        dist = Math.abs(this.distance(lastPoint.x, lastPoint.y, nearestIndex.x, nearestIndex.y));
        if (dist < prevDist) {
          shapeIndex = i;
          prevDist = dist;
          this.lastPoint = GCShape.points[GCShape.points.length - 1].position;
        }
      }
    }

    if (nearestIndex) {
      if (this.GCodeShapes[shapeIndex].kind !== E_KIND_IMAGE && !this.GCodeShapes[shapeIndex].fill) {
        let points2 = this.GCodeShapes[shapeIndex].points.slice(1);

        let G0;
        let G1;
        if (this.GCodeShapes[shapeIndex].closed) {
          const half1 = points2.slice(nearestIndex);
          const half2 = points2.slice(0, nearestIndex);
          half1[0].position.tip = 'pm';
          if (half2 && half2[half2.length - 1]) half2[half2.length - 1].position.tip = 'pm';

          G0 = DeepCopy(half1[0]);
          G0.g = 'G0';

          G1 = DeepCopy(half1[0]);
          G1.g = 'G1';

          this.GCodeShapes[shapeIndex].points = [G0, ...half1, ...half2, G1];
          // this.lastPoint = half2[half2.length - 1].position;
          this.lastPoint = G1.position;
        } else {
          G0 = DeepCopy(points2[0]);
          G0.g = 'G0';

          this.GCodeShapes[shapeIndex].points = [G0, ...points2];
          this.lastPoint = points2[points2.length - 1].position;
        }
      }
    }
    this.sortedShapes.push(this.GCodeShapes[shapeIndex]);
    this.GCodeShapes.splice(shapeIndex, 1);
    this.findNearestShape();
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  findNearestPoint(points: any, lastPoint: any) {
    let nearestIndex;
    let prevDist = Number.MAX_SAFE_INTEGER;
    let dist = 0;
    let point;
    let idx = 0;
    for (let i = 0; i < points.length; i++) {
      point = points[i].position;
      dist = Math.abs(this.distance(lastPoint.x, lastPoint.y, point.x, point.y));

      if (dist < prevDist) {
        nearestIndex = idx;
        prevDist = dist;
      }
      idx++;
    }

    return { dist, nearestIndex };
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  distance(x1, y1, x2, y2) {
    const xDistance = x2 - x1;
    const yDistance = y2 - y1;
    const distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);
    return distance;
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  async addPoints(item: any) {
    if (!item) return;
    return new Promise<void>(async (resolve, reject) => {
      let curve = item.firstCurve;
      let closed = item.closed;
      let params = item.laserSettings;
      let kind = item.kind;
      let isFill;
      if (item.laserSettings && item.laserSettings.laserType)
        isFill = item.laserSettings.laserType === ElementLaserType.Fill;
      const isText = kind === E_KIND_TEXT || (item.data && item.data.textSettings);

      if (!isFill && item.children && item.children.length) {
        for (let i = 0; i < item.children.length; i++) {
          const child = item.children[i];
          if (child.visible === false) continue;
          if (child.laserSettings && !child.laserSettings.output) continue;
          await this.addPoints(child);
        }
      }

      if (!isFill && item.kind !== E_KIND_IMAGE && (!item.curves || item.constructor.name === 'CompoundPath')) {
        resolve();
        return;
      }

      this.GCodeShape = [];

      let passes = 1;
      if (params && params.passes) passes = params.passes;

      if (kind !== E_KIND_IMAGE) {
        const shouldRasterFill =
          isFill &&
          (isText || (!item.userGroup && !item.inGroup) || (item.userGroup && !item.currentParent));

        if (shouldRasterFill) {
          this.GCodeShape = FillToGcode(item);
        } else {
          let length = item.curves.length;

          for (let p = 0; p < passes; p++) {
            for (let i = 0; i < length; i++) {
              if (i === 0) {
                this.addG0Point(curve.point1);
              }
              let straight = false;
              if (curve.isStraight()) straight = true;
              await this.getCurvePoints(curve, straight, closed);
              curve = curve.next;
            }
          }
        }
      } else {
        this.GCodeShape = ImageToGCode(item);
        ImagePreview(item);
      }

      if (this.GCodeShape.length) {
        const pidx = JSON.stringify(params);
        if (!this.cutSteps[pidx]) this.cutSteps[pidx] = 0;
        this.cutSteps[pidx] += this.GCodeShape.length;
        let firstSegment = {};
        if (kind !== E_KIND_IMAGE && item.laserSettings && item.laserSettings.laserType !== ElementLaserType.Fill) {
          firstSegment = {
            x: this.round(item.firstSegment.point.x),
            y: this.round(item.firstSegment.point.y),
          };
        } else {
          firstSegment = { x: item.bounds.x, y: item.bounds.y };
          if (item.laserSettings && item.laserSettings.laserType !== ElementLaserType.Fill)
            item.area = item.bounds.width * item.bounds.height;
        }
        this.GCodeShapes.push({
          firstSegment,
          points: this.GCodeShape,
          params,
          area: Math.abs(item.area),
          closed,
          kind: item.kind,
          fill: item.laserSettings ? item.laserSettings.laserType === ElementLaserType.Fill : false,
          name: item.uname,
          bounds: {
            x: item.bounds.x,
            y: item.bounds.y,
            w: item.bounds.width,
            h: item.bounds.height,
          },
        });
      }
      resolve();
    });
  }

  progress() {
    this.progs++;

    if (this.progs % 30000 !== 0) return;

    return new Promise<void>((resolve, reject) => {
      window['App'].titleBar.text = new Date().toISOString() + ' ' + this.progs;

      setTimeout(() => {
        resolve();
      }, 0);
    });
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getCurvePoints(curve: any, straight = false, closed) {
    return new Promise<void>(async (resolve, reject) => {
      let dividor = Math.floor(curve.length / (this.toolDiameter || DEFAULT_DIAMETER));
      if (dividor < curve.length) dividor = curve.length;
      for (let i = 0; i < dividor; i++) {
        let tip;
        if (straight && i === 0) tip = 'p1';
        if (!closed && straight && i === dividor - 1) tip = 'p2';

        const loc = curve.getPointAt((curve.length / dividor) * i);
        if (loc) {
          this.addG1Point(loc, straight, tip);
        }
        await this.progress();
      }

      if (this.GCodeShape.length > 0 && curve.index === curve.path.curves.length - 1) {
        let loc = curve.getPointAt(curve.length);
        this.addG1Point(loc, straight, 'p2');
      }
      resolve();
    });
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  addG1Point(loc, straight = false, tip) {
    const position = {
      x: this.round(loc.x),
      y: this.round(loc.y),
      straight,
      tip,
    };
    this.GCodeShape.push({ g: 'G1', position });
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  addG0Point(loc) {
    const position = { x: this.round(loc.x), y: this.round(loc.y) };

    this.GCodeShape.push({ g: 'G0', position });
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  round(v, d = ROUND) {
    return Math.floor(v * d) / d;
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getGCode(obj) {
    if (!this.GCodeElements.length) return;
    this.prevGX = `|`;
    this.prevGX = `|`;
    this.prevLineG = `|`;

    const gcode = [];
    let params = DefaultLaserSettings;
    for (let e = 0; e < this.GCodeElements.length; e++) {
      const element = this.GCodeElements[e];

      for (let s = 0; s < element.length; s++) {
        const points = element[s].points;

        if (element[s].params) params = element[s].params;

        const name = element[s].name;
        const kind = element[s].kind;
        const fill = element[s].fill;

        let elementParams = `S${params.power * 10}F${params.speed}`;

        let first;
        let gline;
        const air = params.air ? 'M8' : 'M9';
        const constant = params.constantPower ? 'M3' : 'M4';
        gcode.push(`; element: ${name}`);
        gcode.push(`; kind: ${kind}`);
        if (kind === E_KIND_IMAGE) {
          gcode.push(`; dither: ${params.image.dither}`);
          gcode.push(`; interval: ${this.round(params.fill.lineInterval, 100)} mm`);
        }

        if (fill) {
          gcode.push(`; filled`);
          gcode.push(`; interval: ${this.round(params.fill.lineInterval, 100)} mm`);
        }
        gcode.push(`; min power: ${params.minPower}%`);
        gcode.push(`; max power: ${params.power}%`);
        gcode.push(`; constant power: ${params.constantPower ? 'on' : 'off'}`);
        gcode.push(`; air: ${params.air ? 'on' : 'off'}`);
        gcode.push(`; passes: ${params.passes}`);
        gcode.push(air);
        if (params.air) gcode.push('M7');
        gcode.push(constant);
        const closed = element[s].closed;
        let power;
        for (let i = 0; i < points.length; i++) {
          const line = points[i];
          let params = '';
          if (line.params) {
            if (line.params.power !== undefined) params += `S${line.params.power}`;
            if (line.params.speed !== undefined) params += `F${line.params.speed}`;
          } else {
            if (i === 0) {
              params = 'F6000';
            }
            if (i === 1) {
              params = elementParams;
            }
          }
          let x = Number(line.position.x);
          let y = Number(line.position.y);
          if (x < 0) {
            x = 0;
            this.prevGX = -1;
            this.prevLineG = '';
          }
          if (y < 0) {
            y = 0;
            this.prevGY = -1;
            this.prevLineG = '';
          }
          let straight = line.position.straight;
          let tip = line.position.tip;
          let xx = 'X' + x;
          let yy = 'Y' + y;
          let g = line.g;
          if (g === this.prevLineG && x === this.prevGX) xx = '';
          if (g === this.prevLineG && y === this.prevGY) yy = '';
          this.prevGX = x;
          this.prevGY = y;
          this.prevLineG = g;
          if (xx === '' && yy === '') continue;
          gline = `${g} ${xx}${yy}`;

          if (!straight || (straight && tip)) {
            gcode.push(`${gline}${params ? params : ''}`);
          }
        }
      }
    }

    this.GCodeSufix = [];
    this.GCodeSufix.push('M5');
    this.GCodeSufix.push('M9');

    this.GCodeLines = gcode;

    const output = [...this.GCodePrefix, ...gcode, ...this.GCodeSufix];

    return output;
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getPreviewLine(idx) {
    if (idx === undefined) return;
    if (idx < 0 || idx >= this.GCodeSimLines.length) return;

    return this.GCodeSimLines[idx];
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  setStartPoint(x, y) {
    this.startPoint = { x, y };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  get workingArea() {
    return window[WORKING_AREA];
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  set toolDiameter(v: number) {
    this._toolDiameter = v;
  }

  get toolDiameter() {
    return this._toolDiameter;
  }

  get linesCount() {
    return this.GCodeLines.length;
  }

  get simLinesCount() {
    return this.GCodeSimLines.length;
  }
}
