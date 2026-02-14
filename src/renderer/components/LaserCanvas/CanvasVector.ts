// @ts-ignore
// @ts-nocheck
import CanvasElement, { Counters, E_KIND_CURVE, E_KIND_GROUP, E_KIND_RASTER, E_KIND_VECTOR } from './CanvasElement';
import fs from 'fs';
import path from 'path';
import { CENTER_GRID, CURRENT_THEME, MIRROR_SCALARS, OBJECTS_LAYER, VECTORS } from './LaserCanvas';
import { ImportDXF } from '../../modules/importers/dxf';
import { codec64 } from '../../lib/api/cherry/codec64';
import { tr } from '../../lib/api/cherry/langs';

const SVG_DPI = 96;
const RASTERIZE_DPI = SVG_DPI * 4;
export const VECTOR_IMPORT_EXTENSIONS = ['svg', 'dxf', 'pdf', 'ai'];

export default class CanvasVector extends CanvasElement {
  fillGroups: [];
  strokeGroups: [];
  vector: any;
  prevBiggestArea = 0;
  constructor(protected paper) {
    super(paper);
    this.init();
  }
  private init() {
    window[OBJECTS_LAYER].activate();

    this.element = new this.paper.CompoundPath({ fillRule: 'evenodd' });
  }

  //////////////////////////////////////////////////////////////////////////////////////////

