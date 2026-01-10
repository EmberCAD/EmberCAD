// @ts-ignore
// @ts-nocheck
Math.radians = deg2Rad;

function linspace(a, b, n) {
  let result = [];
  for (let i = 0; i < n; i++) {
    result.push(a + (i * (b - a)) / (n - 1));
  }
  return result;
}

function involute_intersect_angle(Rb, R) {
  Rb = parseFloat(Rb);
  R = parseFloat(R);
  return Math.sqrt(Math.pow(R, 2) - Math.pow(Rb, 2)) / Rb - Math.acos(Rb / R);
}

function point_on_circle(radius, angle) {
  let x = radius * Math.cos(angle);
  let y = radius * Math.sin(angle);
  return [x, y];
}

function undercutMinTeeth(pitch_angle, k = 1.0) {
  let x = Math.max(Math.sin(Math.radians(pitch_angle)), 0.01);
  return (2 * k) / (x * x);
}

const PI = Math.PI;

function deg2Rad(degrees) {
  return (degrees * PI) / 180.0;
}

function rad2Deg(radians) {
  return (radians * 180.0) / PI;
}

function undercutMaxK(teeth, pitchAngle = 20.0) {
  const x = Math.max(Math.sin(deg2Rad(pitchAngle)), 0.01);
  return 0.5 * teeth * x * x;
}

function undercutMinAngle(teeth, k = 1.0) {
  return rad2Deg(Math.asin(Math.min(0.856, Math.sqrt((2.0 * k) / teeth))));
}

function haveUndercut(teeth, pitchAngle = 20.0, k = 1.0) {
  return teeth < undercutMinTeeth(pitchAngle, k);
}

function gearCalculations(numTeeth, circularPitch, pressureAngle, clearance = 0, ringGear = false, profileShift = 0.0) {
  const diametralPitch = PI / circularPitch;
  const pitchDiameter = numTeeth / diametralPitch;
  const pitchRadius = pitchDiameter / 2.0;
  let addendum = 1 / diametralPitch;
  let dedendum = addendum;
  dedendum *= 1 + profileShift;
  addendum *= 1 - profileShift;

  if (ringGear) {
    addendum = addendum + clearance;
  } else {
    dedendum = dedendum + clearance;
  }

  const baseRadius = (pitchDiameter * Math.cos(deg2Rad(pressureAngle))) / 2.0;
  const outerRadius = pitchRadius + addendum;
  const rootRadius = pitchRadius - dedendum;

  const toothThickness = (PI * pitchDiameter) / (2.0 * numTeeth);

  return [pitchRadius, baseRadius, addendum, dedendum, outerRadius, rootRadius, toothThickness];
}

function generateRackPoints(
  tooth_count,
  pitch,
  addendum,
  pressure_angle,
  base_height,
  tab_length,
  clearance = 0,
  draw_guides = false,
) {
  let spacing = 0.5 * pitch;
  let tas = Math.tan(Math.radians(pressure_angle)) * addendum;
  let tasc = Math.tan(Math.radians(pressure_angle)) * (addendum + clearance);
  let base_top = addendum + clearance;
  let base_bot = addendum + clearance + base_height;

  let x_lhs = -pitch * 0.5 * tooth_count - tab_length;
  let points = [];
  points.push([x_lhs, base_bot]);
  points.push([x_lhs, base_top]);
  let x = x_lhs + tab_length + tasc;

  for (let i = 0; i < tooth_count; i++) {
    points.push([x - tasc, base_top]);
    points.push([x + tas, -addendum]);
    points.push([x + spacing - tas, -addendum]);
    points.push([x + spacing + tasc, base_top]);
    x += pitch;
  }

  let x_rhs = x - tasc + tab_length;
  points.push([x_rhs, base_top]);
  points.push([x_rhs, base_bot]);

  let guide_path = null;
  let p = [];
  if (draw_guides) {
    p.push([x_lhs + 0.5 * tab_length, 0]);
    p.push([x_rhs - 0.5 * tab_length, 0]);
  }

  return [points, p];
}

function generateSpurPoints(
  teeth,
  baseRadius,
  pitchRadius,
  outerRadius,
  rootRadius,
  accuracyInvolute,
  accuracyCircular,
) {
  const halfThickAngle = (Math.PI * 2) / (4 * teeth);
  const pitchToBaseAngle = involuteIntersectAngle(baseRadius, pitchRadius);
  const pitchToOuterAngle = involuteIntersectAngle(baseRadius, outerRadius) - pitchToBaseAngle;

  const startInvoluteRadius = Math.max(baseRadius, rootRadius);
  const radii = linspace(startInvoluteRadius, outerRadius, accuracyInvolute);
  const angles = radii.map((r) => involuteIntersectAngle(baseRadius, r));

  const centers = Array.from({ length: teeth }, (_, i) => (i * 2 * Math.PI) / teeth);
  const points = [];

  for (const c of centers) {
    const pitch1 = c - halfThickAngle;
    const base1 = pitch1 - pitchToBaseAngle;
    const offsetAngles1 = angles.map((x) => base1 + x);
    const points1 = offsetAngles1.map((x) => pointOnCircle(radii[i], x));

    const pitch2 = c + halfThickAngle;
    const base2 = pitch2 + pitchToBaseAngle;
    const offsetAngles2 = angles.map((x) => base2 - x);
    const points2 = offsetAngles2.map((x) => pointOnCircle(radii[i], x));

    const pointsOnOuterRadius = linspace(
      offsetAngles1[offsetAngles1.length - 1],
      offsetAngles2[offsetAngles2.length - 1],
      accuracyCircular,
    ).map((x) => pointOnCircle(outerRadius, x));

    let pointsOnRoot;
    if (rootRadius > baseRadius) {
      const pitchToRootAngle = pitchToBaseAngle - involuteIntersectAngle(baseRadius, rootRadius);
      const root1 = pitch1 - pitchToRootAngle;
      const root2 = pitch2 + pitchToRootAngle;
      pointsOnRoot = linspace(root2, root1 + (2 * Math.PI) / teeth, accuracyCircular).map((x) =>
        pointOnCircle(rootRadius, x),
      );
      const pTmp = [
        ...points1,
        ...pointsOnOuterRadius.slice(1, -1),
        ...points2.reverse().slice(1),
        ...pointsOnRoot.slice(1, -1),
      ];
      points.push(...pTmp);
    } else {
      pointsOnRoot = linspace(base2, base1 + (2 * Math.PI) / teeth, accuracyCircular).map((x) =>
        pointOnCircle(rootRadius, x),
      );
      const pTmp = [...points1, ...pointsOnOuterRadius.slice(1, -1), ...points2.reverse(), ...pointsOnRoot];
      points.push(...pTmp);
    }
  }

  return points;
}

function inkbool(val) {
  return !['False', false, '0', 0, 'None', null].includes(val);
}

class OptionParser extends ArgumentParser {
  static types = {
    int: Number,
    float: Number,
    string: String,
    inkbool,
  };

  addOption(short, long_, options) {
    options.type = OptionParser.types[options.type];
    let names = [];
    if (short) {
      names.push(`-${short.replace('-', '_').slice(1)}`);
    }
    if (long_) {
      names.push(`--${long_.replace('-', '_').slice(2)}`);
    }
    this.addArgument(...names, options);
  }
}
