// @ts-ignore
// @ts-nocheck
import bSpline from './bspline';
import opentype from 'opentype.js';
import fs from 'fs';
import path from 'path';

const textControlCharactersRegex = /\\[AXQWOoLIpfH].*;/g;
const curlyBraces = /\\[{}]/g;

// Based on Three.js extension functions. Webpack doesn't seem to like it if we modify the THREE object directly.
let THREEx = { Math: {} };
let parser;
let font;
/**
 * Returns the angle in radians of the vector (p1,p2). In other words, imagine
 * putting the base of the vector at coordinates (0,0) and finding the angle
 * from vector (1,0) to (p1,p2).
 * @param  {Object} p1 start point of the vector
 * @param  {Object} p2 end point of the vector
 * @return {Number} the angle
 */
THREEx.Math.angle2 = function (p1, p2) {
  let v1 = { x: p1.x, y: p1.y };
  let v2 = { x: p2.x, y: p2.y };

  let subs = sub(v1, v2);
  v2 = normalize(subs);

  if (v2.y < 0) return -Math.acos(v2.x);
  return Math.acos(v2.x);
};

THREEx.Math.polar = function (point, distance, angle) {
  let result = {};
  result.x = point.x + distance * Math.cos(angle);
  result.y = point.y + distance * Math.sin(angle);
  return result;
};

function sqr(x) {
  return x * x;
}
function dist2(v, w) {
  return sqr(v.x - w.x) + sqr(v.y - w.y);
}
function length({ x, y }) {
  return Math.sqrt(sqr(x) + sqr(y));
}
function normalize({ x, y }) {
  return divideScalar(x, y, length({ x, y }) || 1);
}

function divideScalar(x, y, scalar) {
  return multiplyScalar(x, y, 1 / scalar);
}

function multiplyScalar(x, y, scalar) {
  x *= scalar;
  y *= scalar;
  return { x, y };
}

function sub(p1, p2) {
  return { x: p2.x - p1.x, y: p2.y - p1.y };
}

/**
 * Calculates points for a curve between two points using a bulge value. Typically used in polylines.
 * @param startPoint - the starting point of the curve
 * @param endPoint - the ending point of the curve
 * @param bulge - a value indicating how much to curve
 * @param segments - number of segments between the two given points
 */
function getBulgeCurvePoints(startPoint, endPoint, bulge, segments) {
  let vertex, i, center, p0, p1, angle, radius, startAngle, thetaAngle;

  let obj = {};
  obj.startPoint = p0 = startPoint ? { x: startPoint.x, y: startPoint.y } : { x: 0, y: 0 };
  obj.endPoint = p1 = endPoint ? { x: endPoint.x, y: endPoint.y } : { x: 1, y: 0 };
  obj.bulge = bulge = bulge || 1;

  angle = 4 * Math.atan(bulge);
  radius = Math.sqrt(dist2(p0, p1)) / 2 / Math.sin(angle / 2);

  center = THREEx.Math.polar(startPoint, radius, THREEx.Math.angle2(p0, p1) + (Math.PI / 2 - angle / 2));

  obj.segments = segments = segments || Math.max(Math.abs(Math.ceil(angle / (Math.PI / 36))), 6);
  startAngle = THREEx.Math.angle2(center, p0);
  thetaAngle = angle / segments;

  let vertices = [];

  vertices.push({ x: p0.x, y: p0.y });

  for (i = 1; i <= segments - 1; i++) {
    vertex = THREEx.Math.polar(center, Math.abs(radius), startAngle + thetaAngle * i);
    vertices.push({ x: vertex.x, y: vertex.y });
  }

  return vertices;
}

/**
 * Viewer class for a dxf object.
 * @param {Object} data - the dxf object
 * @param {Object} parent - the parent element to which we attach the rendering canvas
 * @param {Number} width - width of the rendering canvas in pixels
 * @param {Number} height - height of the rendering canvas in pixels
 * @param {Object} font - a font loaded with THREE.FontLoader
 * @constructor
 */
