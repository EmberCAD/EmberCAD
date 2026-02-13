//@ts-ignore
//@ts-nocheck

import Application, { isMac } from '../lib/components/Application/Application';
import ThemeManager from '../lib/components/Application/ThemeManager';
import ViewManager from '../lib/components/Application/ViewManager';
import View from '../lib/components/Application/View';
import Container2 from '../lib/components/Container2/Container2';
import Container3 from '../lib/components/Container3/Container3';
import { OR_HORIZONTAL } from '../lib/api/declare_common.js';
import { tr } from '../lib/api/cherry/langs.js';
import { crDiv } from '../modules/dom';
import { screen, getCurrentWindow, dialog, app } from '@electron/remote';
import path from 'path';
import './App.scss';
import WorkView from './views/Work/Work';
import getSystemFonts from 'get-system-fonts';
import ServerRemote from '../components/ServerRemote/ServerRemote';
import OptionApp from '../lib/components/OptionApp/OptionApp';
import LaserView from './views/Laser/Laser';
import SettingsView from './views/Settings/Settings';
import TopTools from './views/TopTools/TopTools';
import { setupMenu } from './menu';
import TopIcons from './views/TopIcons/TopIcons';
import DefaultTools from './views/TopTools/DefaultTool';
import ImageTools from './views/TopTools/ImageTools';
import LaserTools from './views/TopTools/LaserTools';
import CameraTools from './views/TopTools/CameraTools';
import RectangleTools from './views/TopTools/RectangleTools';
import Camera from '../modules/Camera/Camera';
import ProjectManager from '../modules/ProjectManager/ProjectManager';
import { ToolboxMode } from '../components/LaserCanvas/Tools/Toolbox';
import TextTools from './views/TopTools/TextTools';
import PowerIntervalTools from './views/TopTools/PowerIntervalTools';
import DefaultPowerTools from './views/TopTools/DefaultPowerTool';
import { VECTOR_IMPORT_EXTENSIONS } from '../components/LaserCanvas/CanvasVector';

const DEFAULT_THEME = 'darkCherry';
const VIEWS = ['Designer', 'Laser'];
const IMAGE_IMPORT_EXTENSIONS = ['jpg', 'jpeg', 'png', 'jfif', 'webp', 'bmp'];
// const VIEWS = ['Designer', 'Laser', 'Settings'];
export const CURRENT_MOD = 'CURRENT_MOD';
export const MOD_WORK = 'ident0';
export const MOD_LASER = 'ident1';
export const MOD_CAMERS = 'ident2';

export default class App {
  private themeManager: any;
  private app: any;
  private appDiv: any;
  private mainViewManager: any;
  private views: any;
  private mainView: any;
  private bottomBar: any;
  private appSwitch: any;

  private projectView: any;
  private topPanel: any;

  private viewPreparation: any;
  private viewWork: any;
  private viewDeliver: any;

  viewLaser: any;
  topTools: any;
  topIcons: TopIcons;
  projectManager: ProjectManager;
  viewControl: SettingsView;
  defaultTopTools: DefaultTools;
  imageTools: ImageTools;
  laserTools: LaserTools;
  cameraTools: CameraTools;
  rectangleTools: RectangleTools;
  camera: Camera;
  textTools: TextTools;
  fonts: any;
  topToolsDoubled: Container2;
  powerIntervalTools: PowerIntervalTools;
  topToolsAux: TopTools;
  defaultPowerTopTools: DefaultPowerTools;
  private isQuitting = false;

  constructor(private parent: any) {
    ////////////////////////////////////////

    setTimeout(async () => {
      await this.init();
      this.events();

      this.appSwitch.select(0);
    }, 100);
  }

