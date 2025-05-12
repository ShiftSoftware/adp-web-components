import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';

import cn from '~lib/cn';
import { getLocaleLanguage } from '~lib/get-local-language';

import { AppStates, MockJson } from '~types/components';
import { VehicleInformation } from '~types/vehicle-information';
import { ErrorKeys, LanguageKeys, Locale, localeSchema } from '~types/a';

import { getVehicleInformation, VehicleInformationInterface } from '~api/vehicleInformation';

let mockData: MockJson<VehicleInformation> = {};

@Component({
  shadow: true,
  tag: 'service-history',
  styleUrl: 'service-history.css',
})
export class ServiceHistory implements VehicleInformationInterface {
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
  @State() errorMessage?: ErrorKeys = null;
  @State() vehicleInformation?: VehicleInformation;

  abortController: AbortController;
  networkTimeoutRef: ReturnType<typeof setTimeout>;

  @Element() el: HTMLElement;

  async componentWillLoad() {
    await this.changeLanguage(this.language);
  }

  @Watch('language')
  async changeLanguage(newLanguage: LanguageKeys) {
    this.locale = await getLocaleLanguage(newLanguage);
  }

  private handleSettingData(response: VehicleInformation) {
    if (response.serviceHistory === null) response.serviceHistory = [];
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

  render() {
    const texts = this.locale.vehicleLookup.serviceHistory;

    return (
      <Host>
        <div dir={this.locale.direction} class="min-h-[100px] relative transition-all duration-300 overflow-hidden">
          <div>
            <loading-spinner isLoading={this.state.includes('loading')} />
            <div class={cn('transition-all !duration-700', { 'scale-0': this.state.includes('loading') || this.state === 'idle', 'opacity-0': this.state.includes('loading') })}>
              <div class={cn('text-center pt-[4px] text-[20px]', { 'text-red-600': !!this.errorMessage })}>{this.vehicleInformation?.vin}</div>

              {['error', 'error-loading'].includes(this.state) && (
                <div class="py-[16px] min-h-[100px] flex items-center">
                  <div class="px-[16px] py-[8px] border reject-card text-[20px] rounded-[8px] w-fit mx-auto">
                    {this.locale.errors[this.errorMessage] || this.locale.errors.wildCard}
                  </div>
                </div>
              )}

              {['data', 'data-loading'].includes(this.state) && (
                <div class="flex mt-[12px] max-h-[70dvh] overflow-hidden rounded-[4px] flex-col border border-[#d6d8dc]">
                  <div class="w-full h-[40px] flex shrink-0 justify-center text-[18px] items-center text-[#383c43] text-center bg-[#e1e3e5]">{texts.serviceHistory}</div>
                  <div class="h-0 overflow-auto flex-1">
                    {!this.vehicleInformation?.serviceHistory.length && <div class="h-[80px] flex items-center justify-center text-[18px]">{texts.noData}</div>}
                    {!!this.vehicleInformation?.serviceHistory.length && (
                      <table class="w-full overflow-auto relative border-collapse">
                        <thead class="top-0 font-bold sticky bg-white">
                          <tr>
                            {['branch', 'dealer', 'invoiceNumber', 'date', 'serviceType', 'odometer'].map(title => (
                              <th key={title} class="px-[10px] py-[20px] text-center whitespace-nowrap border-b border-[#d6d8dc]">
                                {texts[title]}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {this.vehicleInformation?.serviceHistory.map((service, idx) => (
                            <tr class="transition-colors duration-100 hover:bg-slate-100" key={service.invoiceNumber}>
                              {['branchName', 'companyName', 'invoiceNumber', 'serviceDate', 'serviceType', 'mileage'].map(serviceType => (
                                <td
                                  key={service.invoiceNumber + serviceType}
                                  class={cn('px-[10px] py-[20px] text-center whitespace-nowrap border-b border-[#d6d8dc]', {
                                    '!border-none': idx === this.vehicleInformation?.serviceHistory.length - 1,
                                  })}
                                >
                                  {service[serviceType] || '...'}
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
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
