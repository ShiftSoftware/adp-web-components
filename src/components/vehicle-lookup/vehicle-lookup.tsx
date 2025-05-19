import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';

import cn from '~lib/cn';
import validateVin from '~lib/validate-vin';
import { ErrorKeys, getLocaleLanguage, getSharedLocal, SharedLocales, sharedLocalesSchema } from '~lib/get-local-language';

import { LanguageKeys } from '~types/locale';
import { DotNetObjectReference } from '~types/components';
import { VehicleInformation } from '~types/vehicle-information';

import vehicleLookupWrapperSchema from '~locales/vehicleLookup/wrapper-type';

import { VehicleAccessories } from './vehicle-accessories';
import { VehicleSpecification } from './vehicle-specification';
import { VehicleClaimableItems } from './vehicle-claimable-items';
import { VehiclePaintThickness } from './vehicle-paint-thickness';
import { VehicleServiceHistory } from './vehicle-service-history';
import { VehicleWarrantyDetails } from './vehicle-warranty-details';

const componentTags = {
  vehicleAccessories: 'vehicle-accessories',
  vehicleSpecification: 'vehicle-specification',
  vehiclePaintThickness: 'vehicle-paint-thickness',
  vehicleServiceHistory: 'vehicle-service-history',
  vehicleClaimableItems: 'vehicle-claimable-items',
  vehicleWarrantyDetails: 'vehicle-warranty-details',
} as const;

export type ComponentMap = {
  [componentTags.vehicleAccessories]: VehicleAccessories;
  [componentTags.vehicleSpecification]: VehicleSpecification;
  [componentTags.vehicleServiceHistory]: VehicleServiceHistory;
  [componentTags.vehiclePaintThickness]: VehiclePaintThickness;
  [componentTags.vehicleClaimableItems]: VehicleClaimableItems;
  [componentTags.vehicleWarrantyDetails]: VehicleWarrantyDetails;
};

export type ActiveElement = (typeof componentTags)[keyof typeof componentTags] | '';

@Component({
  shadow: false,
  tag: 'vehicle-lookup',
  styleUrl: 'vehicle-lookup.css',
})
export class VehicleLookup {
  @Prop() activeElement?: ActiveElement = '';

  @Prop() baseUrl: string = '';
  @Prop() isDev: boolean = false;
  @Prop() queryString: string = '';
  @Prop() language: LanguageKeys = 'en';
  @Prop() childrenProps?: string | Object;

  @Prop() errorStateListener?: (newError: string) => void;
  @Prop() blazorErrorStateListener = '';

  @Prop() loadingStateChanged?: (isLoading: boolean) => void;
  @Prop() blazorOnLoadingStateChange = '';

  @Prop() dynamicClaimActivate?: (vehicleInformation: VehicleInformation) => void;
  @Prop() blazorDynamicClaimActivate = '';

  @State() wrapperErrorState = '';
  @State() blazorRef?: DotNetObjectReference;

  @State() sharedLocales: SharedLocales = sharedLocalesSchema.getDefault();

  @Element() el: HTMLElement;

  private componentsList: ComponentMap;

  async componentWillLoad() {
    await this.changeLanguage(this.language);
  }

  @Watch('language')
  async changeLanguage(newLanguage: LanguageKeys) {
    const localeResponses = await Promise.all([getLocaleLanguage(newLanguage, 'vehicleLookup', vehicleLookupWrapperSchema), getSharedLocal(newLanguage)]);
    this.sharedLocales = localeResponses[1];
  }

  async componentDidLoad() {
    const vehicleAccessories = this.el.getElementsByTagName('vehicle-accessories')[0] as unknown as VehicleAccessories;
    const vehicleClaim = this.el.getElementsByTagName('vehicle-claimable-items')[0] as unknown as VehicleClaimableItems;
    const vehicleHistory = this.el.getElementsByTagName('vehicle-service-history')[0] as unknown as VehicleServiceHistory;
    const vehicleDetails = this.el.getElementsByTagName('vehicle-warranty-details')[0] as unknown as VehicleWarrantyDetails;
    const vehicleThickness = this.el.getElementsByTagName('vehicle-paint-thickness')[0] as unknown as VehiclePaintThickness;
    const vehicleSpecification = this.el.getElementsByTagName('vehicle-specification')[0] as unknown as VehicleSpecification;

    this.componentsList = {
      [componentTags.vehicleClaimableItems]: vehicleClaim,
      [componentTags.vehicleServiceHistory]: vehicleHistory,
      [componentTags.vehicleWarrantyDetails]: vehicleDetails,
      [componentTags.vehicleAccessories]: vehicleAccessories,
      [componentTags.vehiclePaintThickness]: vehicleThickness,
      [componentTags.vehicleSpecification]: vehicleSpecification,
    } as const;

    Object.values(this.componentsList).forEach(element => {
      if (!element) return;

      element.errorCallback = this.syncErrorAcrossComponents;
      element.loadingStateChange = this.loadingStateChangingMiddleware;
      element.loadedResponse = newResponse => this.handleLoadData(newResponse, element);
    });

    if (vehicleClaim && this.dynamicClaimActivate) {
      vehicleClaim.activate = this.dynamicClaimActivate;
    }

    if (vehicleClaim) {
      vehicleClaim.activate = vehicleInformation => {
        if (this.blazorRef && this.blazorDynamicClaimActivate) {
          this.blazorRef.invokeMethodAsync(this.blazorDynamicClaimActivate, vehicleInformation);
        }
      };
    }
  }

