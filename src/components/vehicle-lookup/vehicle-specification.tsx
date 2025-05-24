import { InferType } from 'yup';
import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';

import { LanguageKeys } from '~types/locale';
import { AppStates, MockJson } from '~types/components';
import { VehicleInformation } from '~types/vehicle-information';

import cn from '~lib/cn';
import { ErrorKeys, getLocaleLanguage, getSharedLocal, SharedLocales, sharedLocalesSchema } from '~lib/get-local-language';

import { getVehicleInformation, VehicleInformationInterface } from '~api/vehicleInformation';

import specificationSchema from '~locales/vehicleLookup/specification/type';

import { CardContent } from '../components/card-content';

let mockData: MockJson<VehicleInformation> = {};

@Component({
  shadow: true,
  tag: 'vehicle-specification',
  styleUrl: 'vehicle-specification.css',
})
export class VehicleSpecification implements VehicleInformationInterface {
  @Prop() baseUrl: string = '';
  @Prop() isDev: boolean = false;
  @Prop() queryString: string = '';
  @Prop() language: LanguageKeys = 'en';
  @Prop() errorCallback: (errorMessage: ErrorKeys) => void;
  @Prop() loadingStateChange?: (isLoading: boolean) => void;
  @Prop() loadedResponse?: (response: VehicleInformation) => void;

  @State() sharedLocales: SharedLocales = sharedLocalesSchema.getDefault();
  @State() locale: InferType<typeof specificationSchema> = specificationSchema.getDefault();

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
    const localeResponses = await Promise.all([getLocaleLanguage(newLanguage, 'vehicleLookup.specification', specificationSchema), getSharedLocal(newLanguage)]);
    this.locale = localeResponses[0];
    this.sharedLocales = localeResponses[1];
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
        this.vehicleInformation = vehicleResponse;
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
    const texts = this.locale;

    let productionDate: string | null = null;

    try {
      if (this.vehicleInformation?.vehicleSpecification?.productionDate) {
        const productionDateObj = new Date(this.vehicleInformation?.vehicleSpecification?.productionDate);

        productionDate = productionDateObj.toLocaleDateString(this.sharedLocales.language, {
          year: 'numeric',
          month: 'long',
        });
      }
    } catch (error) {
      productionDate = null;
    }

    const isLoading = this.state.includes('loading');
    const isError = this.state.includes('error');

    return (
      <Host>
        <div dir={this.sharedLocales.direction} part="vehicle-info-container" class={cn('vehicle-info-container', { loading: isLoading })}>
          <div part="vehicle-info-header" class="vehicle-info-header">
            <strong onAnimationEnd={() => {}} part="vehicle-info-header-vin" class="vehicle-info-header-vin load-animation">
              {isError ? (
                <span dir={this.sharedLocales.direction} style={{ color: 'red' }}>
                  {this.sharedLocales.errors[this.errorMessage] || this.sharedLocales.errors.wildCard}
                </span>
              ) : (
                this.vehicleInformation?.vin
              )}
            </strong>
          </div>

          <div part="vehicle-info-body" class="vehicle-info-body">
            <div part="vehicle-info-content" class="p-[16px] vehicle-info-content">
              <flexible-container>
                <div class="flex p-[4px] [&>div]:grow overflow-auto gap-[16px] items-stretch justify-center md:justify-between flex-wrap">
                  <CardContent title={texts?.model} classes="grow" minWidth="400px">
                    <div class="text-center w-full shift-skeleton">
                      {this?.vehicleInformation?.vehicleVariantInfo?.modelCode || '...'} <br class="my-2" />
                      {this?.vehicleInformation?.vehicleSpecification?.modelDesc || '...'}
                    </div>
                  </CardContent>
                  <CardContent title={texts?.variant} classes="grow" minWidth="400px">
                    <div class="text-center w-full shift-skeleton">
                      {this?.vehicleInformation?.identifiers?.variant?.trim() || '...'} <br />
                      {this?.vehicleInformation?.vehicleSpecification?.variantDesc?.trim() || '...'}
                    </div>
                  </CardContent>
                  <CardContent title={texts?.katashiki} minWidth="250px">
                    <div class="w-full shift-skeleton">{this?.vehicleInformation?.identifiers?.katashiki?.trim() || '...'}</div>
                  </CardContent>
                  <CardContent title={texts?.modelYear} minWidth="250px">
                    <div class="w-full shift-skeleton">{this?.vehicleInformation?.vehicleVariantInfo?.modelYear?.toString()?.trim() || '...'}</div>
                  </CardContent>
                  <CardContent title={texts?.productionDate} minWidth="250px">
                    <div class="w-full shift-skeleton">{!!productionDate ? productionDate : '...'}</div>
                  </CardContent>
                  <CardContent title={texts?.sfx} minWidth="250px">
                    <div class="w-full shift-skeleton">{this?.vehicleInformation?.vehicleVariantInfo?.sfx?.trim() || '...'}</div>
                  </CardContent>
                </div>
              </flexible-container>
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
