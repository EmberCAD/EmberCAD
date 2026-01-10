/**
 * Adds movable size element to the container
 */
export default class ContainerSized extends Container {
    constructor(parent: any);
    _init(parent: any): void;
    customProps: string[];
    set split(arg: any);
    get split(): any;
    _events(): void;
    _onSplitChange: () => void;
    _partsNum: any;
    _uid: any;
    _direction: any;
    _setParts(): void;
    topPart: any;
    bottomPart: any;
    centerPart: any;
    leftPart: any;
    rightPart: any;
    set parts(arg: any);
    get parts(): any;
    part(i: any): any;
}
import Container from "../Container/Container.js";
