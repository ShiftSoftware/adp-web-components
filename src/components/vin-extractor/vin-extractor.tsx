import { Component, Prop, State, Watch, h, Host, Method, Element } from '@stencil/core';
import cn from '~lib/cn';
import validateVin from '~lib/validate-vin';
import { DotNetObjectReference } from '~types/components';

const CAPTURE_INTERVAL = 2000;
const ACTIVE_CAMERA_ID_KEY = 'activeCameraId';

@Component({
  shadow: true,
  tag: 'vin-extractor',
  styleUrl: 'vin-extractor.css',
})
export class VinExtractor {
  @Prop() title: string = '';
  @Prop() isOpen: boolean = false;
  @Prop() captureInterval: number = CAPTURE_INTERVAL;

  @Prop() verbose: boolean = false;

  @Prop() useOcr: boolean = false;
  @Prop() readSticker: boolean = false;

  @Prop() uploaderButtonId: string;
  @Prop() manualCapture: boolean = false;
  @Prop() skipValidation: boolean = false;

  @Prop() ocrEndpoint: string;

  @Prop() onExtract?: ((vin: string) => void) | string;
  @Prop() onError?: ((newError: Error) => void) | string;
  @Prop() onProcessing?: ((vin: string) => void) | string;
  @Prop() onOpenChange?: ((newError: boolean) => void) | string;

  @State() streamRef: MediaStream;
  @State() isAnimating: boolean = false;
  @State() isCameraReady: boolean = false;
  @State() switchRotateDegree: number = 0;
  @State() containerAnimation: string = '';
  @State() blazorRef?: DotNetObjectReference;
  @State() videoInputs: MediaDeviceInfo[] = [];
  @State() manualCaptureLoading: boolean = false;
  @State() activeCameraId: string = localStorage.getItem(ACTIVE_CAMERA_ID_KEY) || '';

  @Element() el: HTMLElement;

  private codeReader: any;
  private fileInput: HTMLInputElement;
  private videoPlayer: HTMLVideoElement;
  private fileButton: HTMLButtonElement;
  private videoCanvas: HTMLCanvasElement;
  private abortController: AbortController;
  private frameCaptureTimeoutRef: ReturnType<typeof setTimeout>;

  async componentDidLoad() {
    this.videoPlayer = this.el.shadowRoot.querySelector('.video-player');
    this.videoCanvas = this.el.shadowRoot.querySelector('.video-canvas');
    this.abortController = new AbortController();

    if (!this.readSticker && this.uploaderButtonId) this.registerFileUploader();

    if (this.readSticker) {
      const ZXingSrc = 'https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js';

      const alreadyLoaded = Array.from(document.scripts).some(script => script.src === ZXingSrc);

      if (alreadyLoaded && this.uploaderButtonId) this.registerFileUploader();

      if (!alreadyLoaded) {
        const script = document.createElement('script');
        script.src = ZXingSrc;
        script.defer = true;
        document.head.appendChild(script);
        script.onload = () => {
          // @ts-ignore
          if (ZXing) this.codeReader = new ZXing.BrowserMultiFormatReader();
        };
      } else if (!this.codeReader) {
        try {
          // @ts-ignore
          if (ZXing) this.codeReader = new ZXing.BrowserMultiFormatReader();
        } catch (error) {
          setTimeout(() => {
            this.componentDidLoad();
          }, 100);
        }
      }
    }
  }

  registerFileUploader = () => {
    if (this.readSticker && !this.codeReader) {
      setTimeout(() => {
        this.componentDidLoad();
      }, 100);
      return;
    }

    this.fileButton = document.querySelector('#' + this.uploaderButtonId);
    this.fileInput = this.el.shadowRoot.querySelector('.vin-extractor-input');

    this.fileButton.removeEventListener('click', this.onFileUploaderClick);
    this.fileInput.removeEventListener('change', this.onFileUploaderChange);

    this.fileButton.addEventListener('click', this.onFileUploaderClick);
    this.fileInput.addEventListener('change', this.onFileUploaderChange);
  };

  onFileUploaderClick = () => {
    this.fileInput.click();
  };

  onFileUploaderChange = () => {
    const file = this.fileInput.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.src = reader.result as string;
    };

    img.onload = async () => {
      this.handleOnProcessing(true);

      const ctx = this.videoCanvas.getContext('2d');
      this.videoCanvas.width = img.width;
      this.videoCanvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const imageDataUrl = this.videoCanvas.toDataURL('image/png');

      await this.handleImage(imageDataUrl);

      this.handleOnProcessing(false);
    };

