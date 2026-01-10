//@ts-ignore
//@ts-nocheck

import LabelPanel from '../../../components/LabelPanel/LabelPanel';
import { CENTER_GRID, CURRENT_UNIT, MIRROR_SCALARS, Unit } from '../../../components/LaserCanvas/LaserCanvas';
import { SELECT } from '../../../components/LaserCanvas/Tools/Select';
import { ToolboxMode, availableTools } from '../../../components/LaserCanvas/Tools/Toolbox';
import { OR_VERTICAL } from '../../../lib/api/declare_common';
import Button from '../../../lib/components/Button/Button';
import Container2 from '../../../lib/components/Container2/Container2';
import OptionApp from '../../../lib/components/OptionApp/OptionApp';
import Panel from '../../../lib/components/Panel/Panel';
import GCode from '../../../modules/GCode/GCode';
import GSerial from '../../../modules/GSerial/GSerial';
import { StreamState } from '../../../modules/GStreamer/GStreamer';
import LaserDevice from '../../../modules/LaserDevice/LaserDevice';
import MovePanel from './MovePanel';
import { SELECT_DEVICE } from '../TopTools/LaserTools';
import View from '../View';
import Preview, { SHOW_RAPID } from './Preview';
import SatatusDisplay from './StatusDisplay';
import fs from 'fs';

const PREPARE_JOB = 'Prepare Job';
const TRACING = 'Tracing...';
const SAVE_TO_DISK = 'Export G-Code';

const STEPS_METRIC = [1, 10, 100];
const STEPS_IMPERIAL = [0.25, 1, 4];

enum ButtonEnabler {
  DisableAll,
  Ready,
  Start,
  Stop,
  Homing,
}

export default class Laser extends View {
  gcode: any;
  tools: any;
  currentTool: string;

  serialPort: GSerial;
  laserDevice: LaserDevice;

  traceSaveButton: any;
  canvas: any;
  laserCanvas: any;

  transport: any;
  paper: any;
  simPath: any;
  ctx: any;
  active: any;
  renderDebouncer: any;
  tracePreview: Button;
  private _topIcons: any;
  tracerLP: LabelPanel;
  rightSide: Container2;
  rightSideTop: Container2;
  consoleLP: LabelPanel;
  movePanel: MovePanel;
  laserLP: LabelPanel;
  startB: Button;
  pauseStopP: Panel;
  pauseB: Button;
  stopB: Button;
  frameB: Button;
  laserSelectorP: Panel;
  private _pauseState: any;
  statusDisplay: SatatusDisplay;
  startPressed: boolean;
  homingPressed: boolean;
  connectionTimer: any;
  private _selectLaserD: any;