  private async init() {
    this.projectManager = new ProjectManager();

    await this.setupView();

    this.appDiv = crDiv(this.parent, { class: 'fill-frame' });
    this.themeManager = new ThemeManager();
    this.themeManager.setTheme(DEFAULT_THEME);

    this.app = new Application(' ', true, this.appDiv);
    window['App'] = this.app;
    window['CHERRIES'].autotranslate = true;

    ////////////////////////////////////////

    this.mainViewManager = new ViewManager();
    this.views = [];

    ////////////////////////////////////////

    this.mainView = new Container2();
    this.mainView.parts = ['%', 40];

    this.mainView.bottomPart.borderTop = '1px solid var(--cherry-background-handle)';

    ////////////////////////////////////////

    this.bottomBar = new Container3(this.mainView.bottomPart);
    this.bottomBar.divide = { direction: OR_HORIZONTAL };
    this.bottomBar.centerPart.alignItems = 'center';
    this.bottomBar.rightPart.cont.setAttribute('laser-status', '');

    ////////////////////////////////////////

    this.projectView = new Container2(this.mainView.topPart);
    this.projectView.parts = ['8rem', '%'];
    this.projectView.topPart.borderBottom = '1px solid var(--cherry-background-handle)';
    this.projectView.topPart.overflow = 'visible';
    ////////////////////////////////////////

    this.topPanel = new Container2(this.projectView.topPart);
    this.topPanel.parts = ['3rem', '%'];
    this.topPanel.topPart.borderBottom = '1px solid var(--cherry-background-handle)';

    // this.topPanel.divide = { direction: OR_HORIZONTAL };
    // this.topPanel.centerPart.alignItems = 'center';
    // this.topPanel.centerPart.fontWeight = 'bold';

    this.bottomBar.centerPart.width = 'auto';

    ////////////////////////////////////////

    this.setProjectName('Untitled');

    ////////////////////////////////////////
    this.appSwitch = new OptionApp(this.bottomBar.centerPart);
    for (let i = 0; i < VIEWS.length; i++) {
      let view = new View(this.projectView.bottomPart);
      view.opacity = 0;
      this.views.push(view);
      this,
        this.mainViewManager.addView({
          ident: 'ident' + i,
          view,
        });
      this.appSwitch.addItem({
        label: VIEWS[i],
        ident: 'ident' + i,
        style: 'min-width:12rem;',
      });
    }

    ////////////////////////////////////////

    this.topIcons = new TopIcons(this.topPanel.topPart);

    ////////////////////////////////////////

    this.viewWork = new WorkView(this.views[0]);
    this.viewLaser = new LaserView(this.views[1], this.viewWork.canvas);
    // this.viewControl = new SettingsView(this.views[2]);

    ////////////////////////////////////////

    this.projectManager.laserCanvas = this.viewWork.canvas;
    this.projectManager.onStateChange = (state) => this.updateWindowTitle(state);
    this.projectManager.onRecentChange = () => this.refreshMainMenu();
    this.projectManager.history = this.viewWork.history;
    this.updateWindowTitle();
    this.refreshMainMenu();

    ////////////////////////////////////////

    this.topToolsDoubled = new Container2(this.topPanel.bottomPart);
    this.topToolsDoubled.parts = ['2.5rem', '%'];
    this.topToolsDoubled.topPart.borderBottom = '1px solid var(--cherry-background-handle)';

    ////////////////////////////////////////

    this.topTools = new TopTools(this.topToolsDoubled.topPart);
    this.topToolsAux = new TopTools(this.topToolsDoubled.bottomPart);

    this.powerIntervalTools = new PowerIntervalTools(this.topToolsAux);

    this.defaultTopTools = new DefaultTools(this.topTools);
    this.defaultPowerTopTools = new DefaultPowerTools(this.topToolsAux);

    this.imageTools = new ImageTools(this.topTools);
    this.imageTools.powerIntervalTools = this.powerIntervalTools;

    this.laserTools = new LaserTools(this.topTools);
    this.cameraTools = new CameraTools(this.topTools);
    this.textTools = new TextTools(this.topTools);
    this.rectangleTools = new RectangleTools(this.topTools, this.viewWork.canvas.paper);
    this.rectangleTools.powerIntervalTools = this.powerIntervalTools;

    this.viewWork.defaultTopTools = this.defaultTopTools;
    this.viewWork.defaultPowerTopTools = this.defaultPowerTopTools;
    this.viewWork.imageTools = this.imageTools;
    this.viewWork.laserTools = this.laserTools;
    this.viewWork.cameraTools = this.cameraTools;
    this.viewWork.rectangleTools = this.rectangleTools;
    this.viewWork.textTools = this.textTools;
    this.viewWork.canvas.editor.textTools = this.textTools;

    this.topTools.addTool(this.defaultTopTools);
    this.topTools.addTool(this.imageTools);
    this.topTools.addTool(this.rectangleTools);
    this.topTools.addTool(this.laserTools);
    this.topTools.addTool(this.cameraTools);
    this.topTools.addTool(this.textTools);

    this.topToolsAux.addTool(this.defaultPowerTopTools);
    this.topToolsAux.addTool(this.powerIntervalTools);

    ////////////////////////////////////////

    this.viewWork.topTools = this.topTools;
    this.viewWork.topToolsAux = this.topToolsAux;
    this.viewWork.topIcons = this.topIcons;
    this.viewLaser.topIcons = this.topIcons;

    ////////////////////////////////////////

    this.camera = new Camera(this.viewWork.canvasHost || this.viewWork.workView.centerPart.cont);
    this.camera.topTools = this.cameraTools;
    this.viewWork.camera = this.camera;

    ////////////////////////////////////////

    this.textTools.fonts = this.fonts;

    ////////////////////////////////////////

    this.viewLaser.selectLaserD = this.laserTools.selectLaserD;
  }

