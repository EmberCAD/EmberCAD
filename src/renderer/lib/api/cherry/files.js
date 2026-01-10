import * as path from 'path';
import * as fs from 'fs';

// file system

export const chPath = {};

chPath.join = (...args) => {
  let res = '';
  args.forEach((arg, i) => {
    res += arg;
    if (i < args.length - 1) res += '/';
  });
  return res;
};

export const requireComponent = (name) => {
  return require(path.join(COMPONENTS, name, name + '.js'));
};
export const requireVendorComponent = (name) => {
  return require(path.join(VENDOR_COMPONENTS, name + '.js'));
};

export const fileExists = (name) => {
  try {
    fs.accessSync(name, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch (err) {
    return false;
  }
};

export const mkDir = (dir) => {
  try {
    fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK);
  } catch (err) {
    try {
      fs.mkdirSync(dir);
    } catch (err) {
      console.error(err);
    }
  }
};

export const deleteFolder = (pat, filesOnly) => {
  pat = pat.replace(/\\/g, '/');

  if (fs.existsSync(pat)) {
    try {
      fs.readdirSync(pat).forEach((file, index) => {
        var curPath = pat + '/' + file;
        if (fs.lstatSync(curPath).isDirectory()) {
          // recurse
          if (!filesOnly) deleteFolder(curPath);
        } else {
          // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(pat);
    } catch (error) {
      console.log(error);
    }
  }
};

export const loadSync = (fileName) => {
  const result = fs.readFileSync(fileName, 'utf8');
  return result;
};

export const load = (fileName) => {
  return new Promise((resolve, reject) => {
    if (isWeb) {
      let request = new XMLHttpRequest();
      request.open('GET', fileName, true);
      request.responseType = 'text';
      request.onload = () => {
        resolve(request.response);
      };
      request.onerror = (error) => {
        log(error);
        reject(error);
      };
      request.send();
    } else {
      resolve(loadSync(path.join(__dirname, fileName)));
    }
  });
};

export const loadFile = async (fileName) => {
  const result = await load(fileName);
  return result;
};

export const loadCSS = async (cssName) => {
  if (typeof REFPATH === 'string') {
    cssName = path.join(REFPATH, 'app', __STARTAPP__, cssName);
  }
  const cssFile = await loadFile(cssName);
  const css = document.createElement('style');
  css.innerHTML = cssFile;
  document.getElementsByTagName('body')[0].appendChild(css);
};

export const loadJSON = async (fname) => {
  const json = await loadFile(fname);
  return json;
};

export const getStartApp = () => {
  let json = JSON.parse(fs.readFileSync(path.join(__dirname, __BOOTUP__), 'utf8'));
  let ls = localStorage.getItem(__CHERRYLAUNCH__);
  if (ls) json.desktop = ls;
  return json.desktop;
};

export const getStartAppWeb = async () => {
  let fname = path.join(REFPATH, __BOOTUP__);
  try {
    let json = await loadJSON(fname);
    if (json) json = JSON.parse(json);
    let ls = localStorage.getItem(__CHERRYLAUNCH__);
    if (ls) json.web = ls;
    return json.web;
  } catch (error) {
    log('JSON loading error: ', fname);
  }
};
