import { InferType } from 'yup';
import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';

import cn from '~lib/cn';
import { ErrorKeys, getLocaleLanguage, getSharedLocal, SharedLocales, sharedLocalesSchema } from '~lib/get-local-language';

import { LanguageKeys } from '~types/locale';
import { AppStates, MockJson } from '~types/components';
import { VehicleInformation } from '~types/vehicle-information';

import { getVehicleInformation, VehicleInformationInterface } from '~api/vehicleInformation';

import ServiceHistorySchema from '~locales/vehicleLookup/serviceHistory/type';

import { InformationTableColumn } from '../components/information-table';

let mockData: MockJson<VehicleInformation> = {};

@Component({
  shadow: true,
  tag: 'vehicle-service-history',
  styleUrl: 'vehicle-service-history.css',
})
export class VehicleServiceHistory implements VehicleInformationInterface {
  @Prop() baseUrl: string = '';
  @Prop() isDev: boolean = false;
  @Prop() queryString: string = '';
  @Prop() language: LanguageKeys = 'en';
  @Prop() errorCallback: (errorMessage: ErrorKeys) => void;
  @Prop() loadingStateChange?: (isLoading: boolean) => void;
  @Prop() loadedResponse?: (response: VehicleInformation) => void;

  @State() sharedLocales: SharedLocales = sharedLocalesSchema.getDefault();
  @State() locale: InferType<typeof ServiceHistorySchema> = ServiceHistorySchema.getDefault();

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
    const localeResponses = await Promise.all([getLocaleLanguage(newLanguage, 'vehicleLookup.serviceHistory', ServiceHistorySchema), getSharedLocal(newLanguage)]);
    this.locale = localeResponses[0];
    this.sharedLocales = localeResponses[1];
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
    const texts = this.locale;

    const isLoading = this.state.includes('loading');
    const isError = this.state.includes('error');

    const tableHeaders: InformationTableColumn[] = [
      {
        width: 400,
        key: 'branchName',
        label: texts.branch,
      },
      {
        width: 200,
        key: 'companyName',
        label: texts.dealer,
      },
      {
        width: 200,
        key: 'invoiceNumber',
        label: texts.invoiceNumber,
      },
      {
        width: 200,
        key: 'serviceDate',
        label: texts.date,
      },
      {
        width: 400,
        key: 'serviceType',
        label: texts.serviceType,
      },
      {
        width: 200,
        key: 'mileage',
        label: texts.odometer,
      },
    ];

    return (
      <Host>
        <div dir={this.sharedLocales.direction} part="vehicle-info-container" class={cn('vehicle-info-container', { loading: isLoading })}>
          <div part="vehicle-info-header" class="vehicle-info-header">
            <strong part="vehicle-info-header-vin" class="vehicle-info-header-vin load-animation">
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
              <information-table rows={this.vehicleInformation?.serviceHistory || []} headers={tableHeaders} isLoading={isLoading}></information-table>
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
