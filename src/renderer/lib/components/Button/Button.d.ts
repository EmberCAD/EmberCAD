export default class Button extends Component {
  zIndex: number;
  constructor(id: any);
  _init(): void;
  customProps: {
    name: string;
  }[];
  button: any;
  _events(): void;
  onStateChanged: () => void;
  _updateState(): void;
  defaults(): void;
  set html(arg: any);
  get html(): any;
  set caption(arg: any);
  get caption(): any;
}
import Component from '../Component/Component';
