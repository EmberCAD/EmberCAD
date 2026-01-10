export default class Hint {
    constructor(id: any);
    _parent: any;
    _init(): void;
    time: number;
    timer: number;
    set active(arg: any);
    get active(): any;
    mainCont: any;
    _events(): void;
    hintEngine(e: any): void;
    show(e: any, txt: any): void;
    prevTxt: any;
    showing: boolean;
    showDebouncer: NodeJS.Timeout;
    hideDebouncer: NodeJS.Timeout;
    set display(arg: any);
    _display: any;
    _active: any;
    hide(): void;
}
