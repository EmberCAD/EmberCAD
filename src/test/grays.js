import { ImageToGCode } from '../renderer/modules/GCode/ImageG';
import fs from 'fs';
import LaserDevice from '../renderer/modules/LaserDevice/LaserDevice';
import GSerial from '../renderer/modules/GSerial/GSerial';
// ImageToGCode();

// const box = new paper.Path.Rectangle(0, 0, 5, 5);
// box.position = [1100, 610];
// box.fillColor = 'rgb(128,128,128)';
// const raster = new paper.Raster('E:/Gregory/Pictures/gradient.png');
// const raster = new paper.Raster('E:/Gregory/Pictures/1645770394338.jfif');
const raster = new paper.Raster('E:/Gregory/Pictures/medalion.jpg');
// picture.source = 'E:/Gregory/Pictures/olka_120x120.png';
var resizedRaster;

raster.on('load', function () {
  // Scale down the raster to 50% of its original size

  const scale = 0.1;
  var newWidth = Math.floor(raster.width * scale);
  var newHeight = Math.floor(raster.height * scale);
  // var newWidth = 128;
  // var newHeight = 20;

  // Create a new canvas with the lower resolution
  var canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  var ctx = canvas.getContext('2d');

  // Draw the original raster onto the canvas, resizing it to the new lower resolution
  ctx.drawImage(raster.canvas, 0, 0, raster.width, raster.height, 0, 0, newWidth, newHeight);

  // Export the canvas as a data URL
  var dataUrl = canvas.toDataURL();

  raster.remove();

  // Now you can use this data URL as source for another raster or do with it whatever you want
  resizedRaster = new paper.Raster(dataUrl);

  resizedRaster.pivot = raster.bounds.topLeft;
  resizedRaster.position = [100, 100];

  // picture.fitBounds(0, 0, 50, 50);
  // picture.width = 50;
  // picture.height = 50;
  // let rbox;
  // setTimeout(() => {
  //   console.time('rasterize');
  //   rbox = box.rasterize({ resolution: 72 * 4, insert: false });
  //   console.timeEnd('rasterize');
  //   getGrayscalePixels(rbox.context);
  // }, 1500);

  setTimeout(async () => {
    const laserDevice = new LaserDevice();
    const serialPorts = new GSerial();
    const pixels = getGrayscalePixels(resizedRaster.context, true);
    const gcode = convertToGCode(pixels, 100, 150, 0.4, 25.4, 1);
    fs.writeFileSync('e:/image.gcode', gcode, 'utf-8');
    // const gcode = fs.readFileSync('e:/to_engrave.gcode', 'utf-8');
    const ports = await serialPorts.list();
    window['laser'] = serialPorts;
    console.log(ports, gcode);
    if (ports.length) {
      laserDevice.gstreamer.output = serialPorts;
      await serialPorts.connect(ports[0].path);
      setTimeout(async () => {
        await serialPorts.flush();
        await laserDevice.home();
        setTimeout(async () => {
          await serialPorts.flush();

          console.log('go!');
          laserDevice.sendGCode(gcode);
        }, 5000);
      }, 1000);
    }
  }, 2000);
});

// 85419 ms
// function getGrayscalePixels(raster) {
//   const width = raster.canvas.width;
//   const height = raster.canvas.height;
//   console.log(width, height);
//   const pixels = [];
//   console.time('luna');
//   for (let y = 0; y < height; y++) {
//     for (let x = 0; x < width; x++) {
//       const pix = raster.getPixel(x, y);
//       pixels.push(pix);
//     }
//   }
//   console.timeEnd('luna');
//   console.log(pixels);
// }

// 73352 ms
// function getGrayscalePixels(context) {
//   return new Promise((resolve, reject) => {
//     const width = context.canvas.width;
//     const height = context.canvas.height;
//     console.log(width, height);
//     const grayscalePixels = [];
//     console.time('luna');
//     for (let y = 0; y < height; y++) {
//       for (let x = 0; x < width; x++) {
//         const imageData = context.getImageData(x, y, 1, 1);
//         const pixel = imageData.data;
//         const grayscaleValue = (pixel[0] + pixel[1] + pixel[2]) / 3; // Assuming RGB image
//         grayscalePixels.push(grayscaleValue);
//       }
//     }
//     console.timeEnd('luna');

//     resolve();
//     // console.log(grayscalePixels);
//   });
// }

//271 ms
function getGrayscalePixels(context, inverse = false) {
  const width = context.canvas.width;
  const height = context.canvas.height;
  console.log(width, height);
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const grayscalePixels = [];
  console.time('luna');
  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    if (i === 10000) {
      console.log(red, green, blue);
    }
    const grayscaleValue = (0.299 * red + 0.587 * green + 0.114 * blue) / 255; // Assuming RGB image

    const laserPower = grayscaleToLaserPower(grayscaleValue, inverse);
    grayscalePixels.push({ grayscaleValue, laserPower, position: getPixelCoordinates(i, width) });
  }
  console.timeEnd('luna');
  return grayscalePixels;
}

