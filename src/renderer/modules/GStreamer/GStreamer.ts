// @ts-ignore
// @ts-nocheck

export enum StreamState {
  Alarm = -2,
  Error = -1,
  Disconected,
  Homing,
  Idle,
  Running,
  Paused,
  Jog,
}

export default class GStreamer {
  outDevice: any;
  lines: string[];
  currentLine: number;
  allowNext = false;
  nextResolve: any;
  state = StreamState.Disconected;
  prevState = '';

  constructor() {
    this.events();
  }

  private events() {}

  set output(device: any) {
    this.outDevice = device;
    let machineState = {};

    this.outDevice.onOpen = () => {
      this.state = StreamState.Idle;
      if (typeof this.onOpened === 'function') this.onOpened();
    };

    this.outDevice.onError = () => {
      // this.state = StreamState.Error;
      if (typeof this.onError === 'function') this.onError();
    };

    this.outDevice.onClose = () => {
      this.state = StreamState.Disconected;
      if (typeof this.onClose === 'function') this.onClose();
    };

    this.outDevice.onDrain = () => {
      this.state = StreamState.Disconected;
      if (typeof this.onDrain === 'function') this.onDrain();
    };

    this.outDevice.onFeedback = (res) => {
      const str = res.toString();
      // console.log(str);

      if (str.indexOf('Idle') === -1 && str.indexOf('ok') === -1) {
        if (str.indexOf('$130') > -1) {
          const width = Number(str.split('=')[1]);
          if (typeof this.onGetWidth === 'function') this.onGetWidth(width);
          return;
        }

        if (str.indexOf('$131') > -1) {
          const height = Number(str.split('=')[1]);
          if (typeof this.onGetHeight === 'function') this.onGetHeight(height);
          return;
        }

        if (str.indexOf('error') > -1) {
          this.state = StreamState.Error;
          if (typeof this.onError === 'function') this.onError(str);
          return;
        }
      }

      if (str.indexOf('<') > -1) {
        const data = str.replace(/[<>\r]/g, '').split('|');
        const status = data[0];
        const position = data[1].substr(5).split(',');
        const fs = data[2].substr(3).split(',');
        machineState = {
          status,
          position: {
            x: position[0],
            y: position[1],
            z: position[2],
          },
          speed: fs[0],
          power: fs[1],
        };

        if (status === 'Alarm') {
          this.state = StreamState.Alarm;
          if (typeof this.onAlarm === 'function') this.onAlarm(machineState);
        }

        if (status === 'Idle') {
          this.state = StreamState.Idle;
          if (typeof this.onIdle === 'function') this.onIdle(machineState);
        }

        if (status === 'Homing') {
          this.state = StreamState.Homing;
          if (typeof this.onHoming === 'function') this.onHoming(machineState);
        }

        if (status === 'Jog') {
          this.state = StreamState.Jog;
        }

        if (status === 'Run') {
          this.state = StreamState.Running;
        }
        machineState.state = this.state;
        if (typeof this.onState === 'function') this.onState(machineState);
      }

      if (this.state === StreamState.Running) {
        if (typeof this.onProgress === 'function')
          this.onProgress(Math.floor((this.currentLine / this.lines.length) * 100));
        if (this.nextResolve) this.nextResolve();
      }
    };
  }

  writeLines(lines: string) {
    this.lines = lines.split('\n');
    this.currentLine = 0;
    console.log(this.lines.length);
  }

  getPosition() {
    this.outDevice.write('?');
  }

  run() {
    if (this.state === StreamState.Running) return;
    if (typeof this.onStartStream === 'function') this.onStartStream();

    return new Promise(async (resolve, reject) => {
      let step = 0;
      this.state = StreamState.Running;
      while (this.currentLine < this.lines.length) {
        if (this.state === StreamState.Running) {
          await this.write(this.lines[this.currentLine]);
        }

        if (this.state === StreamState.Homing) break;

        step++;
      }
      if (this.state !== StreamState.Paused) {
        this.state = StreamState.Idle;
        resolve();
        console.log('finished!!!');
        if (typeof this.onFinished === 'function') this.onFinished();
      }
    });
  }

  pause() {
    if (this.state !== StreamState.Running) return;
    this.tempState = this.state = StreamState.Paused;
  }

  resume() {
    if (this.state !== StreamState.Paused) return;
    if (this.nextResolve) this.nextResolve();
    this.state = StreamState.Running;
  }

  stop() {
    if (this.state !== StreamState.Running) return;

    this.state = StreamState.Idle;

    this.currentLine = this.lines.length;
  }

  write(line) {
    return new Promise((resolve, reject) => {
      this.currentLine++;
      this.outDevice.write(line);
      this.nextResolve = resolve;
    });
  }

  ready() {
    this.state = StreamState.Idle;
  }

  get status() {
    return this.state;
  }
}
