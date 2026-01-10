import { copyCanvasWithRotation } from '../renderer/modules/GCode/ImageG';

const file = 'E:/Gregory/Pictures/scull.png';

const paper = window['paper'];
const rect = new paper.Raster({ insert: true });
rect.source = file;

rect.onLoad = () => {
  rect.pivot = rect.bounds.topLeft;
  rect.position = [0, 0];

  rect.bounds.width = 400;
  const ar = rect.width / rect.height;
  rect.bounds.height = 400 / ar;

  rect.rotation = 10;
  console.log(rect.bounds);

  rect.position.x += -rect.bounds.left;
  rect.position.y += -rect.bounds.top;

  const rectB = new paper.Raster(copyCanvasWithRotation(rect, rect.rotation, rect.bounds.width, rect.bounds.height)); //, 45, 100, 100);
  rectB.pivot = rectB.bounds.topLeft;
  rectB.position = [500, 0];
};
