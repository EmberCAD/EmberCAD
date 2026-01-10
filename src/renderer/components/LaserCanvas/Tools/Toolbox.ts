// @ts-ignore
// @ts-nocheck
import { ELEMENTS } from '../LaserCanvas';
import Circle from './Circle';
import Rectangle from './Rectangle';
import Select from './Select';

export enum ToolboxMode {
  None = -1,
  Select,
  Device,
  Pencil,
  Line,
  Rectangle,
  Circle,
  Polygon,
  Nodes,
  Tabs,
  Text,
  Location,
  Measure,
  Camera,
}

export const availableTools = [
  'select',
  'device',
  'pencil',
  'line',
  'rectangle',
  'circle',
  'polygon',
  'nodes',
  'tabs',
  'text',
  'location',
  'measure',
  'camera',
];

export default class Toolbox {
  select: Select;
  currentTool = ToolboxMode.None;
  currentTheme: any;
  rectangle: Rectangle;
  circle: Circle;

  constructor(private paper) {
    this.init();
    this.events();
  }
  events() {
    this.select.onSelect = () => {
      if (typeof this.onSelect === 'function') this.onSelect();
    };

    this.select.onDuplicate = (uids) => {
      if (typeof this.onDuplicate === 'function') this.onDuplicate(uids);
    };

    this.select.onRemove = () => {
      if (typeof this.onRemove === 'function') this.onRemove();
    };

    this.select.onUpdateSelection = (bounds) => {
      if (typeof this.onUpdateSelection === 'function') this.onUpdateSelection(bounds);
    };

    this.select.onUnselectAll = () => {
      if (typeof this.onUnselectAll === 'function') this.onUnselectAll();
    };

    this.rectangle.onElementCreated = (element) => {
      if (window[ELEMENTS][element.uid]) return;
      if (typeof this.onElementCreated === 'function') this.onElementCreated(element);
    };

    this.circle.onElementCreated = (element) => {
      if (window[ELEMENTS][element.uid]) return;

      if (typeof this.onElementCreated === 'function') this.onElementCreated(element);
    };
  }

  init() {
    this.select = new Select(this.paper);
    this.rectangle = new Rectangle(this.paper);
    this.circle = new Circle(this.paper);
  }

  onMouseDown(e) {
    this.select.color = this.theme.select;

    switch (this.tool) {
      case ToolboxMode.Select:
        this.select.onMouseDown(e);
        break;

      case ToolboxMode.Rectangle:
        this.unselectAll();
        this.rectangle.onMouseDown(e);
        break;

      case ToolboxMode.Circle:
        this.unselectAll();
        this.circle.onMouseDown(e);
        break;

      default:
        break;
    }
  }

  onMouseMove(e) {
    switch (this.tool) {
      case ToolboxMode.Select:
        this.select.onMouseMove(e);
        break;

      case ToolboxMode.Rectangle:
        this.rectangle.onMouseMove(e);
        break;

      case ToolboxMode.Circle:
        this.circle.onMouseMove(e);
        break;

      default:
        break;
    }
  }

  onMouseUp(e?) {
    switch (this.tool) {
      case ToolboxMode.Select:
        this.select.onMouseUp(e);
        break;

      case ToolboxMode.Rectangle:
        this.rectangle.onMouseUp();
        break;

      case ToolboxMode.Circle:
        this.circle.onMouseUp();
        break;

      default:
        break;
    }
  }

  onMouseRotation(e) {
    this.select.onMouseRotation(e);
  }

  unselectAll() {
    this.select.unselectAll();
    if (typeof this.onUnselectAll === 'function') this.onUnselectAll();
  }

  checkHit(point) {
    return this.select.checkHit(point);
  }

  scale(scaleHandle, sizeItem, scale, e) {
    this.select.scale(scaleHandle, sizeItem, scale, e);
  }

  set tool(tool: ToolboxMode) {
    if (tool !== ToolboxMode.Select) {
      this.unselectAll();
    }

    this.currentTool = Number(tool);
  }

  get tool() {
    return this.currentTool;
  }

  set theme(theme) {
    this.currentTheme = theme;
  }

  get theme() {
    return this.currentTheme;
  }
}
