//@ts-ignore
//@ts-nocheck
import { CENTER_GRID, CURRENT_THEME, MIRROR_SCALARS } from '../../components/LaserCanvas/LaserCanvas';
import fontkit from 'fontkit';
import { weld } from '../helpers';
import Paper from 'paper';
import { DeepCopy, crEl } from '../../lib/api/cherry/api';
import { codec64 } from '../../lib/api/cherry/codec64';
import { E_KIND_TEXT } from '../../components/LaserCanvas/CanvasElement';
import { CURRENT_FONT } from '../../App/views/TopTools/TextTools';

export const EDITOR_LAYER = 'EDITOR_LAYER';

export enum AlignX {
  Left = 'Left',
  Center = 'Center',
  Right = 'Right',
}

export const DefaultTextSettings = {
  top: 0,
  left: 0,
  font: {
    fontFamily: '',
    fontSubFamily: '',
    file: '',
    variation: false,
  },
  size: 24,
  align: AlignX.Left,
  allCaps: false,
  combine: true,
  trim: false,
  spacingX: 0,
  spacingY: 0,
  lines: [],
};

export default class Editor {
  private _startPoint: { x: any; y: any };
  private _size: any;
  cursor: any;
  blinkTimer: NodeJS.Timer;
  lines: any;
  private _visible: boolean;
  currentCursorPosition: { x: number; y: number };
  svg: SVGSVGElement;
  font: any;
  g: any;
  el: any;
  private _weld: any;
  allowDraw: boolean;
  metrics: any;
  editor: any;
  cursorXoffset: any;
  private _alignX = AlignX.Left;
  private _spaceX = 0;
  private _spaceY = 0;
  private _text = '';
  editorGroup: any;
  cursorYoffset: number;
  private _trim: boolean;
  _upperCase: boolean;
  paper: any;
  canvas: any;
  editorLayer: any;
  fonts: any;
  private _fontFamily: string;
  private _fontSubFamily: string;
  fontHeight: number;
  fontScale: number;
  fontYAdjust: number;
  textTools: any;
  private _shouldApplyToolSettings: boolean;
  fontVariation: any;
  fontFile: any;
  silentApply: boolean;
  originalElementPosition: any;
  private _editLayerMeta: {
    layerId?: string;
    layerColor?: string;
    textLinkId?: string;
    carrierUid?: string;
    proxyUid?: string;
  } | null;

  constructor(private parent) {
    this.init();
    this.events();

    window['weld'] = weld;
  }