  private events() {
    if (this.viewWork?.designerIcons) {
      this.viewWork.designerIcons.onNew = () => {
        void this.handleNewProject();
      };
      this.viewWork.designerIcons.onOpen = () => {
        void this.handleOpenProject();
      };
      this.viewWork.designerIcons.onSave = () => {
        void this.handleSaveProject();
      };
      this.viewWork.designerIcons.onImport = () => {
        void this.handleImportAssets();
      };
    }

    this.appSwitch.onClick = (mod) => {
      this.mainViewManager.switchTo(mod);
      window[CURRENT_MOD] = mod;
      if (!this.viewWork.canvas) return;

      if (mod === 'ident0') {
        const parentView = this.viewWork.canvasHost || this.viewWork.workView.centerPart.cont;
        this.viewWork.canvas.setParentView(parentView);
        this.camera.setParentView(parentView);
        this.viewWork.tools.select(0, true);
        this.viewLaser.updateView();
        this.viewWork.setTool(ToolboxMode.Select);
        this.viewWork.updateLists();
      }

      this.viewLaser.active = mod === 'ident1';

      if (mod === 'ident1') {
        const PREVIEW = true;
        if (this.viewWork.canvas.isPreviewChanged) {
          this.viewLaser.clearGCode();
        }
        const parentView = this.viewLaser.workView.centerPart.cont;

        this.viewWork.canvas.setParentView(parentView, PREVIEW);
        this.camera.setParentView(parentView);

        this.viewLaser.updateGCode();
        this.topTools.showView(this.viewWork.laserTools);
        this.viewWork.updateTopTools();
        this.viewWork.updateLists();
      }

      if (mod === 'ident2') {
        this.topTools.showView(this.viewWork.defaultTopTools);
      }
    };

    this.viewWork.canvas.onBeforeDrop = () => {
      this.appSwitch.select(0);
    };

    ///////////////////
    this.handleViewLaserEvents();

    this.show();

    this.app.onHintChange = () => {
      this.app.hinter.hide(true);
    };

    window.addEventListener('beforeunload', this.onBeforeUnload);

    this.app.mainMenu.onClick = async (menuId) => {
      switch (menuId) {
        case 'MM_New':
          await this.handleNewProject();
          break;

        case 'MM_Save':
          await this.handleSaveProject();
          break;

        case 'MM_SaveAs':
          await this.handleSaveProjectAs();
          break;

        case 'MM_Open':
          await this.handleOpenProject();
          break;

        case 'MM_Import':
          await this.handleImportAssets();
          break;

        case 'MM_Quit':
          await this.handleQuit();
          break;

        case 'MM_Group':
          if (this.isDesigner) this.viewWork.canvas.toolbox.select.group();
          break;

        case 'MM_Ungroup':
          if (this.isDesigner) this.viewWork.canvas.toolbox.select.ungroup();
          break;

        case 'MM_Remove':
          if (this.isDesigner) {
            this.viewWork.canvas.toolbox.select.remove();
            this.viewWork.handleUnselectAll();
          }
          break;

        case 'MM_Duplicate':
          if (this.isDesigner) this.viewWork.canvas.toolbox.select.duplicate();
          break;

        case 'MM_Undo':
          if (this.isDesigner) this.viewWork.undo();
          break;

        case 'MM_Redo':
          if (this.isDesigner) this.viewWork.redo();
          break;

        case 'MM_SelAll':
          if (this.isDesigner) this.viewWork.handleSelectAll();
          break;

        case 'MM_SelNone':
          if (this.isDesigner) this.viewWork.handleUnselectAll();
          break;

        case 'MM_ZoomFit':
          if (this.isDesigner || this.isLaser) this.viewWork.canvas.zoomFit();
          break;

        case 'MM_ZoomSelection':
          if (this.isDesigner || this.isLaser) this.viewWork.canvas.zoomSelect();
          break;

        case 'MM_ZoomFrame':
          if (this.isDesigner || this.isLaser) this.viewWork.canvas.zoomFrame(this.viewWork.getFrame());
          break;

        default:
          if (menuId === 'MM_OpenRecent_None') break;
          if (menuId && menuId.indexOf('MM_OpenRecent_') === 0) {
            const target = decodeURIComponent(menuId.replace('MM_OpenRecent_', ''));
            await this.handleOpenRecent(target);
            break;
          }
          break;
      }

      console.log(menuId);
    };
  }
  /////////////////////////////////////////////////////////////////////////////////////////////////////

