//@ts-ignore
//@ts-nocheck

export const DEFAULT_LAYER_ID = '00';
export const TOOL_LAYER_IDS = ['T1', 'T2'];
export const LAYER_ORDER_KEY = 'LAYER_ORDER';

export type LayerDef = {
  id: string;
  color: string;
  index: number;
  tool?: boolean;
};

const BASE_LAYER_COLORS = [
  '#000000',
  '#0000ff',
  '#ff0000',
  '#00cc00',
  '#cccc00',
  '#ff9900',
  '#00cccc',
  '#ff00ff',
  '#9c9c9c',
  '#0b2f9f',
  '#8c0000',
  '#006f00',
  '#8c8c00',
  '#b37700',
  '#2a82d7',
  '#7e2ea8',
  '#6b6b6b',
  '#4b567a',
  '#8b5a68',
  '#5077d9',
  '#ca3f64',
  '#89be6c',
  '#b98a5e',
  '#d68fca',
  '#af5abf',
  '#5f267f',
  '#8a5a00',
  '#145c62',
  '#6ebd66',
  '#ffd466',
];

const TOOL_COLORS = ['#ff7c2b', '#2f95d8'];

export const LAYER_PALETTE: LayerDef[] = BASE_LAYER_COLORS.map((color, index) => ({
  id: String(index).padStart(2, '0'),
  color,
  index,
}));

LAYER_PALETTE.push(
  { id: 'T1', color: TOOL_COLORS[0], index: 30, tool: true },
  { id: 'T2', color: TOOL_COLORS[1], index: 31, tool: true },
);

export const LAYER_BY_ID = LAYER_PALETTE.reduce((map, layer) => {
  map[layer.id] = layer;
  return map;
}, {});

export function getLayerById(layerId?: string) {
  return LAYER_BY_ID[layerId] || LAYER_BY_ID[DEFAULT_LAYER_ID];
}

export function isToolLayer(layerId?: string) {
  return TOOL_LAYER_IDS.includes(layerId);
}

export function getDefaultLayerOrder() {
  return LAYER_PALETTE.map((layer) => layer.id);
}

export function normalizeHexColor(color: string) {
  if (!color || typeof color !== 'string') return null;
  let value = color.trim().toLowerCase();
  if (!value) return null;
  if (value.startsWith('rgb')) {
    const m = value.match(/rgba?\(([^)]+)\)/i);
    if (!m) return null;
    const parts = m[1]
      .split(',')
      .slice(0, 3)
      .map((part) => Number(part.trim()));
    if (parts.some((v) => Number.isNaN(v))) return null;
    return (
      '#' +
      parts
        .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
        .join('')
    );
  }
  if (!value.startsWith('#')) return null;
  value = value.slice(1);
  if (value.length === 3) {
    value = value
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  if (!/^[0-9a-f]{6}$/.test(value)) return null;
  return '#' + value;
}

function colorToRgb(color: string) {
  const hex = normalizeHexColor(color);
  if (!hex) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function colorDistance(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

export function findClosestLayer(color: string, includeToolLayers = true) {
  const rgb = colorToRgb(color);
  if (!rgb) return getLayerById(DEFAULT_LAYER_ID);
  let best = null;
  for (let i = 0; i < LAYER_PALETTE.length; i++) {
    const candidate = LAYER_PALETTE[i];
    if (!includeToolLayers && candidate.tool) continue;
    const crgb = colorToRgb(candidate.color);
    if (!crgb) continue;
    const distance = colorDistance(rgb, crgb);
    if (!best || distance < best.distance || (distance === best.distance && candidate.index < best.layer.index)) {
      best = {
        layer: candidate,
        distance,
      };
    }
  }
  return best ? best.layer : getLayerById(DEFAULT_LAYER_ID);
}

export function setLayerData(item: any, layerId: string, layerColor?: string) {
  if (!item) return;
  const layer = getLayerById(layerId);
  const color = normalizeHexColor(layerColor) || layer.color;
  if (!item.data) item.data = {};
  item.data.layerId = layer.id;
  item.data.layerColor = color;
}

export function getLayerId(item: any) {
  return item && item.data && item.data.layerId ? item.data.layerId : DEFAULT_LAYER_ID;
}

export function getLayerColor(item: any) {
  if (item && item.data && item.data.layerColor) {
    const normalized = normalizeHexColor(item.data.layerColor);
    if (normalized) return normalized;
  }
  return getLayerById(getLayerId(item)).color;
}

function rgbToHex(rgb: { r: number; g: number; b: number }) {
  return (
    '#' +
    [rgb.r, rgb.g, rgb.b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  );
}

function brightenColor(color: string, ratio = 0.45) {
  const rgb = colorToRgb(color);
  if (!rgb) return color;
  return rgbToHex({
    r: rgb.r + (255 - rgb.r) * ratio,
    g: rgb.g + (255 - rgb.g) * ratio,
    b: rgb.b + (255 - rgb.b) * ratio,
  });
}

function isNearBlack(color: string) {
  const rgb = colorToRgb(color);
  if (!rgb) return false;
  return rgb.r <= 16 && rgb.g <= 16 && rgb.b <= 16;
}

export function getLayerUiColor(layerId?: string, layerColor?: string) {
  const raw = normalizeHexColor(layerColor) || getLayerById(layerId).color;
  if (isNearBlack(raw)) return '#ffffff';
  return raw;
}

export function getLayerElementColor(layerId?: string, layerColor?: string) {
  const uiColor = getLayerUiColor(layerId, layerColor);
  if (uiColor === '#ffffff') return uiColor;
  return brightenColor(uiColor, 0.45);
}

export function getElementDisplayColor(item: any) {
  const layerId = getLayerId(item);
  const layerColor = getLayerColor(item);
  return getLayerElementColor(layerId, layerColor);
}

export function ensureLayerData(item: any, fallbackLayerId = DEFAULT_LAYER_ID) {
  if (!item) return getLayerById(fallbackLayerId);
  const currentId = getLayerId(item);
  const layer = getLayerById(currentId || fallbackLayerId);
  setLayerData(item, layer.id, item?.data?.layerColor || layer.color);
  return layer;
}

export function isDrawableItem(item: any) {
  if (!item || !item.uid || item.uid === 'select') return false;
  if (!item.bounds || !item.bounds.width || !item.bounds.height) return false;
  return true;
}
