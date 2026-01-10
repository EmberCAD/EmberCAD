//@ts-ignore
//@ts-nocheck
import Label from '../../../lib/components/Label/Label';
import { StreamState } from '../../../modules/GStreamer/GStreamer';
import { readUni, writeUni } from '../../../modules/helpers';

const STATUS = ['Alarm', 'Error', 'Disconected', 'Homing', 'Idle', 'Running', 'Paused', 'Jog'];

export default class SatatusDisplay {
  label: Label;
  private _port: any;
  private _position: void;
  positionL: any;
  private _prevState: StreamState;
  _errorMessage: any;
  private _state: StreamState;

  constructor() {
    this.init();
    this.events();
  }
  init() {
    this.parent = document.querySelector('[laser-status]');
    this.parent.style.alignItems = 'center';
    this.parent.style.justifyContent = 'end';
    this.parent.style.flex = 'auto';

    this.positionL = new Label(this.parent);
    this.positionL.text = '';
    this.positionL.height = 'auto';
    this.positionL.flex = 'auto';
    this.positionL.position = 'relative';
    this.positionL.marginRight = '1rem';
    this.positionL.justifyContent = 'end';
    this.positionL.opacity = 0.6;

    ////

    this.label = new Label(this.parent);
    this.label.textAlign = 'right';
    this.label.height = 'auto';
    this.label.width = '3rem';
    this.label.flex = 'auto';
    this.label.position = 'relative';
    this.label.marginRight = '1rem';
    this.label.justifyContent = 'end';

    this.status = StreamState.Disconected;
  }
  events() {}

  set status(state: StreamState) {
    this._state = state;
    const index = state + 2;

    if (this._prevState === state && state !== StreamState.Error && state !== StreamState.Running) return;
    this._prevState = state;

    this.label.opacity = 1;
    switch (state) {
      case StreamState.Disconected:
        this.label.opacity = 0.5;
        this.label.color = 'white';
        this.label.hint = 'No laser connected';
        break;

      case StreamState.Alarm:
        this.label.color = 'orange';
        this.label.hint = 'Alarm - Home device';

        break;

      case StreamState.Error:
        this.label.color = 'red';
        this.label.hint = 'Error - toggle laser off/on';

        break;

      default:
        this.label.color = 'green';
        this.label.hint = 'Laser connected';

        break;
    }

    let msg = this.errorMessage || STATUS[index];

    this.label.text = this.port ? this.port + ' - ' + msg : msg;
    setTimeout(() => {
      this._errorMessage = '';
    }, 100);
  }

  get status() {
    return this._state;
  }

  set position(obj) {
    if (!obj) obj = { x: '---', y: '---' };
    else {
      obj.x = readUni(obj.x);
      obj.y = readUni(obj.y);
    }
    this.positionL.text = `X: ${obj.x}, Y: ${obj.y}`;
    this._position = obj;
  }

  get position() {
    return this._position;
  }

  set port(txt) {
    this._port = txt;
  }

  get port() {
    return this._port || '';
  }

  set errorMessage(txt) {
    this._errorMessage = txt;
    this.status = StreamState.Error;
    this._prevState = -1;
  }

  get errorMessage() {
    return this._errorMessage;
  }
}
