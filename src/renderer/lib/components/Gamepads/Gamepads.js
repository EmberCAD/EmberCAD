class Gamepads {
  constructor() {
    this._init();
    this._events();
  }

  _init() {}

  getGamepads() {
    this.gamepads = navigator.getGamepads();
  }

  _events() {
    window.addEventListener('gamepadconnected', (e) => {
      log('Gamepad connected at index %d: %s. %d buttons, %d axes.', e.gamepad.index, e.gamepad.id, e.gamepad.buttons.length, e.gamepad.axes.length);

      if (typeof this.onConnected == 'function')
        this.onConnected({
          index: e.gamepad.index,
          id: e.gamepad.id,
          buttons: e.gamepad.buttons.length,
          axes: e.gamepad.axes.length,
        });
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      log('Gamepad disconnected from index %d: %s', e.gamepad.index, e.gamepad.id);

      if (typeof this.onDisconnected == 'function')
        this.onDisconnected({
          index: e.gamepad.index,
          id: e.gamepad.id,
        });
    });
  }

  buttonState(gpIdx, btIdx) {
    let gamepads = navigator.getGamepads();
    if (!gamepads) return -1;
    if (gamepads[gpIdx].buttons.length >= btIdx) return -2;

    return gamepads[gpIdx].buttons[btIdx];
  }

  listenersStart() {
    this.listenersLoop = true;
  }

  listenersStop() {
    this.listenersLoop = false;
  }

  set listenersLoop(op) {
    this._listenerLoop = op;
    if (op) {
      this.rAF();
    } else {
      cancelAnimationFrame(this.gpLoop);
    }
  }

  get listenersLoop() {
    return this._listenerLoop;
  }

  rAF() {
    this.gpLoop = requestAnimationFrame(this.rAF.bind(this));
    if (!this.prevBt) this.prevBt = [];
    this.getGamepads();
    for (let g = 0; g < this.gamepads.length; g++) {
      let gp = this.gamepads[g];
      if (!gp) continue;

      for (let b = 0; b < gp.buttons.length; b++) {
        let bt = gp.buttons[b];
        if (!this.prevBt[g]) this.prevBt[g] = [];
        if (this.prevBt[g][b] != undefined) {
          if (bt.value != this.prevBt[g][b].value)
            if (typeof this.onChange == 'function') this.onChange({ gamepad: gp, button: Object.assign(bt, { index: b }), timestamp: gp.timestamp });
        }
        this.prevBt[g][b] = bt;
      }
    }
  }
}

module.exports = Gamepads;