  constructor(private par: any, canvas) {
    super(par, 'Laser');
    this._init(canvas);
    this._events();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  _init(canvas) {
    this.laserCanvas = canvas;
    this.ctx;
    this.paper = this.laserCanvas.paper;
    this.laserCanvas.drawGCode = this.drawGCode.bind(this);

    this.tools = new OptionApp(this.mainView.leftPart, OR_VERTICAL);

    const icons = [];

    icons[ToolboxMode.Device] = '<i class="fa-solid fa-gear"></i>';

    icons[ToolboxMode.Location] = '<i class="fa-solid fa-location-dot"></i>';
    icons[ToolboxMode.Camera] = '<i class="fa-solid fa-video"></i>';

    const tools = [];
    Object.keys(icons).forEach((tool) => {
      tools.push({ t: tool, icon: icons[tool] });
    });

    this.tools.menuItems = tools.map((tool) => ({
      label: `<span style="font-size:1.2rem;pointer-events:none;">${tool.icon}</span>`,
      ident: tool.t,
      hint: availableTools[tool.t], //autotranslate in hinter
    }));

    //////////////////////////////////////////////////////////

    this.rightSide = new Container2(this.workView.rightPart);
    this.rightSide.parts = ['%', 70];

    this.tracerLP = new LabelPanel(this.rightSide.bottomPart, true);
    this.tracerLP.text = 'G-Code';
    this.tracerLP.body.justifyContent = 'center';
    this.tracerLP.body.alignItems = 'center';
    this.tracerLP.body.backgroundColor = '#111';
    /////////////

    this.rightSideTop = new Container2(this.rightSide.topPart);
    this.rightSideTop.parts = ['%', 540];
    this.rightSideTop.topPart.paddingTop = '1rem';

    /////////////

    this.consoleLP = new LabelPanel(this.rightSideTop.topPart);
    this.consoleLP.text = 'Location';

    /////////////

    this.laserLP = new LabelPanel(this.rightSideTop.bottomPart);
    this.laserLP.text = 'Control Panel';
    this.laserLP.body.flexDirection = 'column';
    this.laserLP.body.alignItems = 'center';

    /////////////

    ///

    this.movePanel = new MovePanel(this.laserLP.body);
    this.movePanel.cont.marginTop = '0.5rem';

    ///

    this.initLaserButtons();

    /////////////////////////////////////////////

    this.initLaser();

    this.tools.select(0);

    /////////////////////////////////////////////

    this.statusDisplay = new SatatusDisplay();

    /////////////////////////////////////////////

    this.transport = new Preview(this.workView.centerPart.cont);
    this.workView.centerPart.justifyContent = 'center';

    this.transport.hide();
    this.buttonsEnabler(ButtonEnabler.DisableAll);

    this.tracePreview = new Button(this.tracerLP.body);
    this.tracePreview.text = PREPARE_JOB;
    this.tracePreview.width = '90%';
    this.tracePreview.height = '70%';
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private initLaserButtons() {
    this.startB = new Button(this.laserLP.body);
    this.startB.text = 'Start';
    this.startB.width = '90%';
    this.startB.height = '3rem';

    ///
    this.pauseStopP = new Panel(this.laserLP.body);
    this.pauseStopP.width = '90%';
    this.pauseStopP.height = '3rem';
    this.pauseStopP.justifyContent = 'center';
    this.pauseStopP.marginTop = '0.5rem';

    ///
    this.pauseB = new Button(this.pauseStopP);
    this.pauseB.text = 'Pause';
    this.pauseB.width = '49%';
    this.pauseB.height = '3rem';
    this.pauseB.marginRight = '2%';

    ///
    this.stopB = new Button(this.pauseStopP);
    this.stopB.text = 'Stop';
    this.stopB.width = '49%';
    this.stopB.height = '3rem';

    ///
    this.frameB = new Button(this.laserLP.body);
    this.frameB.text = 'Frame';
    this.frameB.width = '90%';
    this.frameB.height = '5rem';
    this.frameB.marginTop = '1rem';
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private async initLaser() {
    this.laserDevice = new LaserDevice();
    this.serialPort = new GSerial();
    this.gcode = new GCode(this.laserCanvas.paper);
    this.movePanel.homing = this.laserDevice.autoHome;

    const output2Array = function (target) {
      return {
        write: function (cmd) {
          target.push(cmd);
        },
      };
    };
    this.checkPorts();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private checkPorts() {
    clearInterval(this.connectionTimer);

    this.connectionTimer = setInterval(async () => {
      const ports = await this.serialPort.list();
      window['laser'] = this.serialPort;

      if (ports.length && !this.serialPort.connected) {
        this.selectLaserD.items = ports.map((port) => port.friendlyName || port.path);
        await this.serialPort.close();
        this.laserDevice.gstreamer.output = this.serialPort;
        await this.serialPort.connect(ports[0].path);
        this.selectLaserD.text = ports[0].friendlyName || ports[0].path;
      }

      if (this.serialPort.connected) {
        clearInterval(this.connectionTimer);
        if (this.tracePreview.text === SAVE_TO_DISK) this.buttonsEnabler(ButtonEnabler.Stop);
      } else {
        if (this.selectLaserD.items && !this.selectLaserD.items.length) {
          this.selectLaserD.items = [SELECT_DEVICE];
          this.selectLaserD.text = SELECT_DEVICE;
        }
      }
    }, 1000);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  _events() {
    if (!this.laserDevice) return;
    this.laserDevice.onOpen = () => {
      this.updateHoming();
      this.statusDisplay.port = this.serialPort.serialDevice.settings.path;
      this.laserDevice.ready();
      this.homingPressed = true;
      this.statusDisplay.status = StreamState.Homing;
      this.buttonsEnabler(ButtonEnabler.Ready);
    };

    this.laserCanvas.onSetLocation = (pos) => {
      if (this.currentTool != ToolboxMode.Location) return;

      this.serialPort.write(String.fromCharCode(0x85));
      this.serialPort.write(`G90`);
      this.serialPort.write(`$J= X${pos.x}Y${pos.y} F16000`);
      // this.serialPorts.write(`G0 X${pos.x}Y${pos.y} F10000`);
    };

    this.tools.onClick = (tool) => {
      this.laserCanvas.toolbox.tool = tool;
      this.currentTool = tool;
      if (typeof this.onToolSelect === 'function') this.onToolSelect(tool);
    };

    this.laserDevice.onState = (msg) => {
      if (this.startPressed || this.homingPressed) return;
      this.laserCanvas.laserCursor.position = msg.position;
      this.statusDisplay.position = msg.position;
      this.statusDisplay.status = msg.state;
      if (msg.state === StreamState.Disconected) {
        this.buttonsEnabler(ButtonEnabler.DisableAll);
        this.checkPorts();
      }
    };

    this.laserDevice.onError = (str) => {
      this.statusDisplay.errorMessage = str;
      this.statusDisplay.status = StreamState.Error;
    };

    this.laserDevice.onStep = ({ line, gcode, progress }) => {
      this.transport.position = progress;
    };

    this.laserDevice.onFinished = () => {
      if (this.startPressed) {
        this.startPressed = false;
        this.buttonsEnabler(ButtonEnabler.Stop);
      }

      if (this.homingPressed) {
        this.homingPressed = false;
      }
      this.statusDisplay.status = StreamState.Idle;
    };

    this.laserCanvas.onResize = () => {
      this.transport.update();
    };

    ///////////////////

    this.laserDevice.onGetWidth = (w) => {
      if (typeof this.onGetWidth === 'function') this.onGetWidth(w);
    };

    this.laserDevice.onGetHeight = (h) => {
      if (typeof this.onGetHeight === 'function') this.onGetHeight(h);
    };

    ///////////////////

    this.startB.onClick = () => {
      let gcode = this.gcode.getGCode();
      if (!gcode) return;

      this.startPressed = true;
      this.buttonsEnabler(ButtonEnabler.Start);
      this.resetPause();

      gcode = gcode.join('\n');
      this.serialPort.write(String.fromCharCode(0x85));
      this.laserDevice.sendGCode(gcode);
      this.statusDisplay.status = StreamState.Running;
    };

    this.stopB.onClick = async () => {
      this.handleLaserStop();
    };

    this.pauseB.onClick = async () => {
      this.pauseState = !this.pauseState;
      if (this.statusDisplay.status !== StreamState.Running && this.statusDisplay.status !== StreamState.Paused) return;

      if (this.pauseState) {
        this.laserDevice.pause();
        this.statusDisplay.status = StreamState.Paused;
      } else {
        this.laserDevice.resume();
        this.statusDisplay.status = StreamState.Running;
      }

      this.serialPort.write(this.pauseState ? '!' : '~');
    };

    this.frameB.onClick = () => {
      if (typeof this.onGetFrame === 'function') this.onGetFrame();
    };

    /////

    this.transport.onChange = () => {
      this.drawGCode(false);
    };

    //////

    this.movePanel.onHome = () => {
      this.laserCanvas.laserCursor.position = [0, 0];
      this.laserDevice.home();
      this.homingPressed = true;
      this.statusDisplay.status = StreamState.Homing;
    };

    this.movePanel.onUp = (stepSize) => {
      this.moveLaser('up', stepSize);
    };

    this.movePanel.onDown = (stepSize) => {
      this.moveLaser('down', stepSize);
    };

    this.movePanel.onLeft = (stepSize) => {
      this.moveLaser('left', stepSize);
    };

    this.movePanel.onRight = (stepSize) => {
      this.moveLaser('right', stepSize);
    };

    //////

    this.tracePreview.onClick = async () => {
      if (this.tracePreview.text === SAVE_TO_DISK) {
        this.saveGcode();
      } else await this.preparePreview();
    };
  }

  //////////////////////////////////////////////////////////////////////////////

  showFrame(frame) {
    let gcode = [];

    gcode.push(`G90`);
    gcode.push(`G0 X${frame.l}Y${frame.t}`);
    gcode.push(`G0 X${frame.r}Y${frame.t}`);
    gcode.push(`G0 X${frame.r}Y${frame.b}`);
    gcode.push(`G0 X${frame.l}Y${frame.b}`);
    gcode.push(`G0 X${frame.l}Y${frame.t}`);

    gcode = gcode.join('\n');

    this.serialPort.write(String.fromCharCode(0x85));
    this.laserDevice.sendGCode(gcode);
  }

  //////////////////////////////////////////////////////////////////////////////

  updateHoming() {
    this.movePanel.homing = this.laserDevice.autoHome;

    if (this.laserDevice.autoHome) {
      this.serialPort.write(`$21=1`);
      this.serialPort.write(`$22=1`);
    } else {
      this.serialPort.write(`$21=0`);
      this.serialPort.write(`$22=0`);
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  private async handleLaserStop() {
    this.startPressed = false;
    this.buttonsEnabler(ButtonEnabler.Stop);
    this.serialPort.write(String.fromCharCode(0x18));
    this.laserDevice.stop();
    await this.serialPort.flush();
    this.resetPause();

    setTimeout(() => {
      if (this.laserDevice.autoHome) {
        this.laserDevice.home();
        this.homingPressed = true;
        this.statusDisplay.status = StreamState.Homing;
      }
    }, 1000);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  resetPause() {
    this.pauseState = false;
  }

  set pauseState(op) {
    this._pauseState = op;
    this.pauseB.text = op ? 'Resume' : 'Pause';
  }

  get pauseState() {
    return this._pauseState;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private moveLaser(direction, stepSize: any) {
    const unit = Number(localStorage.getItem(CURRENT_UNIT)) || 0;

    const mm = STEPS_METRIC[stepSize];
    const inch = STEPS_IMPERIAL[stepSize] * 25.4;

    let distance = mm * (direction === 'up' || direction === 'left' ? -1 : 1);
    if (unit === Unit.Imperial) distance = inch * (direction === 'up' || direction === 'left' ? -1 : 1);

    const axis = direction === 'up' || direction === 'down' ? 'Y' : 'X';

    if (axis === 'X') distance *= window[MIRROR_SCALARS].x;
    else distance *= window[MIRROR_SCALARS].y;

    this.serialPort.write(String.fromCharCode(0x85));
    this.serialPort.write(`G91`);
    this.serialPort.write(`$J=${axis}${distance} F16000`);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  saveGcode() {
    let gcode = this.gcode.getGCode();
    if (!gcode) return;
    fs.writeFileSync('MyGode.gcode', gcode.join('\n'), 'utf8');
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  updateGCode() {
    this.updateLaserCursor();
    this.updateTools();

    if (this.transport.visible) {
      this.transport.position = 1;
      this.laserCanvas.laserCursorPosition = { x: 0, y: 0 };
      this.drawGCode();
    }

    if (this.laserCanvas.objectsLayer.children.length <= 1) {
      let skip = true;
      if (this.laserCanvas.objectsLayer.children.length) {
        const l1 = this.laserCanvas.objectsLayer.children[0];
        if (l1 && l1.uid !== SELECT) skip = false;
      }

      if (skip) {
        this.transport.hide();
        this.tracePreview.text = PREPARE_JOB;
        if (this.statusDisplay.status !== ButtonEnabler.DisableAll) this.buttonsEnabler(ButtonEnabler.Stop);

        this.clearGCode();
        return;
      }
    }

    if (!this.laserCanvas.isPreviewChanged) {
      return;
    }
    this.tracePreview.text = PREPARE_JOB;
    this.buttonsEnabler(ButtonEnabler.Ready);

    this.transport.hide();
    if (this.gcode.GCodeLines) this.tracePreview.show();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  buttonsEnabler(op: ButtonEnabler) {
    this.startB.enabled = false;
    if (op == ButtonEnabler.DisableAll) {
      this.pauseB.enabled = false;
      this.stopB.enabled = false;
    }

    this.frameB.enabled = false;
    this.movePanel.enabled = true;
    this.movePanel.homing = this.laserDevice.autoHome;

    if (this.laserDevice.status === StreamState.Disconected) {
      this.movePanel.homing = false;
      return;
    }

    switch (op) {
      case ButtonEnabler.Stop:
        this.movePanel.enabled = true;//this.laserDevice.autoHome;
        if (this.tracePreview.text !== PREPARE_JOB) this.startB.enabled = true;
        this.frameB.enabled = true;
        break;

      case ButtonEnabler.Start:
        this.pauseB.enabled = true;
        this.stopB.enabled = true;
        this.movePanel.homing = false;
        break;

      case ButtonEnabler.Ready:
        this.movePanel.enabled = true;//this.laserDevice.autoHome;
        this.frameB.enabled = true;
        this.stopB.enabled = true;

        break;

      default:
        this.movePanel.homing = false;
        break;
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  updateTools() {
    this.laserCanvas.setTool(this.currentTool);
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  updateLaserCursor() {
    if (!this.laserDevice || !this.laserDevice.isReady) return;
    this.laserDevice.startQuery();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private preparePreview() {
    return new Promise((resolve, reject) => {
      this.gcode.startPoint = {
        x: this.laserCanvas.laserCursor.position.x,
        y: this.laserCanvas.laserCursor.position.y,
      };
      this.tracePreview.text = TRACING;
      this.tracePreview.enabled = false;
      this.buttonsEnabler(ButtonEnabler.DisableAll);

      setTimeout(async () => {
        this.laserCanvas.isPreviewChanged = false;
        this.laserCanvas.toolbox.select.unselectAll();
        this.clearGCode();

        await this.gcode.addElements(this.laserCanvas.objectsLayer);
        const gcode = this.gcode.getGCode();
        this.transport.show();
        this.transport.position = 1;
        this.tracePreview.text = SAVE_TO_DISK;
        this.tracePreview.enabled = true;
        this.buttonsEnabler(ButtonEnabler.Stop);

        this.drawGCode();
        this.laserCanvas.imagesVisible(false);

        resolve();
      });
    });
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  updateView() {
    this.laserCanvas.toolbox.select.unselectAll();
    this.laserCanvas.updateSelection();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  clearGCode() {
    this.gcode.clear();
    this.laserCanvas.laserCursorPosition = { x: 0, y: 0 };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  drawGCode(isZooming = true) {
    let delay = 5;
    if (isZooming) {
      const ctx = this.laserCanvas.ctxPreview;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      delay = 200;
    }
    clearTimeout(this.renderDebouncer);
    this.renderDebouncer = setTimeout(() => {
      this.renderGCode();
    }, delay);
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private renderGCode() {
    if (!this.gcode) return;

    const ctx = this.laserCanvas.ctxPreview;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (!this.active) return;

    const playhead = this.transport.position || 0;

    ctx.lineWidth = 2;
    const scale = this.laserCanvas.scale;

    const strokeColorG0 = '#a009';
    const strokeColorG0_0 = '#0000';
    const strokeColorG1 = '#0af';

    let skip = 0;

    let skipStep = this.gcode.linesCount > 15000 ? 50 : 10;
    skipStep /= scale;
    const viewBounds = this.paper.view.bounds;

    const endTime = Math.floor(this.gcode.simLinesCount * playhead);

    const laserCursor = this.gcode.getPreviewLine(endTime - 1);

    if (laserCursor && laserCursor.position) this.laserCanvas.laserCursorPosition = laserCursor.position;
    if (!endTime) return;

    const area = {
      w: window[CENTER_GRID].bounds.width || 350,
      h: window[CENTER_GRID].bounds.height || 350,
    };

    const showRapid = JSON.parse(localStorage.getItem(SHOW_RAPID));

    const zero = this.paper.view.projectToView(0, 0);
    let prevRapid = false;
    let prevPower = -1;
    let prevSpeed = -1;
    let prevPos = { x: undefined, y: undefined };
    let power;
    let speed;
    let nextLine;
    let nextPosition;
    let nx, ny;
    let color;

    for (let i = 0; i < endTime; i++) {
      const line = this.gcode.getPreviewLine(i);
      const position = line.position;

      if (position.x < 0) position.x = 0;
      if (position.y < 0) position.y = 0;
      if (position.x > area.w) position.x = area.w;
      if (position.y > area.h) position.y = area.h;

      if (i < endTime - 1) {
        nextLine = this.gcode.getPreviewLine(i + 1);
        nextPosition = nextLine.position;
        if (nextPosition.x < 0) nextPosition.x = 0;
        if (nextPosition.y < 0) nextPosition.y = 0;
        if (nextPosition.x > area.w) nextPosition.x = area.w;
        if (nextPosition.y > area.h) nextPosition.y = area.h;
      }
      let rapid = line.rapid;
      let image = false;

      if (line.params) {
        rapid = rapid || line.params.rapid;
        image = line.params.image;
        power = laserPowerToGrayscale(line.params.power / 10) * 255;
        speed = line.params.speed;
        if (power > 255) {
          power = 255;
        }
        if (power < 0) power = 0;
      }

      let { x, y } = this.paper.view.projectToView(position.x, position.y);
      x = Math.floor(x * 1e3) / 1e3;
      y = Math.round(y * 1e3) / 1e3;

      if (i < endTime - 1) {
        const npos = this.paper.view.projectToView(nextPosition.x, nextPosition.y);
        nx = Math.round(npos.x * 1e3) / 1e3;
        ny = Math.round(npos.y * 1e3) / 1e3;
      }

      if (prevPos.x === x && prevPos.y === y && prevRapid === rapid && prevPower === power && prevSpeed === speed) {
        continue;
      }

      color = showRapid ? strokeColorG0 : strokeColorG0_0;

      if (!rapid) {
        if (power !== undefined && image) {
          color = `rgb(${power},${power},${power})`;
        } else color = strokeColorG1;
      }

      if (nextLine) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = color;
        ctx.lineTo(nx, ny);
        ctx.stroke();
      }

      prevRapid = rapid;
      prevPower = power;
      prevSpeed = speed;
      prevPos = { x, y };
    }
  }

  set topIcons(topIcons) {
    this._topIcons = topIcons;
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  set selectLaserD(selectLaserD) {
    this._selectLaserD = selectLaserD;

    this.selectLaserD.onClick = (e) => {
      this.checkPorts();
    };
  }

  get selectLaserD() {
    return this._selectLaserD;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  getWorkAreaSize() {
    this.serialPort.write('$130');
    this.serialPort.write('$131');
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////

function laserPowerToGrayscale(laserPower, isInverted = false) {
  // min and max laser power
  let minPower = 15;
  let maxPower = 100;

  // handle edge cases
  if (laserPower === maxPower) {
    return isInverted ? 0 : 1;
  } else if (laserPower === minPower) {
    return isInverted ? 1 : 0;
  }

  // linearly interpolate between min and max power to get gamma corrected grayscale value
  let gamma = 2.2;
  let gammaCorrected = (laserPower - minPower) / (maxPower - minPower);

  // handle inversion
  if (isInverted) {
    gammaCorrected = 1 - gammaCorrected;
  }

  // calculate the grayscale value
  let grayscale = Math.pow(gammaCorrected, 1 / gamma);

  return grayscale;
}
