// @ts-ignore
// @ts-nocheck
export default class GMock {
  write(txt: string) {
    this.doMove().then((res) => {
      if (typeof this.onFeedback === 'function') this.onFeedback('ok');
    });
  }

  private doMove() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 59);
    });
  }
}
