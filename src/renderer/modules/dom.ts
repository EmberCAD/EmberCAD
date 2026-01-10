export const crEl = (element, parent, opt) => {
  let el = document.createElement(element);
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

export const crDiv = (parent, opt) => {
  let el = crEl('div', parent, opt);
  return el;
};

export interface ICallback<T> {
  (param: T): void;
}
