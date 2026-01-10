import CanvasRectangle, { CornerStyle } from '../renderer/components/LaserCanvas/CanvasRectangle';

const paper = window['paper'];
const rect = new CanvasRectangle(paper, 100, 100, 200, 100);
rect.strokeColor = 'white';

rect.radius = 15;

setTimeout(() => {
  rect.radius = 65;
  setTimeout(() => {
    rect.corner = [CornerStyle.Concave, CornerStyle.Cutout, CornerStyle.Straight, CornerStyle.None];
    rect.radius = [20, 30, 40, 50];
  }, 2000);
}, 2000);
