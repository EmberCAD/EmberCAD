export = Input;
declare class Input {
    constructor(id: any);
    _init(): void;
    customProps: ({
        name: string;
        values?: undefined;
    } | {
        name: string;
        values: string[];
    })[];
    propsFilter: string[];
    baseClass: string;
    input: any;
    _events(): void;
    onStateChanged: () => void;
    set onChange(arg: any);
    _onInputCB: any;
    set onInput(arg: any);
    set onFocus(arg: any);
    set onKeyPress(arg: any);
    set onBlur(arg: any);
    _updateState(): void;
    defaults(): void;
    width: number;
    height: any;
    set text(arg: any);
    get text(): any;
    set placeholder(arg: any);
    get placeholder(): any;
    set design(arg: any);
    get design(): any;
    designClass: string;
    _design: any;
    set backgroundColor(arg: any);
    get backgroundColor(): any;
    set size(arg: any);
    get size(): any;
    set readonly(arg: any);
    get readonly(): any;
}
