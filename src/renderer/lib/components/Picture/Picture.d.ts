export = Picture;
declare class Picture {
    constructor(id: any);
    _init(): void;
    customProps: {
        name: string;
    }[];
    baseClass: string;
    canvas: any;
    ctx: any;
    set autosize(arg: any);
    get autosize(): any;
    _cursorPos: {
        x: number;
        y: number;
    } | {
        x: number;
        y: number;
    } | {
        x: any;
        y: any;
    };
    _events(): void;
    onStateChanged: () => void;
    _updateState(): void;
    set tint(arg: any);
    get tint(): any;
    tintPic: any;
    tintCtx: any;
    defaults(): void;
    set width(arg: any);
    get width(): any;
    set height(arg: any);
    get height(): any;
    cls(col: any): void;
    set stroke(arg: any);
    get stroke(): any;
    _stroke: any;
    set fill(arg: any);
    get fill(): any;
    _fill: any;
    set font(arg: any);
    text(txt: any, x: any, y: any): void;
    strokeRect(x: any, y: any, w: any, h: any, lw: any): void;
    set lineWidth(arg: any);
    get lineWidth(): any;
    fillRect(x: any, y: any, w: any, h: any): void;
    moveTo(x: any, y: any): void;
    lineTo(x: any, y: any): void;
    plot(x: any, y: any): void;
    load(fname: any): Promise<void>;
    save(fname: any, type: any): Promise<void>;
    savePicture(fname: any, type: any): Promise<any>;
    loadPicture(fname: any): Promise<any>;
    image: HTMLImageElement;
    naturalWidth: number;
    naturalHeight: number;
    copyFrom(srcPic: any, x: any, y: any, w: any, h: any, wr: any, hr: any): void;
    copyTo(srcPic: any, x: any, y: any, w: any, h: any, wr: any, hr: any): void;
}
