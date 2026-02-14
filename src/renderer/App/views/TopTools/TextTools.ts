//@ts-ignore
//@ts-nocheck

import { CURRENT_UNIT, Unit } from '../../../components/LaserCanvas/LaserCanvas';
import { DeepCopy } from '../../../lib/api/cherry/api';
import { OR_HORIZONTAL } from '../../../lib/api/declare_common';
import OptionApp from '../../../lib/components/OptionApp/OptionApp';
import { AlignX, DefaultTextSettings } from '../../../modules/Editor/Editor';

export const TOOL_NAME = 'TEXT_TOOL';
export const CURRENT_FONT = 'CURRENT_FONT';

export default class TextTools {
  private _element: any;
  label: any;
  private _view: any;
  snapC: any;
  separator: any;
  groupB: Button;
  unGroupB: any;
  fontS: any;
  boldC: any;
  italiC: any;
  weldC: any;
  caseC: any;
  subFamilyS: any;
  sizeI: any;
  spaceX: any;
  spaceY: any;
  convertToPathB: any;
  alignS: any;

  private _fonts: any;
  fontNames = [];
  currentFont: any;
  prevFile: any;
  trimC: any;
  prevSubfamily: string;

  ////////////////////////////////////////////////////////////////////

  constructor(private topTool) {}

  /////////////////////////////////////////////////////////////////////

  private initView() {
    const unitHint = window[CURRENT_UNIT] === Unit.Metric ? 'mm' : 'in';

    this.label = this.topTool.addLabel('Font:');
    this.fontS = this.topTool.addSelect();
    this.fontS.width = '10rem';
    this.fontS.itemsWidth = '20rem';
    this.fontS.marginRight = '1rem';
    this.fontS.maxHeight = '10rem';

    this.subFamilyS = this.topTool.addSelect();
    this.subFamilyS.marginRight = '1rem';
    this.subFamilyS.itemsWidth = '8rem';
    this.subFamilyS.width = '10rem';
    this.subFamilyS.itemsWidth = '15rem';

    this.sizeI = this.topTool.addLabelInput('Size:', 24, unitHint);
    this.sizeI.input.width = '3rem';

    this.sizeI.isNumeric = true;

    this.separator = this.topTool.addSeparator();

    this.addAlignSelect();

    this.separator = this.topTool.addSeparator();

    this.caseC = this.topTool.addCheckBox('ALL CAPS', false);
    this.caseC.marginRight = '0.5rem';

    this.weldC = this.topTool.addCheckBox('Combine', true);
    this.weldC.marginRight = '0.5rem';

    this.separator = this.topTool.addSeparator();

    this.spaceX = this.topTool.addLabelInput('Spacing X:', 0, unitHint);
    this.spaceX.input.width = '3rem';
    this.spaceX.isNumeric = true;

    this.spaceY = this.topTool.addLabelInput('Spacing Y:', 0, unitHint);
    this.spaceY.input.width = '3rem';
    this.spaceY.isNumeric = true;
    this.spaceY.marginRight = '0.5rem';

    this.convertToPathB = this.topTool.addButton('Convert to Path', 'Convert editable text to vector path');

    this.separator = this.topTool.addSeparator();

    this.events();
  }

  /////////////////////////////////////////////////////////////////////