    reader.readAsDataURL(file);
  };

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

  handleOnProcessing = (isProcessing: boolean) => {
    this.triggerCallback(this.onProcessing, isProcessing);
  };

  captureFrame = async (manualCapture: boolean = false) => {
    if (!this.isOpen) return;

    if (!this.videoPlayer || !this.videoCanvas) return this.componentDidLoad();

    const ctx = this.videoCanvas.getContext('2d');

    if (!ctx) return;

    this.handleOnProcessing(true);

    if (manualCapture) {
      this.videoPlayer.pause();
      this.manualCaptureLoading = true;
    }

    this.videoCanvas.width = this.videoPlayer.videoWidth;
    this.videoCanvas.height = this.videoPlayer.videoHeight;

    ctx.drawImage(this.videoPlayer, 0, 0, this.videoCanvas.width, this.videoCanvas.height);

    const imageDataUrl = this.videoCanvas.toDataURL('image/png');

    this.handleImage(imageDataUrl);

    if (!this.manualCapture) {
      this.frameCaptureTimeoutRef = setTimeout(this.captureFrame, this.captureInterval);
      this.handleOnProcessing(false);
    }

    if (manualCapture) {
      setTimeout(() => {
        this.videoPlayer.play();
        this.manualCaptureLoading = false;
        this.handleOnProcessing(false);
      }, 1000);
    }
  };

  handleImage = async (imageDataUrl: string) => {
    if (this.readSticker) await this.stickerHandler(imageDataUrl);

    if (this.useOcr && this.ocrEndpoint) await this.ocrHandler(imageDataUrl);
  };

  ocrHandler = async (imageDataUrl: string) => {
    try {
      const response = await fetch(this.ocrEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: this.abortController.signal,
        body: JSON.stringify({ image: imageDataUrl.split(',')[1] }),
      });

      if (!response.ok) throw new Error('Failed to fetch OCR result');

      if (this.verbose) console.log(response);

      const data: string = await response.json();

      if (this.skipValidation || (!!data.trim() && validateVin(data))) this.handleExtract(data);
    } catch (error) {
      this.handleError(error as Error);
    }
  };

  stickerHandler = async (imageDataUrl: string) => {
    try {
      if (this.verbose) console.log('try detecting sticker');

      const result = await this.codeReader.decodeFromImage(undefined, imageDataUrl);
      const text = result.getText();
      if (this.verbose) console.log(text);

      if (!!text.trim()) {
        if (this.skipValidation) this.handleExtract(text.trim());
        else {
          const vin = text.replace(/[qo]/g, '0').replace(/i/g, '1').replace(/ /g, '');

          if (vin.length === 17 && validateVin(vin)) this.handleExtract(vin);
        }
      }
    } catch (error) {
      this.handleError(error as Error);
    }
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

      if (!this.manualCapture) this.frameCaptureTimeoutRef = setTimeout(this.captureFrame, this.captureInterval + 300);

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

      this.manualCaptureLoading = false;
    } catch (error) {
      if (this.verbose) console.error(error);
      throw new Error('Error accessing camera: ');
    }
  };

  closeScanner = () => {
    this.isCameraReady = false;
    this.abortController.abort();
    clearTimeout(this.frameCaptureTimeoutRef);
    if (this.codeReader) this.codeReader.reset();
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

  @Watch('readSticker')
  QRChanged(newValue: boolean) {
    if (newValue) this.componentDidLoad();
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
    const ariaExpanded = this.isOpen && this.isCameraReady && (this.useOcr || this.readSticker);

    return (
      <Host>
        <slot />
        <input class="vin-extractor-input" type="file" accept="image/*" capture="environment" hidden />
        <canvas class="video-canvas hidden"></canvas>
        {!this.uploaderButtonId && (
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
                'vin-extractor-container md:w-[600px] md:rounded-lg md:overflow-hidden opacity-0 md:h-auto aria-expanded:pointer-events-auto w-full h-full relative transition-all duration-500',
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
              {this.manualCapture && (
                <button
                  type="button"
                  disabled={this.manualCaptureLoading}
                  onClick={this.captureFrame.bind(this, true)}
                  class="absolute disabled:bg-white/75 outline-none cursor-pointer left-1/2 -translate-x-1/2 flex justify-center items-center h-[60px] py-[10px] w-[100px] rounded-full shadow-lg border border-slate-500 text-slate-500 z-10 bg-white bottom-4"
                >
                  {this.manualCaptureLoading ? (
                    <svg
                      fill="none"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="size-full animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  ) : (
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
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                  )}
                </button>
              )}
              <video id="video" autoPlay playsInline class="video-player md:aspect-auto bg-black min-w-full min-h-full object-cover object-center"></video>
            </div>
          </div>
        )}
      </Host>
    );
  }
}
