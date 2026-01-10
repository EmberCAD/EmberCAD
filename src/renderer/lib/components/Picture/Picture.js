import { crEl } from '../../api/cherry/api';
import Component from '../Component/Component';

export default class Picture extends Component {
  constructor(id) {
    super(id);
    this._init();
    this._events();
    this.defaults();
  }

  _init() {
    this.customProps = [{ name: 'tint' }];

    this.cont.classList.add('ch-pictureCont');

    this.baseClass = 'ch-picture ch-flex100';

    this.canvas = crEl(
      'canvas',
      {
        class: this.baseClass,
        designswitch: ''
      },
      this.cont
    );

    this.canvas.setAttribute('type', 'picture');
    this.canvas.setAttribute('uid', this.uid);

    this.ctx = this.canvas.getContext('2d');
    this.autosize = true;
    this._updateState();

    this._cursorPos = { x: 0, y: 0 };
  }

  _events() {
    this.onStateChanged = () => {
      this._updateState();
    };
  }

  _updateState() {
    if (this.hint !== undefined) {
      this.canvas.setAttribute('hint', this.hint);
    }
    if (this.devhint !== undefined) {
      this.canvas.setAttribute('devhint', this.devhint);
    }
  }

  set tint(v) {
    this._data.tint = v;

    if (!this.tintPic) {
      this.tintPic = crEl('canvas');
      this.tintCtx = this.tintPic.getContext('2d');
    }
    this.tintPic.width = this.width;
    this.tintPic.height = this.height;

    this.tintCtx.fillStyle = v;
    this.tintCtx.fillRect(0, 0, this.width, this.height);
    this.tintCtx.globalCompositeOperation = 'multiply';
    this.tintCtx.drawImage(this.canvas, 0, 0);
    this.tintCtx.globalCompositeOperation = 'destination-atop';
    this.tintCtx.drawImage(this.canvas, 0, 0);
    this.ctx.drawImage(this.canvas, 0, 0);
    // this.ctx.globalAlpha = 0.9;
    this.ctx.drawImage(this.tintPic, 0, 0);
    this.tintCtx.globalCompositeOperation = '';
    this.ctx.globalCompositeOperation = '';
    delete this.tintPic;
  }

  get tint() {
    return this._data.tint;
  }

  defaults() {
    this.width = 320;
    this.height = 240;
    this.cls();
  }

  cls(col) {
    if (col != 'transparent') {
      col = col || 'black';
      this.ctx.fillStyle = col;
      this.ctx.fillRect(0, 0, this.width, this.height);
    } else {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }

    this._cursorPos = { x: 0, y: 0 };
    this.ctx.textBaseline = 'top';
  }

  set stroke(col) {
    this._stroke = col;
  }

  get stroke() {
    return this._stroke || 'white';
  }
  set fill(col) {
    this._fill = col;
  }

  get fill() {
    return this._fill || 'white';
  }

  set font(v) {
    this.ctx.font = v;
  }

  text(txt, x, y) {
    this.ctx.fillStyle = this.fill;
    this.ctx.fillText(txt, x, y);
  }

  strokeRect(x, y, w, h, lw) {
    this.ctx.strokeStyle = this.stroke;
    this.lineWidth = lw || 1;
    this.ctx.strokeRect(x, y, w, h);
  }
  set lineWidth(v) {
    this.ctx.lineWidth = v;
  }
  get lineWidth() {
    return this.ctx.lineWidth;
  }

  fillRect(x, y, w, h) {
    this.ctx.fillStyle = this.fill || 'white';
    this.ctx.fillRect(x, y, w, h);
  }

  moveTo(x, y) {
    this._cursorPos = { x, y };
  }

  lineTo(x, y) {
    this.ctx.strokeStyle = this.stroke || 'white';

    this.ctx.beginPath();
    this.ctx.moveTo(this._cursorPos.x, this._cursorPos.y);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();

    this.moveTo(x, y);
  }

  plot(x, y) {
    this.ctx.strokeStyle = this.stroke || 'white';

    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + this.lineWidth, y);
    this.ctx.stroke();
  }

  set width(v) {
    let unit = 'px';
    if (typeof v === 'string') unit = '';
    this._data.width = v;
    this.cont.style.width = v + unit;
    if (this.canvas && !this.autosize && this.image === undefined) {
      this.canvas.width = v;
      this.cls();
    }
  }

  get width() {
    return this._data.width;
  }

  set height(v) {
    let unit = 'px';
    if (typeof v === 'string') unit = '';
    this._data.height = v;
    this.cont.style.height = v + unit;
    if (this.canvas && !this.autosize && this.image === undefined) {
      this.canvas.height = v;
      this.cls();
    }
  }

  get height() {
    return this._data.height;
  }

  set autosize(v) {
    this._data.autosize = v;
  }

  get autosize() {
    return this._data.autosize;
  }

  async load(fname) {
    await this.loadPicture(fname);
    if (this.autosize) {
      this.autosize = true;
    }
  }

  // type: 'png' or 'jpeg'
  async save(fname, type) {
    await this.savePicture(fname, type || 'jpeg');
  }

  savePicture(fname, type) {
    return new Promise((resolve, reject) => {
      const url = this.canvas.toDataURL('image/' + type, 0.9);
      const base64Data = url.replace(/^data:image\/jpeg;base64,/, '').replace(/^data:image\/png;base64,/, '');

      fs.writeFileSync(fname, base64Data, 'base64', function (err) {
        console.log(err);
      });
      resolve(fname);
    });
  }

  loadPicture(fname) {
    this.image = new Image();
    // image.setAttribute('crossOrigin', '');
    return new Promise((resolve, reject) => {
      this.image.onload = () => {
        if (this.autosize) {
          this.width = this.image.naturalWidth;
          this.height = this.image.naturalHeight;
        } else {
          this.canvas.width = this.image.naturalWidth;
          this.canvas.height = this.image.naturalHeight;
        }
        this.naturalWidth = this.image.naturalWidth;
        this.naturalHeight = this.image.naturalHeight;
        this.cls('transparent');
        this.ctx.drawImage(this.image, 0, 0);
        resolve();
      };
      try {
        this.image.src = fname;
      } catch (error) {
        log(error);
      }
    });
  }

  copyFrom(srcPic, x, y, w, h, wr, hr) {
    if (x === undefined) {
      x = 0;
      y = 0;
      w = srcPic.canvas.width;
      h = srcPic.canvas.height;
      wr = this.canvas.width;
      hr = this.canvas.height;
    }
    this.ctx.imageSmoothingQuality = 'medium';
    this.ctx.imageSmoothingEnabled = true;

    if (wr === undefined) this.ctx.drawImage(srcPic.canvas, x, y, w, h, 0, 0, w, h);
    else this.ctx.drawImage(srcPic.canvas, x, y, w, h, 0, 0, wr, hr);

    //  if (this._data.tint) this.tint = this._data.tint;
  }

  copyTo(srcPic, x, y, w, h, wr, hr) {
    if (wr === undefined) this.ctx.drawImage(srcPic.canvas, 0, 0, w, h, x, y, w, h);
    else this.ctx.drawImage(srcPic.canvas, 0, 0, w, h, x, y, wr, hr);

    //  if (this._data.tint) this.tint = this._data.tint;
  }
}
