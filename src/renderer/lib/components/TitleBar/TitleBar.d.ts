export default class TitleBar {
    constructor(id: any, mainMenu: any);
    _parent: any;
    mainMenu: any;
    _init(): void;
    cont: any;
    appIcon: any;
    menubar: any;
    titlebar: any;
    winIcons: any;
    winMin: any;
    winMax: any;
    winCls: any;
    _data: any[];
    set height(arg: any);
    get height(): any;
    set visible(arg: any);
    get visible(): any;
    _events(): void;
    toggleWindow(): void;
    updateRestore(): void;
    hide(): void;
    show(): void;
    set text(arg: any);
    get text(): any;
    set caption(arg: any);
    get caption(): any;
}
