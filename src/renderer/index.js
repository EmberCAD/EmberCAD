'use strict';

import { app, screen, getCurrentWindow } from '@electron/remote';
import { uri } from './App/splash';
import App from './App/App';
import fs from 'fs';
import path from 'path';
import { isMac } from './lib/components/Application/Application';
import { getFonts } from './modules/Editor/Fonts';

const browserWindow = getCurrentWindow();
const appDiv = document.querySelector('#app');
const body = document.querySelector('body');

/////////////////////////////////////////////

const pdf = document.createElement('script');
pdf.innerHTML = fs.readFileSync(path.join(__static, 'pdf', 'pdf.js'));
body.appendChild(pdf); /////////////////////////////////////////////

const dxf = document.createElement('script');
dxf.innerHTML = fs.readFileSync(path.join(__static, 'dxf', 'dxf-parser-mtext.js'));
body.appendChild(dxf);

/////////////////////////////////////////////

let mainApplication;

(async () => {
  await splashScreen();
  const fonts = await getFonts();
  await initMainApp(fonts);
})();

function splashScreen() {
  browserWindow.closeDevTools();

  return new Promise((resolve, reject) => {
    browserWindow.show();
    browserWindow.restore();
    browserWindow.setMinimumSize(980, 410);
    browserWindow.setSize(980, 410);
    browserWindow.setResizable(false);
    browserWindow.center();
    if (isMac) browserWindow.setWindowButtonVisibility(false);
    body.style.overflow = 'hidden';
    body.style.margin = '0';
    appDiv.innerHTML = `<img alt="" style="pointer-events:none;user-select:none;" src="${uri}">`;

    setTimeout(() => {
      resolve();
    }, 2000);
  });
}

function initMainApp(fonts) {
  appDiv.innerHTML = '';

  let currentVersion = '';

  if (process.env.NODE_ENV === 'development') {
    currentVersion = require('../../package.json').version;
    browserWindow.openDevTools();
  } else {
    currentVersion = app.getVersion();
  }

  mainApplication = new App(appDiv);
  mainApplication.fonts = fonts;
  mainApplication.version = currentVersion;
  window['mainApp'] = mainApplication;
  setTimeout(() => {
    if (isMac) browserWindow.setWindowButtonVisibility(true);
  }, 100);
}
