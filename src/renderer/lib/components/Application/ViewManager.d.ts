export default class ViewManager {
    _init(): void;
    views: Manager;
    addView(obj: any): void;
    clear(): void;
    switchTo(id: any): void;
    _onSwitch(id: any): void;
}
import Manager from "../../api/cherry/manager";
