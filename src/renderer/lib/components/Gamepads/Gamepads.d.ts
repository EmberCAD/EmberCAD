export = Gamepads;
declare class Gamepads {
    _init(): void;
    getGamepads(): void;
    gamepads: Gamepad[];
    _events(): void;
    buttonState(gpIdx: any, btIdx: any): GamepadButton | -1 | -2;
    listenersStart(): void;
    set listenersLoop(arg: any);
    get listenersLoop(): any;
    listenersStop(): void;
    _listenerLoop: any;
    rAF(): void;
    gpLoop: number;
    prevBt: any[];
}
