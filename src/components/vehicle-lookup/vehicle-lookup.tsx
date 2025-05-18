import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';

import cn from '~lib/cn';
import validateVin from '~lib/validate-vin';
import { ErrorKeys, getLocaleLanguage, getSharedLocal, SharedLocales, sharedLocalesSchema } from '~lib/get-local-language';

import { LanguageKeys } from '~types/locale';
import { DotNetObjectReference } from '~types/components';

import vehicleLookupWrapperSchema from '~locales/vehicleLookup/wrapper-type';

import { VehicleClaimableItems } from './vehicle-claimable-items';
import { PaintThickness } from './paint-thickness';
import { ServiceHistory } from './service-history';
import { WarrantyDetails } from './warranty-details';
import { VehicleAccessories } from './vehicle-accessories';
import { VehicleSpecification } from './vehicle-specification';
import { VehicleInformation } from '../../components';

const componentTags = {
  paintThickness: 'paint-thickness',
  serviceHistory: 'service-history',
  warrantyDetails: 'warranty-details',
  vehicleAccessories: 'vehicle-accessories',
  vehicleSpecification: 'vehicle-specification',
  vehicleClaimableItems: 'vehicle-claimable-items',
} as const;

export type ComponentMap = {
  [componentTags.paintThickness]: PaintThickness;
  [componentTags.serviceHistory]: ServiceHistory;
  [componentTags.warrantyDetails]: WarrantyDetails;
  [componentTags.vehicleAccessories]: VehicleAccessories;
  [componentTags.vehicleSpecification]: VehicleSpecification;
  [componentTags.vehicleClaimableItems]: VehicleClaimableItems;
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
    const vehicleHistory = this.el.getElementsByTagName('service-history')[0] as unknown as ServiceHistory;
    const vehicleThickness = this.el.getElementsByTagName('paint-thickness')[0] as unknown as PaintThickness;
    const vehicleDetails = this.el.getElementsByTagName('warranty-details')[0] as unknown as WarrantyDetails;
    const vehicleAccessories = this.el.getElementsByTagName('vehicle-accessories')[0] as unknown as VehicleAccessories;
    const vehicleClaim = this.el.getElementsByTagName('vehicle-claimable-items')[0] as unknown as VehicleClaimableItems;
    const vehicleSpecification = this.el.getElementsByTagName('vehicle-specification')[0] as unknown as VehicleSpecification;

    this.componentsList = {
      [componentTags.serviceHistory]: vehicleHistory,
      [componentTags.warrantyDetails]: vehicleDetails,
      [componentTags.paintThickness]: vehicleThickness,
      [componentTags.vehicleClaimableItems]: vehicleClaim,
      [componentTags.vehicleAccessories]: vehicleAccessories,
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
      [componentTags.paintThickness]: {},
      [componentTags.serviceHistory]: {},
      [componentTags.warrantyDetails]: {},
      [componentTags.vehicleAccessories]: {},
      [componentTags.vehicleSpecification]: {},
      [componentTags.vehicleClaimableItems]: {},
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

        <div class={cn('w-full', { hidden: this.activeElement !== componentTags.warrantyDetails })}>
          <warranty-details
            show-ssc="true"
            show-warranty="true"
            base-url={this.baseUrl}
            language={this.language}
            query-string={this.queryString}
            {...props[componentTags.warrantyDetails]}
          >
            <slot></slot>
          </warranty-details>
        </div>

        <div class={cn('w-full', { hidden: this.activeElement !== componentTags.serviceHistory })}>
          <service-history language={this.language} base-url={this.baseUrl} query-string={this.queryString} {...props[componentTags.serviceHistory]}></service-history>
        </div>

        <div class={cn('w-full', { hidden: this.activeElement !== componentTags.paintThickness })}>
          <paint-thickness base-url={this.baseUrl} language={this.language} query-string={this.queryString} {...props[componentTags.paintThickness]}></paint-thickness>
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
