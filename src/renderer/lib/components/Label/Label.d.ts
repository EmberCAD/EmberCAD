export = Label;
declare class Label {
    constructor(id: any);
    defaults(): void;
    width: string;
    height: any;
    _init(): void;
    customProps: {
        name: string;
    }[];
    set font(arg: any);
    get font(): any;
    set size(arg: any);
    get size(): any;
    set text(arg: any);
    get text(): any;
    set html(arg: any);
    get html(): any;
}
