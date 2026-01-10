//@ts-nocheck

import { ELEMENTS, OBJECTS_LAYER, IMAGES, VECTORS } from '../../../components/LaserCanvas/LaserCanvas';
import { E_KIND_IMAGE, E_KIND_VECTOR } from '../../../components/LaserCanvas/CanvasElement';
import { SELECT } from '../../../components/LaserCanvas/Tools/Select';
import { DeepCopy } from '../../../lib/api/cherry/api';

type ElementMeta = {
  uid: string;
  uname?: string;
  kind?: string;
  userGroup?: boolean;
  inGroup?: boolean;
  laserSettings?: any;
  visible?: boolean;
  locked?: boolean;
  type?: any;
  parentUid?: string | null;
};

export interface HistorySnapshot {
  id: number;
  label: string;
  childrenJSON: string[];
  metadata: Record<string, ElementMeta>;
  selection: string[];
  hash: string;
  timestamp: number;
}

interface CommitOptions {
  label?: string;
  selection?: string[];
}

interface HistoryOptions {
  maxEntries?: number;
}

export default class History {
  private stack: HistorySnapshot[] = [];
  private pointer = -1;
  private isApplying = false;
  private sequence = 0;
  private maxEntries: number;

  onApply?: (payload: {
    selection: string[];
    label: string;
    index: number;
    total: number;
  }) => void;
  onCommit?: (snapshot: HistorySnapshot) => void;
  onPointerChange?: (snapshot: HistorySnapshot | null) => void;

  constructor(private canvas: any, options: HistoryOptions = {}) {
    const maxEntries = options.maxEntries;
    this.maxEntries = maxEntries != null ? maxEntries : 100;
  }

  get canUndo() {
    return this.pointer > 0;
  }

  get canRedo() {
    return this.pointer >= 0 && this.pointer < this.stack.length - 1;
  }

  get revision() {
    const snapshot = this.stack[this.pointer];
    return snapshot ? snapshot.id : 0;
  }

  clear() {
    this.stack = [];
    this.pointer = -1;
    this.sequence = 0;
    this.emitPointerChange();
  }

  commit(label = 'Change', options: CommitOptions = {}) {
    if (this.isApplying) return false;

    const snapshot = this.captureSnapshot(label, options.selection);
    if (!snapshot) return false;

    const current = this.stack[this.pointer];
    if (current && current.hash === snapshot.hash) return false;

    if (this.pointer < this.stack.length - 1) {
      this.stack = this.stack.slice(0, this.pointer + 1);
    }

    this.stack.push(snapshot);
    if (this.stack.length > this.maxEntries) {
      const overflow = this.stack.length - this.maxEntries;
      if (overflow > 0) this.stack.splice(0, overflow);
    }

    this.pointer = this.stack.length - 1;
    if (typeof this.onCommit === 'function') this.onCommit(snapshot);
    this.emitPointerChange();
    return true;
  }

  undo() {
    if (!this.canUndo) return;
    this.pointer = Math.max(0, this.pointer - 1);
    const snapshot = this.stack[this.pointer];
    if (snapshot) this.applySnapshot(snapshot);
    this.emitPointerChange();
  }

  redo() {
    if (!this.canRedo) return;
    this.pointer = Math.min(this.stack.length - 1, this.pointer + 1);
    const snapshot = this.stack[this.pointer];
    if (snapshot) this.applySnapshot(snapshot);
    this.emitPointerChange();
  }

  private captureSnapshot(label: string, selection?: string[]): HistorySnapshot | null {
    const layer = window[OBJECTS_LAYER];
    if (!layer || !layer.exportJSON) return null;

    const restoreSelectionGroup = this.detachSelectionGroup();

    const children = this.getChildren(layer);
    const childrenJSON = children.map((item: any) => item.exportJSON());
    const metadata = this.captureMetadata(layer);
    const selected = selection != null ? selection : this.getSelection();

    if (restoreSelectionGroup) restoreSelectionGroup();

    const hash = this.computeHash(childrenJSON, metadata);
    return {
      id: ++this.sequence,
      label,
      childrenJSON,
      metadata,
      selection: selected,
      hash,
      timestamp: Date.now(),
    };
  }

