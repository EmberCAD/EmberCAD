export = Tabs;
declare class Tabs {
    constructor(id: any);
    _init(): void;
    baseClass: string;
    align: any;
    mainSplit: any;
    viewManager: any;
    _events(): void;
    render(): void;
    tabs: any[];
    select(tabIndex: any): void;
    deselect(): void;
    set items(arg: any);
    get items(): any;
}