  loadSVG(fileName: string) {
    window[OBJECTS_LAYER].activate();

    return new Promise((resolve, reject) => {
      try {
        this.element.removeChildren();
        this.fillGroups = [];
        this.strokeGroups = [];

        const svg = fs.readFileSync(path.resolve(fileName), 'utf8');
        let temp = this.paper.project.importSVG(svg, {
          expandShapes: true,
          applyMatrix: false,
          insert: false,
        });
        const element = this.paper.project.importSVG(svg, {
          expandShapes: true,
        });

        element.matrix.a = temp.matrix.d;
        element.matrix.d = temp.matrix.a;
        element.uname = path.basename(fileName); //tr(E_KIND_VECTOR) + ' ' + ++Counters.Vectors;

        this.prepareElement(element);
        temp.remove();
        temp = null;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  //////////////////////////////////////////////////////////////////////////////////////////

  async loadDXF(fileName: string) {
    this.element.removeChildren();
    this.fillGroups = [];
    this.strokeGroups = [];

    const dxf = fs.readFileSync(path.resolve(fileName), 'utf8');
    const element = await ImportDXF(dxf, this.paper);
    element.uname = path.basename(fileName);
    this.prepareElement(element, false);
    this.makeStrokeGroups(element);
    this.makeFillGroups(element);
  }

  //////////////////////////////////////////////////////////////////////////////////////////

  async loadText(element: any) {
    this.element.removeChildren();

    element.uname = 'Text';
    this.prepareElement(element, false);
  }

  //////////////////////////////////////////////////////////////////////////////////////////

  async loadCombine(element: any, uname = 'Combined') {
    this.element.removeChildren();

    element.uname = uname;
    this.prepareElement(element, false);
  }

  //////////////////////////////////////////////////////////////////////////////////////////

  async loadPDF(fileName: string) {
    const data = new Uint8Array(fs.readFileSync(fileName));
    pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(__static, 'pdf', 'pdf.worker.js');
    const doc = await pdfjsLib.getDocument({
      data,
      cMapUrl: path.join(__static, 'pdf', 'cmaps'),
      cMapPacked: true,
      fontExtraProperties: true,
    }).promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 1.0 });
    const opList = await page.getOperatorList();
    const svgGfx = new pdfjsLib.SVGGraphics(page.commonObjs, page.objs, /* forceDataSchema = */ true);
    svgGfx.embedFonts = true;
    let svg = await svgGfx.getSVG(opList, viewport);
    svg =
      `<svg version="1.1" width="${viewport.width}px" height="${viewport.height}px" preserveAspectRatio="none" viewBox="0 0 ${viewport.width} ${viewport.height}">` +
      svg.innerHTML.replace(/svg:/g, '') +
      '</svg>';
    const element = this.paper.project.importSVG(svg, { expandShapes: true });
    element.uname = path.basename(fileName);
    this.prepareElement(element, true, 72);
  }

  //////////////////////////////////////////////////////////////////////////////////////////

  private prepareElement(element: any, fit = true, scale = SVG_DPI) {
    window[OBJECTS_LAYER].activate();

    element.opacity = 1;
    element.strokeWidth = 1;
    element.scaling = 1;
    element.strokeScaling = false;

    element.scale(1 * window[MIRROR_SCALARS].x, 1 * window[MIRROR_SCALARS].y);
    if (fit)
      if (
        element.bounds.width > window[CENTER_GRID].bounds.width ||
        element.bounds.height > window[CENTER_GRID].bounds.height
      )
        element.fitBounds(0, 0, (element.bounds.width / scale) * 25.4, (element.bounds.height / scale) * 25.4);

    element.userGroup = true;
    element.kind = E_KIND_VECTOR;
    element.type = E_KIND_VECTOR;

    this.rasterized = false;
    this.vector = element;
    this.vector.uid = this.uid;
    this.groupChildren(this.vector);

    element.strokeColor = window[CURRENT_THEME].object.strokeColor;
    element.fillColor = null;
  }

  //////////////////////////////////////////////////////////////////////////////////////////

  makeStrokeGroups(element) {
    if (!this.strokeGroups) return;
    const groups = Object.keys(this.strokeGroups);
    if (!groups || !groups.length) return;

    for (let i = 0; i < groups.length; i++) {
      const group = this.strokeGroups[groups[i]];
      const paperGroup = new this.paper.CompoundPath(group, { fillRule: 'evenodd' });
      paperGroup.inGroup = true;
      paperGroup.sel = false;
      paperGroup.uid = codec64.uId('group_');
      paperGroup.kind = E_KIND_GROUP;
      paperGroup.type = E_KIND_VECTOR;
      paperGroup.uname =
        `<span style="border:1px solid #444;margin-right:0.5rem;min-width:1.5rem;background-color:${groups[i]}"></span>` +
        tr('Group');
      element.addChild(paperGroup);
    }
  }

  makeFillGroups(element) {
    if (!this.fillGroups) return;
    const groups = Object.keys(this.fillGroups);
    if (!groups || !groups.length) return;

    for (let i = 0; i < groups.length; i++) {
      const group = this.fillGroups[groups[i]];
      const paperGroup = new this.paper.CompoundPath(group, { fillRule: 'evenodd' });
      paperGroup.userGroup = true;
      paperGroup.inGroup = true;
      paperGroup.sel = false;
      paperGroup.uid = codec64.uId('group_');
      paperGroup.kind = E_KIND_GROUP;
      paperGroup.type = E_KIND_VECTOR;
      paperGroup.uname =
        `<span style="border:1px solid #444;margin-right:0.5rem;min-width:1.5rem;background-color:${groups[i]}"></span>` +
        tr('Group');

      element.addChild(paperGroup);
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////

  groupChildren(childP) {
    // if (childP.children && childP.children.length > 1000) {
    //   this.rasterized = true;
    // }
    let items = childP.children;
    for (let i = items.length - 1; i >= 0; i--) {
      const child = items[i];

      if (child.clipMask || (child.children && child.children.length === 0)) {
        child.remove();
        continue;
      }

      child.uid = codec64.uId('element_');
      child.sel = false;
      child.inGroup = true;
      child.kind = E_KIND_CURVE;
      child.uname = tr(E_KIND_CURVE) + ' ' + ++Counters.Curves;

      if (child.closed) {
        const area = Math.abs(child.area);
        if (area > this.prevBiggestArea) {
          child.outline = true;
          this.prevBiggestArea = area;
        }
      }

      let colorIndex;
      if (child.fillColor) {
        colorIndex = child.fillColor.toCSS();
        if (colorIndex.indexOf('NaN') > -1) colorIndex = 'rgb(0,0,0)';
        if (!this.fillGroups) this.fillGroups = [];

        if (!this.fillGroups[colorIndex]) {
          this.fillGroups[colorIndex] = [];
        }
        child.strokeColor = child.fillColor;
        child.data.fillColor = colorIndex;
        child.data.strokeColor = colorIndex;

        this.fillGroups[colorIndex].push(child);
      } else if (child.strokeColor) {
        colorIndex = child.strokeColor.toCSS();
        if (colorIndex.indexOf('NaN') > -1) colorIndex = 'rgb(0,0,0)';
        if (!this.strokeGroups) this.strokeGroups = [];
        if (!this.strokeGroups[colorIndex]) this.strokeGroups[colorIndex] = [];
        child.data.strokeColor = colorIndex;
        this.strokeGroups[colorIndex].push(child);
      }

      if (child.children && child.children.length) {
        child.userGroup = true;
        child.kind = E_KIND_GROUP;
        child.uname = tr(E_KIND_GROUP);
        this.groupChildren(child);
      }
    }
  }
}
