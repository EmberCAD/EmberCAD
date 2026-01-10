import Panel from '../Panel/Panel';
import Component from '../Component/Component';
import { codec64 } from '../../api/cherry/codec64';
import { OR_VERTICAL } from '../../api/declare_common';
import Splitter from '../Splitter/Splitter';

/**
 * Base class for containers
 */
export default class Container extends Component {
  constructor(id) {
    super(id);
  }

  _divide(parent, divides, direction, minSizes, splitId) {
    let res = [];
    let uid = parent || parent.uid;
    let obj = parent;
    this.minSizes = minSizes;
    if (!obj.type) {
      obj = App.form;
    }

    if (typeof obj !== 'object') {
      let cont = document.body.querySelector(`[uid="${uid}"]`);

      if (cont) {
        obj = {};
        obj.cont = cont;
        obj.type = obj.cont.getAttribute('type');
      }
    }

    if (!obj) return;
    //log(obj);

    let type = obj.type.toLowerCase();

    if (type == 'panel' || type == 'listview' || type == 'treeview' || type == 'form' || 'view') {
      /// remove old divide
      let currDivide = obj.cont.getAttribute('divides');
      let divs = obj.cont.querySelectorAll(`[divide="${currDivide}"]`);
      if (divs)
        divs.forEach((div) => {
          div.remove();
        });

      ///
      let divide = codec64.uId();
      direction == OR_VERTICAL ? (obj.flexDirection = 'column') : (obj.flexDirection = 'row');
      obj.cont.setAttribute('divides', divide);
      obj.cont.setAttribute('direction', obj.flexDirection);

      if (splitId !== undefined) obj.cont.setAttribute('splitid', splitId);
      obj.cont.style.flexDirection = obj.flexDirection;

      for (let i = 0; i < divides; i++) {
        let div = new Panel(obj);
        div.position = 'relative';
        div._data.divide = divide;
        div.setAttribute('divide', divide);
        div._data.remove = true;
        div.left = 0;
        div.top = 0;
        if (direction == OR_VERTICAL) {
          div.height = 100 / divides + '%';
          div.width = '100%';
        } else {
          div.width = 100 / divides + '%';
          div.height = '100%';
        }
        res.push(div);
      }
    }
    return res;
  }

  _addSplit(obj) {
    if (!obj) {
      let cont = document.body.querySelector(`[uid="${uid}"]`);
      if (cont) {
        obj = {};
        obj.cont = cont;
        obj.flexDirection = cont.getAttribute('direction');
        cont.style.flexDirection = cont.getAttribute('direction');
      }
    }
    const splitId = obj.cont.getAttribute('splitid');
    const currDivide = obj.cont.getAttribute('divides');
    const divides = Array.from(obj.cont.querySelectorAll(`[divide="${currDivide}"]`));

    const options = {
      minSize: this.minSizes || 200,
      gutterSize: 1,
      snapOffset: 0,
      splitId,
      onDrag: (ab) => {
        if (typeof this._onSplitChange == 'function') this._onSplitChange(ab);
      },
    };

    if (obj.flexDirection == 'column') options['direction'] = OR_VERTICAL;

    this._splitter = new Splitter(divides, options);

    this.splitSizes(
      divides.map(function () {
        return 100 / divides.length;
      }),
    );
  }

  splitSizes(p) {
    this._splitter.setSizes(p);
  }

  get splitter() {
    return this._splitter;
  }
}