  private init() {
    this.canvas = crEl(
      'canvas',
      {
        utype: 'paper-editor',
        style: 'width:100%;height:100%;position:absolute;top:0;left:0;pointer-events:none;z-index:2;',
        hidpi: 'off',
        resize: true,
      },
      this.parent,
    );
    this.paper = new Paper.PaperScope();
    this.paper.setup(this.canvas);
    this.paper.activate();
    this.paper.view.setCenter(0, 0);

    this.editorLayer = new this.paper.Layer();
    this.editorLayer.name = EDITOR_LAYER;

    window['paperEditor'] = this.paper;

    this.cursor = new this.paper.Path.Rectangle([
      this.startPoint.x,
      this.startPoint.y,
      1,
      this.startPoint.y + this.size,
    ]);
    this.cursor.strokeColor = window[CURRENT_THEME].object.strokeColor;
    this.cursor.strokeScaling = false;
    this.cursor.opacity = 0;
    this.cursor.pivot = this.cursor.bounds.topLeft;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  private events() {
    this.paper.activate();

    this.paper.view.onMouseDown = (e) => {
      if (!this.visible) return;
      this.handleMouseDown(e);
    };

    document.addEventListener('keydown', (e) => {
      if (!this.visible) return;
      if (document.activeElement.nodeName === 'INPUT') return;

      if (!this.lines[this.currentCursorPosition.y]) this.lines[this.currentCursorPosition.y] = '';
      this.allowDraw = true;
      this.blink(true);

      if (e.key === 'Escape') {
        e.preventDefault();

        this.endEdit();
        return;
      }

      if (e.key === 'Enter') {
        let len = this.lines[this.currentCursorPosition.y].length;
        if (this.currentCursorPosition.y < this.lines.length - 1) {
          this.lines = this.lines
            .slice(0, this.currentCursorPosition.y + 1)
            .concat([''])
            .concat(this.lines.slice(this.currentCursorPosition.y + 1));
        }

        if (this.currentCursorPosition.x < len) {
          const tmp = this.lines[this.currentCursorPosition.y];
          this.lines[this.currentCursorPosition.y] = tmp.slice(0, this.currentCursorPosition.x);
          this.lines[this.currentCursorPosition.y + 1] = tmp.slice(this.currentCursorPosition.x);
        }

        this.currentCursorPosition.y++;

        if (!this.lines[this.currentCursorPosition.y]) this.lines[this.currentCursorPosition.y] = '';

        this.currentCursorPosition.x = 0;
        this.allowDraw = false;
      }

      if (e.key === 'Backspace') {
        this.allowDraw = false;
        if (this.currentCursorPosition.x > 0) {
          this.lines[this.currentCursorPosition.y] = this.lines[this.currentCursorPosition.y].removeCharAt(
            this.currentCursorPosition.x,
          );
        }

        this.currentCursorPosition.x--;

        if (this.currentCursorPosition.x < 0 && this.currentCursorPosition.y > 0) {
          this.currentCursorPosition.x = this.lines[this.currentCursorPosition.y - 1].length;
          this.lines[this.currentCursorPosition.y - 1] += this.lines[this.currentCursorPosition.y];
          this.lines = this.lines
            .slice(0, this.currentCursorPosition.y)
            .concat(this.lines.slice(this.currentCursorPosition.y + 1));
          this.lines[this.lines.length] = '';
          this.el[this.lines.length - 1].remove();

          this.lines.length--;
          this.currentCursorPosition.y--;
        }
      }

      if (e.key === 'Delete') {
        this.allowDraw = false;
        if (this.currentCursorPosition.x < this.lines[this.currentCursorPosition.y].length) {
          this.lines[this.currentCursorPosition.y] = this.lines[this.currentCursorPosition.y].removeCharAt(
            this.currentCursorPosition.x + 1,
          );
        } else {
          if (this.currentCursorPosition.y < this.lines.length - 1) {
            this.lines[this.currentCursorPosition.y] += this.lines[this.currentCursorPosition.y + 1];
            this.lines = this.lines
              .slice(0, this.currentCursorPosition.y + 1)
              .concat(this.lines.slice(this.currentCursorPosition.y + 2));
            this.lines[this.lines.length] = '';
            this.el[this.lines.length - 1].remove();
          }
        }
      }

      if (e.key === 'Home') {
        this.allowDraw = false;
        this.currentCursorPosition.x = 0;
      }

      if (e.key === 'End') {
        this.allowDraw = false;

        const lastChar = this.lines[this.currentCursorPosition.y].length;
        this.currentCursorPosition.x = lastChar;
      }

      if (e.key === 'ArrowLeft') {
        this.allowDraw = false;
        this.currentCursorPosition.x--;
      }

      if (e.key === 'ArrowUp') {
        this.allowDraw = false;
        this.currentCursorPosition.y--;
        if (this.currentCursorPosition.y < 0) this.currentCursorPosition.y = 0;
        this.setCursorPosition(this.currentCursorPosition.y, this.cursor.position.x);
      }

      if (e.key === 'ArrowDown') {
        this.allowDraw = false;
        this.currentCursorPosition.y++;
        if (this.currentCursorPosition.y < this.lines.length) {
          this.setCursorPosition(this.currentCursorPosition.y, this.cursor.position.x);
        }
      }

      if (e.key === 'ArrowRight') {
        this.allowDraw = false;

        this.currentCursorPosition.x++;
      }

      ///////////////////

      if (this.currentCursorPosition.y > this.lines.length - 1) this.currentCursorPosition.y = this.lines.length - 1;

      if (this.currentCursorPosition.x < 0) {
        if (this.currentCursorPosition.y > 0) {
          this.currentCursorPosition.y--;
          this.currentCursorPosition.x = this.lines[this.currentCursorPosition.y].length;
        } else this.currentCursorPosition.x = 0;
      }

      if (this.currentCursorPosition.x > this.lines[this.currentCursorPosition.y].length) {
        if (this.currentCursorPosition.y < this.lines.length - 1) {
          this.currentCursorPosition.y++;
          this.currentCursorPosition.x = 0;
        } else this.currentCursorPosition.x = this.lines[this.currentCursorPosition.y].length;
      }

      if (!this.allowDraw) this.draw();
    });

    document.addEventListener('keypress', (e) => {
      if (!this.visible) return;
      if (document.activeElement.nodeName === 'INPUT') return;

      let char = e.key;

      if (!char || !this.allowDraw) return;
      this.lines[this.currentCursorPosition.y] = this.lines[this.currentCursorPosition.y].insertCharAt(
        char,
        this.currentCursorPosition.x,
      );
      this.currentCursorPosition.x++;
      this.draw();
    });
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  private setCursorPosition(line: number, x: number) {
    let index = this.metrics[line].length;
    x = x - this.el[line].bounds.left;
    for (let i = 0; i < this.metrics[line].length; i++) {
      const glyph = this.metrics[line][i];
      let glyphWidth = glyph;
      let a = 0;
      let b = glyphWidth / 2;
      let c = glyphWidth;
      if (i > 0) {
        glyphWidth = glyph - this.metrics[line][i - 1];
        a = this.metrics[line][i - 1];
        b = a + glyphWidth / 2;
        c = glyph + glyphWidth / 2;
      }
      if (x >= a && x <= b) {
        index = i;
        break;
      }
      if (x >= b && x <= c) {
        index = i + 1;
        break;
      }
    }

    if (index) {
      this.currentCursorPosition.x = index;
      this.currentCursorPosition.y = line;
      this.draw();
    }
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  handleMouseDown(e) {
    document.activeElement.blur();

    const x = e.point.x;
    const y = e.point.y - this.editor.bounds.top;
    if (x < 0 || y < 0) return;
    if (!this.metrics || !this.metrics[0].length) return;
    const line = Math.floor(y / (this.size + this.spaceY));

    if (line > this.lines.length - 1) return;
    this.blink(true);
    this.setCursorPosition(line, x);
    if (typeof this.onMouseDown === 'function') this.onMouseDown();
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  createShape(y) {
    let yy = 0;
    let scale = (1 / this.font.unitsPerEm) * this.size;
    let line = new this.paper.Group();
    line.pivot = [0, 0];
    let content = this.lines[y];
    if (this.trim) {
      content = content.trim();
    }

    if (this.upperCase) {
      content = content.toUpperCase();
    }

    content = content || ' ';

    const run = this.font.layout(content);
    const fontPaths = run.glyphs;

    this.metrics[y] = [];
    let text = '';
    let xx = 0;
    for (let i = 0; i < fontPaths.length; i++) {
      text += content[i];

      let pos = run.positions[i];

      const fontPath = fontPaths[i].path;

      const letterPath = `<g><path d="${fontPath.toSVG()}"></path></g>`;
      const idx = (xx + pos.xOffset) * scale;

      let letter = this.paper.project.importSVG(letterPath, { insert: false });
      if (this.weld) {
        letter = weld(letter, this.paper);
      }

      letter.pivot = [0, 0];
      letter.scaling = [scale, -scale];
      letter.position.x = idx + i * this.spaceX;
      letter.position.y = this.size;
      letter.strokeColor = 'white';
      line.addChild(letter);
      letter.strokeScaling = false;

      this.metrics[y][i] = idx + pos.xAdvance * scale + i * this.spaceX;
      xx += pos.xAdvance;
    }
    yy += this.size;

    return line;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////

  draw() {
    this.paper.activate();
    this.editor = {};
    this.editor.bounds = { top: 0, bottom: this.size, left: 0, right: this.size };
    if (!this.lines || !this.lines.length) return;

    this._text = this.lines.join('\n');

    this.metrics = [];
    let left = Number.MAX_SAFE_INTEGER;
    let right = Number.MIN_SAFE_INTEGER;

    if (this.editorGroup) {
      this.editorGroup.remove();
    }

    this.editorGroup = new this.paper.Group();
    this.editorGroup.bounds.height = this.size;
    this.editorGroup.bounds.width = this.size;
    if (!this.editorGroup.data) this.editorGroup.data = {};
    delete this.editorGroup.data.editLayerId;
    delete this.editorGroup.data.editLayerColor;
    delete this.editorGroup.data.editTextLinkId;
    delete this.editorGroup.data.editCarrierUid;
    delete this.editorGroup.data.editProxyUid;
    if (this._editLayerMeta) {
      this.editorGroup.data.editLayerId = this._editLayerMeta.layerId;
      this.editorGroup.data.editLayerColor = this._editLayerMeta.layerColor;
      this.editorGroup.data.editTextLinkId = this._editLayerMeta.textLinkId;
      this.editorGroup.data.editCarrierUid = this._editLayerMeta.carrierUid;
      this.editorGroup.data.editProxyUid = this._editLayerMeta.proxyUid;
    }

    if (this._shouldApplyToolSettings) {
      this._shouldApplyToolSettings = false;
      this.editorGroup.data.textSettings = this.textTools.textSettings;
      this.updateElement(this.editorGroup);
    }

    for (let y = 0; y < this.lines.length; y++) {
      if (!this.el) this.el = [];
      if (this.el[y]) this.el[y].remove();
      this.el[y] = this.createShape(y);

      this.el[y].strokeColor = 'white';
      this.el[y].fillColor = null;
      this.el[y].position = [this.startPoint.x, this.startPoint.y + y * (this.size + this.spaceY)];

      if (this.el[y].bounds.width) {
        left = Math.min(left, this.el[y].bounds.left);
        right = Math.max(right, this.el[y].bounds.right);
      }
      this.editorGroup.addChild(this.el[y]);
    }

    let top = this.el[0].bounds.top;
    let bottom = this.el[this.el.length - 1].bounds.bottom;
    this.editor.bounds = { top, bottom, left, right };
    const editorWidth = this.editor.bounds.right - this.editor.bounds.left;
    let w = this.metrics[this.currentCursorPosition.y][this.currentCursorPosition.x - 1] || 0;

    if (this.alignX === AlignX.Center) {
      for (let y = 0; y < this.lines.length; y++) {
        this.el[y].position.x = this.startPoint.x + (editorWidth - this.el[y].bounds.width) / 2;
      }
    }

    if (this.alignX === AlignX.Right) {
      for (let y = 0; y < this.lines.length; y++) {
        this.el[y].bounds.right = this.editor.bounds.right;
      }
    }

    let x = this.el[this.currentCursorPosition.y].position.x + w - this.cursor.bounds.width;
    let y = this.el[this.currentCursorPosition.y].position.y; // + this.currentCursorPosition.y * (this.size + this.spaceY);

    if (x < -1e8) {
      if (this.originalElementPosition) {
        x = this.originalElementPosition[0];
        y = this.originalElementPosition[1];
      } else {
        x = this.startPoint.x;
        y = this.startPoint.y;
      }
    }
    this.cursor.position = [x, y];
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////

  clear() {
    this.currentCursorPosition = { x: 0, y: 0 };
    if (!this.lines) return;

    for (let i = 0; i < this.lines.length; i++) {
      if (this.el[i]) this.el[i].remove();
    }
    this.lines = [];
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////

  edit(item?) {
    this.paper.view.context.canvas.style.pointerEvents = 'auto';
    this.paper.activate();

    this.el = [];
    if (this.editorGroup) this.editorGroup.removeChildren();
    this.lines = [];
    this.currentCursorPosition = { x: 0, y: 0 };
    this.originalElementPosition = null;
    this._editLayerMeta = null;
    if (item && item.data && item.data.textSettings) {
      this.originalElementPosition = [item.position.x, item.position.y];
      this._editLayerMeta = {
        layerId: item?.data?.layerId,
        layerColor: item?.data?.layerColor,
        textLinkId: item?.data?.textLinkId,
        carrierUid: item?.data?.carrierUid || item?.uid,
        proxyUid: item?.data?.proxyUid || item?.uid,
      };
      this.textTools.textSettings = DeepCopy(item.data.textSettings);
      this.text = item.data.textSettings.lines;
      this.applyTextSettings();
      item.remove();
    }
    this._shouldApplyToolSettings = true;
    this.show();
    this.draw();
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  applyTextSettings() {
    this.silentApply = true;

    this.setFont(this.textTools.textSettings.font);
    this.size = this.textTools.textSettings.size;
    this.alignX = this.textTools.textSettings.align;
    this.spaceX = this.textTools.textSettings.spaceX;
    this.spaceY = this.textTools.textSettings.spaceY;
    this.trim = this.textTools.textSettings.trim;
    this.upperCase = this.textTools.textSettings.allCaps;
    this.weld = this.textTools.textSettings.weld ?? this.textTools.textSettings.combine;

    this.silentApply = false;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  blink(op: boolean) {
    this.paper.activate();

    clearInterval(this.blinkTimer);
    this.cursor.opacity = op ? 1 : 0;
    if (!op) return;
    this.blinkTimer = setInterval(() => {
      this.cursor.opacity = this.cursor.opacity ? 0 : 1;
    }, 500);
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  updateElement(element) {
    this.silentApply = true;
    this.setFont(element.data.textSettings.font);
    this.size = element.data.textSettings.size;
    this.alignX = element.data.textSettings.align;
    this.spaceX = element.data.textSettings.spaceX;
    this.spaceY = element.data.textSettings.spaceY;
    this.trim = element.data.textSettings.trim;
    this.upperCase = element.data.textSettings.allCaps;
    this.weld = element.data.textSettings.weld ?? element.data.textSettings.combine;
    this.silentApply = false;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  endEdit(silentFlag = false) {
    this.paper.activate();
    this.paper.view.context.canvas.style.pointerEvents = 'none';

    if (this.el && this.el.length) {
      this.editorGroup.data.textSettings = this.textTools.textSettings;
      this.editorGroup.data.textSettings.font.file = this.fontFile;
      this.editorGroup.data.textSettings.font.variation = this.fontVariation;
      const elPos = this.el[0].bounds;
      this.editorGroup.data.textSettings.left = elPos.left - this.startPoint.x;
      this.editorGroup.data.textSettings.top = elPos.top - this.startPoint.y;
      this.editorGroup.data.textSettings.lines = this.lines.join('\n');

      if (this.weld) {
        const grp = new this.paper.CompoundPath();
        for (let i = 0; i < this.el.length; i++) {
          grp.addChild(weld(this.el[i], this.paper));
          this.el[i].remove();
        }
        const edit = weld(grp, this.paper, true);
        edit.strokeColor = 'white';
        this.editorGroup.addChild(edit);
        this.editorGroup.strokeScaling = false;
      }
      if (this.originalElementPosition) {
        this.editorGroup.position = this.originalElementPosition;
      }
      if (typeof this.onEndEditText === 'function') this.onEndEditText(this.editorGroup, silentFlag);
    }

    this.hide();
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  setFont(obj?) {
    const { file, fontFamily, fontSubFamily, variation } = obj || window[CURRENT_FONT];
    if (fontFamily === this.fontFamily && fontSubFamily === this.fontSubFamily) return;
    if (fontFamily) this.fontFamily = fontFamily;
    if (fontSubFamily) this.fontSubFamily = fontSubFamily;
    if (file) {
      this.fontFile = file;
      if (variation) {
        this.fontVariation = variation;
        this.font = fontkit.openSync(file).getVariation(fontSubFamily);
      } else this.font = fontkit.openSync(file);
      this.fontHeight = this.font.ascent - this.font.descent;
      if (!this.silentApply) this.draw();
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////

  set text(txt: string) {
    this.clear();
    this._text = txt;
    this.lines = txt.split('\n');
  }

  get text() {
    return this._text;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  set fontFamily(txt: string) {
    this._fontFamily = txt;
  }
  get fontFamily() {
    return this._fontFamily;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  set fontSubFamily(txt: string) {
    this._fontFamily = txt;
  }
  get fontSubFamily() {
    return this._fontSubFamily;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  show() {
    this.paper.activate();

    this._visible = true;
    this.paper.view.scaling = [1, 1];
    this.blink(true);
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  hide() {
    this._visible = false;

    this.blink(false);
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  set visible(op) {
    if (op) this.show();
    else this.hide();
  }

  get visible() {
    return this._visible;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  set weld(op) {
    this._weld = op;
    if (!this.silentApply) this.draw();
  }

  get weld() {
    return this.textTools.textSettings.weld;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  set startPoint({ x, y, endX, endY }) {
    this._startPoint = { x, y, endX, endY };
    this.cursor.position = [x, y];
  }

  get startPoint() {
    return this._startPoint || { x: 0, y: 0, endX: 0, endY: 0 };
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  set alignX(align: AlignX) {
    this._alignX = align;

    if (!this.silentApply) this.draw();
  }

  get alignX() {
    return this._alignX;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  set spaceX(v: number) {
    this._spaceX = v;
    if (!this.silentApply) this.draw();
  }

  get spaceX() {
    return this.textTools.textSettings.spaceX;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  set trim(op: boolean) {
    this._trim = op;
    if (!this.silentApply) this.draw();
  }

  get trim() {
    return this._trim;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  set upperCase(op: boolean) {
    this._upperCase = op;
    if (!this.silentApply) this.draw();
  }

  get upperCase() {
    return this._upperCase;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  set spaceY(v: number) {
    this._spaceY = v;
    if (!this.silentApply) this.draw();
  }
  get spaceY() {
    return this.textTools.textSettings.spaceY;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////

  set size(h) {
    this._size = h;
    this.cursor.bounds.height = h;
    this.fontScale = (1 / this.font.unitsPerEm) * h;
    this.fontYAdjust = this.fontHeight - this.font.ascent;
    if (!this.silentApply) this.draw();
  }

  get size() {
    return this._size || 24;
  }
}
