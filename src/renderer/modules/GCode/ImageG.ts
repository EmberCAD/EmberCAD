//@ts-ignore
//@ts-nocheck

import { CENTER_GRID, MIRROR_SCALARS, PREVIEW_OPACITY, SCALE } from '../../components/LaserCanvas/LaserCanvas';
import RgbQuant from 'rgbquant';
import { DeepCopy } from '../../lib/api/cherry/api';
import { ElementLaserType } from '../../App/views/Work/Work';

export const reduceOptions = {
  colors: 2, // desired palette size
  method: 2, // histogram method, 2: min-population threshold within subregions; 1: global top-population
  boxSize: [64, 64], // subregion dims (if method = 2)
  boxPxls: 2, // min-population threshold (if method = 2)
  initColors: 4096, // # of top-occurring colors  to start with (if method = 1)
  minHueCols: 0, // # of colors per hue group to evaluate regardless of counts, to retain low-count hues
  dithKern: 'Jarvis', // dithering kernel name, see available kernels in docs below
  dithDelta: 0, // dithering threshhold (0-1) e.g: 0.05 will not dither colors with <= 5% difference
  dithSerp: false, // enable serpentine pattern dithering
  palette: [
    [0, 0, 0],
    [255, 255, 255],
  ], // a predefined palette to start with in r,g,b tuple format: [[r,g,b],[r,g,b]...]
  reIndex: false, // affects predefined palettes only. if true, allows compacting of sparsed palette once target palette size is reached. also enables palette sorting.
  useCache: true, // enables caching for perf usually, but can reduce perf in some cases, like pre-def palettes
  cacheFreq: 10, // min color occurance count needed to qualify for caching
  colorDist: 'euclidean', // method used to determine color distance, can also be "manhattan"
};

/*
FloydSteinberg
FalseFloydSteinberg
Atkinson
Burkes
Sierra
TwoSierra
SierraLite
*/

export const ImageToGCode = (element) => {
  const ctx2 = reduceRGB(element, reduceOptions);

  const top = element.bounds.top;
  const left = element.bounds.left;
  const passes = element.laserSettings.passes;
  const speed = element.laserSettings.speed;
  const lineInterval = element.laserSettings.fill.lineInterval || 0.4;
  const minPower = element.laserSettings.minPower || 15;
  const maxPower = element.laserSettings.power || 100;
  const negative = element.laserSettings.image.negative;
  const overscan = element.laserSettings.fill.overscan;
  const overscanValue = overscan ? element.laserSettings.fill.overscanValue : 0;

  const pixels = getGrayscalePixels(ctx2, speed, minPower, maxPower, negative);
  const rapidSpeed = 6000;
  const gcode = convertToGCode(pixels, left, top, lineInterval, 25.4, passes, rapidSpeed, overscanValue);
  return gcode;
};

////////////////////////////////////////////////////////////////////////////////////////////////

export const FillToGcode = (element) => {
  const WHITE = 'rgba(255,255,255,255)';
  const styles = [];

  const prepareNode = (node, isRoot = false) => {
    if (!node) return;
    styles.push({
      node,
      strokeColor: node.strokeColor,
      fillColor: node.fillColor,
      strokeWidth: node.strokeWidth,
      strokeScaling: node.strokeScaling,
      opacity: node.opacity,
    });
    if (node.strokeColor !== undefined) node.strokeColor = null;
    if (node.strokeScaling !== undefined) node.strokeScaling = false;
    if (isRoot && node.strokeWidth !== undefined) node.strokeWidth = element.laserSettings.fill.lineInterval;
    if (node.fillColor !== undefined) node.fillColor = WHITE;
    if (node.opacity !== undefined) node.opacity = 1;

    const children = node.children;
    if (children && children.length) {
      for (let i = 0; i < children.length; i++) {
        prepareNode(children[i], false);
      }
    }
  };

  prepareNode(element, true);
  element.opacity = 1;
  const raster = element.rasterize({ resolution: 4000, insert: false });
  raster.laserSettings = DeepCopy(element.laserSettings);
  raster.laserSettings.image.dither = 'Grayscale';
  raster.data.rotation = 0;

  raster.originalContext = undefined;
  const gcode = ImageToGCode(raster);

  for (let i = 0; i < styles.length; i++) {
    const { node, strokeColor, fillColor, strokeWidth, strokeScaling, opacity } = styles[i];
    if (!node) continue;
    if (node.strokeColor !== undefined) node.strokeColor = strokeColor;
    if (node.fillColor !== undefined) node.fillColor = fillColor;
    if (node.strokeWidth !== undefined && strokeWidth !== undefined) node.strokeWidth = strokeWidth;
    if (node.strokeScaling !== undefined && strokeScaling !== undefined) node.strokeScaling = strokeScaling;
    if (node.opacity !== undefined && opacity !== undefined) node.opacity = opacity;
  }
  element.opacity = PREVIEW_OPACITY;
  return gcode;
};