  private applySnapshot(snapshot: HistorySnapshot) {
    const layer = window[OBJECTS_LAYER];
    if (!layer) return;

    this.detachSelectionGroup(false);

    this.isApplying = true;
    try {
      if (this.canvas?.toolbox?.select) {
        const selectTool = this.canvas.toolbox.select;
        selectTool.selectedItems = [];
        selectTool.selectionBounds = null;
        if (selectTool.selectionGroup) {
          selectTool.selectionGroup.removeChildren();
          if (selectTool.selectionGroup.parent !== window[OBJECTS_LAYER]) {
            window[OBJECTS_LAYER].addChild(selectTool.selectionGroup);
          }
        }
      }

      layer.removeChildren();
      for (let i = 0; i < snapshot.childrenJSON.length; i++) {
        layer.importJSON(snapshot.childrenJSON[i]);
      }

      this.applyMetadata(layer, snapshot.metadata);
      if (typeof this.canvas?.refreshScene === 'function') {
        this.canvas.refreshScene(true);
      }
      this.canvas.isPreviewChanged = true;

      if (this.onApply) {
        this.onApply({
          selection: snapshot.selection,
          label: snapshot.label,
          index: this.pointer,
          total: this.stack.length,
        });
      }
    } finally {
      this.isApplying = false;
    }
  }

  private emitPointerChange() {
    if (typeof this.onPointerChange === 'function') {
      const snapshot = this.stack[this.pointer] || null;
      this.onPointerChange(snapshot);
    }
  }

  private captureMetadata(root: any) {
    const metadata: Record<string, ElementMeta> = {};

    const walk = (item: any, path: string, parent: any) => {
      if (!item) return;
      if (item.uid) {
        const parentUid = this.resolveParentUid(item, parent);
        metadata[path] = {
          uid: item.uid,
          uname: item.uname,
          kind: item.kind,
          userGroup: item.userGroup,
          inGroup: item.inGroup,
          laserSettings: item.laserSettings ? DeepCopy(item.laserSettings) : undefined,
          visible: typeof item.visible === 'boolean' ? item.visible : undefined,
          locked: typeof item.locked === 'boolean' ? item.locked : undefined,
          type: item.type,
          parentUid,
        };
      }

      const children = this.getChildren(item);
      for (let i = 0; i < children.length; i++) {
        const childPath = path ? `${path}.${i}` : `${i}`;
        walk(children[i], childPath, item);
      }
    };

    const rootChildren = this.getChildren(root);
    for (let i = 0; i < rootChildren.length; i++) {
      walk(rootChildren[i], `${i}`, root);
    }

    return metadata;
  }

  private applyMetadata(root: any, metadata: Record<string, ElementMeta>) {
    const elements: Record<string, any> = {};
    const images: Record<string, any> = {};
    const vectors: Record<string, any> = {};

    const walk = (item: any, path: string, parent: any) => {
      if (!item) return;

      const info = metadata[path];
      const resolvedParentUid =
        info && Object.prototype.hasOwnProperty.call(info, 'parentUid')
          ? info.parentUid
          : this.resolveParentUid(item, parent);
      const normalizedParentUid = typeof resolvedParentUid === 'string' ? resolvedParentUid : null;

      if (info) {
        item.uid = info.uid;
        if (typeof info.uname !== 'undefined') item.uname = info.uname;
        if (typeof info.kind !== 'undefined') item.kind = info.kind;
        if (typeof info.userGroup !== 'undefined') item.userGroup = info.userGroup;
        if (typeof info.inGroup !== 'undefined') item.inGroup = info.inGroup;
        if (typeof info.visible !== 'undefined') item.visible = info.visible;
        if (typeof info.locked !== 'undefined') item.locked = info.locked;
        if (typeof info.type !== 'undefined') item.type = info.type;
        item.laserSettings = info.laserSettings ? DeepCopy(info.laserSettings) : item.laserSettings;
        item.sel = false;
        item.currentParent = normalizedParentUid;

        elements[info.uid] = item;
        if (info.kind === E_KIND_IMAGE) images[info.uid] = item;
        if (info.kind === E_KIND_VECTOR || info.type === E_KIND_VECTOR) vectors[info.uid] = item;

        parent = item;
      }

      const children = this.getChildren(item);
      for (let i = 0; i < children.length; i++) {
        const childPath = path ? `${path}.${i}` : `${i}`;
        walk(children[i], childPath, parent);
      }
    };

    const rootChildren = this.getChildren(root);
    for (let i = 0; i < rootChildren.length; i++) {
      walk(rootChildren[i], `${i}`, null);
    }

    this.canvas.elements = elements;
    window[ELEMENTS] = elements;
    window[IMAGES] = images;
    window[VECTORS] = vectors;
  }

