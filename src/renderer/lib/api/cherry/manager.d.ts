export default class Manager {
    versionNumber: number;
    _init(): void;
    clear(): void;
    elements: any[];
    addElement(obj: any): any;
    updateStore(uid: any, store: any): void;
    updateName(uid: any, name: any): void;
    updateBin(uid: any, bin: any): void;
    deleteElement(uid: any): void;
    duplicateElement(uid: any): any;
    get count(): number;
    getElement(uid: any): {
        name: any;
        store: any;
        bin: any;
    };
    listelements(): any[];
    store(): any[];
    restore(list: any): void;
}
