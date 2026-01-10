import Panel from '../../lib/components/Panel/Panel';

const LABEL_HEIGHT = 1.5;

export default class LabelPanel {
  private cont: any;
  private label: any;
  private body: any;
  private _text: any;

  constructor(private parent: any, private addTopBorder: boolean) {
    this.init();
  }

  private init() {
    this.cont = new Panel(this.parent);
    this.cont.position = 'relative';
    this.cont.width = '100%';
    this.cont.height = '100%';
    this.cont.flexDirection = 'column';

    this.label = new Panel(this.cont);
    this.label.position = 'relative';
    this.label.width = '100%';
    this.label.height = `${LABEL_HEIGHT}rem`;
    this.label.fontSize = '0.8rem';
    this.label.backgroundColor = 'var(--cherry-background-hint)';
    this.label.borderBottom = '1px solid var(--cherry-background-handle)';
    this.label.cont.style.boxShadow = '0px 6px 23px 1px rgba(0, 0, 0, .3)';
    this.label.zIndex = 1;

    if (this.addTopBorder) {
      this.label.borderTop = '1px solid var(--cherry-background-handle)';
    }

    this.body = new Panel(this.cont);
    this.body.position = 'relative';
    this.body.width = '100%';
    this.body.height = `calc(100% - ${LABEL_HEIGHT}rem)`;
  }

  set text(txt: string) {
    this._text = txt;
    this.label.text = txt;
    this.label.span.style.justifyContent = 'start';
    this.label.span.style.marginLeft = '1rem';
    this.label.span.style.marginTop = '0.05rem';
  }

  set capitals(op: boolean) {
    this.label.text = op ? this._text.toUpperCase() : this._text;
  }

  set isSub(op: boolean) {
    if (op) {
      this.label.backgroundColor = 'var(--cherry-background-header)';
      this.label.fontSize = '0.75rem';
    } else {
      this.label.backgroundColor = 'var(--cherry-background-hint)';
      this.label.fontSize = '0.8rem';
    }
  }
}
