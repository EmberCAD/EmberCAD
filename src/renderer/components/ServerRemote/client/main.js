import { io } from './socket.io.esm.min.js';

const socket = io();
const noSleep = new NoSleep();

const button = document.createElement('button');
button.innerHTML = 'Connect';
document.body.appendChild(button);
let wakeEnabled = false;

button.onclick = () => {
  if (!wakeEnabled) {
    noSleep.enable();
    wakeEnabled = true;
  }
  if (!document.fullscreen) {
    if (document.body.requestFullscreen) {
      document.body.requestFullscreen({ navigationUI: 'hide' }).catch((err) => {
        document.body.style.backgroundColor = 'red';
      });
    }
  }
  button.innerHTML = 'Click!';
  socket.emit('event', { msg: 'hello from remote!' });
};