  private handleViewLaserEvents() {
    this.viewLaser.onGetWidth = (w) => {
      this.viewWork.laserTools.setWorkAreaWidth(w);
    };

    this.viewLaser.onGetHeight = (h) => {
      this.viewWork.laserTools.setWorkAreaHeight(h);
    };

    this.viewLaser.onGetFrame = () => {
      const obj = this.viewWork.getFrame();
      if (!obj.elements) return;

      this.viewLaser.showFrame(obj.frame);
    };

    this.viewLaser.onToolSelect = (tool) => {
      this.viewWork.updateTopTools();
    };

    ////////////

    this.viewWork.onHomingChange = () => {
      if (this.viewLaser.moveLaser.enabled) this.viewLaser.updateHoming();
    };

    this.viewWork.onGetWorkAreaSize = () => {
      this.viewLaser.getWorkAreaSize();
    };

    this.viewWork.onSetUnit = (unit) => {
      this.viewLaser.movePanel.updateUnits();
    };
  }

  private refreshMainMenu(recentPaths?: string[]) {
    const paths = recentPaths || (this.projectManager?.getRecentFiles?.() || []);
    const items = this.buildRecentMenuItems(paths);
    setupMenu(items);
  }

  private buildRecentMenuItems(paths: string[]) {
    if (!paths || !paths.length) return [];

    return paths.map((fullPath) => {
      const base = path.basename(fullPath);
      const dir = path.dirname(fullPath);
      const label = dir && dir !== '.' ? `${base} — ${dir}` : base;
      return {
        id: `MM_OpenRecent_${encodeURIComponent(fullPath)}`,
        label,
      };
    });
  }

  private updateWindowTitle(state?: { dirty: boolean; filePath: string }) {
    const dirty = state?.dirty ?? this.projectManager.hasUnsavedChanges;
    const filePath = state?.filePath ?? this.projectManager.currentFilePath;
    const name = filePath ? path.basename(filePath) : 'Untitled';
    this.setProjectName(dirty ? `${name}*` : name);
  }

  private async handleNewProject() {
    const proceed = await this.confirmDiscardChanges('creating a new project');
    if (!proceed) return;

    this.viewWork.handleUnselectAll();
    await this.projectManager.createNewProject();
    this.afterProjectLoaded('Initial state');
  }

