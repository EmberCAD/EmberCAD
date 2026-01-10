import fontkit from 'fontkit';
import opentype from 'opentype.js';

import path from 'path';

const font = fontkit.openSync(path.join('E:/dev/ember/embercad-application/@design/p-fonts', 'Bahnschrift.ttf'));
// const font2 = opentype.loadSync(path.join('E:/dev/ember/embercad-application/@design/p-fonts', 'Bahnschrift.ttf'), );

console.log(font);
// console.log(font2);
window['font'] = font;
const variation = font.getVariation('Light');
const run = variation.layout('hello world!');
const glyph = run.glyphs[0].path.toSVG();
const glyph2 = run.glyphs[1].path.toSVG();
const svg = `<g fill="white"><path d="${glyph}"></path></g>`;
const svg2 = `<g fill="white"><path d="${glyph2}"></path></g>`;
console.log(variation.createSubset());
const letter = paper.project.activeLayer.importSVG(svg);
letter.strokeColor = 'white';
letter.fillColor = null;
letter.scaling = [0.5, -0.5];
const letter2 = paper.project.activeLayer.importSVG(svg2);
letter2.strokeColor = 'white';
letter2.fillColor = null;
letter2.scaling = [0.5, -0.5];
