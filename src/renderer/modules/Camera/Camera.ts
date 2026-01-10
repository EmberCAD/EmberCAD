//@ts-ignore
//@ts-nocheck
import { crEl } from '../dom';
import './Camera.scss';

export default class Camera {
  video: any;
  cameras: any;
  cameraTools: any;
  stream: any;
  playPromise: any;
  isPlaying: any;
  constructor(private parent) {
    this.init();
  }

  private init() {
    this.video = crEl('video', this.parent, { class: 'control-camera' });
  }

  set topTools(topTools) {
    this.cameraTools = topTools;
    this.getCameras();

    this.events();
  }

  ///////

  events() {
    this.cameraTools.onActivate = async (ch) => {
      if (!this.stream) await this.selectCamera(this.cameras[0]);
      if (ch) {
        this.play(this.stream);
      } else {
        this.pause(this.stream);
      }
    };

    this.cameraTools.onSelectCamera = async (idx) => {
      await this.selectCamera(this.cameras[idx]);
    };

    this.cameraTools.onSelectClick = async () => {
      this.getCameras();
    };

    this.cameraTools.onSelectOpacity = (opacity) => {
      this.video.style.opacity = opacity;
    };
  }

  ///////////////////////////////////////////////////////////////////////

  hide() {
    this.video.style.display = null;
  }

  ///////////////////////////////////////////////////////////////////////

  show() {
    this.video.style.display = 'block';
  }

  async getCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    this.cameras = devices.filter((device) => device.kind === 'videoinput');
    this.cameraTools.setCameras(this.cameras);
  }
  ///////////////////////////////////////////////////////////////////////

  async selectCamera(camera) {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: camera.deviceId } },
    });

    this.stream.getVideoTracks()[0].onended = () => {
      console.log('camera disconnected');
      setTimeout(async () => {
        await this.getCameras();
      }, 3000);
    };

    if (this.stream) this.play();
  }

  ///////////////////////////////////////////////////////////////////////

  setParentView(parentView) {
    parentView.appendChild(this.video);
  }

  ///////////////////////////////////////////////////////////////////////

  play() {
    if (!this.cameraTools.active || !this.stream) return;
    this.show();
    if (this.isPlaying) return;

    this.video.srcObject = this.stream;
    this.playPromise = this.video.play();
    this.isPlaying = true;
  }
  ///////////////////////////////////////////////////////////////////////

  pause() {
    this.hide();

    if (this.playPromise !== undefined) {
      this.playPromise.then((_) => {
        this.video.pause();
        this.isPlaying = false;
        // Stop all tracks to disconnect camera and turn off LED
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.video.srcObject = null;
          this.stream = null;
        }
      });
    }
  }

  ///////////////////////////////////////////////////////////////////////

  // async listCameraResolutions() {
  //   // Get a list of available video inputs
  //   const devices = await navigator.mediaDevices.enumerateDevices();
  //   const cameras = devices.filter((device) => device.kind === 'videoinput');

  //   // Prompt the user to select a camera
  //   const camera = cameras[0];
  //   const stream = await navigator.mediaDevices.getUserMedia({
  //     video: { deviceId: { exact: camera.deviceId } },
  //   });

  //   // Get the camera's capabilities
  //   const videoTrack = stream.getVideoTracks()[0];
  //   const capabilities = videoTrack.getCapabilities();

  //   // List the available resolutions
  //   console.log('Available resolutions:');
  //   for (const [key, value] of Object.entries(capabilities.width)) {
  //     console.log(`  ${key}: ${value}`);
  //   }
  // }

  // ///////////////////////////////////////////////////////////////////////

  // async logCameraCapabilities() {
  //   // Get a list of available video inputs
  //   const devices = await navigator.mediaDevices.enumerateDevices();
  //   const cameras = devices.filter((device) => device.kind === 'videoinput');

  //   // Prompt the user to select a camera
  //   const camera = cameras[0];
  //   const stream = await navigator.mediaDevices.getUserMedia({
  //     video: { deviceId: { exact: camera.deviceId } },
  //   });

  //   // Get the camera's capabilities
  //   const videoTrack = stream.getVideoTracks()[0];
  //   const capabilities = videoTrack.getCapabilities();

  //   // Log all the capabilities properties
  //   console.log('Camera capabilities:');
  //   for (const key of Object.keys(capabilities)) {
  //     console.log(`  ${key}:`, capabilities[key]);
  //   }
  // }

  // ///////////////////////////////////////////////////////////////////////

  // async listCameraFrameRates() {
  //   // Get a list of available video inputs
  //   const devices = await navigator.mediaDevices.enumerateDevices();
  //   const cameras = devices.filter((device) => device.kind === 'videoinput');

  //   // Prompt the user to select a camera
  //   const camera = cameras[0];
  //   const stream = await navigator.mediaDevices.getUserMedia({
  //     video: { deviceId: { exact: camera.deviceId } },
  //   });

  //   // Get the camera's capabilities
  //   const videoTrack = stream.getVideoTracks()[0];
  //   const capabilities = videoTrack.getCapabilities();

  //   // List the available frame rates
  //   console.log('Available frame rates:');
  //   for (const [key, value] of Object.entries(capabilities.frameRate)) {
  //     console.log(`  ${key}: ${value}`);
  //   }
  // }
}
