declare function _exports(ids: any, options: any): {
    setSizes: (newSizes: any) => void;
    destroy: () => void;
    gutterVis?: undefined;
    getSizes?: undefined;
    getElements?: undefined;
    collapse?: undefined;
} | {
    setSizes: (newSizes: any) => void;
    gutterVis: (op: any, num: any) => void;
    getSizes: () => any;
    getElements: () => any;
    collapse: (i: any) => void;
    destroy: () => void;
};
export = _exports;