////////////////////////////////////////////////////////////////////////////////////////////////

export const ImagePreview = (element: any, refresh = false) => {
  const dither = element.laserSettings.image.dither;

  if ((dither === 'Original' && element.originalContext) || refresh) {
    element.context.imageSmoothingEnabled = true;
    element.context.drawImage(
      element.originalContext.canvas,
      0,
      0,
      element.width,
      element.height,
      0,
      0,
      element.width,
      element.height,
    );
    element.opacity = 0;
    element.opacity = 1;

    if (!refresh) return;
  }
  const ctx = reduceRGB(element, { dithKern: dither, preview: true });
};

export function reduceRGB(element: any, opts?: any) {
  if (!opts.preview) opts.dithKern = element.laserSettings.image.dither;
  if (opts.dithKern === 'Dither') opts.dithKern = 'FloydSteinberg';
  if (opts.dithKern === 'Dither2') opts.dithKern = 'FalseFloydSteinberg';

  opts = { ...reduceOptions, ...opts };

  if (!element.originalContext) {
    const canvas = document.createElement('canvas');
    canvas.width = element.width;
    canvas.height = element.height;
    const ctxOriginal = canvas.getContext('2d');
    ctxOriginal.imageSmoothingEnabled = true;

    ctxOriginal.drawImage(element.canvas, 0, 0, canvas.width, canvas.height, 0, 0, element.width, element.height);

    element.originalContext = ctxOriginal;
  } else {
    element.context.drawImage(
      element.originalContext.canvas,
      0,
      0,
      element.width,
      element.height,
      0,
      0,
      element.width,
      element.height,
    );
  }

  const lineInterval = element.laserSettings.fill.lineInterval || 0.4;
  const w = calculateNewImageSize(element.width, element.bounds.width, lineInterval);
  const h = calculateNewImageSize(element.height, element.bounds.height, lineInterval);

  let canvas = element.canvas;
  let ctx = element.context;
  const negative = element.laserSettings.image.negative;

  const obj = copyCanvasWithRotation(element, element.data.rotation || 0, w, h, opts.preview);
  canvas = obj.canvas;
  ctx = obj.ctx;
  let ctx2 = ctx;
  if (opts.dithKern === 'Original' || opts.dithKern === 'Grayscale') {
    rgbToGrayscale(ctx2, negative);
  } else {
    rgbToGrayscale(ctx2, negative);
    console.log(canvas.width, canvas.height);

    const q = new RgbQuant(opts);
    q.sample(canvas);
    q.palette();
    const idxi8 = q.reduce(canvas);
    const idxi32 = new Uint32Array(idxi8.buffer);
    const canvas2 = document.createElement('canvas');
    canvas2.width = canvas.width;
    canvas2.height = canvas.height;
    ctx2 = canvas2.getContext('2d');
    ctx2.imageSmoothingEnabled = true;

    const imgd = ctx2.createImageData(canvas2.width, canvas2.height);

    const buf32 = new Uint32Array(imgd.data.buffer);
    buf32.set(idxi32);
    ctx2.putImageData(imgd, 0, 0);
  }

  element.context.imageSmoothingEnabled = true;
  element.context.drawImage(
    ctx2.canvas,
    0,
    0,
    ctx2.canvas.width,
    ctx2.canvas.height,
    0,
    0,
    element.width,
    element.height,
  );
  element.opacity = 0;
  element.opacity = opts.preview ? 1 : 0.1;

  return ctx2;
}

