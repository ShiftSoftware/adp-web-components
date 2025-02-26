import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';

import Loader from '~assets/loader.svg';
import SSCTable from './components/SSCTable';
import CardsContainer from './components/CardsContainer';

import cn from '~lib/cn';
import { getLocaleLanguage } from '~lib/get-local-language';

import { Grecaptcha } from '~types/general';
import { AppStates, MockJson } from '~types/components';
import { VehicleInformation, Warranty } from '~types/vehicle-information';
import { ErrorKeys, LanguageKeys, Locale, localeSchema } from '~types/locales';

import { getVehicleInformation, VehicleInformationInterface } from '~api/vehicleInformation';

let mockData: MockJson<VehicleInformation> = {};

declare const grecaptcha: Grecaptcha;

@Component({
  shadow: true,
  tag: 'warranty-details',
  styleUrl: 'warranty-details.css',
})
export class WarrantyDetails implements VehicleInformationInterface {
  @Prop() baseUrl: string = '';
  @Prop() isDev: boolean = false;
  @Prop() showSsc: boolean = false;
  @Prop() queryString: string = '';
  @Prop() recaptchaKey: string = '';
  @Prop() language: LanguageKeys = 'en';
  @Prop() showWarranty: boolean = false;
  @Prop() unauthorizedSscLookupBaseUrl: string = '';
  @Prop() unauthorizedSscLookupQueryString: string = '';

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

  @Prop() errorCallback: (errorMessage: ErrorKeys) => void;
  @Prop() loadingStateChange?: (isLoading: boolean) => void;
  @Prop() loadedResponse?: (response: VehicleInformation) => void;

  @State() state: AppStates = 'idle';
  @State() externalVin?: string = null;
  @State() showRecaptcha: boolean = false;
  @State() errorMessage?: ErrorKeys = null;
  @State() unInvoicedByBrokerName?: string = null;
  @State() vehicleInformation?: VehicleInformation;
  @State() checkingUnauthorizedSSC: boolean = false;
  @State() recaptchaRes: { hasSSC: boolean; message: 'noPendingSSC' | 'pendingSSC' } | null = null;
  @State() headers: any = {};

  @State() locale: Locale = localeSchema.getDefault();

  abortController: AbortController;
  networkTimeoutRef: ReturnType<typeof setTimeout>;
  private recaptchaIntervalRef: ReturnType<typeof setInterval>;

  @Element() el: HTMLElement;

  async componentWillLoad() {
    await this.changeLanguage(this.language);
  }

  @Watch('language')
  async changeLanguage(newLanguage: LanguageKeys) {
    this.locale = await getLocaleLanguage(newLanguage);
  }

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

            await new Promise(r => setTimeout(r, 3000));

            this.checkingUnauthorizedSSC = false;

            const hasPendingSSC = Math.random() < 0.5 ? false : true;

            this.recaptchaRes = {
              hasSSC: hasPendingSSC,
              message: hasPendingSSC ? 'pendingSSC' : 'noPendingSSC',
            };
          } else {
            this.checkingUnauthorizedSSC = true;

            this.showRecaptcha = false;

            ///
            const response = await fetch(`${this.unauthorizedSscLookupBaseUrl}${vin}/${this.vehicleInformation?.sscLogId}?${this.unauthorizedSscLookupQueryString}`, {
              signal: this.abortController.signal,
              headers: {
                ...this.headers,
                'Ssc-Recaptcha-Token': recaptchaResponse,
              },
            });

            const vinResponse = await response.json();

            if (vinResponse && this.networkTimeoutRef === scopedTimeoutRef) {
              this.checkingUnauthorizedSSC = false;

              const hasPendingSSC = vinResponse.sscLookupStatus === 1;

              this.recaptchaRes = {
                hasSSC: hasPendingSSC,
                message: hasPendingSSC ? 'pendingSSC' : 'noPendingSSC',
              };
            } else throw new Error('wrongResponseFormat');
          }
        }
      }, 500);
      this.showRecaptcha = true;
    } else {
      this.showRecaptcha = false;
    }
  }

  @Method()
  async setData(newData: VehicleInformation | string, headers: any = {}) {
    this.recaptchaRes = null;
    this.headers = headers;
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

      const vehicleResponse = isVinRequest ? await getVehicleInformation(this, { scopedTimeoutRef, vin, mockData }, headers) : newData;

      if (this.networkTimeoutRef === scopedTimeoutRef) {
        if (!vehicleResponse) throw new Error('wrongResponseFormat');

        this.handleSettingData(vehicleResponse);
        this.handleInitializingRecaptcha(vin, scopedTimeoutRef);
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

  @Method()
  async setMockData(newMockData: MockJson<VehicleInformation>) {
    mockData = newMockData;
  }

  @Watch('state')
  async loadingListener() {
    if (this.loadingStateChange) this.loadingStateChange(this.state.includes('loading'));
  }

  render() {
    return (
      <Host>
        <div dir={this.locale.direction} class="min-h-[100px] warranty">
          <div>
            <loading-spinner isLoading={this.state.includes('loading')} />
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
                <div class="py-[16px] min-h-[100px] flex items-center">
                  <div class="px-[16px] py-[8px] border reject-card text-[20px] rounded-[8px] w-fit mx-auto">
                    {this.locale.errors[this.errorMessage] || this.locale.errors.wildCard}
                  </div>
                </div>
              )}

              {this.showWarranty && ['data', 'data-loading'].includes(this.state) && (
                <CardsContainer
                  locale={this.locale}
                  isAuthorized={this.vehicleInformation?.isAuthorized}
                  unInvoicedByBrokerName={this.unInvoicedByBrokerName}
                  warranty={this.vehicleInformation?.warranty as Warranty}
                />
              )}

              <div style={{ ...(this.showRecaptcha ? { height: 'auto', padding: '16px 16px 0px 16px' } : { height: '0px' }) }} class="recaptcha-container">
                <slot></slot>
              </div>

              {['data', 'data-loading'].includes(this.state) && this.recaptchaRes && (
                <div class={cn('recaptcha-response', !this.recaptchaRes.hasSSC ? 'success-card' : 'reject-card ')}>
                  {this.locale.vehicleLookup.warranty[this.recaptchaRes.message]}
                </div>
              )}

              {this.checkingUnauthorizedSSC && (
                <div class="loading-spinner" style={{ marginTop: '20px', flexDirection: 'column' }}>
                  <div>
                    <strong>{this.locale.vehicleLookup.warranty.checkingTMC}</strong>
                  </div>
                  <img class="spin" src={Loader} />
                </div>
              )}

              {this.showSsc && ['data', 'data-loading'].includes(this.state) && this.vehicleInformation?.ssc !== null && !!this.vehicleInformation?.ssc.length && (
                <SSCTable locale={this.locale} ssc={this.vehicleInformation.ssc} />
              )}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
