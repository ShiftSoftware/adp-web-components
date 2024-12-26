import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';

import Loading from './components/Loading';
import StatusCard from './components/StatusCard';
import Loader from '~assets/loader.svg';

import CardsContainer from './components/CardsContainer';
import SSCTable from './components/SSCTable';
import cn from '~lib/cn';
import { VehicleInformation, Warranty } from '~types/vehicle-information';
import { AppStates, MockJson } from '~types/components';
import { getVehicleInformation, VehicleInformationInterface } from '~api/vehicleInformation';

let mockData: MockJson<VehicleInformation> = {};

declare const grecaptcha: {
  getResponse(): string;
  reset(widgetId?: number): void;
  ready(callback: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
  render(
    container: HTMLElement | string,
    parameters: { 'sitekey': string; 'callback'?: (token: string) => void; 'error-callback'?: () => void; 'expired-callback'?: () => void },
  ): number;
};

@Component({
  shadow: true,
  tag: 'warranty-details',
  styleUrl: 'warranty-details.css',
})
export class WarrantyDetails implements VehicleInformationInterface {
  @Prop() baseUrl: string = '';
  @Prop() unauthorizedSscLookupBaseUrl: string = '';
  @Prop() isDev: boolean = false;
  @Prop() showSsc: boolean = false;
  @Prop() queryString: string = '';
  @Prop() unauthorizedSscLookupQueryString: string = '';
  @Prop() recaptchaKey: string = '';
  @Prop() showWarranty: boolean = false;

  @Prop() cityId?: string = null;
  @Prop() cityIntegrationId?: string = null;
  @Prop() companyId?: string = null;
  @Prop() companyIntegrationId?: string = null;
  @Prop() companyBranchId?: string = null;
  @Prop() companyBranchIntegrationId?: string = null;
  @Prop() userId?: string = null;
  @Prop() brandIntegrationId: string = null;

  @Prop() customerName?: string = null;
  @Prop() customerPhone?: string = null;
  @Prop() customerEmail?: string = null;

  @Prop() loadingStateChange?: (isLoading: boolean) => void;
  @Prop() loadedResponse?: (response: VehicleInformation) => void;

  //@State() componentHeight = '0px';
  @State() state: AppStates = 'idle';
  @State() externalVin?: string = null;
  @State() errorMessage?: string = null;
  @State() showRecaptcha: boolean = false;
  @State() unInvoicedByBrokerName?: string = null;
  @State() vehicleInformation?: VehicleInformation;
  @State() checkingUnauthorizedSSC: boolean = false;
  @State() recaptchaRes: { hasSSC: boolean; message: string } | null = null;

  //private wrapperRef?: HTMLDivElement;
  abortController: AbortController;
  networkTimeoutRef: ReturnType<typeof setTimeout>;
  private recaptchaIntervalRef: ReturnType<typeof setInterval>;

  @Element() el: HTMLElement;

  private handleSettingData(response: VehicleInformation) {
    if (response.warranty === null)
      response.warranty = {
        warrantyEndDate: '',
        warrantyStartDate: '',
        hasActiveWarranty: false,
        hasExtendedWarranty: false,
        extendedWarrantyEndDate: '',
        extendedWarrantyStartDate: '',
      };
    if (response.ssc === null) response.ssc = [];

    this.unInvoicedByBrokerName = null;

    if (response?.saleInformation?.broker !== null && response?.saleInformation?.broker?.invoiceDate === null)
      this.unInvoicedByBrokerName = response.saleInformation.broker.brokerName;

    this.vehicleInformation = response;
  }

  private async handleInitializingRecaptcha(vin, scopedTimeoutRef) {
    if (this.vehicleInformation?.isAuthorized === false && this.showSsc && this.recaptchaKey !== '') {
      grecaptcha.reset();
      await new Promise(r => setTimeout(r, 400));
      this.recaptchaIntervalRef = setInterval(async () => {
        const recaptchaResponse = grecaptcha.getResponse();
        if (recaptchaResponse) {
          clearInterval(this.recaptchaIntervalRef);

          if (this.isDev) {
            this.checkingUnauthorizedSSC = true;

            this.showRecaptcha = false;

            //this.calculateHeight(this.state);

            await new Promise(r => setTimeout(r, 3000));

            this.checkingUnauthorizedSSC = false;

            const hasPendingSSC = Math.random() < 0.5 ? false : true;

            this.recaptchaRes = {
              hasSSC: hasPendingSSC,
              message: hasPendingSSC ? 'This Vehicle has a Pending SSC' : 'No Pending SSC',
            };

            //this.calculateHeight(this.state);
          } else {
            this.checkingUnauthorizedSSC = true;

            this.showRecaptcha = false;

            //this.calculateHeight(this.state);

            const response = await fetch(`${this.unauthorizedSscLookupBaseUrl}${vin}/${this.vehicleInformation?.sscLogId}?${this.unauthorizedSscLookupQueryString}`, {
              signal: this.abortController.signal,
              headers: {
                'Ssc-Recaptcha-Token': recaptchaResponse,
              },
            });

            const vinResponse = await response.json();

            if (vinResponse && this.networkTimeoutRef === scopedTimeoutRef) {
              this.checkingUnauthorizedSSC = false;

              const hasPendingSSC = vinResponse.sscLookupStatus === 1;

              this.recaptchaRes = {
                hasSSC: hasPendingSSC,
                message: hasPendingSSC ? 'This Vehicle has a Pending SSC' : 'No Pending SSC',
              };

              //this.calculateHeight(this.state);
            } else throw new Error('Wrong response format');
          }
        }
      }, 500);
      this.showRecaptcha = true;
    } else {
      this.showRecaptcha = false;
    }
  }

  @Method()
  async setData(newData: VehicleInformation | string) {
    this.recaptchaRes = null;
    clearTimeout(this.networkTimeoutRef);
    clearInterval(this.recaptchaIntervalRef);
    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();
    let scopedTimeoutRef: ReturnType<typeof setTimeout>;

    const isVinRequest = typeof newData === 'string';

    const vin = isVinRequest ? newData : newData?.vin;
    this.externalVin = vin;

    try {
      if (!vin || vin.trim().length === 0) {
        //this.componentHeight = '0px';
        this.state = 'idle';
        return;
      }

      if (this.state === 'data' || this.state === 'error') {
        this.state = (this.state + '-loading') as 'data-loading' | 'error-loading';
      } else this.state = 'loading';

      await new Promise(r => {
        scopedTimeoutRef = setTimeout(r, 600);
        this.networkTimeoutRef = scopedTimeoutRef;
      });

      const vehicleResponse = isVinRequest ? await getVehicleInformation(this, { scopedTimeoutRef, vin, mockData }) : newData;

      if (this.networkTimeoutRef === scopedTimeoutRef) {
        if (!vehicleResponse) throw new Error('Wrong response format');

        this.handleSettingData(vehicleResponse);
        this.handleInitializingRecaptcha(vin, scopedTimeoutRef);
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
  async fetchData(requestedVin: string = this.externalVin) {
    await this.setData(requestedVin);
  }

  async componentDidLoad() {
    if (this.recaptchaKey !== '') {
      const script = document.createElement('script');

      script.src = 'https://www.google.com/recaptcha/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => console.log('reCAPTCHA script loaded');

      document.head.appendChild(script);
    }
  }

  //calculateHeight(componentState: string) {
  //  if (componentState.includes('loading') && this.componentHeight === '0px') {
  //    this.componentHeight = '100px';
  //  } else if (componentState !== 'idle') {
  //    setTimeout(() => {
  //      this.componentHeight = `${this.wrapperRef.clientHeight}px`;
  //    }, 50);
  //  } else {
  //    this.componentHeight = '0px';
  //  }
  //}

  @Method()
  async setMockData(newMockData: MockJson<VehicleInformation>) {
    mockData = newMockData;
  }

  @Watch('showSsc')
  onShowSscChange() {
    //this.calculateHeight(this.state);
  }

  @Watch('showWarranty')
  onShowWarrantyChange() {
    //this.calculateHeight(this.state);
  }

  @Watch('state')
  async loadingListener() {
    //this.calculateHeight(newState);

    if (this.loadingStateChange) this.loadingStateChange(this.state.includes('loading'));
  }

  render() {
    return (
      <Host>
        <div class="min-h-[100px] warranty">
          <div>
            <Loading isLoading={this.state.includes('loading')} />
            <div
              class="transition duration-700"
              style={{ transform: this.state.includes('loading') || this.state === 'idle' ? 'scale(0)' : 'scale(1)', opacity: this.state.includes('loading') ? '0' : '1' }}
            >
              {(this.showSsc || this.showWarranty) && (
                <div style={{ color: !!this.errorMessage ? 'red' : 'black' }} class="warranty-vin">
                  {this.vehicleInformation?.vin}
                </div>
              )}

              {['error', 'error-loading'].includes(this.state) && (
                <div class="py-4">
                  <StatusCard desc={this.errorMessage} className="mx-auto reject-card max-w-500" />{' '}
                </div>
              )}

              {this.showWarranty && ['data', 'data-loading'].includes(this.state) && (
                <CardsContainer
                  isAuthorized={this.vehicleInformation?.isAuthorized}
                  unInvoicedByBrokerName={this.unInvoicedByBrokerName}
                  warranty={this.vehicleInformation?.warranty as Warranty}
                />
              )}

              <div style={{ ...(this.showRecaptcha ? { height: 'auto', padding: '16px 16px 0px 16px' } : { height: '0px' }) }} class="recaptcha-container">
                <slot></slot>
              </div>

              {['data', 'data-loading'].includes(this.state) && this.recaptchaRes && (
                <div class={cn('recaptcha-response', !this.recaptchaRes.hasSSC ? 'success-card' : 'reject-card ')}>{this.recaptchaRes.message}</div>
              )}

              {this.checkingUnauthorizedSSC && (
                <div class="loading-spinner" style={{ marginTop: '20px', flexDirection: 'column' }}>
                  <div>
                    <strong>Checking TMC</strong>
                  </div>
                  <img class="spin" src={Loader} />
                </div>
              )}

              {this.showSsc && ['data', 'data-loading'].includes(this.state) && this.vehicleInformation?.ssc !== null && !!this.vehicleInformation?.ssc.length && (
                <SSCTable ssc={this.vehicleInformation.ssc} />
              )}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
