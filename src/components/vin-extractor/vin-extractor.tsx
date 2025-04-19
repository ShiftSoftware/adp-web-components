import { Component, Prop, State, Watch, h, Host, Method, Element } from '@stencil/core';
import { log } from 'console';
import cn from '~lib/cn';

import { DotNetObjectReference } from '~types/components';

const CAPTURE_INTERVAL = 2000;
const ACTIVE_CAMERA_ID_KEY = 'activeCameraId';

@Component({
  shadow: true,
  tag: 'vin-extractor',
  styleUrl: 'vin-extractor.css',
})
export class VinExtractor {
  @Prop() isOpen: boolean = false;

  @Prop() useOcr: boolean = false;
  @Prop() readQrcode: boolean = false;
  @Prop() readBarcode: boolean = false;

  @Prop() captureInterval: number = CAPTURE_INTERVAL;

  @Prop() onExtract?: ((vin: string) => void) | string;
  @Prop() onError?: ((newError: Error) => void) | string;

  @State() isCameraReady: boolean = false;
  @State() blazorRef?: DotNetObjectReference;
  @State() videoInputs: MediaDeviceInfo[] = [];
  @State() activeCameraId: string = localStorage.getItem(ACTIVE_CAMERA_ID_KEY) || '';

  @Element() el: HTMLElement;

  @State() streamRef: MediaStream;
  private videoPlayer: HTMLVideoElement;
  private abortController: AbortController;
  private firstCaptureTimeoutRef: ReturnType<typeof setTimeout>;

  async componentDidLoad() {
    this.videoPlayer = this.el.shadowRoot.querySelector('.video-player');
  }

  @Method()
  setBlazorRef(newBlazorRef: DotNetObjectReference) {
    this.blazorRef = newBlazorRef;
  }

  triggerCallback = (callback: any, ...args: any[]) => {
    if (callback) {
      if (typeof callback === 'function') callback(...args);
      else if (this.blazorRef && typeof callback === 'string' && !!callback) this.blazorRef?.invokeMethodAsync(callback, ...args);
    }
  };

  handleError = (error: any) => {
    this.triggerCallback(this.onError, error as Error);
  };

  handleExtract = (vin: string) => {
    this.triggerCallback(this.onExtract, vin);
  };

  captureFrame = () => {
    if (!this.isOpen) return;

    console.log('captureFrame');
  };

  openScanner = async () => {
    try {
      this.abortController?.abort();
      this.abortController = new AbortController();

      const permissionStatus = await navigator.permissions.query({
        // @ts-ignore
        name: 'camera',
      });

      if (permissionStatus.state === 'prompt') {
        try {
          await navigator.mediaDevices.getUserMedia({
            video: true,
          });
        } catch (error) {
          throw new Error('no camera access');
        }
      }

      if (permissionStatus.state === 'denied') {
        throw new Error('no camera access');
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => {
        if (device.kind !== 'videoinput') return false;

        // TODO: this code only works for IOS however android has no standards

        // const label = device.label.toLowerCase();
        // const hasDirection = label.includes('front') || label.includes('back');
        // const isValid = label.includes('front camera') || label.includes('back camera');

        // return hasDirection ? isValid : true;
        return true;
      });

      if (videoInputs.length === 0) throw new Error('No Camera Found');

      this.videoInputs = videoInputs;

      if (!videoInputs.some(input => input.deviceId === this.activeCameraId)) {
        const selectedCamera = videoInputs.find(({ label }) => label.toLowerCase().includes('back') || label.toLowerCase().includes('environment')) || videoInputs[0];

        this.activeCameraId = selectedCamera.deviceId;

        localStorage.setItem(ACTIVE_CAMERA_ID_KEY, this.activeCameraId);
      }

      await this.startCamera();

      this.firstCaptureTimeoutRef = setTimeout(() => this.captureFrame(), this.captureInterval + 300);

      if (document) document.body.style.overflow = 'hidden';

      this.isCameraReady = true;
    } catch (error) {
      this.handleError(error);
    }
  };

  startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: this.activeCameraId,
        },
      };

      this.streamRef = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.videoPlayer) {
        this.videoPlayer.srcObject = this.streamRef;
        this.videoPlayer.play();
      }
    } catch (error) {
      console.error(error);
      throw new Error('Error accessing camera: ');
    }
  };

  closeScanner = () => {
    this.isCameraReady = false;
    this.abortController.abort();
    clearTimeout(this.firstCaptureTimeoutRef);
    if (document) document.body.style.overflow = 'auto';
    // 300ms delay for animation to be done
    setTimeout(this.stopCamera, 300);
  };

  stopCamera = () => {
    if (this.streamRef) {
      this.streamRef.getTracks().forEach(track => track.stop());
      this.streamRef = null;
    }
  };

  @Watch('isOpen')
  isOpenHandler(newValue: any) {
    if (newValue) this.openScanner();
    else this.closeScanner();
  }

  switchCamera = () => {
    if (this.videoInputs.length > 1) {
      const currentIndex = this.videoInputs.findIndex(device => device.deviceId === this.activeCameraId);

      const newCameraIndex = (currentIndex + 1) % this.videoInputs.length;

      this.activeCameraId = this.videoInputs[newCameraIndex].deviceId;

      localStorage.setItem(ACTIVE_CAMERA_ID_KEY, this.activeCameraId);

      this.stopCamera();
      this.startCamera();
    }
  };

  render() {
    const open = this.isOpen && this.isCameraReady && (this.useOcr || this.readQrcode || this.readBarcode);
    // @ts-ignore
    document.jj = this;
    return (
      <Host>
        <div class={cn({ 'opacity-0': !open })}>
          <h1>hiiiiii</h1>
          <br />
          {this.onError}
          <br />
          {this.onExtract}
          <br />
          <button onClick={() => this.handleExtract('kodoooooo')}>extract</button>
          <br />
          <button onClick={() => this.handleError('kodoooooo')}>error</button>
          <br />
          <button onClick={this.switchCamera}>switch camera</button>
          <video autoPlay playsInline class="video-player bg-black min-w-full min-h-full object-cover object-center"></video>
        </div>
      </Host>
    );
  }
}