  private syncErrorAcrossComponents = (newErrorMessage: ErrorKeys) => {
    Object.values(this.componentsList).forEach(element => {
      if (element) element.setErrorMessage(newErrorMessage);
    });
  };

  private handleLoadData(newResponse, activeElement) {
    Object.values(this.componentsList).forEach(element => {
      if (element !== null && element !== activeElement && newResponse) element.setData(newResponse);
    });
  }

  private loadingStateChangingMiddleware = (newState: boolean) => {
    if (this.loadingStateChanged) this.loadingStateChanged(newState);
    if (this.blazorRef && this.blazorOnLoadingStateChange) this.blazorRef.invokeMethodAsync(this.blazorOnLoadingStateChange, newState);
  };

  @Watch('wrapperErrorState')
  async errorListener(newState) {
    if (this.errorStateListener) this.errorStateListener(newState);
    if (this.blazorRef && this.blazorErrorStateListener) this.blazorRef.invokeMethodAsync(this.blazorErrorStateListener, newState);
  }

  @Method()
  async setBlazorRef(newBlazorRef: DotNetObjectReference) {
    this.blazorRef = newBlazorRef;
  }

  @Method()
  async fetchVin(vin: string, headers: any = {}) {
    const activeElement = this.componentsList[this.activeElement] || null;

    this.wrapperErrorState = '';

    this.componentsList[componentTags.vehicleClaimableItems].headers = headers;

    if (!activeElement) return;

    if (vin == '') return (this.wrapperErrorState = this.sharedLocales.errors.vinNumberRequired);

    if (!validateVin(vin)) return (this.wrapperErrorState = this.sharedLocales.errors.invalidVin);

    activeElement.fetchData(vin, headers);
  }

  render() {
    const props = {
      [componentTags.vehicleAccessories]: {},
      [componentTags.vehicleSpecification]: {},
      [componentTags.vehicleClaimableItems]: {},
      [componentTags.vehiclePaintThickness]: {},
      [componentTags.vehicleServiceHistory]: {},
      [componentTags.vehicleWarrantyDetails]: {},
    };

    try {
      if (this.childrenProps) {
        let parsedProps = {};
        if (typeof this.childrenProps === 'string') parsedProps = JSON.parse(this.childrenProps);
        else if (typeof this.childrenProps === 'object') parsedProps = this.childrenProps;

        Object.keys(props).forEach(key => {
          if (typeof parsedProps[key] === 'object') props[key] = parsedProps[key];
        });
      }
    } catch (error) {
      console.error(error);
    }

    if (!Object.values(componentTags).includes(this.activeElement as any))
      return <div class="w-full h-[200px] text-[26px] text-red-600 flex items-center justify-center">Invalid tag</div>;

    return (
      <Host>
        <div class={cn('w-full', { hidden: this.activeElement !== componentTags.vehicleSpecification })}>
          <vehicle-specification
            base-url={this.baseUrl}
            language={this.language}
            query-string={this.queryString}
            {...props[componentTags.vehicleSpecification]}
          ></vehicle-specification>
        </div>

        <div class={cn('w-full', { hidden: this.activeElement !== componentTags.vehicleAccessories })}>
          <vehicle-accessories base-url={this.baseUrl} language={this.language} query-string={this.queryString} {...props[componentTags.vehicleAccessories]}></vehicle-accessories>
        </div>

        <div class={cn('w-full', { hidden: this.activeElement !== componentTags.vehicleWarrantyDetails })}>
          <vehicle-warranty-details
            show-ssc="true"
            show-warranty="true"
            base-url={this.baseUrl}
            language={this.language}
            query-string={this.queryString}
            {...props[componentTags.vehicleWarrantyDetails]}
          >
            <slot></slot>
          </vehicle-warranty-details>
        </div>

        <div class={cn('w-full', { hidden: this.activeElement !== componentTags.vehicleServiceHistory })}>
          <vehicle-service-history
            language={this.language}
            base-url={this.baseUrl}
            query-string={this.queryString}
            {...props[componentTags.vehicleServiceHistory]}
          ></vehicle-service-history>
        </div>

        <div class={cn('w-full', { hidden: this.activeElement !== componentTags.vehiclePaintThickness })}>
          <vehicle-paint-thickness
            base-url={this.baseUrl}
            language={this.language}
            query-string={this.queryString}
            {...props[componentTags.vehiclePaintThickness]}
          ></vehicle-paint-thickness>
        </div>

        <div class={cn('w-full', { hidden: this.activeElement !== componentTags.vehicleClaimableItems })}>
          <vehicle-claimable-items
            {...props[componentTags.vehicleClaimableItems]}
            language={this.language}
            base-url={this.baseUrl}
            query-string={this.queryString}
          ></vehicle-claimable-items>
        </div>
      </Host>
    );
  }
}
