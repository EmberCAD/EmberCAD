/**
 * codec64
 * unique tag generator - new number from base -> 64 = 10
 */

const base = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-';

let uIdSessionCounter = 1;

const uId = (prefix) => {
  let result = (prefix || '') + v2r(Date.now());
  result += uIdSessionCounter++;
  return result;
};

const uIdRand = (prefix) => {
  let result = (prefix || '') + v2r(Date.now()) + v2r(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
  result += uIdSessionCounter++;
  return result;
};

////////////////////////////////////////////////////////////////////////////////

const strCode = (txt) => {
  let result = '';
  for (let i = 0; i < txt.length; i++) {
    const code = txt.charCodeAt(i) + 64 + (i % 64);
    result += v2r(code);
  }
  return result;
};

const strDecode = (txt) => {
  let result = '';
  let j = 0;
  for (let i = 0; i < txt.length; i += 2) {
    result += String.fromCharCode(r2v(txt.substr(i, 2)) - 64 - (j % 64));
    j++;
  }
  return result;
};

////////////////////////////////////////////////////////////////////////////////

const v2r = (n) => {
  var b = base.length;
  var digits = n == 0 ? '0' : '';

  while (n > 0) {
    digits = base.charAt(n % b) + digits;
    n = Math.floor(n / b);
  }
  return digits;
};

const r2v = (digits) => {
  var b = base.length;
  var n = 0;
  for (let d = 0; d < digits.length; d++) {
    n = b * n + base.indexOf(digits.charAt(d));
  }
  return n;
};

export const codec64 = {
  v2r,
  r2v,
  uId,
  uIdRand,
  strCode,
  strDecode
};
