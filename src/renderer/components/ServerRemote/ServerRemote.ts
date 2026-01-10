// @ts-ignore
// @ts-nocheck
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';

import ip from 'ip';
import QRCode from 'qrcode';

const PORT = 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  pingTimeout: 3000
});

let connections = 0;

export default class ServerRemote {
  private connections = 0;
  constructor() {
    this.init();
    this.events();
  }

  private init() {
    const address = `http://${ip.address()}:${PORT}/`;
    console.log(address);
    this.generateQR(address);

    io.on('connection', (socket) => {
      this.connections++;
      if (typeof this.onConnect === 'function') this.onConnect(this.connections);

      socket.on('event', (event) => {
        if (typeof this.onCommand === 'function') this.onCommand(event);
      });

      socket.on('disconnect', (s) => {
        this.connections--;
        this.onDisconnectCB();
      });
    });

    app.use(express.static(path.join(__dirname, 'client')));

    server.listen(PORT, () => {
      console.log('listening on *:' + PORT);
    });
  }

  private events() {}

  private onDisconnectCB() {
    if (typeof this.onDisconnect === 'function') this.onDisconnect(this.connections);
  }

  private async generateQR(text) {
    try {
      const qr = await QRCode.toDataURL(text);
      if (qr) {
        if (typeof this.onQR === 'function') this.onQR(qr);
      }
    } catch (err) {
      console.error(err);
    }
  }
}
