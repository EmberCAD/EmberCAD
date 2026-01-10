export = Memo;
declare class Memo {
    constructor(id: any);
    _init(): void;
    customProps: ({
        name: string;
        values?: undefined;
    } | {
        name: string;
        values: string[];
    })[];
    baseClass: string;
    input: any;
    _events(): void;
    onStateChanged: () => void;
    _updateState(): void;
    defaults(): void;
    width: number;
    height: any;
    clear(): void;
    set text(arg: any);
    get text(): any;
    addLine(txt: any): void;
    set readonly(arg: any);
    get readonly(): any;
    set size(arg: any);
    get size(): any;
    set placeholder(arg: any);
    get placeholder(): any;
    set design(arg: any);
    get design(): any;
    designClass: string;
    _design: any;
    set color(arg: any);
    get color(): any;
    load(fname: any): void;
}
