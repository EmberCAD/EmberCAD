import Container2 from '../../lib/components/Container2/Container2';
import Container3 from '../../lib/components/Container3/Container3';
import ContainerSized from '../../lib/components/ContainerSized/ContainerSized';
import { OR_VERTICAL, OR_HORIZONTAL } from '../../lib/api/declare_common';

export default class View {
  private mainView: any;
  protected leftView: any;

  protected workView: any;

  constructor(private parent: any, private id) {
    this.init();
  }

  private init() {
    this.mainView = new Container2(this.parent);
    this.mainView.divide = { direction: OR_HORIZONTAL };
    this.mainView.parts = [50, '%'];

    this.leftView = new ContainerSized(this.mainView.rightPart);
    this.leftView.split = {
      num: 2,
      direction: OR_HORIZONTAL,
      minSizes: [500, 420],
      splitId: this.id,
    };

    if (!localStorage.getItem(this.id)) this.leftView.splitter.setSizes([70, 30]);

    this.workView = {};

    this.workView.centerPart = this.leftView.leftPart;
    this.workView.rightPart = this.leftView.rightPart;

    this.workView.centerPart.borderRight = '1px solid #000';
  }
}
