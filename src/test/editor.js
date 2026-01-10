import Editor, { AlignX } from '../renderer/modules/Editor/Editor';
import path from 'path';
import getSystemFonts from 'get-system-fonts';
import opentype from 'opentype.js';
import { CURRENT_THEME, MIRROR_SCALARS } from '../renderer/components/LaserCanvas/LaserCanvas';

window[CURRENT_THEME] = { object: { strokeColor: 'white' } };

const editor = new Editor(window['canvasE']);
const fonts = [];

window['editor'] = editor;

editor.startPoint = { x: 320, y: 500 };

test();

async function test() {
  editor.setFont(path.join(__static, 'fonts', 'Bahnschrift.ttf'));

  editor.edit();

  editor.size = 56;
  editor.spaceY = -20;
  editor.weld = true;

  editor.text = 'o';

  editor.text = `-  Hello Mello Bello
  sdfgsd
  sdfgsd
  wunderbaum 2`;
  await sleep(2);
  editor.endEdit();
  // editor.setFont(path.join(__static, 'fonts', 'Bahnschrift.ttf'));
  // await sleep(2);
  // await sleep(2);
  // editor.weld = false;
  // await sleep(2);
  // // const font = fonts[Object.keys(fonts)[11]][0].font;
  // // editor.setFont(font);
  // await sleep(2);
  // await editor.clear();
  // await sleep(2);
  //   editor.text = `function sleep(sec) {
  //   return new Promise((resolve, reject) => {
  //     setTimeout(() => {
  //       resolve();
  //     }, sec * 1000);
  //   });
  // }
  // `;

  // editor.text = `D`;
  /*
  await sleep(2);
  editor.hSpace = 0.1;
  editor.vSpace = 5;

  await sleep(2);
  editor.trim = true;

  await sleep(2);
  editor.alignX = AlignX.Center;

  await sleep(2);
  editor.alignX = AlignX.Left;

  await sleep(2);
  */
  // editor.alignX = AlignX.Right;
  // editor.upperCase = true;
  // editor.weld = true;

  // await sleep(2);
  // editor.alignX = AlignX.Left;
  // editor.hSpace = 0;
  // editor.vSpace = 0;
  // editor.trim = false;
  // editor.weld = false;
}

// setTimeout(() => {
//   editor.setFont(path.join(__static, 'fonts', 'Bahnschrift.ttf'));

//   setTimeout(() => {
//     const font = fonts[Object.keys(fonts)[11]][0].font;
//     // editor.weld = true;
//     editor.setFont(font);
//   }, 2000);
// }, 5000);

function sleep(sec) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, sec * 1000);
  });
}

// (async () => {
//   const list = await getSystemFonts();
//   console.log(list.length);
//   list.forEach((font) => {
//     try {
//       const fnt = opentype.loadSync(font);
//       const ff = fnt.names.fontFamily.en;
//       if (!fonts[ff]) fonts[ff] = [];
//       const fsf = fnt.names.fontSubfamily.en;
//       if (fsf) {
//         fonts[ff].push({ fsf, font });
//       }
//     } catch (error) {}
//   });
// })();