  private getSelection() {
    const select = this.canvas?.toolbox?.select;
    if (!select || !select.selectedItems) return [];

    const uids: string[] = [];
    for (let i = 0; i < select.selectedItems.length; i++) {
      const item = select.selectedItems[i];
      if (item && item.uid) uids.push(item.uid);
    }
    return uids;
  }

  private detachSelectionGroup(restore = true) {
    const select = this.canvas?.toolbox?.select;
    const selectionGroup = select?.selectionGroup;
    if (!selectionGroup || !selectionGroup.parent) return null;

    const parent = selectionGroup.parent;
    const index =
      typeof selectionGroup.index === 'number'
        ? selectionGroup.index
        : parent.children.indexOf(selectionGroup);

    const selectionChildren = selectionGroup.children ? selectionGroup.children.slice() : [];
    const placements: Array<{ child: any; parent: any }> = [];

    for (let i = 0; i < selectionChildren.length; i++) {
      const child = selectionChildren[i];
      if (!child) continue;

      const parentUid = typeof child.currentParent === 'string' ? child.currentParent : null;
      let targetParent = parentUid && this.canvas?.elements ? this.canvas.elements[parentUid] : null;

      if (!targetParent || targetParent.uid === SELECT) {
        targetParent = window[OBJECTS_LAYER];
      }

      child.remove();
      targetParent.addChild(child);
      placements.push({ child, parent: targetParent });
    }

    selectionGroup.remove();

    if (!restore) return null;

    return () => {
      for (let i = placements.length - 1; i >= 0; i--) {
        const { child } = placements[i];
        if (!child) continue;
        if (child.parent) child.remove();
        selectionGroup.addChild(child);
      }
      if (!parent.children || !parent.insertChild) return;
      parent.insertChild(index, selectionGroup);
    };
  }

  private getChildren(item: any) {
    if (!item || !item.children) return [];
    if (Array.isArray(item.children)) return item.children.slice();
    try {
      return Array.from(item.children);
    } catch (error) {
      return [];
    }
  }

  private computeHash(childrenJSON: string[], metadata: Record<string, ElementMeta>) {
    const metaEntries = Object.keys(metadata)
      .sort()
      .map((key) => [key, metadata[key]]);

    const metaString = JSON.stringify(metaEntries);
    const childrenString = JSON.stringify(childrenJSON);

    return `${History.hash(childrenString)}:${History.hash(metaString)}`;
  }

  private static hash(value: string) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(16);
  }

  private resolveParentUid(item: any, parent: any) {
    if (!item) return null;

    const stored = item.currentParent;
    if (typeof stored === 'string' && stored !== SELECT) {
      return stored;
    }

    let parentItem = parent;
    if (!parentItem && item.parent) parentItem = item.parent;

    if (parentItem && typeof parentItem.uid === 'string' && parentItem.uid !== SELECT) {
      return parentItem.uid;
    }

    return null;
  }
}
