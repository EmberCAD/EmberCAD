export default class Splitter {
    constructor(ids: any, options: any);
    onDragEnd: any;
    Split: {
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
    initIds: any;
    currIds: any;
    options: any;
    minSizes: any;
    initSizes: any;
    numSizes: any[];
    combi: string;
    hidden: boolean[];
    visible(idx: any, op: any, isRestoring: any): void;
    saveState(): void;
    loadState(): void;
    showGutter(num: any): void;
    hideGutter(num: any): void;
    getAllSizes(): [string, any][];
    setAllSizes(set: any): void;
    getSizes(): any;
    setSizes(sizes: any): void;
}