////////////////////////////////////////////////////////////////////////////////////////////////

function getGrayscalePixels(context, speed, minPower, maxPower) {
  const width = context.canvas.width;
  const height = context.canvas.height;

  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const grayscalePixels = [];

  for (let i = 0; i < data.length; i += 4) {
    let red = data[i];
    let green = data[i + 1];
    let blue = data[i + 2];
    const alpha = data[i + 3];
    if (alpha < 255) {
      red = 0;
      green = 0;
      blue = 0;
    }

    let grayscaleValue = (0.299 * red + 0.587 * green + 0.114 * blue) / 255; // Assuming RGB image

    const laserPower = grayscaleToLaserPower(grayscaleValue, minPower, maxPower);
    grayscalePixels.push({ grayscaleValue, laserPower, speed, position: getPixelCoordinates(i, width), alpha });
  }

  return grayscalePixels;
}
////////////////////////////////////////////////////////////////////////////////////////////////

function rgbToGrayscale(context, inverse = false) {
  const width = context.canvas.width;
  const height = context.canvas.height;

  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let red = data[i];
    let green = data[i + 1];
    let blue = data[i + 2];

    let alpha = data[i + 3];
    if (alpha < 255) {
      red = 0;
      green = 0;
      blue = 0;
    }

    let grayscaleValue = 0.299 * red + 0.587 * green + 0.114 * blue; // Assuming RGB image

    if (inverse) {
      grayscaleValue = 255 - grayscaleValue;
    }

    data[i] = grayscaleValue;
    data[i + 1] = grayscaleValue;
    data[i + 2] = grayscaleValue;
  }

  context.putImageData(imageData, 0, 0);
}

////////////////////////////////////////////////////////////////////////////////////////////////

function getPixelCoordinates(index, width) {
  const pixelsIndex = index / 4; // Each pixel is represented by 4 values: red, green, blue, and alpha
  const y = Math.floor(pixelsIndex / width);
  const x = pixelsIndex % width;
  return { x, y };
}

////////////////////////////////////////////////////////////////////////////////////////////////

function grayscaleToLaserPower(grayscale, minPower, maxPower, isInverted = false) {
  if (grayscale < 0 || grayscale > 1) {
    throw new Error('Grayscale value must be between 0 and 1');
  }

  // min and max laser power

  // If isInverted is true, invert the grayscale
  if (isInverted) {
    grayscale = 1 - grayscale;
  }

  // handle edge cases
  if (grayscale === 1) {
    return maxPower;
  } else if (grayscale === 0) {
    return 0;
  }

  // calculate the gamma corrected grayscale value
  let gamma = 2.2;
  let gammaCorrected = Math.pow(grayscale, gamma);

  // linearly interpolate between min and max power using the gamma corrected value
  let laserPower = minPower + gammaCorrected * (maxPower - minPower);

  return laserPower;
}

////////////////////////////////////////////////////////////////////////////////////////////////

