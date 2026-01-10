import path from 'path';
import fs from 'fs';
import { dialog, app } from '@electron/remote';

const RECENT_PROJECTS_KEY = 'embercad_recent_projects';

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
      const exported = this.laserCanvas.objectsLayer.exportJSON();
      return typeof exported === 'string' ? exported : JSON.stringify(exported);
    } catch (error) {
      throw new Error(`Failed to serialize project: ${error?.message || error}`);
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  private async loadProjectFromPath(filePath: string) {
    if (!this.laserCanvas) throw new Error('Laser canvas is not ready');
    const data = await fs.promises.readFile(filePath, 'utf-8');

    const imported = this.laserCanvas.paper.project.importJSON(data);
    this.laserCanvas.objectsLayer.removeChildren();

    if (imported && imported.children && imported.children.length) {
      this.laserCanvas.objectsLayer.addChildren(imported.children);
    }

    imported.remove();
    this.laserCanvas.toolbox.select.unselectAll();
    this.laserCanvas.updateSelection();
    this.laserCanvas.paper.view.update();
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
}