function getPixelCoordinates(index, width) {
  const pixelsIndex = index / 4; // Each pixel is represented by 4 values: red, green, blue, and alpha
  const y = Math.floor(pixelsIndex / width);
  const x = pixelsIndex % width;
  return { x, y };
}

function grayscaleToLaserPower(grayscale, isInverted = false) {
  if (grayscale < 0 || grayscale > 1) {
    throw new Error('Grayscale value must be between 0 and 1');
  }

  // min and max laser power
  let minPower = 15;
  let maxPower = 100;

  // If isInverted is true, invert the grayscale
  if (isInverted) {
    grayscale = 1 - grayscale;
  }

  // handle edge cases
  if (grayscale === 0) {
    return maxPower;
  } else if (grayscale === 1) {
    return minPower;
  }

  // calculate the gamma corrected grayscale value
  let gamma = 2.2;
  let gammaCorrected = Math.pow(grayscale, gamma);

  // linearly interpolate between min and max power using the gamma corrected value
  let laserPower = minPower + gammaCorrected * (maxPower - minPower);

  return laserPower;
}

function convertToGCode(pixels, offsetX = 0, offsetY = 0, toolDiameter = 0.04, dpi = 300, passes = 1) {
  let gCode = `G00 G17 G40 G21 G54
G90
M8
M4
`;
  let scaleFactor = 25.4 / dpi; // 1 inch = 25.4 mm

  let rows = [];
  pixels.forEach((pixel) => {
    if (!rows[pixel.position.y]) {
      rows[pixel.position.y] = [];
    }
    rows[pixel.position.y].push(pixel);
  });

  let reverse = false;

  for (let y = 0; y < rows.length; y++) {
    for (let pass = 0; pass < passes; pass++) {
      let rowPixels = reverse ? rows[y].slice().reverse() : rows[y];
      gCode += `; row: ${y}, pass: ${pass + 1}\n`;
      for (let pixel of rowPixels) {
        let xPosition = (pixel.position.x * scaleFactor * toolDiameter + offsetX).toFixed(2);
        let yPosition = (pixel.position.y * scaleFactor * toolDiameter + offsetY).toFixed(2);

        let xx = 'X' + xPosition;
        let yy = 'Y' + yPosition;

        let power = (pixel.laserPower * 10).toFixed(1);

        if (pass === 0 && y === 0 && pixel === rowPixels[0]) {
          gCode += `G0 ${xx} ${yy} F6000 S0\n`;
          gCode += `G1 ${xx} ${yy} F6000 S0\n`;
        }
        gCode += `G1${xx}${yy}S${power}\n`;
      }
      reverse = !reverse;
    }
  }
  gCode += `G90
M9
G1 S0
M5
G90
; return to user-defined finish pos
G1 X0 Y200
M2
`;
  return gCode;
}

function calculateDPIAndToolDiameter(imageWidthInPixels, engravingWidthInMm) {
  // Convert the engraving width from millimeters to inches
  let engravingWidthInInches = engravingWidthInMm / 25.4;

  // Calculate the DPI based on the width of the image in pixels and the desired engraving width
  let dpi = imageWidthInPixels / engravingWidthInInches;

  // The tool diameter can be seen as the resolution of your machine
  // We can calculate it as 1 / DPI (in inches)
  let toolDiameterInInches = 1 / dpi;

  // Convert the tool diameter from inches to millimeters
  let toolDiameterInMm = toolDiameterInInches * 25.4;

  return {
    dpi: dpi,
    toolDiameter: toolDiameterInMm,
  };
}

function calculateDPI(imageWidthInPixels, engravingWidthInMm, toolDiameterInMm) {
  // Convert the engraving width from millimeters to inches
  let engravingWidthInInches = engravingWidthInMm / 25.4;

  // Calculate the DPI based on the width of the image in pixels and the desired engraving width
  let dpi = imageWidthInPixels / engravingWidthInInches;

  // Calculate the tool diameter in inches
  let toolDiameterInInches = toolDiameterInMm / 25.4;

  // Calculate the number of pixels that the tool can cover at the calculated DPI
  let pixelsPerToolDiameter = toolDiameterInInches * dpi;

  // If the tool can cover more than one pixel at the calculated DPI, we need to adjust the DPI
  if (pixelsPerToolDiameter > 1) {
    dpi = dpi / pixelsPerToolDiameter;
  }

  return dpi;
}

function calculateNewImageWidth(originalImageWidthIn_mm, targetWidthIn_mm, toolDiameterIn_mm) {
  // Calculate the scale factor as the ratio of the target width to the original width
  let scaleFactor = targetWidthIn_mm / originalImageWidthIn_mm;

  // Calculate how many "pixel" units fit into the original width, based on the tool diameter
  let originalWidthInPixels = originalImageWidthIn_mm / toolDiameterIn_mm;

  // Apply the scale factor to the original width in "pixels"
  let newImageWidthInPixels = Math.floor(originalWidthInPixels * scaleFactor);

  return newImageWidthInPixels;
}
