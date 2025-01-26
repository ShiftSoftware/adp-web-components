import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';

import cn from '~lib/cn';
import { getLocaleLanguage } from '~lib/get-local-language';

import { getVehicleInformation } from '~api/vehicleInformation';
import { ErrorKeys, LanguageKeys, Locale, localeSchema } from '~types/locales';

import Eye from '~assets/eye.svg';
import Loading from '../components/Loading';

import { AppStates, MockJson } from '~types/components';
import { VehicleInformation } from '~types/vehicle-information';
import { closeImageViewer, ImageViewerInterface, openImageViewer } from '~lib/image-expansion';

let mockData: MockJson<VehicleInformation> = {};

@Component({
  shadow: true,
  tag: 'paint-thickness',
  styleUrl: 'paint-thickness.css',
})
export class PaintThickness implements ImageViewerInterface {
  @Prop() baseUrl: string = '';
  @Prop() isDev: boolean = false;
  @Prop() queryString: string = '';
  @Prop() language: LanguageKeys = 'en';
  @Prop() errorCallback: (errorMessage: ErrorKeys) => void;
  @Prop() loadingStateChange?: (isLoading: boolean) => void;
  @Prop() loadedResponse?: (response: VehicleInformation) => void;

  @State() locale: Locale = localeSchema.getDefault();

  @State() state: AppStates = 'idle';
  @State() externalVin?: string = null;
  @State() expandedImage?: string = null;
  @State() errorMessage?: ErrorKeys = null;
  @State() vehicleInformation?: VehicleInformation;

  abortController: AbortController;
  networkTimeoutRef: ReturnType<typeof setTimeout>;

  originalImage: HTMLImageElement;

  @Element() el: HTMLElement;

  async componentWillLoad() {
    await this.changeLanguage(this.language);
  }

  @Watch('language')
  async changeLanguage(newLanguage: LanguageKeys) {
    this.locale = await getLocaleLanguage(newLanguage);
  }

  private handleSettingData(response: VehicleInformation) {
    if (!response.paintThickness) response.paintThickness = { imageGroups: [], parts: [] };
    if (!response.paintThickness.parts || !Array.isArray(response.paintThickness.parts)) response.paintThickness.parts = [];
    if (!response.paintThickness.imageGroups || !Array.isArray(response.paintThickness.imageGroups)) response.paintThickness.imageGroups = [];

    this.vehicleInformation = response;
  }

  @Method()
  async setData(newData: VehicleInformation | string, headers: any = {}) {
    clearTimeout(this.networkTimeoutRef);
    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();
    let scopedTimeoutRef: ReturnType<typeof setTimeout>;

    const isVinRequest = typeof newData === 'string';

    const vin = isVinRequest ? newData : newData?.vin;
    this.externalVin = vin;

    try {
      if (!vin || vin.trim().length === 0) {
        this.state = 'idle';
        return;
      }

      if (this.state === 'data' || this.state === 'error') {
        this.state = (this.state + '-loading') as 'data-loading' | 'error-loading';
      } else this.state = 'loading';

      await new Promise(r => {
        scopedTimeoutRef = setTimeout(r, 700);
        this.networkTimeoutRef = scopedTimeoutRef;
      });

      const vehicleResponse = isVinRequest ? await getVehicleInformation(this, { scopedTimeoutRef, vin, mockData }, headers) : newData;

      if (this.networkTimeoutRef === scopedTimeoutRef) {
        if (!vehicleResponse) throw new Error('wrongResponseFormat');

        this.handleSettingData(vehicleResponse);
      }

      this.errorMessage = null;
      this.state = 'data';
    } catch (error) {
      if (error && error?.name === 'AbortError') return;
      if (this.errorCallback) this.errorCallback(error.message);
      console.error(error);
      this.setErrorMessage(error.message);
    }
  }

  @Method()
  async setErrorMessage(message: ErrorKeys) {
    this.state = 'error';
    this.vehicleInformation = null;
    this.errorMessage = message;
  }

  @Method()
  async fetchData(requestedVin: string = this.externalVin, headers: any = {}) {
    await this.setData(requestedVin, headers);
  }

  @Watch('state')
  async loadingListener() {
    if (this.loadingStateChange) this.loadingStateChange(this.state.includes('loading'));
  }

  @Method()
  async setMockData(newMockData: MockJson<VehicleInformation>) {
    mockData = newMockData;
  }

  closeImageListener = (event?: KeyboardEvent) => {
    this.closeImage(event);
  };

  openImage = (target: HTMLImageElement, imageSrc: string) => {
    openImageViewer(this, target, imageSrc);
  };

  closeImage = (event?: KeyboardEvent) => {
    closeImageViewer(this, event);
  };

