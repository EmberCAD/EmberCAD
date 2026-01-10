'use strict';

require('@electron/remote/main').initialize();
import { app, BrowserWindow, Menu, screen } from 'electron';
import * as path from 'path';
import { format as formatUrl } from 'url';
delete process.env.ELECTRON_ENABLE_SECURITY_WARNINGS;
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

const isDevelopment = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow;

function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const window = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
      contextIsolation: false,
      enableRemoteModule: true,
      spellcheck: false,
      webSecurity: false,
      sandbox: false,
      devTools: isDevelopment,
    },
    title: 'EmberCAD',
    darkTheme: true,
    width: 980,
    height: 410,
    center: true,
    zoomFactor: 1,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 9, y: 9 },
    backgroundColor: '#000',
    show: false,
    disableAutoHideCursor: true,
    icons: null,
    resizible: false,
    frame: false,
  });

  if (isMac) window.setWindowButtonVisibility(false);

  if (isDevelopment) {
    // window.webContents.openDevTools();

    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
  } else {
    window.loadURL(
      formatUrl({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true,
      }),
    );
  }

  window.on('closed', () => {
    mainWindow = null;
  });

  // window.webContents.on('devtools-opened', () => {
  //   window.focus();
  //   setImmediate(() => {
  //     window.focus();
  //   });
  // });

  require('@electron/remote/main').enable(window.webContents);

  return window;
}

Menu.setApplicationMenu(null);

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  app.quit();
});

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow();
});

//ATBBgCVKMXR2X9JYHFZkGuCX57EY03AA4A33
