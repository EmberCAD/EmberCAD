export const gSelectorTable = []; /// csschPath
export const log = console.log;
export const gListOfCssRules = [];

// components helpers
export const alNone = 'alNone';
export const alClient = 'alClient';
export const alTop = 'alTop';
export const alRight = 'alRight';
export const alBottom = 'alBottom';
export const alLeft = 'alLeft';

export const anTopLeft = 'anTopLeft';
export const anTop = 'anTop';
export const anTopRight = 'anTopRight';
export const anRight = 'anRight';
export const anBottomRight = 'anBottomRight';
export const anBottom = 'anBottom';
export const anBottomLeft = 'anBottomLeft';
export const anLeft = 'anLeft';

//// prevent middle button scroll

document.addEventListener('mousedown', (e) => {
  if (e.button == 1) e.preventDefault();
});

// GUI Helpers

export const sleep = (time) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

export const getId = (sTag) => {
  return document.getElementById(sTag);
};

export const crEl = (k, opt, parent) => {
  let el = document.createElement(k);
  if (opt) {
    let opts = Object.entries(opt);

    for (let i = 0; i < opts.length; i++) {
      let key = opts[i][0];
      let value = opts[i][1];
      el.setAttribute(key, value);
    }
  }
  if (parent) {
    parent.appendChild(el);
  }
  return el;
};

export const crDiv = (opt, parent) => {
  let el = crEl('div', opt, parent);
  return el;
};

export const CtrlCmd = (e) => {
  return e.ctrlKey || e.metaKey;
};

export const DeepCopy = (obj) => {
  if (!obj) return {};
  return JSON.parse(JSON.stringify(obj));
};

export const numberToPx = (v) => (typeof v === 'string' || v === null ? v : v + 'px');
export const pxToNumber = (v) => Number(v.replace('px', ''));
export const computedStyleToNumber = (element, style) => pxToNumber(window.getComputedStyle(element)[style]);

/// css advanced switcher

export const setCssAdv = (selector, value) => {
  let cssRule;
  if (!gSelectorTable[selector]) {
    for (let i = 0; i < document.styleSheets.length; i++) {
      let cssStyles = document.styleSheets[i];
      cssRule = findCssRule(cssStyles, selector);
      gSelectorTable[selector] = cssRule;
      if (cssRule) break;
    }
  } else {
    cssRule = gSelectorTable[selector];
  }
  if (cssRule) cssRule.style[value.style] = value.value;
};

export const getListOfCssRules = () => {
  let start = Array.from(document.styleSheets);
  start.forEach((styleSheet) => {
    listCssRules(styleSheet);
  });
  return gListOfCssRules;
};

export const listCssRules = (cssRule) => {
  for (let i = 0; i < cssRule.rules.length; i++) {
    if (cssRule.rules[i].styleSheet) {
      listCssRules(cssRule.rules[i].styleSheet);
    } else if (cssRule.rules[i] && cssRule.rules[i].styleMap) {
      for (let j = 0; j < cssRule.rules[i].styleMap.size; j++) {
        if (cssRule.rules[i].style[j].indexOf('--') == 0) {
          let style = cssRule.rules[i].style[j];
          let cssText = cssRule.rules[i].cssText;
          let idx = cssText.indexOf(style);
          let semicolon = cssText.indexOf(';', idx);
          let result = cssText.substring(idx, semicolon).split(':');
          gListOfCssRules[result[0].trim()] = result[1].trim();
        }
      }
    }
  }
};

export const findCssRule = (cssRule, selector) => {
  for (let i = 0; i < cssRule.rules.length; i++) {
    if (cssRule.rules[i].selectorText != undefined || !cssRule.rules[i].styleSheet) {
      if (cssRule.rules[i].selectorText == selector) {
        return cssRule.rules[i];
      }
    } else {
      let find = findCssRule(cssRule.rules[i].styleSheet, selector);
      if (find != undefined) return find;
    }
  }
};

export const getComputedCSSStyle = (className, styleName) => {
  return parseInt(findCssRule(document.styleSheets[0], className).style[styleName]);
};

export const resetApp = () => {
  localStorage.removeItem(__CHERRYLAUNCH__);

  if (isWeb) {
    location.reload();
  } else {
    window.onbeforeunload = null;
    mainProcess.webContents.reloadIgnoringCache();
  }
};

export const remToPixels = (rem) => {
  // get the current font size
  const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

  // calculate the pixel value
  const pixels = rem * fontSize;

  // return the pixel value rounded to 2 decimal places
  return Number(pixels.toFixed(2));
};

export const rnd = (max) => {
  return Math.floor(Math.random() * (max + 1));
};

export const firstLetterUpper = (name) => {
  if (!name) return '';
  return name.substr(0, 1).toUpperCase() + name.substr(1);
};

export const firstLetterLower = (name) => {
  if (!name) return '';
  return name.substr(0, 1).toLowerCase() + name.substr(1);
};

export const boxOverlap = (a, b) => {
  return overlap(a.x1, a.x2, b.x1, b.x2) && overlap(a.y1, a.y2, b.y1, y.y2);
};

export const ch = () => {
  let ch = 'c h e r r y  j s';
};
