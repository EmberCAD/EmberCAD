export = CheckBox;
declare class CheckBox {
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
    border: string;
    checker: any;
    defaults(): void;
    set size(arg: any);
    get size(): any;
    width: number;
    set checked(arg: any);
    get checked(): any;
    enabled: boolean;
    set design(arg: any);
    get design(): any;
    _events(): void;
    onClick: () => void;
    onStateChanged: () => void;
    set text(arg: any);
    get text(): any;
    designClass: string;
    set color(arg: any);
    get color(): any;
    height: any;
    set checkSymbol(arg: any);
    get checkSymbol(): any;
    set uncheckSymbol(arg: any);
    get uncheckSymbol(): any;
    label: any;
    _updateState(): void;
    set labelPosition(arg: any);
    get labelPosition(): any;
    set hint(arg: any);
}
