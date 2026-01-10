export = LaunchPad;
declare class LaunchPad {
    _iconSize: number;
    render(): void;
    dirWeb(): Promise<void>;
    apps: any;
    dir(): void;
    prepareDirectory(): void;
    showApps(): Promise<void>;
    getAppInfo(appname: any): any;
    addBottomPanel(): void;
    bottomPanel: any;
    set iconSize(arg: any);
}