  render() {
    const texts = this.locale.vehicleLookup.paintThickness;
    const { imageGroups, parts } = this?.vehicleInformation ? this?.vehicleInformation?.paintThickness : { imageGroups: [], parts: [] };

    return (
      <Host>
        <div dir={this.locale.direction} class="min-h-[100px] relative transition-all duration-300 overflow-hidden">
          <div>
            <Loading isLoading={this.state.includes('loading')} />
            <div class={cn('transition-all duration-700', { 'scale-0': this.state.includes('loading') || this.state === 'idle', 'opacity-0': this.state.includes('loading') })}>
              <div class={cn('text-center pt-[4px] text-[20px]', { 'text-red-600': !!this.errorMessage })}>{this.vehicleInformation?.vin}</div>

              {['error', 'error-loading'].includes(this.state) && (
                <div class="py-[16px] min-h-[100px] flex items-center">
                  <div class="px-[16px] py-[8px] border reject-card text-[20px] rounded-[8px] w-fit mx-auto">
                    {this.locale.errors[this.errorMessage] || this.locale.errors.wildCard}
                  </div>
                </div>
              )}

              {['data', 'data-loading'].includes(this.state) && (
                <div class="flex mt-[12px] w-full max-h-[70dvh] overflow-hidden mx-auto rounded-[4px] flex-col border border-[#d6d8dc]">
                  <div class="w-full h-[40px] flex shrink-0 justify-center text-[18px] items-center text-[#383c43] text-center bg-[#e1e3e5]">{texts.paintThickness}</div>
                  <div class="h-0 overflow-auto flex-1">
                    {!parts.length && <div class="h-[50px] px-[30px] flex items-center justify-center text-[18px]">{texts.noData}</div>}
                    {!!parts.length && (
                      <table class="w-full overflow-auto relative border-collapse">
                        <thead class="top-0 font-bold sticky bg-white">
                          <tr>
                            {['part', 'left', 'right'].map(title => (
                              <th key={title} class="px-[15px] min-w-[100px] py-[15px] text-center whitespace-nowrap border-b border-[#d6d8dc]">
                                {texts[title]}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {parts.map((part, idx) => (
                            <tr class="transition-colors duration-100 hover:bg-slate-100" key={part.part}>
                              {['part', 'left', 'right'].map(key => (
                                <td
                                  key={part.part + key}
                                  class={cn('px-[10px] py-[20px] text-center whitespace-nowrap border-b border-[#d6d8dc]', {
                                    '!border-none': idx === parts.length - 1,
                                  })}
                                >
                                  {part[key] || '...'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {['data', 'data-loading'].includes(this.state) && (
                <div>
                  {!imageGroups.length && <div class="h-[40px] px-[30px] flex text-red-500 items-center justify-center text-[18px]">{texts.noImageGroups}</div>}
                  {!!imageGroups.length && (
                    <div class="py-[16px] gap-[16px] justify-center flex flex-wrap px-[24px] w-full">
                      {imageGroups.map(imageGroup => (
                        <div class="shrink-0 rounded-lg shadow-sm border overflow-hidden flex flex-col" key={imageGroup.name}>
                          <h1 class="text-center border-b bg-slate-200 font-semibold p-[6px]">{imageGroup.name}</h1>

                          <div class="flex p-[12px] gap-[8px]">
                            {imageGroup.images.map(image => (
                              <div class="flex gap-[8px]" key={image}>
                                <button
                                  onClick={({ target }) => this.openImage(target as HTMLImageElement, image)}
                                  class="shrink-0 relative ring-0 outline-none w-fit mx-auto [&_img]:hover:shadow-lg [&_div]:hover:!opacity-100 cursor-pointer"
                                >
                                  <div class="absolute flex-col justify-center gap-[4px] size-full flex items-center pointer-events-none hover:opacity-100 rounded-lg opacity-0 bg-black/40 transition-all duration-300">
                                    <img src={Eye} />
                                    <span class="text-white">{texts.expand}</span>
                                  </div>
                                  <img class="w-auto h-[150px] cursor-pointer shadow-sm rounded-lg transition-all duration-300" src={image} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div
                        onClick={() => this.closeImage()}
                        style={{ backdropFilter: this.expandedImage ? 'blur(3px)' : 'blur(0px)' }}
                        class={cn('pointer-events-none w-[100dvw] h-[100dvh] fixed top-0 z-10 left-0 opacity-0 bg-black/40 transition-all duration-400', {
                          'pointer-events-auto opacity-100 delay-200': this.expandedImage,
                        })}
                      >
                        <button class="flex flex-col mt-[16px] items-center justify-center size-12 float-right mr-[16px]" onClick={() => this.closeImage()}>
                          <div class="h-1 w-12 rounded-full rotate-45 absolute bg-white"></div>
                          <div class="h-1 w-12 rounded-full -rotate-45 absolute bg-white"></div>
                        </button>
                      </div>
                      <img alt="" id="expanded-image" class="fixed opacity-0 z-40 transition-all rounded-lg" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