export async function ImportDXF(rawDxf, paperView) {
  if (!parser) {
    parser = new DxfParser();
    font = await opentype.load(path.join(__static, 'fonts', 'Roboto-Regular.ttf'));
  }
  const data = parser.parseSync(rawDxf);
  const dxf = new paperView.Group();
  let entity, obj, min_x, min_y, min_z, max_x, max_y, max_z;
  let dims = {
    min: { x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER },
    max: { x: Number.MIN_SAFE_INTEGER, y: Number.MIN_SAFE_INTEGER },
  };

  for (let i = 0; i < data.entities.length; i++) {
    entity = data.entities[i];

    obj = drawEntity(entity, data);
    if (obj) {
      dxf.addChild(obj);
      obj = obj.bounds;
      dims.min.x = Math.min(dims.min.x, obj.x);
      dims.max.x = Math.max(dims.max.x, obj.x + obj.width);
      dims.min.y = Math.min(dims.min.y, obj.y);
      dims.max.y = Math.max(dims.max.y, obj.y + obj.height);
    }
    obj = null;
  }

  return dxf;

  function drawEntity(entity, data) {
    let mesh;
    if (entity.type === 'CIRCLE' || entity.type === 'ARC') {
      mesh = drawArc(entity, data);
    } else if (entity.type === 'LWPOLYLINE' || entity.type === 'LINE' || entity.type === 'POLYLINE') {
      mesh = drawLine(entity, data);
    } else if (entity.type === 'TEXT') {
      mesh = drawText(entity, data);
    } else if (entity.type === 'SOLID') {
      mesh = drawSolid(entity, data);
    } else if (entity.type === 'POINT') {
      mesh = drawPoint(entity, data);
    } else if (entity.type === 'INSERT') {
      mesh = drawBlock(entity, data);
    } else if (entity.type === 'SPLINE') {
      mesh = drawSpline(entity, data);
    } else if (entity.type === 'MTEXT') {
      mesh = drawMtext(entity, data);
    } else if (entity.type === 'ELLIPSE') {
      mesh = drawEllipse(entity, data);
    } else if (entity.type === 'DIMENSION') {
      let dimTypeEnum = entity.dimensionType & 7;
      if (dimTypeEnum === 0) {
        mesh = drawDimension(entity, data);
      } else {
        console.log('Unsupported Dimension type: ' + dimTypeEnum);
      }
    } else {
      console.log('Unsupported Entity Type: ' + entity.type);
    }
    if (mesh) mesh.strokeScaling = false;
    return mesh;
  }

  function drawEllipse(entity, data) {
    let color = getColor(entity, data);

    let xrad = Math.sqrt(Math.pow(entity.majorAxisEndPoint.x, 2) + Math.pow(entity.majorAxisEndPoint.y, 2));
    let yrad = xrad * entity.axisRatio;
    let rotation = Math.atan2(entity.majorAxisEndPoint.y, entity.majorAxisEndPoint.x);

    const elli = new paperView.Path.Ellipse({
      center: [entity.center.x, -entity.center.y],
      radius: [xrad, yrad],
    });

    elli.rotate(-(rotation * 180) / Math.PI);

    elli.strokeColor = color;
    elli.strokeWidth = 1 / 3;

    return elli;
  }

  function drawMtext(entity, data) {
    const svg = font.getPath(entity.text, 0, 0, entity.height).toSVG();

    const text = new paperView.Path().importSVG(svg);
    text.text = entity.text;
    // 1 = Top left; 2 = Top center; 3 = Top right
    // 4 = Middle left; 5 = Middle center; 6 = Middle right
    // 7 = Bottom left; 8 = Bottom center; 9 = Bottom right

    text.fillColor = getColor(entity, data);
    text.fontSize = '1pt';
    if (entity.rotation) {
      text.rotate(-entity.rotation);
    }

    switch (entity.attachmentPoint) {
      case 1:
        text.pivot = text.bounds.topLeft;
        break;
      case 2:
        text.justification = 'center';
        text.pivot = text.bounds.topCenter;

        break;
      case 3:
        text.justification = 'right';
        text.pivot = text.bounds.topRight;

        break;
      case 4:
        text.pivot = text.bounds.leftCenter;
        break;
      case 5:
        text.justification = 'left';
        text.pivot = text.bounds.center;

        break;
      case 6:
        text.justification = 'right';
        text.pivot = text.bounds.rightCenter;
        break;
      case 7:
        text.pivot = text.bounds.bottomLeft;
        break;
      case 8:
        text.justification = 'center';
        text.pivot = text.bounds.bottomCenter;

        break;
      case 9:
        text.justification = 'right';
        text.pivot = text.bounds.bottomRight;

        break;

      default:
        break;
    }

    text.position = [entity.position.x, -entity.position.y];

    return text;
  }

  function drawSpline(entity, data) {
    let color = getColor(entity, data);

    let points = getBSplinePolyline(entity.controlPoints, entity.degreeOfSplineCurve, entity.knotValues, 100);

    let line = new paperView.Path({ strokeWidth: 1 / 3, strokeColor: color });

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      line.add(new paperView.Point(point.x, -point.y));
    }
    line = line.reduce();
    line.simplify(0.0001);
    return line;
  }

  /**
   * Interpolate a b-spline. The algorithm examins the knot vector
   * to create segments for interpolation. The parameterisation value
   * is re-normalised back to [0,1] as that is what the lib expects (
   * and t i de-normalised in the b-spline library)
   *
   * @param controlPoints the control points
   * @param degree the b-spline degree
   * @param knots the knot vector
   * @returns the polyline
   */
  function getBSplinePolyline(controlPoints, degree, knots, interpolationsPerSplineSegment, weights) {
    const polyline = [];
    const controlPointsForLib = controlPoints.map(function (p) {
      return [p.x, p.y];
    });

    const segmentTs = [knots[degree]];
    const domain = [knots[degree], knots[knots.length - 1 - degree]];

    for (let k = degree + 1; k < knots.length - degree; ++k) {
      if (segmentTs[segmentTs.length - 1] !== knots[k]) {
        segmentTs.push(knots[k]);
      }
    }

    interpolationsPerSplineSegment = interpolationsPerSplineSegment || 25;
    for (let i = 1; i < segmentTs.length; ++i) {
      const uMin = segmentTs[i - 1];
      const uMax = segmentTs[i];
      for (let k = 0; k <= interpolationsPerSplineSegment; ++k) {
        const u = (k / interpolationsPerSplineSegment) * (uMax - uMin) + uMin;
        // Clamp t to 0, 1 to handle numerical precision issues
        let t = (u - domain[0]) / (domain[1] - domain[0]);
        t = Math.max(t, 0);
        t = Math.min(t, 1);
        const p = bSpline(t, degree, controlPointsForLib, knots, weights);
        polyline.push({ x: p[0], y: p[1] });
      }
    }
    return polyline;
  }

  function drawLine(entity, data) {
    let points = [];
    let color = getColor(entity, data);
    let material, lineType, vertex, startPoint, endPoint, bulgeGeometry, bulge, i;

    if (!entity.vertices) return console.log('entity missing vertices.');

    // create geometry

    for (let i = 0; i < entity.vertices.length; i++) {
      if (entity.vertices[i].bulge) {
        bulge = entity.vertices[i].bulge;
        startPoint = entity.vertices[i];
        endPoint = i + 1 < entity.vertices.length ? entity.vertices[i + 1] : points[0];

        let bulgePoints = getBulgeCurvePoints(startPoint, endPoint, bulge);
        points.push.apply(points, bulgePoints);
      } else {
        vertex = entity.vertices[i];
        points.push({ x: vertex.x, y: vertex.y });
      }
    }

    const line = new paperView.Path({ strokeWidth: 1 / 3, strokeColor: color });

    // set material
    if (entity.lineType) {
      lineType = data.tables.lineType.lineTypes[entity.lineType];
    }

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      line.add(new paperView.Point(point.x, -point.y));
    }

    if (entity.shape) line.closed = true;

    return line.reduce();
  }

  function drawArc(entity, data) {
    let startAngle, endAngle, throughAngle;
    const color = getColor(entity, data);

    if (entity.type === 'CIRCLE') {
      const circle = new paperView.Path.Circle(new paperView.Point(entity.center.x, -entity.center.y), entity.radius);
      circle.strokeColor = color;
      circle.strokeWidth = 1 / 3;
      return circle;
    } else {
      startAngle = -(entity.startAngle * 180) / Math.PI;
      endAngle = -(entity.endAngle * 180) / Math.PI;
      throughAngle = (startAngle + endAngle) / 2;

      const centerPoint = new paperView.Point(entity.center.x, -entity.center.y);

      const from = centerPoint.add({ length: entity.radius, angle: startAngle });
      const through = centerPoint.add({ length: entity.radius, angle: throughAngle });
      const to = centerPoint.add({ length: entity.radius, angle: endAngle });

      const arc = new paperView.Path.Arc(from, through, to);
      arc.strokeColor = color;
      arc.strokeWidth = 1 / 3;

      return arc.reduce();
    }
  }

  function drawSolid(entity, data) {
    const color = getColor(entity, data);
    const points = entity.points;
    const line1 = new paperView.Path({ strokeWidth: 1 / 3, strokeColor: color, fillColor: color });
    const line2 = new paperView.Path({ strokeWidth: 1 / 3, strokeColor: color, fillColor: color });

    line1.add(new paperView.Point(points[0].x, -points[0].y));
    line1.add(new paperView.Point(points[1].x, -points[1].y));
    line1.add(new paperView.Point(points[2].x, -points[2].y));
    line2.add(new paperView.Point(points[1].x, -points[1].y));
    line2.add(new paperView.Point(points[2].x, -points[2].y));
    line2.add(new paperView.Point(points[3].x, -points[3].y));

    const lines = new paperView.Group([line1, line2]);

    return lines;
  }

  function drawText(entity, data) {
    return;
    const svg = font
      .getPath(entity.text, entity.startPoint.x, -entity.startPoint.y, entity.textHeight * (72 / 96) || 16)
      .toSVG();
    const text = new paperView.Path().importSVG(svg);
    text.text = entity.text;
    text.fillColor = getColor(entity, data);
    text.fontSize = entity.textHeight + 'pt' || '12pt';
    if (entity.rotation) {
      text.rotate(-entity.rotation);
    }

    return text;
  }

  function drawPoint(entity, data) {
    const color = getColor(entity, data);
    const circle = new paperView.Path.Circle(new paperView.Point(entity.position.x, -entity.position.y), 1 / 3);
    circle.fillColor = color;
    circle.strokeWidth = 1 / 3;
    return circle;
  }

  function drawDimension(entity, data) {
    return;

    let block = data.blocks[entity.block];

    if (!block || !block.entities) return null;

    let group = new THREE.Object3D();
    // if(entity.anchorPoint) {
    //     group.position.x = entity.anchorPoint.x;
    //     group.position.y = entity.anchorPoint.y;
    //     group.position.z = entity.anchorPoint.z;
    // }

    for (let i = 0; i < block.entities.length; i++) {
      let childEntity = drawEntity(block.entities[i], data, group);
      if (childEntity) group.add(childEntity);
    }

    return group;
  }

  function drawBlock(entity, data) {
    let block = data.blocks[entity.name];

    if (!block.entities) return null;

    let group = new paperView.Group();

    for (let i = 0; i < block.entities.length; i++) {
      let childEntity = drawEntity(block.entities[i], data);
      if (block.entities[i].center)
        group.pivot = new paperView.Point(block.entities[i].center.x, block.entities[i].center.y);
      if (childEntity) group.addChild(childEntity);
    }

    group.name = entity.name;

    if (entity.rotation) {
      const angle = -entity.rotation;
      group.rotate(angle);
    }

    if (entity.xScale) group.scale(entity.xScale, 0);
    if (entity.yScale) group.scale(0, entity.yScale);

    if (entity.position) {
      group.translate(new paperView.Point(entity.position.x, -entity.position.y));
    }
    return group;
  }

  function getColor(entity, data) {
    let color = 0x000000; //default
    if (entity.color) color = entity.color;
    else if (data.tables && data.tables.layer && data.tables.layer.layers[entity.layer])
      color = data.tables.layer.layers[entity.layer].color;

    if (color == null || color === 0xffffff) {
      color = 0x000000;
    }
    return '#' + color.toString(16).padStart(6, '0');
  }

  function createLineTypeShaders(data) {
    let ltype, type;
    if (!data.tables || !data.tables.lineType) return;
    let ltypes = data.tables.lineType.lineTypes;

    for (type in ltypes) {
      ltype = ltypes[type];
      if (!ltype.pattern) continue;
      ltype.material = createDashedLineShader(ltype.pattern);
    }
  }

  function createDashedLineShader(pattern) {
    let i,
      dashedLineShader = {},
      totalLength = 0.0;

    for (i = 0; i < pattern.length; i++) {
      totalLength += Math.abs(pattern[i]);
    }

    dashedLineShader.uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib['common'],
      THREE.UniformsLib['fog'],

      {
        pattern: { type: 'fv1', value: pattern },
        patternLength: { type: 'f', value: totalLength },
      },
    ]);

    dashedLineShader.vertexShader = [
      'attribute float lineDistance;',

      'varying float vLineDistance;',

      THREE.ShaderChunk['color_pars_vertex'],

      'void main() {',

      THREE.ShaderChunk['color_vertex'],

      'vLineDistance = lineDistance;',

      'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

      '}',
    ].join('\n');

    dashedLineShader.fragmentShader = [
      'uniform vec3 diffuse;',
      'uniform float opacity;',

      'uniform float pattern[' + pattern.length + '];',
      'uniform float patternLength;',

      'varying float vLineDistance;',

      THREE.ShaderChunk['color_pars_fragment'],
      THREE.ShaderChunk['fog_pars_fragment'],

      'void main() {',

      'float pos = mod(vLineDistance, patternLength);',

      'for ( int i = 0; i < ' + pattern.length + '; i++ ) {',
      'pos = pos - abs(pattern[i]);',
      'if( pos < 0.0 ) {',
      'if( pattern[i] > 0.0 ) {',
      'gl_FragColor = vec4(1.0, 0.0, 0.0, opacity );',
      'break;',
      '}',
      'discard;',
      '}',

      '}',

      THREE.ShaderChunk['color_fragment'],
      THREE.ShaderChunk['fog_fragment'],

      '}',
    ].join('\n');

    return dashedLineShader;
  }

  function findExtents(scene) {
    for (let child of scene.children) {
      let minX, maxX, minY, maxY;
      if (child.position) {
        minX = Math.min(child.position.x, minX);
        minY = Math.min(child.position.y, minY);
        maxX = Math.max(child.position.x, maxX);
        maxY = Math.max(child.position.y, maxY);
      }
    }

    return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
  }
}

