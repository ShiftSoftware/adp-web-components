import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';

import { AppStates, MockJson } from '~types/components';
import { VehicleInformation } from '~types/vehicle-information';

import { getVehicleInformation } from '~api/vehicleInformation';

import cn from '~lib/cn';

import Loading from '../components/Loading';

import Eye from '~assets/eye.svg';
import { closeImageViewer, ImageViewerInterface, openImageViewer } from '~lib/image-expansion';

let mockData: MockJson<VehicleInformation> = {};

@Component({
  shadow: true,
  tag: 'vehicle-accessories',
  styleUrl: 'vehicle-accessories.css',
})
export class VehicleAccessories implements ImageViewerInterface {
  @Prop() baseUrl: string = '';
  @Prop() isDev: boolean = false;
  @Prop() queryString: string = '';
  @Prop() loadingStateChange?: (isLoading: boolean) => void;
  @Prop() loadedResponse?: (response: VehicleInformation) => void;

  @State() state: AppStates = 'idle';
  @State() externalVin?: string = null;
  @State() errorMessage?: string = null;
  @State() expandedImage?: string = null;
  @State() vehicleInformation?: VehicleInformation;

  originalImage: HTMLImageElement;
  abortController: AbortController;
  networkTimeoutRef: ReturnType<typeof setTimeout>;

  @Element() el: HTMLElement;

  private handleSettingData(response: VehicleInformation) {
    if (!response.accessories || !Array.isArray(response.accessories)) response.accessories = [];
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
        if (!vehicleResponse) throw new Error('Wrong response format');

        this.handleSettingData(vehicleResponse);
      }

      this.errorMessage = null;
      this.state = 'data';
    } catch (error) {
      if (error && error?.name === 'AbortError') return;

      this.state = 'error';
      this.vehicleInformation = null;
      this.errorMessage = error.message;
    }
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
    const accessories = this?.vehicleInformation ? this.vehicleInformation?.accessories : [];

    return (
      <Host>
        <div class="min-h-[100px] relative transition-all duration-300 overflow-hidden">
          <div>
            <Loading isLoading={this.state.includes('loading')} />
            <div class={cn('transition-all duration-700', { 'scale-0': this.state.includes('loading') || this.state === 'idle', 'opacity-0': this.state.includes('loading') })}>
              <div class={cn('text-center pt-[4px] text-[20px]', { 'text-red-600': !!this.errorMessage })}>{this.vehicleInformation?.vin}</div>

              {['error', 'error-loading'].includes(this.state) && (
                <div class="py-[16px]">
                  <div class=" px-[16px] py-[8px] border reject-card text-[20px] rounded-[8px] w-fit mx-auto">{this.errorMessage}</div>
                </div>
              )}

              {['data', 'data-loading'].includes(this.state) && (
                <div class="flex mt-[12px] max-h-[70dvh] overflow-hidden rounded-[4px] flex-col border border-[#d6d8dc]">
                  <div class="w-full h-[40px] flex shrink-0 justify-center text-[18px] items-center text-[#383c43] text-center bg-[#e1e3e5]">Vehicle Accessories</div>
                  <div class="h-0 overflow-auto flex-1">
                    {!accessories.length && <div class="h-[80px] flex items-center justify-center text-[18px]">No data is available.</div>}
                    {!!accessories.length && (
                      <table class="w-full overflow-auto relative border-collapse">
                        <thead class="top-0 font-bold z-40 sticky bg-white">
                          <tr>
                            {['Part Number', 'Description', 'Image'].map(title => (
                              <th key={title} class="px-[10px] py-[20px] text-center whitespace-nowrap border-b border-[#d6d8dc]">
                                {title}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {accessories.map((accessory, idx) => (
                            <tr class="transition-colors duration-100 hover:bg-slate-100" key={accessory.partNumber}>
                              {['partNumber', 'description'].map(key => (
                                <td
                                  key={accessory.partNumber + key}
                                  class={cn('px-[10px] py-[20px] text-center whitespace-nowrap border-b border-[#d6d8dc]', {
                                    '!border-none': idx === this.vehicleInformation?.serviceHistory.length - 1,
                                  })}
                                >
                                  {accessory[key] || '...'}
                                </td>
                              ))}
                              <td
                                class={cn('px-[10px] py-[10px] text-center whitespace-nowrap border-b border-[#d6d8dc]', {
                                  '!border-none': idx === this.vehicleInformation?.serviceHistory.length - 1,
                                })}
                              >
                                <button
                                  onClick={({ target }) => this.openImage(target as HTMLImageElement, accessory.image)}
                                  class="shrink-0 relative ring-0 outline-none w-fit mx-auto [&_img]:hover:shadow-lg [&_div]:hover:!opacity-100 cursor-pointer"
                                >
                                  <div class="absolute flex-col justify-center gap-[4px] size-full flex items-center pointer-events-none hover:opacity-100 rounded-lg opacity-0 bg-black/40 transition-all duration-300">
                                    <img src={Eye} />
                                    <span class="text-white">Expand</span>
                                  </div>
                                  <img class="w-auto h-auto max-w-[133px] max-h-[133px] cursor-pointer shadow-sm rounded-lg transition-all duration-300" src={accessory.image} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <div
                          onClick={() => this.closeImage()}
                          style={{ backdropFilter: this.expandedImage ? 'blur(3px)' : 'blur(0px)' }}
                          class={cn('pointer-events-none w-[100dvw] h-[100dvh] fixed top-0 z-50 left-0 opacity-0 bg-black/40 transition-all duration-400', {
                            'pointer-events-auto opacity-100 delay-200': this.expandedImage,
                          })}
                        >
                          <button class="flex flex-col mt-[16px] items-center justify-center size-12 float-right mr-[16px]" onClick={() => this.closeImage()}>
                            <div class="h-1 w-12 rounded-full rotate-45 absolute bg-white"></div>
                            <div class="h-1 w-12 rounded-full -rotate-45 absolute bg-white"></div>
                          </button>
                        </div>
                        <img alt="" id="expanded-image" class="fixed opacity-0 z-50 transition-all rounded-lg" />
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