  private events() {
    this.fontS.onChange = () => {
      this.updateElement();
      this.selectFamily(this.fontS.items[this.fontS.itemIndex]);
    };

    this.fontS.onMouseHover = (family) => {
      this.selectFamily(family);
    };

    this.subFamilyS.onChange = () => {
      this.updateElement();
      this.selectSubFamily(this.fontS.text, this.subFamilyS.items[this.subFamilyS.itemIndex]);
    };

    this.subFamilyS.onMouseHover = (subFamily) => {
      this.selectSubFamily(this.fontS.text, subFamily);
    };

    this.sizeI.onChange = () => {
      let size = Number(this.sizeI.input.text) || 24;
      if (size < 0.1) size = 0.1;
      if (size > 1000) size = 1000;
      this.sizeI.input.text = size;
      this.updateElement();
      if (typeof this.onSizeChange === 'function') this.onSizeChange(size);
    };

    this.alignS.onClick = (op) => {
      this.updateElement();
      if (typeof this.onAlign === 'function') this.onAlign(op);
    };

    this.caseC.onChanged = () => {
      this.updateElement();
      if (typeof this.onCaseChange === 'function') this.onCaseChange(this.caseC.checked);
    };

    this.weldC.onChanged = () => {
      this.updateElement();
      if (typeof this.onCombineChange === 'function') this.onCombineChange(this.weldC.checked);
    };

    this.spaceX.onChange = () => {
      let space = Number(this.spaceX.input.text) || 0;
      if (space < -100) space = -100;
      if (space > 100) space = 100;
      this.spaceX.input.text = space;
      this.updateElement();
      if (typeof this.onSpaceXChange === 'function') this.onSpaceXChange(space);
    };

    this.spaceY.onChange = () => {
      let space = Number(this.spaceY.input.text) || 0;
      if (space < -100) space = -100;
      if (space > 100) space = 100;
      this.spaceY.input.text = space;
      this.updateElement();
      if (typeof this.onSpaceYChange === 'function') this.onSpaceYChange(space);
    };

    this.convertToPathB.onClick = () => {
      if (typeof this.onConvertToPath === 'function') this.onConvertToPath();
    };
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  private addAlignSelect() {
    const panel = this.topTool.addPanel();

    this.alignS = new OptionApp(panel, OR_HORIZONTAL);

    const icons = [];
    icons[AlignX.Left] = '<i class="fa-solid fa-align-left"></i>';
    icons[AlignX.Center] = '<i class="fa-solid fa-align-center"></i>';
    icons[AlignX.Right] = '<i class="fa-solid fa-align-right"></i>';
    const tools = [];

    Object.keys(icons).forEach((tool) => {
      tools.push({ t: tool, icon: icons[tool] });
    });

    this.alignS.menuItems = tools.map((tool) => ({
      label: `<span style="font-size:1.2rem;pointer-events:none;transform:scaleY(-1);">${tool.icon}</span>`,
      ident: tool.t,
      hint: tool.t + ' Align',
    }));

    this.alignS.select(0);
  }

  /////////////////////////////////////////////////////////////////////

  updateElement() {
    if (this.silentUpdate) {
      return;
    }
    if (!this._element) return;
    this._element.data.textSettings = {
      ...this.textSettings,
      lines: this._element.data.textSettings.lines,
      top: this._element.data.textSettings.top,
      left: this._element.data.textSettings.left,
      font: { ...this.currentFont },
    };
  }

  /////////////////////////////////////////////////////////////////////

  fillProps() {
    this.textSettings = DeepCopy(this._element.data.textSettings);
  }

  /////////////////////////////////////////////////////////////////////

  selectFamily(family: string) {
    if (!family) return;
    let index = 0;
    this.fontS.text = family;
    if (!this._fonts[family]) return;
    this.subFamilyS.items = this._fonts[family].map((font) => font.fsf);
    for (let i = 0; i < this.subFamilyS.items.length; i++) {
      const item = this.subFamilyS.items[i];
      if (item.toLowerCase().indexOf('regular') > -1) {
        index = i;
        break;
      }
    }
    this.subFamilyS.itemIndex = index;
    const subFamily = this.subFamilyS.items[index];
    this.selectSubFamily(family, subFamily);
  }

  /////////////////////////////////////////////////////////////////////

  selectSubFamily(family, subFamily: string) {
    if (!family || !subFamily) return;

    let index = 0;
    if (!this._fonts[family]) return;

    this.subFamilyS.items = this._fonts[family].map((font) => font.fsf).sort();
    for (let i = 0; i < this.subFamilyS.items.length; i++) {
      const item = this.subFamilyS.items[i];
      if (item.toLowerCase().indexOf(subFamily.toLowerCase()) === 0) {
        index = i;
        break;
      }
    }
    this.fontS.text = family;
    this.subFamilyS.text = subFamily;
    this.subFamilyS.itemIndex = index;
    subFamily = this.subFamilyS.items[index];
    for (let i = 0; i < this._fonts[family].length; i++) {
      const font = this._fonts[family][i];
      if (font.fsf === subFamily) {
        index = i;
        break;
      }
    }
    const file = this._fonts[family][index].font;
    const variation = this._fonts[family][index].variation;
    this.currentFont = {
      file,
      fontFamily: this.fontS.text,
      fontSubFamily: this.subFamilyS.text,
      variation,
    };

    this.textSettings.font = this.currentFont;

    if (file === this.prevFile && subFamily === this.prevSubfamily) return;
    this.prevFile = file;
    this.prevSubfamily = subFamily;
    if (typeof this.onSelectFont === 'function') this.onSelectFont(this.currentFont);
  }
  /////////////////////////////////////////////////////////////////////

  selectFont(family, subFamily) {
    this.currentFont = this._fonts[this.fontNames[family]][subFamily].font;
    this.fontS.text = this.fontNames[family];
    this.selectFamily(this.fontNames[family]);
    this.selectSubFamily(this.fontS.text, this._fonts[this.fontNames[family]][subFamily].fsf);

    window[CURRENT_FONT] = this.currentFont;
  }

  /////////////////////////////////////////////////////////////////////

  set fonts(arr) {
    this._fonts = arr;
    this.fontNames = Object.keys(arr).sort();
    this.fontS.items = this.fontNames;
    this.selectFont(0, 0);
  }

  get font() {
    return this.currentFont;
  }
  /////////////////////////////////////////////////////////////////////

  set textSettings(settings: any) {
    if (!settings) return;
    if (!settings.font)
      settings.font = { fontFamily: this.fontS.text, fontSubFamily: this.subFamilyS.text, variation: false };

    if (Number(this.sizeI.input.text) !== settings.size) this.sizeI.input.text = settings.size;
    let idx = 0;
    if (settings.align === AlignX.Center) idx = 1;
    if (settings.align === AlignX.Right) idx = 2;
    this.alignS.select(idx, true);
    if (this.caseC.checked !== settings.allCaps) this.caseC.checked = settings.allCaps;
    if (Number(this.spaceX.input.text) !== settings.spaceX) this.spaceX.input.text = settings.spaceX || 0;
    if (Number(this.spaceY.input.text) !== settings.spaceY) this.spaceY.input.text = settings.spaceY || 0;
    if (this.weldC.checked !== settings.weld) this.weldC.checked = settings.weld;
    if (this.fontS.text !== settings.font.fontFamily) this.selectFamily(settings.font.fontFamily);

    if (this.subFamilyS.text !== settings.font.fontSubFamily)
      this.selectSubFamily(settings.font.fontFamily, settings.font.fontSubFamily);
  }

  get textSettings() {
    return DeepCopy({
      font: {
        file: this.currentFont.file,
        variation: this.currentFont.variation,
        fontFamily: this.fontS.text,
        fontSubFamily: this.subFamilyS.text,
      },
      size: Number(this.sizeI.input.text),
      align: this.alignS.currentSelection,
      allCaps: this.caseC.checked,
      spaceX: Number(this.spaceX.input.text),
      spaceY: Number(this.spaceY.input.text),
      weld: this.weldC.checked,
    });
  }

  /////////////////////////////////////////////////////////////////////

  resetText() {
    this._element = undefined;
    this.textSettings = DefaultTextSettings;
  }

  /////////////////////////////////////////////////////////////////////

  set element(element) {
    if (this._element && this._element.uid === element.uid) return;
    this._element = element;
    this.fillProps();
  }

  get element() {
    return this._element;
  }

  /////////////////////////////////////////////////////////////////////

  get viewName() {
    return TOOL_NAME;
  }

  set view(view: any) {
    this._view = view;
    this.initView();
  }
}