// Show/Hide helpers from https://plainjs.com/javascript/effects/hide-or-show-an-element-42/
// get the default display style of an element
function defaultDisplay(tag) {
  let iframe = document.createElement('iframe');
  iframe.setAttribute('frameborder', 0);
  iframe.setAttribute('width', 0);
  iframe.setAttribute('height', 0);
  document.documentElement.appendChild(iframe);

  let doc = (iframe.contentWindow || iframe.contentDocument).document;

  // IE support
  doc.write();
  doc.close();

  let testEl = doc.createElement(tag);
  doc.documentElement.appendChild(testEl);
  let display = (window.getComputedStyle ? getComputedStyle(testEl, null) : testEl.currentStyle).display;
  iframe.parentNode.removeChild(iframe);
  return display;
}

// actual show/hide function used by show() and hide() below
function showHide(el, show) {
  let value = el.getAttribute('data-olddisplay'),
    display = el.style.display,
    computedDisplay = (window.getComputedStyle ? getComputedStyle(el, null) : el.currentStyle).display;

  if (show) {
    if (!value && display === 'none') el.style.display = '';
    if (el.style.display === '' && computedDisplay === 'none') value = value || defaultDisplay(el.nodeName);
  } else {
    if ((display && display !== 'none') || !(computedDisplay == 'none'))
      el.setAttribute('data-olddisplay', computedDisplay == 'none' ? display : computedDisplay);
  }
  if (!show || el.style.display === 'none' || el.style.display === '') el.style.display = show ? value || '' : 'none';
}

// helper functions
function show(el) {
  showHide(el, true);
}
function hide(el) {
  showHide(el);
}