function convertToGCode(
  pixels,
  offsetX = 0,
  offsetY = 0,
  toolDiameter = 0.04,
  dpi = 25.4,
  passes = 1,
  rapidSpeed = 6000,
  overscanValue,
) {
  let gCode = [];
  let scaleFactor = 25.4 / dpi; // 1 inch = 25.4 mm

  overscanValue = Number((Math.round(overscanValue * 1000) / 1000).toFixed(2));

  let rows = [];
  pixels.forEach((pixel) => {
    if (!rows[pixel.position.y]) {
      rows[pixel.position.y] = [];
    }
    rows[pixel.position.y].push(pixel);
  });

  pixels = [];

  let reverse = false;
  let rowH = 0;

  let line = Math.floor(rows.length / 2);
  line = Number((Math.round(line * 1000) / 1000).toFixed(2));

  if (line) {
    rowH = (rows[line][0].position.y - rows[line - 1][0].position.y) * scaleFactor * toolDiameter;
  }

  const area = { w: window[CENTER_GRID].bounds.width, h: window[CENTER_GRID].bounds.height };
  let startPositionApplied = false;
  const begin = [];

  const toolDiameterHalf = toolDiameter / 2;
  for (let y = 0; y < rows.length; y++) {
    if (y > 0) rows[y - 1] = [];

    for (let pass = 0; pass < passes; pass++) {
      let rowPixels: any = rows[y];
      if (!rowPixels) continue;
      let start = -1;
      let end = -1;

      const gy = [];

      for (let x = 0; x < rowPixels.length; x++) {
        const pixel = rowPixels[reverse ? rowPixels.length - x - 1 : x];
        let power = Number((pixel.laserPower * 10).toFixed(1));

        if (end < 0) if (power > 0) start = x;
        if (start >= 0) if (power > 0) end = x;

        const xPosition =
          Math.floor(
            (pixel.position.x * scaleFactor * toolDiameter +
              offsetX +
              toolDiameterHalf +
              (reverse && x > 0 && x < rowPixels.length - 1 ? toolDiameter : 0)) *
              1e3,
          ) / 1e3;

        const yPosition =
          Math.floor((pixel.position.y * scaleFactor * toolDiameter + offsetY + toolDiameterHalf) * 1e3) / 1e3;

        let speed = pixel.speed;
        const position = { x: xPosition, y: yPosition };

        if (xPosition < 0 || yPosition < 0) continue;
        if (xPosition > area.w || yPosition > area.h) continue;

        if (power > 0) {
          if (!startPositionApplied) {
            startPositionApplied = true;
            begin.push({
              g: 'G0',
              position,
              params: { speed: rapidSpeed },
            });
          }

          gy.push({
            g: 'G1',
            position,
            params: { power, image: true, speed },
          });
        } else {
          gy.push({
            g: 'G0',
            position,
            params: { power, rapid: true, speed: rapidSpeed },
          });
        }
      }

      if (start >= 0 && end >= 0) {
        const slice = optimizeSlice(gy.slice(start, end + 1));

        if (overscanValue && y > 0) {
          const os = overscanValue * (!reverse ? -1 : 1);

          const over = [];

          const position = slice[0].position;

          const xPosition = slice[0].position.x;
          const yPosition = slice[0].position.y;

          over.push({
            g: 'G0',
            position: { x: xPosition, y: yPosition - rowH },
            params: { speed: rapidSpeed, rapid: true },
          });
          over.push({
            g: 'G0',
            position: { x: xPosition + os, y: yPosition - rowH },
            params: { rapid: true },
          });
          over.push({
            g: 'G0',
            position: { x: xPosition + os, y: yPosition },
            params: { rapid: true },
          });
          over.push({
            g: 'G0',
            position,
            params: { rapid: true },
          });

          gCode = gCode.concat(over).concat(slice);
        } else {
          gCode = gCode.concat(slice);
        }

        //
      }
      reverse = !reverse;
    }
    gCode = begin.concat(gCode);
  }

  return gCode;
}

////////////////////////////////////////////////////////////////////////////////////////////////

function optimizeSlice(slice) {
  const optimized = [];
  for (let i = 0; i < slice.length; i++) {
    const current = slice[i];

    if (i && i < slice.length - 1) {
      const prev = slice[i - 1];
      if (prev.params.power === current.params.power && prev.params.speed === current.params.speed) {
        continue;
      }
    }

    optimized.push(current);
  }
  return optimized;
}

