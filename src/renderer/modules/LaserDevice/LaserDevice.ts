import { HOME_ON_STARTUP } from '../../App/views/TopTools/LaserTools';
import ThemeManager from '../../lib/components/Application/ThemeManager';
import GStreamer, { StreamState } from '../GStreamer/GStreamer';

export default class LaserDevice {
  gstreamer: any;
  isReady = false;
  reqAnim: any;
  statCounter = 0;

  onOpen?: () => void;
  onState?: (state: any) => void;
  onStep?: (stepNumber: number) => void;
  onError?: (error: any) => void;
  onFinished?: () => void;
  onGetWidth?: (width: number) => void;
  onGetHeight?: (height: number) => void;

  constructor() {
    this.init();
    this.events();
  }

  init() {
    this.gstreamer = new GStreamer();
  }

  events() {
    this.gstreamer.onState = (res) => {
      this.updateStatus(res);
    };

    this.gstreamer.onStep = (stepNumber) => {
      if (typeof this.onStep === 'function') this.onStep(stepNumber);
    };

    this.gstreamer.onOpened = () => {
      console.log('open');
      this.gstreamer.write('G21');
      this.gstreamer.write('$10=0');
      this.gstreamer.write('$13=0');
      this.gstreamer.write('$32=1');
      this.gstreamer.write('G10 L2 P0 X0 Y0');
      this.gstreamer.write('G10 L2 P1 X0 Y0');
      this.gstreamer.write('?');
      this.gstreamer.ready();
      this.startQuery();
      if (typeof this.onOpen === 'function') this.onOpen();
    };

    this.gstreamer.onError = (str) => {
      this.updateStatus();
      this.stopQuery();
      if (typeof this.onError === 'function') this.onError(str);
    };

    this.gstreamer.onAlarm = () => {
      this.updateStatus();
      this.stopQuery();
    };

    this.gstreamer.onStartStream = () => {
      this.stopQuery();
      this.updateStatus();
    };

    this.gstreamer.onFinished = () => {
      this.stopQuery();
      this.gstreamer.stop();
      this.updateStatus();
      this.startQuery();
      if (typeof this.onFinished === 'function') this.onFinished();
    };

    this.gstreamer.onClose = () => {
      this.updateStatus();
      this.stopQuery();
    };

    this.gstreamer.onGetWidth = (w) => {
      if (typeof this.onGetWidth === 'function') this.onGetWidth(w);
    };

    this.gstreamer.onGetHeight = (h) => {
      if (typeof this.onGetHeight === 'function') this.onGetHeight(h);
    };
  }

  updateStatus(res?) {
    if (this.gstreamer) {
      const state = res || { state: this.gstreamer.status };

      if (typeof this.onState === 'function') this.onState(state);
      // console.log('Laser status', state);
    }
  }

  set serial(port: any) {
    console.log(port);
  }

  startQuery() {
    this.isReady = true;
    this.query();
  }

  stopQuery() {
    this.isReady = false;
    cancelAnimationFrame(this.reqAnim);
  }

  query() {
    if (!this.isReady) {
      cancelAnimationFrame(this.reqAnim);
      return;
    }
    this.reqAnim = requestAnimationFrame(this.query.bind(this));
    this.statCounter++;
    if (this.statCounter % 10 !== 0) return;
    this.gstreamer.getPosition();
  }

  sendGCode(lines) {
    this.stopQuery();
    setTimeout(() => {
      this.gstreamer.stop();
      this.gstreamer.writeLines(lines);
      this.gstreamer.run();
    }, 500);
  }

  async getValue(txt) {}

  home() {
    this.stopQuery();
    setTimeout(async () => {
      await this.flush();
      const lines = ['$H'];
      this.gstreamer.writeLines(lines.join('\n'));
      this.gstreamer.run();
    }, 100);
  }

  stop() {
    this.stopQuery();
    setTimeout(() => {
      this.gstreamer.stop();
      const lines = ['M5', 'M9'];
      this.gstreamer.writeLines(lines.join('\n'));
      this.gstreamer.run();
      this.startQuery();
    }, 100);
  }

  pause() {
    this.stopQuery();
    setTimeout(() => {
      this.gstreamer.pause();
    }, 100);
  }

  async resume() {
    await this.flush();

    this.gstreamer.resume();
    setTimeout(() => {
      this.startQuery();
    }, 100);
  }

  async flush() {
    await this.gstreamer.outDevice.flush();
  }

  ready() {
    if (this.autoHome) {
      setTimeout(() => {
        this.home();
      }, 500);
    }
  }

  get autoHome() {
    return JSON.parse(localStorage.getItem(HOME_ON_STARTUP));
  }

  get status() {
    if (this.gstreamer) return this.gstreamer.status;
    else return StreamState.Disconected;
  }
}
