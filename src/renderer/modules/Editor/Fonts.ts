import getSystemFonts from 'get-system-fonts';
import fontkit from 'fontkit';

export function getFonts() {
  return new Promise<any>(async (resolve, reject) => {
    const list = await getSystemFonts();
    let counter = 0;
    const fonts = [];
    list.forEach((font) => {
      counter++;
      if (counter > 50) return;
      try {
        const fnt = fontkit.openSync(font);
        const ff = fnt.name.records.fontFamily.en;
        if (!fonts[ff]) fonts[ff] = [];
        const namedVariations = Object.keys(fnt.namedVariations);
        if (namedVariations.length) {
          fonts[ff] = namedVariations.map((variation) => {
            return { fsf: variation, font, variation: true };
          });
        } else {
          const fsf = fnt.name.records.fontSubfamily.en;

          if (fsf) {
            fonts[ff].push({ fsf, font });
          }
        }
      } catch (error) {}
    });

    resolve(fonts);
  });
}
