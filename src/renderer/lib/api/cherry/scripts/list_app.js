const fs = require('fs');
const path = require('path');

///// read directory
const SPACES = 40;

let files = fs.readdirSync('app');

console.log('Available applications:');
console.log('-'.repeat(SPACES + 15));
console.log('Name' + ' '.repeat(SPACES - 2) + 'Folder');
console.log('-'.repeat(SPACES + 15));
try {
  files = fs.readdirSync('app');
  for (let i = 0; i < files.length; i++) {
    let name = files[i];
    let stat = fs.statSync(path.join('app', name));
    let isDir = stat.isDirectory() ? 1 : 0;

    if (isDir && name !== 'launchpad') {
      try {
        let info = JSON.parse(fs.readFileSync(path.join('app', name, 'info.json')));
        const appName = info.application.name.replace(/\n/g, ' ');
        if (!info.application.hidden) console.log(appName, ' '.repeat(SPACES - appName.length), name);
      } catch (error) {}
    }
  }
} catch (error) {
  console.log(error);
}
console.log('-'.repeat(SPACES + 15));
