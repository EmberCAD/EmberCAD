export default class ObjectsManager {
    objects: any[];
    objectsOrder: any[];
    guiFile: any;
    guiFileWeb: any;
    add(obj: any): any;
    delete(uid: any): void;
    set design(arg: any);
    store(orderArray: any): any;
    saveObjects(orderArray: any): void;
    loadJSON(): Promise<any>;
    loadObjects(): Promise<any>;
    counter: any[];
    addComponent(obj: any, parent: any): any;
    removeComponent(uid: any): void;
    removeAll(): void;
    registerComponent(obj: any): void;
    isExisting(obj: any, nameSpace: any, suffix: any): any;
    setDefaultCount(): void;
    resetCounter(nameSpace: any): void;
    getNameSpace(obj: any): any;
    setCounter(obj: any): any;
    translate(): void;
}
