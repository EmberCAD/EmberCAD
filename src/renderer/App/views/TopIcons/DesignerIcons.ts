//@ts-ignore
//@ts-nocheck
import { flipH, flipV } from './BasicIcons';

export const ICON_NAME = 'DESIGNER_ICONS';

export default class DesignerIcons {
  label: any;
  private _view: any;
  newFile: any;

  open: any;
  save: any;
  import: any;
  undo: any;
  redo: any;
  duplicate: any;
  remove: any;
  zoomFit: any;
  zoomIn: any;
  zoomOut: any;
  flipH: any;
  flipV: any;
  separator: any;
  ////////////////////////////////////////////////////////////////////

  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onImport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onZoomFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  constructor(private topIcons) {}

  /////////////////////////////////////////////////////////////////////

  private initView() {
    this.newFile = this.topIcons.addIconButton('<i class="fa-regular fa-file"></i>', 'New');
    this.open = this.topIcons.addIconButton('<i class="fa-regular fa-folder-open"></i>', 'Open');
    this.save = this.topIcons.addIconButton('<i class="fa-solid fa-floppy-disk"></i>', 'Save');
    this.import = this.topIcons.addIconButton('<i class="fa-solid fa-file-import"></i>', 'Import');

    this.topIcons.addSeparator();

    this.undo = this.topIcons.addIconButton('<i class="fa-solid fa-rotate-left"></i>', 'Undo');
    this.redo = this.topIcons.addIconButton('<i class="fa-solid fa-rotate-right"></i>', 'Redo');

    this.topIcons.addSeparator();

    this.duplicate = this.topIcons.addIconButton('<i class="fa-regular fa-clone"></i>', 'Duplicate');
    this.remove = this.topIcons.addIconButton('<i class="fa-regular fa-trash-can"></i>', 'Remove');

    this.topIcons.addSeparator();

    this.zoomFit = this.topIcons.addIconButton('<i class="fa-solid fa-magnifying-glass"></i>', 'Zoom to Fit');
    this.zoomIn = this.topIcons.addIconButton('<i class="fa-solid fa-magnifying-glass-plus"></i>', 'Zoom In');
    this.zoomOut = this.topIcons.addIconButton('<i class="fa-solid fa-magnifying-glass-minus"></i>', 'Zoom Out');

    this.separator = this.topIcons.addSeparator();
    this.separator.hide();

    this.flipH = this.topIcons.addIconButton(flipH, 'Flip Horizontal');
    this.flipV = this.topIcons.addIconButton(flipV, 'Flip Vertical');

    this.flipH.hide();
    this.flipV.hide();
    this.events();
  }

  /////////////////////////////////////////////////////////////////////

  private events() {
    this.newFile.onClick = () => {
      if (typeof this.onNew === 'function') this.onNew();
    };

    this.open.onClick = () => {
      if (typeof this.onOpen === 'function') this.onOpen();
    };

    this.save.onClick = () => {
      if (typeof this.onSave === 'function') this.onSave();
    };

    this.import.onClick = () => {
      if (typeof this.onImport === 'function') this.onImport();
    };

    this.undo.onClick = () => {
      if (typeof this.onUndo === 'function') this.onUndo();
    };

    this.redo.onClick = () => {
      if (typeof this.onRedo === 'function') this.onRedo();
    };

    this.duplicate.onClick = () => {
      if (typeof this.onDuplicate === 'function') this.onDuplicate();
    };

    this.remove.onClick = () => {
      if (typeof this.onRemove === 'function') this.onRemove();
    };

    this.zoomFit.onClick = () => {
      if (typeof this.onZoomFit === 'function') this.onZoomFit();
    };

    this.zoomIn.onClick = () => {
      if (typeof this.onZoomIn === 'function') this.onZoomIn();
    };

    this.zoomOut.onClick = () => {
      if (typeof this.onZoomOut === 'function') this.onZoomOut();
    };

    this.flipH.onClick = () => {
      if (typeof this.onFlipH === 'function') this.onFlipH();
    };
    this.flipV.onClick = () => {
      if (typeof this.onFlipV === 'function') this.onFlipV();
    };
  }

  /////////////////////////////////////////////////////////////////////

  showExtraTools() {
    this.separator.show();
    this.flipH.show();
    this.flipV.show();
  }

  hideExtraTools() {
    this.separator.hide();
    this.flipH.hide();
    this.flipV.hide();
  }

  /////////////////////////////////////////////////////////////////////

  get viewName() {
    return ICON_NAME;
  }

  set view(view: any) {
    this._view = view;
    this.initView();
  }
}
