//@ts-ignore
//@ts-nocheck

import fs from 'fs';
import path from 'path';

const CURENT_THEME = 'CURENT_THEME';
const appPath = process.env.NODE_ENV === 'production' ? `${process.resourcesPath}` : __dirname;

export default class CanvasTheme {
  themes: any[];
  constructor() {
    this.themes = [];

    const files = fs.readdirSync(path.join(appPath, 'themes'));
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const theme = JSON.parse(fs.readFileSync(path.join(appPath, 'themes', file), 'utf-8'));
      if (theme) this.themes[theme.key] = theme;
    }
  }

  set theme(key: string) {
    localStorage.setItem(CURENT_THEME, key);
  }

  get theme() {
    const key = localStorage.getItem(CURENT_THEME) || this.themes[Object.keys(this.themes)[0]].key;
    return this.themes[key];
  }
}
