// @ts-ignore
// @ts-nocheck
import { screen, getCurrentWindow } from '@electron/remote';
import GStreamer from '../GStreamer/GStreamer';
import fs from 'fs';
import path from 'path';
import Label from '../renderer/lib/components/Label/Label';
import Application from '../renderer/lib/components/Application/Application';
import { crDiv } from '../renderer/helpers/dom';
import ThemeManager from '../renderer/lib/components/Application/ThemeManager';
import GSerial from '../GSerial/GSerial';
import Input from '../renderer/lib/components/Input/Input';
import Button from '../renderer/lib/components/Button/Button';

const DEFAULT_THEME = 'lightMUI';

export default class App {
  gstreamer: GStreamer;
  laser: GMock;
  label: Label;
  appDiv: any;
  app: any;
  themeManager: any;

  constructor(private parent: any) {
    this.init();
    this.events();
  }

  init() {
    this.appDiv = crDiv(this.parent, { class: 'fill-frame' });
    this.themeManager = new ThemeManager();
    this.themeManager.setTheme(DEFAULT_THEME);

    this.app = new Application(' ', true, this.appDiv);
    window['App'] = this.app;
    window['CHERRIES'].autotranslate = true;
    this.label = new Label();
    this.label.left = this.label.top = 100;

    this.show();
    this.gstreamer = new GStreamer();
    this.laser = new GSerial();

    this.gstreamer.output = this.laser;

    this.run();

    const input = new Input();
    const button = new Button();
    button.text = 'Send';
    button.onClick = () => {
      this.gstreamer.writeLines(input.text + '\r\n');
      this.gstreamer.run();
    };
  }

  events() {
    this.gstreamer.onProgress = (res) => {
      this.label.text = 'Laser progress: ' + res;
    };
  }

  async run() {
    const list = await this.laser.list();
    this.laser.connect(list[0].path);
    const lines = fs.readFileSync(path.join(__dirname, '../../', 'circ.gcode'), 'utf-8');
    this.gstreamer.writeLines(lines);

    this.gstreamer.run();
  }

  show() {
    const browserWindow = getCurrentWindow();

    browserWindow.setResizable(true);
    const scr = screen.getPrimaryDisplay().workArea;
    browserWindow.setPosition(scr.x, scr.y);
    browserWindow.setSize(scr.width, scr.height);
    browserWindow.maximize();
  }
}
