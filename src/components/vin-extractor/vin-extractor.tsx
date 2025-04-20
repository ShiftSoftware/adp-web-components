import { Component, Prop, State, Watch, h, Host, Method, Element } from '@stencil/core';
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

  @Prop() title: string = '';
  @Prop() useOcr: boolean = false;
  @Prop() readQrcode: boolean = false;
  @Prop() readBarcode: boolean = false;

  @Prop() captureInterval: number = CAPTURE_INTERVAL;

  @Prop() onExtract?: ((vin: string) => void) | string;
  @Prop() onError?: ((newError: Error) => void) | string;
  @Prop() onOpenChange?: ((newError: boolean) => void) | string;

  @State() isAnimating: boolean = false;
  @State() isCameraReady: boolean = false;
  @State() switchRotateDegree: number = 0;
  @State() containerAnimation: string = '';
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

      this.firstCaptureTimeoutRef = setTimeout(() => this.captureFrame(), this.captureInterval + 500);

      if (document) document.body.style.overflow = 'hidden';

      this.isCameraReady = true;

      this.containerAnimation = 'show-container';
    } catch (error) {
      this.handleError(error);
    }
  };

  @Method()
  open() {
    this.isOpen = true;
  }

  @Method()
  async close() {
    this.isOpen = false;
  }

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
    this.containerAnimation = 'hide-container';
  };

  stopCamera = () => {
    if (this.streamRef) {
      this.streamRef.getTracks().forEach(track => track.stop());
      this.streamRef = null;
    }
  };

  @Watch('isOpen')
  isOpenHandler(newValue: boolean) {
    if (newValue) this.openScanner();
    else this.closeScanner();

    this.triggerCallback(this.onOpenChange, newValue);
  }

  switchCamera = () => {
    if (this.videoInputs.length > 1) {
      const currentIndex = this.videoInputs.findIndex(device => device.deviceId === this.activeCameraId);

      const newCameraIndex = (currentIndex + 1) % this.videoInputs.length;

      this.activeCameraId = this.videoInputs[newCameraIndex].deviceId;

      localStorage.setItem(ACTIVE_CAMERA_ID_KEY, this.activeCameraId);

      this.stopCamera();
      this.startCamera();
      this.switchRotateDegree += 90;
    }
  };

  @Watch('isAnimating')
  animationHandler(newValue: boolean) {
    if (!newValue && !this.isOpen) this.stopCamera();
  }
  render() {
    const ariaExpanded = this.isOpen && this.isCameraReady && (this.useOcr || this.readQrcode || this.readBarcode);

    return (
      <Host>
        <div
          onClick={() => (this.isOpen = false)}
          aria-expanded={ariaExpanded.toString()}
          class="vin-extractor-background md:aria-expanded:bg-black/40 md:transition-all md:duration-300 fixed flex items-center justify-center w-[100dvw] h-[100dvh] top-0 left-0 z-[9999]"
        >
          <div
            onClick={e => e.stopPropagation()}
            aria-expanded={ariaExpanded.toString()}
            onAnimationEnd={() => (this.isAnimating = false)}
            onAnimationStart={() => (this.isAnimating = true)}
            class={cn(
              'vin-extractor-container md:w-[600px] md:rounded-lg md:overflow-hidden opacity-0 md:h-auto pointer-events-auto w-full h-full relative transition-all duration-500',
              this.containerAnimation,
            )}
          >
            <div class="vin-extractor-heading items-center md:py-[8px] w-full md:!opacity-100 md:!translate-x-0 p-[16px] md:bg-white bg-black/30 shadow-md z-10 md:relative absolute top-0 left-0 flex justify-between">
              {this.videoInputs.length > 1 ? (
                <button
                  type="button"
                  onClick={this.switchCamera}
                  class="size-[32px] md:border-none md:bg-white md:hover:bg-slate-100 bg-slate-100 rounded-lg p-1 hover:text-slate-700 border transition-colors duration-300 hover:bg-slate-300 border-slate-600 text-slate-600 hover:border-slate-700"
                >
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    xmlns="http://www.w3.org/2000/svg"
                    class="size-full transition-all duration-300"
                    style={{ rotate: `${this.switchRotateDegree}deg` }}
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M8 16H3v5" />
                  </svg>
                </button>
              ) : (
                <div class="size-8" />
              )}
              <h1 class="text-center md:text-3xl md:text-black text-slate-100 text-xl">{this.title}</h1>
              <button
                type="button"
                onClick={() => (this.isOpen = false)}
                class="size-[32px] md:border-none md:bg-white md:hover:bg-slate-100 bg-slate-100 rounded-lg p-1 hover:text-slate-700 border transition-colors duration-300 hover:bg-slate-300 border-slate-600 text-slate-600 hover:border-slate-700"
              >
                <svg
                  fill="none"
                  stroke-width="2"
                  class="size-full"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <video autoPlay playsInline class="video-player md:aspect-auto bg-black min-w-full min-h-full object-cover object-center"></video>
          </div>
        </div>
      </Host>
    );
  }
}
