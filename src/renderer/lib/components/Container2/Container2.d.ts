export default class Container2 extends Container {
    constructor(parent: any);
    _init(parent: any): void;
    customProps: string[];
    set divide(arg: any);
    get divide(): any;
    set direction(arg: any);
    get direction(): any;
    _uid: any;
    _direction: any;
    _cont: import("../Panel/Panel.js").default[];
    set parts(arg: any);
    get parts(): any;
    _setParts(): void;
    topPart: import("../Panel/Panel.js").default;
    bottomPart: import("../Panel/Panel.js").default;
    leftPart: import("../Panel/Panel.js").default;
    rightPart: import("../Panel/Panel.js").default;
    part(i: any): import("../Panel/Panel.js").default;
}
import Container from "../Container/Container.js";
