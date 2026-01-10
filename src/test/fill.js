import { FillShape } from '../renderer/modules/GCode/ImageG';
import fs from 'fs';

const maskElement = new paper.CompoundPath();
maskElement.fillRule = 'evenodd';
const circle = new paper.Path.Ellipse([180, 150], [400, 200]);
circle.strokeColor = null;
circle.fillColor = 'white';
const circle2 = new paper.Path.Ellipse([180, 150], [400, 200]);
circle2.strokeColor = null;
circle2.fillColor = 'white';
circle2.position = [300, 300];
maskElement.addChild(circle);
maskElement.addChild(circle2);
maskElement.strokeColor = null;
maskElement.fillColor = 'white';
console.log(maskElement);
// const fill = FillShape(maskElement, 2, 45, false);
// const svg = fill.exportSVG({
//   asString: true,
// });

// fs.writeFileSync('test.svg', svg, 'utf8');
// const fill2 = fillMask(maskElement, 5, 45, true);
// fill.strokeColor = 'white';
// fill.fillColor = 'green';
