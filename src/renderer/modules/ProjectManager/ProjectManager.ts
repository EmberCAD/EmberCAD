import path from 'path';
import fs from 'fs';
import { dialog, app } from '@electron/remote';
import { DeepCopy } from '../../lib/api/cherry/api';
import { E_KIND_IMAGE, E_KIND_VECTOR } from '../../components/LaserCanvas/CanvasElement';
import { ELEMENTS, IMAGES, OBJECTS_LAYER, VECTORS } from '../../components/LaserCanvas/LaserCanvas';
import { SELECT } from '../../components/LaserCanvas/Tools/Select';
import { getLayerColor, getLayerId, setLayerData } from '../layers';

const RECENT_PROJECTS_KEY = 'embercad_recent_projects';
const PROJECT_FORMAT = 'ecad-v2';

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
  data?: any;
  layerId?: string;
  layerColor?: string;
};

type SerializedProject = {
  format: string;
  childrenJSON: string[];
  metadata: Record<string, ElementMeta>;
  layerData: Record<string, any>;
};

export default class ProjectManager {
  private _laserCanvas: any;
  private _currentFilePath: string;
  private _hasUnsavedChanges = false;
  onStateChange: (state: { dirty: boolean; filePath: string }) => void;
  private _history: any;
  private _lastSavedRevision = 0;
  onRecentChange: (paths: string[]) => void;
  private _recentFiles: string[];

