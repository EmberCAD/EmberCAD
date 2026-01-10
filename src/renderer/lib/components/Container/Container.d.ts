/**
 * Base class for containers
 */
export default class Container extends Component {
    constructor(id: any);
    _divide(parent: any, divides: any, direction: any, minSizes: any, splitId: any): Panel[];
    minSizes: any;
    _addSplit(obj: any): void;
    splitter: Splitter;
    splitSizes(p: any): void;
}
import Component from "../Component/Component";
import Panel from "../Panel/Panel";
import Splitter from "../Splitter/Splitter";