  private async handleOpenProject() {
    const proceed = await this.confirmDiscardChanges('opening another project');
    if (!proceed) return;

    this.viewWork.handleUnselectAll();
    this.appSwitch.select(0);

    try {
      const result = await this.projectManager.openProject();
      if (result?.canceled) return;
      this.afterProjectLoaded('Loaded project');
    } catch (error) {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Open Project Failed',
        message: 'Unable to open the project file.',
        detail: error?.message || String(error),
      });
    }
  }

  private async handleImportAssets() {
    if (!this.viewWork?.canvas) return;

    this.appSwitch.select(0);

    const defaultPath = this.projectManager?.currentFilePath
      ? path.dirname(this.projectManager.currentFilePath)
      : app.getPath('documents');
    const importExtensions = [...VECTOR_IMPORT_EXTENSIONS, ...IMAGE_IMPORT_EXTENSIONS];

    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import File',
      defaultPath,
      filters: [
        { name: 'Supported Files', extensions: importExtensions },
        { name: 'Vector Files', extensions: VECTOR_IMPORT_EXTENSIONS },
        { name: 'Image Files', extensions: IMAGE_IMPORT_EXTENSIONS },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile', 'multiSelections'],
    });

    if (canceled || !filePaths || !filePaths.length) return;

    await this.viewWork.canvas.importFiles(filePaths);
  }

  private async handleOpenRecent(filePath: string) {
    if (!filePath) return;
    const proceed = await this.confirmDiscardChanges('opening a recent project');
    if (!proceed) return;

    this.viewWork.handleUnselectAll();
    this.appSwitch.select(0);

    try {
      const result = await this.projectManager.openProjectByPath(filePath);
      if (result?.canceled) return;
      this.afterProjectLoaded('Loaded project');
    } catch (error) {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Open Project Failed',
        message: 'Unable to open the project file.',
        detail: error?.message || String(error),
      });
      this.projectManager.removeFromRecent(filePath);
    }
  }

  private async handleSaveProject() {
    this.viewWork.handleUnselectAll();
    const result = await this.projectManager.saveProject();
    if (result?.canceled || !result?.filePath) return false;
    this.viewWork.canvas.isPreviewChanged = false;
    this.updateWindowTitle();
    return true;
  }

  private async handleSaveProjectAs() {
    this.viewWork.handleUnselectAll();
    const result = await this.projectManager.saveProjectAs();
    if (result?.canceled || !result?.filePath) return false;
    this.viewWork.canvas.isPreviewChanged = false;
    this.updateWindowTitle();
    return true;
  }

  private async handleQuit() {
    const proceed = await this.confirmDiscardChanges('quitting EmberCAD');
    if (!proceed) return;
    this.isQuitting = true;
    window.removeEventListener('beforeunload', this.onBeforeUnload);
    app.quit();
  }

  private afterProjectLoaded(historyLabel: string) {
    this.isQuitting = false;
    this.viewWork.updateLists();
    if (this.viewWork.history) {
      this.viewWork.history.clear();
      this.viewWork.history.commit(historyLabel);
      this.projectManager.history = this.viewWork.history;
      this.projectManager.markClean();
    }
    if (this.viewWork.canvas?.handleToolMouseDown) {
      this.viewWork.canvas.handleToolMouseDown({ event: { button: 3 } });
    }
    this.viewWork.canvas.zoomFit();
  }

  private async confirmDiscardChanges(action: string) {
    if (!this.projectManager.hasUnsavedChanges) return true;

    const { response } = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['Save', "Don't Save", 'Cancel'],
      defaultId: 0,
      cancelId: 2,
      message: `Do you want to save the changes before ${action}?`,
      title: 'Unsaved Changes',
    });

    if (response === 0) {
      return this.handleSaveProject();
    }

    if (response === 1) {
      return true;
    }

    return false;
  }

  private onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (this.isQuitting || !this.projectManager.hasUnsavedChanges) return;

    event.preventDefault();
    event.returnValue = '';

    void this.handleWindowCloseRequest();
  };

  private async handleWindowCloseRequest() {
    const proceed = await this.confirmDiscardChanges('closing EmberCAD');
    if (!proceed) return;

    this.isQuitting = true;
    window.removeEventListener('beforeunload', this.onBeforeUnload);
    const win = getCurrentWindow();
    if (!win.isDestroyed()) win.close();
  }

  setProjectName(txt: string) {
    this.app.titleBar.caption = txt;
  }

  ////////////////////////////////////////

  hide() {
    this.appDiv.style.display = 'none';
  }

  show() {
    this.appDiv.style.display = null;
    this.app.titleBar.show();
    this.refreshMainMenu();
  }

  setupView() {
    return new Promise<void>((resolve, reject) => {
      const browserWindow = getCurrentWindow();

      browserWindow.setResizable(true);
      const scr = screen.getPrimaryDisplay().workArea;
      browserWindow.setPosition(scr.x, scr.y);
      browserWindow.setSize(scr.width, scr.height);
      browserWindow.maximize();
      browserWindow.setMinimumSize(1280, 720);

      setTimeout(() => {
        resolve();
      }, 100);
    });
  }

  showRemote() {
    if (!this.serverRemote) this.serverRemote = new ServerRemote();
  }

  get isDesigner(): boolean {
    return this.appSwitch.currentSelection === 'ident0';
  }

  get isLaser(): boolean {
    return this.appSwitch.currentSelection === 'ident1';
  }
}
