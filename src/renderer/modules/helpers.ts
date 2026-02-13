//@ts-ignore
//@ts-nocheck

import { roundPoint } from '../App/views/Work/ElementProperties';
import { CURRENT_UNIT, Unit, WORKING_AREA } from '../components/LaserCanvas/LaserCanvas';
import { ImagePreview } from './GCode/ImageG';
import { getElementDisplayColor } from './layers';

export function readUni(n: number) {
  return window[CURRENT_UNIT] === Unit.Metric ? roundPoint(n, 3) : mmToInch(n);
}
export function writeUni(n: number) {
  return window[CURRENT_UNIT] === Unit.Metric ? roundPoint(n, 3) : inchToMm(n);
}

export function mmToInch(mm: number): number {
  const inch = roundPoint(mm / 25.4, 4);
  return inch;
}

export function inchToMm(inch: number): number {
  const mm = roundPoint(inch * 25.4, 3);
  return mm;
}

function roundPoint(num, places) {
  const div = 10 ** places;
  return Math.round(num * div) / div;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function getElementColor(item): any {
  if (!isInArea(item)) return 'red';
  return getElementDisplayColor(item);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

String.prototype.removeCharAt = function (i: any) {
  let tmp = this.split('');
  tmp.splice(i - 1, 1);
  return tmp.join('');
};

String.prototype.insertCharAt = function (c: string, i: any) {
  if (i < 0 || i > this.length) return this;
  let tmp = this;
  if (tmp.length === i) tmp += c;
  else tmp = tmp.slice(0, i) + c + tmp.slice(i);
  return tmp;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function isInArea(item) {
  const b = item.bounds;
  const workingArea = window[WORKING_AREA];
  return !(b.left < 0 || b.top < 0 || b.right > workingArea.width || b.bottom > workingArea.height);
}

export function applyStrokeFill(item, strokeColor, fillColor) {
  if (!item) return;

  const apply = (node) => {
    if (!node) return;
    if (strokeColor !== undefined && node.strokeColor !== undefined) {
      node.strokeColor = strokeColor;
    }
    if (fillColor !== undefined && node.fillColor !== undefined) {
      node.fillColor = fillColor;
    }
    const children = node.children;
    if (children && children.length) {
      for (let i = 0; i < children.length; i++) {
        apply(children[i]);
      }
    }
  };

  apply(item);
}

export function checkImageInArea(item) {
  if (isInArea(item)) {
    if (item.outside) {
      item.outside = false;
      ImagePreview(item, true);
    }
    return;
  }

  const ctx = item.context;
  const canvas = item.canvas;
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  ctx.strokeStyle = 'red';
  ctx.lineWidth = w / 90;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w, h);
  ctx.stroke();
  item.outside = true;
}

function isIntersected(group) {
  for (let i = 1; i < group.children.length; i++) {
    const intersections = group.children[0].getIntersections(group.children[i]);
    if (intersections.length > 0) return true;
  }
  return false;
}

export function weld(group, paperWelder, exclude = false) {
  if (!group) return;
  if (!group.children || !group.children.length) return;

  let welded = new paperWelder.Path({ insert: false });
  welded.strokeColor = null;
  welded.fillColor = null;
  for (let i = 0; i < group.children.length; i++) {
    let child = group.children[i];
    if (child.name === 'skip') continue;
    if (child.children && child.children.length) {
      if (isIntersected(child)) child = weld(child, paperWelder);
    }
    if (exclude && child && child.getIntersections) {
      const intersections = child.getIntersections(welded);
      if (intersections.length) {
        welded = welded.unite(child, { insert: false });
      } else {
        welded = welded.exclude(child, { insert: false });
      }
    } else {
      try {
        welded = welded.unite(child, { insert: false });
      } catch (error) {}
    }
  }
  return welded;
}
