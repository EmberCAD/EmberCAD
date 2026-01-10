import opentype from 'opentype.js';
import path from 'path';
import { PaperOffset } from 'paperjs-offset';

// const font = opentype.loadSync(path.join(__static, 'fonts', 'RobotoCondensed-LightItalic.ttf'));
// const font = opentype.loadSync(path.join(__static, 'fonts', 'YanoneKaffeesatz-ExtraLight.ttf'));
const font = opentype.loadSync(path.join('E:/dev/ember/embercad-application/@design/p-fonts', 'Bahnschrift.ttf'), {
  styleName: 'SemiBold Condensed',
});

console.log(font);
window['font'] = font;
// const font = opentype.loadSync(path.join('E:', 'bahnschrift.ttf'));

const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
g.setAttribute('fill', 'white');
// document.body.appendChild(svg);
svg.appendChild(g);
// svg.style.position = 'absolute';
// svg.style.top = 0;

let h = 100;
const createShape = (font, content) => {
  let pathMarkup = '';
  const fontPaths = font.substitution.font.getPaths(content, 0, h, h, {
    styleName: 'Light',
  });
  const paths = fontPaths.map((fontPath) => {
    let path = fontPath.toSVG();
    pathMarkup += path;
  });
  g.insertAdjacentHTML('beforeend', pathMarkup);
  //adjust viewBox
  let viewBox = svg.getBBox();
  svg.setAttribute(
    'viewBox',
    [0, 0, (viewBox.width + viewBox.x).toFixed(2), (viewBox.height + viewBox.y).toFixed(2)].join(' '),
  );
};

function isIntersected(group) {
  for (let i = 1; i < group.children.length; i++) {
    const intersections = group.children[0].getIntersections(group.children[i]);
    if (intersections.length > 0) return true;
  }
  return false;
}

function weld(group) {
  if (!group) return;
  if (!group.children.length) return;
  let welded = new paper.Path({ insert: false });
  welded.strokeColor = null;
  welded.fillColor = null;
  for (let i = 0; i < group.children.length; i++) {
    let child = group.children[i];
    if (child.children && child.children.length) {
      if (isIntersected(child)) child = weld(child);
    }
    welded = welded.unite(child, { insert: false });
  }
  return welded;
}

const draw = (font) => {
  // createShape(font, 'D');
  createShape(font, 'B');
  paper.project.activeLayer.activate();
  paper.project.activeLayer.fillColor = null;
  console.log(svg.innerHTML);
  const el = paper.project.activeLayer.importSVG(svg.innerHTML);
  el.strokeColor = 'white';
  el.fillColor = null;
  setTimeout(() => {
    el.position = [600, h / 2];
    const n = weld(el);
    n.position = [600, 500];
    n.fillColor = null;
    n.strokeColor = 'white';
    paper.project.activeLayer.addChild(n);

    // const o = weld(PaperOffset.offset(n, -h / 88, { cap: 'round', join: 'round', insert: false }));
    // o.fillColor = null;
    // o.strokeColor = 'white';
    // paper.project.activeLayer.addChild(o);
    // o.position = [600, 600];
    // console.log(o.exportJSON());

    // const o2 = weld(PaperOffset.offset(n, 30, { cap: 'round', join: 'round', insert: false }));
    // o2.fillColor = null;
    // o2.strokeColor = 'white';
    // paper.project.activeLayer.addChild(o2);
    // o2.position = [600, 800];
    // n.position = [600, 800];
  }, 10);
};

draw(font);
