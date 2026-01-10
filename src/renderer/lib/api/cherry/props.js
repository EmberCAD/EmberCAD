export const POSITION_HINT = 'Position in pixels. E.g. 10 - for ten px, 10em, 10rem';

export const COMPONENTS_PROPERTIES = [
  {
    group: 'Layout',
    items: [
      {
        name: 'align',
        values: ['alNone', 'alClient', 'alTop', 'alRight', 'alBottom', 'alLeft'],
        default: 'alNone',
      },
      {
        name: 'anchor',
        values: ['anTopLeft', 'anTop', 'anTopRight', 'anRight', 'anBottomRight', 'anBottom', 'anBottomLeft', 'anLeft'],
        default: 'anTopLeft',
      },
      {
        name: 'position',
        default: 'absolute',
      },
      {
        name: 'left',
        default: 0,
        hint: POSITION_HINT,
      },
      {
        name: 'top',
        default: 0,
        hint: POSITION_HINT,
      },
      {
        name: 'right',
        default: null,
        hint: POSITION_HINT,
      },
      {
        name: 'bottom',
        default: null,
        hint: POSITION_HINT,
      },
      {
        name: 'width',
        hint: POSITION_HINT,
      },
      {
        name: 'height',
        hint: POSITION_HINT,
      },
    ],
  },
  {
    group: 'Appearance',
    items: [
      {
        name: 'display',
        default: 'flex',
      },
      {
        name: 'color',
      },
      {
        name: 'backgroundColor',
        default: '',
      },
      {
        name: 'border',
        default: '',
      },
      {
        name: 'opacity',
        default: '1',
      },
      {
        name: 'borderRadius',
        default: '',
      },
    ],
  },
  {
    group: 'Action',
    items: [
      {
        name: 'enabled',
        values: ['true', 'false'],
        default: 'true',
      },
      {
        name: 'visible',
        values: ['true', 'false'],
        default: 'true',
      },
      {
        name: 'flash',
        values: ['true', 'false'],
        default: 'true',
      },
    ],
  },
];

export let cherryStylesUnitConvert = ['margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft'];
cherryStylesUnitConvert = [
  ...cherryStylesUnitConvert,
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
];
cherryStylesUnitConvert = [...cherryStylesUnitConvert, 'borderRadius', 'fontSize'];

export let cheryStyles = ['position', 'display', 'opacity', 'pointerEvents', 'cursor', 'zIndex', 'maxHeight'];
cheryStyles = [...cheryStyles, 'border', 'boxSizing'];
cheryStyles = [...cheryStyles, 'borderTop', 'borderRight', 'borderBottom', 'borderLeft'];
cheryStyles = [...cheryStyles, 'flex', 'flexDirection', 'gap'];
cheryStyles = [...cheryStyles, 'alignItems', 'justifyContent'];
cheryStyles = [...cheryStyles, 'font', 'fontWeight', 'fontFamily', 'fontStyle', 'fontSize'];
cheryStyles = [...cheryStyles, 'textAlign'];
cheryStyles = [...cheryStyles, 'color', 'background', 'backgroundColor'];

// 'ignoreEvents',
// 'enabled',
// 'opacity',
// 'fontColor',
// 'hint',
// 'borderRadius',
// 'flash',
// 'cursor',

// this.props['align'] = this.props['anchor']
// this.props['flexDirection'] = ['column', 'row'];
