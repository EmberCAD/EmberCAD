/*
    App Distribution helper

    Bundler (--bundle as parameter)
    - prepares bundle directory
    - empties dist directory
    - copies app
    - minifies JS files with uglify-es

    Deployer (--deploy as parameter)
    - uploads required files from dist folder do FTP server (config defined in .env.json)

 */

const PJ_INDEX_PLAIN = 'index.js';
const PJ_INDEX_BUNDLED = 'bundle/index.js';

const rimraf = require('rimraf');
const mkdirpsync = require('mkdirp-sync');
const UglifyJS = require('uglify-js');
const FileSystem = require('fs');
const Path = require('path');
const chalk = require('chalk');
const FTP = require('ftpimp');
const jetpack = require('fs-jetpack');
const yaml = require('js-yaml');

const args = process.argv.slice(2);
if (args[0] === '--bundle') {
  doBundle();
} else if (args[0] === '--deploy') {
  doDeploy();
} else if (args[0] === '--predist') {
  packageJsonMainChange(PJ_INDEX_BUNDLED);
} else if (args[0] === '--postdist') {
  packageJsonMainChange(PJ_INDEX_PLAIN);
} else if (args[0] === '--createPCreleaseJson') {
  createPCreleaseJSON();
} else {
  console.log(chalk.red('*** ERROR: parameter required (---bundle or ---deploy)'));
  process.exit(-1);
}

// ---------------------------------------------------
function createPCreleaseJSON() {
  try {
    const pcConf = yaml.safeLoad(FileSystem.readFileSync('dist/latest.yml', { encoding: 'utf-8' }));
    try {
      FileSystem.writeFileSync('dist/latest.json', JSON.stringify(pcConf, null, 2));
      console.log(chalk.green('- dist/latest.json created successfully from dist/latest.yml'));
    } catch (e) {
      console.log(chalk.red('*** ERROR: Cant parse dist/latest.yml or write latest.json'));
    }
  } catch (e) {
    console.log(chalk.yellow('*** NOTICE: skipping PC yml->json (maybe osx-only build was initiated)'));
    process.exit(0);
  }
}
function packageJsonMainChange(mainData) {
  const pj = FileSystem.readFileSync('package.json', { encoding: 'utf-8' });
  if (mainData === PJ_INDEX_BUNDLED) {
    FileSystem.writeFileSync('backup.package.json.bak', pj); // just in case
  }

  let pJson;
  try {
    pJson = JSON.parse(pj);
  } catch (e) {
    console.log(chalk.red('*** ERROR: cannot read from package.json (file corrupted?)'));
    process.exit(-1);
  }
  console.log(chalk.yellow('- changing package.json:main to: ' + mainData));
  pJson.main = mainData;
  try {
    FileSystem.writeFileSync('package.json', JSON.stringify(pJson, null, 2));
  } catch (e) {
    console.log(chalk.red('*** ERROR: cannot write to package.json !!!! - check file for corruption'));
    process.exit(-1);
  }
}

function doDeploy() {
  // get config from .env.json (not in repo)
  const env = FileSystem.readFileSync('.env.json', { encoding: 'utf-8' });
  let cfg;
  if (!env) {
    console.log(chalk.red('*** ERROR: no .env.json file!'));
    process.exit(-1);
  } else {
    try {
      cfg = JSON.parse(env);
    } catch (e) {
      console.log(chalk.red('*** ERROR: .env.json file corrupted (not proper JSON file)'));
      process.exit(-1);
    }

    const ftpConfig = {
      host: cfg.autoupdate.deployHost,
      port: 21,
      user: cfg.autoupdate.deployHostUsername,
      pass: cfg.autoupdate.deployHostPassword,
      debug: false,
    };

    let filesToUpload = getFilesByExtFlat('dist', '.exe')
      .map((el) => {
        return { dir: 'dist/', name: el };
      })
      .concat(
        getFilesByExtFlat('dist', '.json').map((el) => {
          return { dir: 'dist/', name: el };
        }),
      )
      .concat(
        getFilesByExtFlat('dist', '.yml').map((el) => {
          return { dir: 'dist/', name: el };
        }),
      )
      .concat(
        getFilesByExtFlat('dist', '.zip').map((el) => {
          return { dir: 'dist/', name: el };
        }),
      )
      .concat(
        getFilesByExtFlat('dist', '.dmg').map((el) => {
          return { dir: 'dist/', name: el };
        }),
      );

    if (!filesToUpload.length) {
      console.log(chalk.red('*** ERROR: no files to upload (empty dist dir?)'));
      process.exit(-1);
    }

    console.log(chalk.green(`*** Starting upload to FTP deployment server [ ${filesToUpload.length} file(s) ]`));

    const ftp = FTP.create(ftpConfig);
    let filesCtr = filesToUpload.length;
    console.log(chalk.yellow(`> Trying to connect to deployment server...`));
    ftp.connect(() => {
      console.log(chalk.green(`> FTP connected`));
      filesToUpload.forEach((el) => {
        console.log(chalk.blue(`> uploading file: ` + el.dir + el.name));
        ftp.put([el.dir + el.name, '/' + el.name], (err, filename) => {
          console.log(chalk.green(`> done: ` + filename));
          if (!--filesCtr) {
            console.log(chalk.green(`*** Upload finished`));
            process.exit(0);
          }
        });
      });
    });
  }
}
// ---------------------------------------------------