////////////////////////////////////////////////////////////////////////////////////////////////

function calculateNewImageSize(originalImageWidthIn_mm, targetWidthIn_mm, toolDiameterIn_mm) {
  // Calculate the scale factor as the ratio of the target width to the original width
  let scaleFactor = targetWidthIn_mm / originalImageWidthIn_mm;

  // Calculate how many "pixel" units fit into the original width, based on the tool diameter
  let originalWidthInPixels = originalImageWidthIn_mm / toolDiameterIn_mm;

  // Apply the scale factor to the original width in "pixels"
  let newImageWidthInPixels = Math.floor(originalWidthInPixels * scaleFactor);

  return newImageWidthInPixels;
}

////////////////////////////////////////////////////////////////////////////////////////////////

export function copyCanvasWithRotation(element, rotationAngle, newWidth, newHeight, preview = false) {
  const canvasA = element.canvas;

  const ar = element.width / (element.height || 1);

  const picWidth = newWidth;
  const picHeight = newWidth / ar;

  const canvasB = document.createElement('canvas');
  const ctxB = canvasB.getContext('2d');

  const canvasAWidth = canvasA.width;
  const canvasAHeight = canvasA.height;

  let mirror = { x: window[MIRROR_SCALARS].x, y: window[MIRROR_SCALARS].y };
  if (element.laserSettings.laserType === ElementLaserType.Fill) {
    mirror = { x: 1, y: 1 };
  }

  let mh = mirror.x > 0;
  let mv = mirror.y > 0;

  const scalars = (mh && !mv) || (!mh && mv) ? -1 : 1;

  const angleInRadians = (rotationAngle * scalars * Math.PI) / 180;

  const boundingBox = { width: newWidth, height: newHeight };
  const scaleBox = getBoundingBox(picWidth, picHeight, angleInRadians);

  canvasB.width = boundingBox.width;
  canvasB.height = boundingBox.height;

  const translateX = (boundingBox.width - picWidth) / 2;
  const translateY = (boundingBox.height - picHeight) / 2;

  const scaleW = boundingBox.width / scaleBox.width;
  const scaleH = boundingBox.height / scaleBox.height;

  ctxB.clearRect(0, 0, canvasB.width, canvasB.height);

  if (preview) {
    ctxB.imageSmoothingEnabled = false;
    canvasB.style.imageRendering = 'pixelated';
    ctxB.drawImage(canvasA, 0, 0, canvasAWidth, canvasAHeight, 0, 0, newWidth, newHeight);
  } else {
    ctxB.translate(translateX, translateY);

    ctxB.translate(picWidth / 2, picHeight / 2);
    ctxB.scale(scaleW * mirror.x, scaleH * mirror.y);
    ctxB.rotate(angleInRadians);

    ctxB.translate(-picWidth / 2, -picHeight / 2);

    ctxB.drawImage(
      canvasA,
      0,
      0,
      canvasAWidth,
      canvasAHeight,
      mirror.x > 0 ? 0 : picWidth,
      mirror.y > 0 ? 0 : picHeight,
      picWidth * mirror.x,
      picHeight * mirror.y,
    );
  }

  ctxB.setTransform(1, 0, 0, 1, 0, 0);

  return { canvas: canvasB, ctx: ctxB };
}

function getBoundingBox(width, height, angle) {
  const topLeft = rotatePoint(0, 0, angle);
  const topRight = rotatePoint(width, 0, angle);
  const bottomLeft = rotatePoint(0, height, angle);
  const bottomRight = rotatePoint(width, height, angle);

  const minX = Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
  const maxX = Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
  const minY = Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
  const maxY = Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);

  const boundingWidth = maxX - minX;
  const boundingHeight = maxY - minY;

  return { width: boundingWidth, height: boundingHeight };
}

function rotatePoint(x, y, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const rotatedX = x * cos - y * sin;
  const rotatedY = x * sin + y * cos;

  return { x: rotatedX, y: rotatedY };
}
