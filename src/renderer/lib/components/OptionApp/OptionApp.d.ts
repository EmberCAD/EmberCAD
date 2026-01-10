export = OptionApp;
declare class OptionApp {
    constructor(id: any, direction?: any);
    uniqId: string;
    itemIdx: number;
    _items: any[];
    _parent: any;
    direction: any;
    cont: any;
    set menuItems(arg: any[]);
    get menuItems(): any[];
    i_tems: any[];
    select(sel: any): void;
    selectIdent(sel: any): void;
    addItem(item: any): void;
    set onChange(arg: any);
    callback: any;
    set onClick(arg: any);
    enable(idx: any, state: any): void;
    enabled(idx: any): boolean;
    onChange_(e: any): void;
    onClick_(e: any): void;
}
