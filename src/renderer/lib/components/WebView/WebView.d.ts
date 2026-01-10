export = WebView;
declare class WebView {
    constructor(id: any);
    _init(): void;
    customProps: {
        name: string;
        default: string;
    }[];
    onEvents: any;
    webView: any;
    defaults(): void;
    domReady: boolean;
    set design(arg: any);
    get design(): any;
    width: number;
    height: number;
    background: any;
    _events(): void;
    set url(arg: any);
    get url(): any;
    designClass: string;
    _design: any;
}