function doBundle() {
  const foldersToClear = ['bundle', 'dist'];
  const foldersToCreate = ['bundle'];
  const dirsToCopy = ['app', 'lib'];

  console.log(chalk.green('*** Starting Bundle/Minify module'));

  console.log(chalk.blue('- emptying/creating directories'));
  foldersToClear.forEach((el) => {
    try {
      rimraf.sync(el);
    } catch (e) {
      console.log(chalk.red('*** ERROR cleaning directories, make sure that theres no lock on bundle/dist directories'));
      process.exit(-1);
    }
  });
  foldersToCreate.forEach((el) => {
    mkdirpsync(el);
  });

  console.log(chalk.blue('- copying bundle content'));
  jetpack.copy('index.js', 'bundle/index.js');
  jetpack.copy('index.html', 'bundle/index.html');
  jetpack.copy('bootup.json', 'bundle/bootup.json');

  dirsToCopy.forEach((el) => {
    jetpack.copy(el, 'bundle/' + el);
  });
  doUglify();
  copyBin();
  console.log(chalk.green('*** Bundle created successfully'));
}

// ---------------------------------------------------------

function doUglify() {
  console.log(chalk.blue('- fetching files to process'));
  const filesToProcess = getFilesByExt('bundle', '.js');
  if (filesToProcess && filesToProcess.length) {
    console.log(chalk.green('- found ' + filesToProcess.length + ' file(s)'));
    filesToProcess.forEach((el) => {
      const f = FileSystem.readFileSync(el, 'utf8');
      if (!f) {
        console.log(chalk.red('Cannot read file: ' + el));
        process.exit(-1);
      }
      const uf = UglifyJS.minify(f, {
        compress: {},
        mangle: {
          toplevel: false,
        },
        nameCache: {},
      });
      if (uf.error) {
        console.log(chalk.red('UglifyJS ERROR: ' + uf.error));
        process.exit(-1);
      }

      FileSystem.writeFileSync(el, uf.code, 'utf8');
    });
  } else {
    console.log(chalk.red('no files to Uglify'));
    process.exit(-1);
  }
}

function readDirR(dir) {
  return FileSystem.statSync(dir).isDirectory() ? Array.prototype.concat(...FileSystem.readdirSync(dir).map((f) => readDirR(Path.join(dir, f)))) : dir;
}

function getFilesByExt(dir, ext) {
  let filesArr = readDirR(dir);
  if (filesArr) {
    filesArr = filesArr.filter((el) => el.indexOf(ext) !== -1 && el.indexOf(ext) === el.length - ext.length);
  }
  return filesArr;
}

function getFilesByExtFlat(dir, ext) {
  try {
    const list = FileSystem.readdirSync(dir);
    return list.filter((el) => el.indexOf(ext) !== -1 && el.indexOf(ext) === el.length - ext.length);
  } catch (e) {
    return [];
  }
}

function copyBin() {
  return;
  console.log(chalk.yellow('- copying platform bin dependencies'));

  if (process.arch !== 'x64') {
    console.log(chalk.red('Only 64-bit deploys are supported'));
    console.log(chalk.red('Current architecture: ' + process.arch));
    process.exit(-1);
  }

  // cleanup before copy
  rimraf.sync('bundle/bin');

  switch (process.platform) {
    case 'win32':
      jetpack.copy('bin/x64', 'bundle/bin/x64');
      break;
    case 'darwin':
      jetpack.copy('bin/osx', 'bundle/bin/osx');
      break;
    default:
      console.log(chalk.red('Platform not supported, must be win32 or darwin'));
      console.log(chalk.red('Current platform: ' + process.platform));
      process.exit(-1);
  }
}
