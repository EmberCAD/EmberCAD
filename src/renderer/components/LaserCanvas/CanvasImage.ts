import fs from 'fs';
import path from 'path';
import { codec64 } from '../../lib/api/cherry/codec64';
import { E_KIND_IMAGE } from './CanvasElement';

import { CENTER_GRID, IMAGES, MIRROR_SCALARS, OBJECTS_LAYER, VECTORS } from './LaserCanvas';

export default class CanvasImage {
  element: any;
  uid: string;
  constructor(private paper) {
    this.uid = codec64.uId('element_');
  }

  loadImage(fileName: string, contentType) {
    window[OBJECTS_LAYER].activate();
    return new Promise<void>(async (resolve, reject) => {
      try {
        this.paper.activate();
        const imageFile = fs.readFileSync(path.resolve(fileName));

        const source = 'data:' + contentType + ';base64,' + imageFile.toString('base64');

        this.element = new this.paper.Raster({ source });
        this.element.opacity = 0;
        this.element.uid = codec64.uId('element_');

        this.element.kind = E_KIND_IMAGE;
        this.element.type = E_KIND_IMAGE;
        this.element.sel = false;
        this.element.uname = path.basename(fileName);
        this.element.data.fileName = fileName;

        if (!window[IMAGES]) window[IMAGES] = [];
        if (!window[IMAGES][this.element.uid]) window[IMAGES][this.element.uid] = [];
        window[IMAGES][this.element.uid] = this.element;
        this.element.on('load', (result) => {
          this.element.scale(window[MIRROR_SCALARS].x, window[MIRROR_SCALARS].y);
          this.element.fitBounds([0, 0, window[CENTER_GRID].bounds.width / 3, window[CENTER_GRID].bounds.height / 3]);
          this.element.opacity = 1;

          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
