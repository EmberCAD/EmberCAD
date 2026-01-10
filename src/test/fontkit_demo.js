import fontkit from 'fontkit';
import path from 'path';
import { getFonts } from '../renderer/modules/Editor/Fonts';

getFonts().then((_) => {
  console.log(_);
  const fname = Object.keys(_)[4];
  const fnt = fontkit.openSync(_[fname][0].font);
  console.log(fnt.namedVariations);
});

let text = '-H'; //Hello World. ZAŻÓŁĆ Gęślą jaźń';

const font = fontkit.openSync(path.join('E:/dev/ember/embercad-application/@design/p-fonts', 'Bahnschrift.ttf'));
let scripts = (font.GSUB ? font.GSUB.scriptList : []).concat(font.GPOS ? font.GPOS.scriptList : []);
let scriptTags = Array.from(new Set(scripts.map((s) => s.tag)));

console.log(font.namedVariations);
console.log(scriptTags);

let run = font.getVariation('Bold').layout(text); //), font_features); //font_features, font_script, font_language, font_direction

const fontHeight = font.ascent - font.descent;

console.log(fontHeight);

let fontSize = 44;

let scale = (1 / font.unitsPerEm) * fontSize;
let x = 0;
let y = 0;

let yAdjust = fontHeight - font.ascent;

let box = new paper.Path.Rectangle(10, 200 + yAdjust * scale, run.advanceWidth * scale, -fontHeight * scale);
box.strokeColor = 'white';

run.glyphs.forEach((glyph, index) => {
  let pos = run.positions[index];

  const svg = `<g><path d="${glyph.path.toSVG()}"></path></g>`;
  const letter = paper.project.activeLayer.importSVG(svg);
  letter.pivot = [0, 0];
  letter.strokeColor = 'white';
  letter.fillColor = null;
  letter.scaling = [scale, -scale];
  letter.position = [10 + (x + pos.xOffset) * scale, 200 + (y + pos.yOffset) * scale];

  x += pos.xAdvance;
  y += pos.yAdvance;
});
