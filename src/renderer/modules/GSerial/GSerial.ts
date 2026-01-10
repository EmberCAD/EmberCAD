// @ts-ignore
// @ts-nocheck
const { SerialPort, ReadlineParser } = require('serialport');

export default class GSerial {
  private serialDevice: any;
  private parser: any;
  private _connected = false;

  constructor() {}

  async list() {
    const list = await SerialPort.list();
    return list.filter((ser) => ser.vendorId !== undefined);
  }

  connect(path) {
    this.serialDevice = new SerialPort({
      path,
      baudRate: 115200,
      autoOpen: false,
    });

    this.serialDevice.open((err) => {
      if (err) {
        console.log(err);
      }
    });

    this.serialDevice.on('open', () => {
      console.log(this.serialDevice, 'opened');
      this._connected = true;
      if (typeof this.onOpen === 'function') this.onOpen();
    });

    window.onbeforeunload = () => {
      this.close();
    };

    this.parser = this.serialDevice.pipe(new ReadlineParser());

    this.parser.on('data', (data) => {
      if (typeof this.onFeedback === 'function') this.onFeedback(data);
    });

    this.parser.on('error', (data) => {
      if (typeof this.onParserError === 'function') this.onParserError(data);

      console.log('serial parser error', data);
    });

    this.serialDevice.on('error', (data) => {
      console.log('serial error', data);
      if (typeof this.onError === 'function') this.onError(data);
    });

    this.serialDevice.on('close', (data) => {
      this._connected = false;

      if (typeof this.onClose === 'function') this.onClose(data);
      console.log('serial close', data);
    });

    this.serialDevice.on('drain', (data) => {
      if (typeof this.onDrain === 'function') this.onDrain(data);
      console.log('serial drain', data);
    });
  }

  close() {
    if (this.serialDevice) this.serialDevice.close();
  }

  write(txt: string) {
    txt += '\r\n';
    if (this.serialDevice) this.serialDevice.write(txt);
    this.serialDevice.drain((err) => {
      if (err) {
        console.error({ err });
        if (typeof this.onError === 'function') this.onError(err);
      }
    });
  }

  flush() {
    return new Promise<void>((resolve, reject) => {
      this.serialDevice.flush((err) => {
        if (err) {
          console.log(err);
          reject(err);
        }
      });

      resolve();
    });
  }

  get connected() {
    return this._connected;
  }
}