  constructor() {
    this._currentFilePath = '';
    this._recentFiles = this.loadRecentFiles();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  get currentFilePath() {
    return this._currentFilePath || '';
  }

  get hasUnsavedChanges() {
    return this._hasUnsavedChanges;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  markDirty() {
    if (!this._hasUnsavedChanges) {
      this._hasUnsavedChanges = true;
      this.emitState();
    }
    if (this._history) {
      this.handleHistoryChange();
    }
  }

  markClean() {
    this._hasUnsavedChanges = false;
    this._lastSavedRevision = this.historyRevision();
    this.emitState();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  async createNewProject() {
    if (!this.laserCanvas) return;

    this.laserCanvas.toolbox.select.unselectAll();
    this.laserCanvas.objectsLayer.removeChildren();
    this._currentFilePath = '';
    this.laserCanvas.isPreviewChanged = false;
    this.markClean();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  async saveProject(targetPath?: string) {
    if (!this.laserCanvas) throw new Error('Laser canvas is not ready');

    const filePath = this.ensureExtension(targetPath || this.currentFilePath);

    if (!filePath) {
      return this.saveProjectAs();
    }

    await this.writeFile(filePath, this.serializeProject());

    this._currentFilePath = filePath;
    this.laserCanvas.isPreviewChanged = false;
    this.markClean();
    this.addToRecent(filePath);

    return { filePath };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  async saveProjectAs() {
    const suggestion = this.currentFilePath || this.suggestFilePath();
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save EmberCAD Project',
      defaultPath: this.ensureExtension(suggestion) || suggestion,
      filters: [
        { name: 'EmberCAD Project', extensions: ['ecad'] },
        { name: 'JSON', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (canceled || !filePath) {
      return { canceled: true };
    }

    return this.saveProject(filePath);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  async openProject() {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Open EmberCAD Project',
      defaultPath: this.currentFilePath || this.suggestDirectory(),
      filters: [
        { name: 'EmberCAD Project', extensions: ['ecad', 'json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (canceled || !filePaths || !filePaths.length) {
      return { canceled: true };
    }

    const filePath = filePaths[0];
    await this.loadProjectFromPath(filePath);
    this._currentFilePath = filePath;
    this.laserCanvas.isPreviewChanged = false;
    this.markClean();
    this.addToRecent(filePath);

    return { filePath };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  private serializeProject() {
    if (!this.laserCanvas) return '';

    try {
      const layer = this.laserCanvas.objectsLayer;
      const restoreSelectionGroup = this.detachSelectionGroup();
      try {
        const children = this.getChildren(layer);
        const payload: SerializedProject = {
          format: PROJECT_FORMAT,
          childrenJSON: children.map((item: any) => item.exportJSON()),
          metadata: this.captureMetadata(layer),
          layerData: layer?.data ? DeepCopy(layer.data) : {},
        };
        return JSON.stringify(payload);
      } finally {
        if (restoreSelectionGroup) restoreSelectionGroup();
      }
    } catch (error) {
      throw new Error(`Failed to serialize project: ${error?.message || error}`);
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  private async loadProjectFromPath(filePath: string) {
    if (!this.laserCanvas) throw new Error('Laser canvas is not ready');
    const data = await fs.promises.readFile(filePath, 'utf-8');
    const layer = this.laserCanvas.objectsLayer;
    const parsed = this.tryParseProject(data);

    if (parsed && parsed.format === PROJECT_FORMAT && Array.isArray(parsed.childrenJSON)) {
      layer.removeChildren();
      for (let i = 0; i < parsed.childrenJSON.length; i++) {
        layer.importJSON(parsed.childrenJSON[i]);
      }
      layer.data = parsed.layerData ? DeepCopy(parsed.layerData) : {};
      this.applyMetadata(layer, parsed.metadata || {});
    } else {
      const imported = this.laserCanvas.paper.project.importJSON(data);
      layer.removeChildren();
      if (!layer.data) layer.data = {};
      const importedData = imported && imported.data ? imported.data : {};
      layer.data = { ...importedData };
      if (imported && imported.children && imported.children.length) {
        layer.addChildren(imported.children);
      }
      imported.remove();
    }

    this.cleanupDuplicateUidGhosts(layer);

    this.laserCanvas.toolbox.select.unselectAll();
    if (typeof this.laserCanvas.refreshScene === 'function') {
      this.laserCanvas.refreshScene(true);
    }
    this.laserCanvas.updateSelection();
    this.laserCanvas.paper.view.update();
  }

  private cleanupDuplicateUidGhosts(root: any) {
    if (!root) return;
    const byUid: Record<string, any[]> = {};

    const isDrawable = (item: any) => {
      if (!item) return false;
      if (item.kind === E_KIND_IMAGE) return true;
      const b = item.bounds;
      return !!(b && b.width && b.height);
    };

    const walk = (item: any) => {
      if (!item) return;
      if (item.uid && item.uid !== SELECT) {
        if (!byUid[item.uid]) byUid[item.uid] = [];
        byUid[item.uid].push(item);
      }
      const children = this.getChildren(item);
      for (let i = 0; i < children.length; i++) walk(children[i]);
    };

    const rootChildren = this.getChildren(root);
    for (let i = 0; i < rootChildren.length; i++) walk(rootChildren[i]);

    const uids = Object.keys(byUid);
    for (let i = 0; i < uids.length; i++) {
      const uid = uids[i];
      const items = byUid[uid];
      if (!items || items.length < 2) continue;
      let keep = items[0];
      for (let j = 1; j < items.length; j++) {
        const candidate = items[j];
        if (!isDrawable(keep) && isDrawable(candidate)) keep = candidate;
      }
      for (let j = 0; j < items.length; j++) {
        const item = items[j];
        if (item === keep) continue;
        try {
          item.remove && item.remove();
        } catch (error) {
          console.warn('Failed to remove duplicate uid ghost item:', uid, error);
        }
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  private async writeFile(filePath: string, data: string) {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, data, 'utf-8');
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  private ensureExtension(filePath?: string) {
    if (!filePath) return '';

    const ext = path.extname(filePath);
    if (ext.toLowerCase() === '.ecad' || ext.toLowerCase() === '.json') {
      return filePath;
    }
    return `${filePath}.ecad`;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  private suggestDirectory() {
    try {
      return this.currentFilePath ? path.dirname(this.currentFilePath) : app.getPath('documents');
    } catch (error) {
      return process.cwd();
    }
  }

  private suggestFilePath() {
    const dir = this.suggestDirectory();
    return path.join(dir, 'Untitled.ecad');
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  set laserCanvas(laserCanvas) {
    this._laserCanvas = laserCanvas;
    if (!laserCanvas) return;

    if (!laserCanvas.__projectManagerHooked) {
      let previewValue = laserCanvas.isPreviewChanged;
      Object.defineProperty(laserCanvas, 'isPreviewChanged', {
        configurable: true,
        enumerable: true,
        get: () => previewValue,
        set: (value) => {
          previewValue = value;
          if (value) {
            this.markDirty();
          }
        },
      });
      Object.defineProperty(laserCanvas, '__projectManagerHooked', {
        value: true,
        configurable: true,
        enumerable: false,
        writable: false,
      });
    }
  }

  get laserCanvas() {
    return this._laserCanvas;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  private emitState() {
    if (typeof this.onStateChange === 'function') {
      this.onStateChange({ dirty: this._hasUnsavedChanges, filePath: this.currentFilePath });
    }
  }

  set history(history) {
    this._history = history;
    if (!history) {
      this._lastSavedRevision = 0;
      return;
    }
    history.onCommit = () => this.handleHistoryChange();
    history.onPointerChange = () => this.handleHistoryChange();
    this._lastSavedRevision = this.historyRevision();
    this.handleHistoryChange();
  }

  get history() {
    return this._history;
  }

  private historyRevision() {
    if (!this._history || typeof this._history.revision !== 'number') return 0;
    return this._history.revision;
  }

  private handleHistoryChange() {
    const dirty = this.historyRevision() !== this._lastSavedRevision;
    if (dirty !== this._hasUnsavedChanges) {
      this._hasUnsavedChanges = dirty;
      this.emitState();
    }
  }

  getRecentFiles() {
    return [...this._recentFiles];
  }

  removeFromRecent(filePath: string) {
    if (!filePath) return;
    const normalized = this.normalizePath(filePath);
    const prevLength = this._recentFiles.length;
    this._recentFiles = this._recentFiles.filter((item) => item !== normalized);
    if (this._recentFiles.length !== prevLength) {
      this.saveRecentFiles();
      this.emitRecentChange();
    }
  }

  async openProjectByPath(filePath: string) {
    if (!filePath) return { canceled: true };
    await this.loadProjectFromPath(filePath);
    this._currentFilePath = filePath;
    this.laserCanvas.isPreviewChanged = false;
    this.markClean();
    this.addToRecent(filePath);
    return { filePath };
  }

  private addToRecent(filePath: string) {
    if (!filePath) return;
    const normalized = this.normalizePath(filePath);
    this._recentFiles = [normalized, ...this._recentFiles.filter((item) => item !== normalized)].slice(0, 10);
    this.saveRecentFiles();
    this.emitRecentChange();
  }

  private normalizePath(filePath: string) {
    try {
      return path.resolve(filePath);
    } catch (error) {
      return filePath;
    }
  }

  private loadRecentFiles() {
    try {
      const raw = localStorage.getItem(RECENT_PROJECTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => typeof item === 'string');
      }
    } catch (error) {
      console.warn('Failed to load recent projects', error);
    }
    return [];
  }

  private saveRecentFiles() {
    try {
      localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(this._recentFiles));
    } catch (error) {
      console.warn('Failed to save recent projects', error);
    }
  }

  private emitRecentChange() {
    if (typeof this.onRecentChange === 'function') {
      this.onRecentChange(this.getRecentFiles());
    }
  }

  private tryParseProject(data: string): SerializedProject | null {
    try {
      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed !== 'object') return null;
      if (!parsed.format || !Array.isArray(parsed.childrenJSON)) return null;
      return parsed as SerializedProject;
    } catch (error) {
      return null;
    }
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

  private resolveParentUid(item: any, parent: any) {
    const currentParent = item && item.currentParent;
    if (typeof currentParent === 'string') {
      return currentParent === SELECT ? null : currentParent;
    }
    if (!parent || !parent.uid) return null;
    return parent.uid === SELECT ? null : parent.uid;
  }

  private captureMetadata(root: any) {
    const metadata: Record<string, ElementMeta> = {};

    const walk = (item: any, itemPath: string, parent: any) => {
      if (!item) return;
      if (item.uid) {
        metadata[itemPath] = {
          uid: item.uid,
          uname: item.uname,
          kind: item.kind,
          userGroup: item.userGroup,
          inGroup: item.inGroup,
          laserSettings: item.laserSettings ? DeepCopy(item.laserSettings) : undefined,
          visible: typeof item.visible === 'boolean' ? item.visible : undefined,
          locked: typeof item.locked === 'boolean' ? item.locked : undefined,
          type: item.type,
          parentUid: this.resolveParentUid(item, parent),
          data: item.data ? DeepCopy(item.data) : undefined,
          layerId: getLayerId(item),
          layerColor: getLayerColor(item),
        };
      }

      const children = this.getChildren(item);
      for (let i = 0; i < children.length; i++) {
        const childPath = itemPath ? `${itemPath}.${i}` : `${i}`;
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

    const walk = (item: any, itemPath: string, parent: any) => {
      if (!item) return;
      const info = metadata[itemPath];
      const resolvedParentUid =
        info && Object.prototype.hasOwnProperty.call(info, 'parentUid')
          ? info.parentUid
          : this.resolveParentUid(item, parent);

      if (info) {
        item.uid = info.uid;
        if (typeof info.uname !== 'undefined') item.uname = info.uname;
        if (typeof info.kind !== 'undefined') item.kind = info.kind;
        if (typeof info.userGroup !== 'undefined') item.userGroup = info.userGroup;
        if (typeof info.inGroup !== 'undefined') item.inGroup = info.inGroup;
        if (typeof info.visible !== 'undefined') item.visible = info.visible;
        if (typeof info.locked !== 'undefined') item.locked = info.locked;
        if (typeof info.type !== 'undefined') item.type = info.type;
        if (typeof info.data !== 'undefined') item.data = DeepCopy(info.data);
        item.laserSettings = info.laserSettings ? DeepCopy(info.laserSettings) : item.laserSettings;
        item.sel = false;
        item.currentParent = typeof resolvedParentUid === 'string' ? resolvedParentUid : null;
        if (info.layerId) setLayerData(item, info.layerId, info.layerColor);
      }

      if (item.uid) {
        elements[item.uid] = item;
        if (item.kind === E_KIND_IMAGE) images[item.uid] = item;
        if (item.kind === E_KIND_VECTOR || item.type === E_KIND_VECTOR) vectors[item.uid] = item;
      }

      const children = this.getChildren(item);
      for (let i = 0; i < children.length; i++) {
        const childPath = itemPath ? `${itemPath}.${i}` : `${i}`;
        walk(children[i], childPath, item);
      }
    };

    const rootChildren = this.getChildren(root);
    for (let i = 0; i < rootChildren.length; i++) {
      walk(rootChildren[i], `${i}`, root);
    }

    this.laserCanvas.elements = elements;
    window[ELEMENTS] = elements;
    window[IMAGES] = images;
    window[VECTORS] = vectors;
  }

  private detachSelectionGroup() {
    const select = this.laserCanvas?.toolbox?.select;
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
      let targetParent = parentUid && this.laserCanvas?.elements ? this.laserCanvas.elements[parentUid] : null;
      if (!targetParent || targetParent.uid === SELECT) targetParent = window[OBJECTS_LAYER];
      child.remove();
      targetParent.addChild(child);
      placements.push({ child, parent: targetParent });
    }

    selectionGroup.remove();

    return () => {
      for (let i = placements.length - 1; i >= 0; i--) {
        const child = placements[i].child;
        if (!child) continue;
        if (child.parent) child.remove();
        selectionGroup.addChild(child);
      }
      if (!parent.children || !parent.insertChild) return;
      parent.insertChild(index, selectionGroup);
    };
  }
}
