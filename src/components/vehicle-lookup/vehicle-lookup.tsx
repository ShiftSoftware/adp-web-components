import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';

import cn from '~lib/cn';
import validateVin from '~lib/validate-vin';
import { getLocaleLanguage } from '~lib/get-local-language';

import { DotNetObjectReference } from '~types/components';
import { ErrorKeys, LanguageKeys, Locale, localeSchema } from '~types/locales';

import { DynamicClaim } from './dynamic-claim';
import { PaintThickness } from './paint-thickness';
import { ServiceHistory } from './service-history';
import { WarrantyDetails } from './warranty-details';
import { VehicleAccessories } from './vehicle-accessories';
import { VehicleSpecification } from './vehicle-specification';

const componentTags = {
  dynamicClaim: 'dynamic-claim',
  paintThickness: 'paint-thickness',
  serviceHistory: 'service-history',
  warrantyDetails: 'warranty-details',
  vehicleAccessories: 'vehicle-accessories',
  vehicleSpecification: 'vehicle-specification',
} as const;

export type ComponentMap = {
  [componentTags.dynamicClaim]: DynamicClaim;
  [componentTags.paintThickness]: PaintThickness;
  [componentTags.serviceHistory]: ServiceHistory;
  [componentTags.warrantyDetails]: WarrantyDetails;
  [componentTags.vehicleAccessories]: VehicleAccessories;
  [componentTags.vehicleSpecification]: VehicleSpecification;
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
  @Prop() blazorErrorStateListener = '';
  @Prop() childrenProps?: string | Object;
  @Prop() blazorOnLoadingStateChange = '';
  @Prop() errorStateListener?: (newError: string) => void;
  @Prop() loadingStateChanged?: (isLoading: boolean) => void;

  @State() wrapperErrorState = '';
  @State() blazorRef?: DotNetObjectReference;
  @State() locale: Locale = localeSchema.getDefault();

  @Element() el: HTMLElement;

  private componentsList: ComponentMap;

  async componentWillLoad() {
    await this.changeLanguage(this.language);
  }

  @Watch('language')
  async changeLanguage(newLanguage: LanguageKeys) {
    this.locale = await getLocaleLanguage(newLanguage);
  }

  async componentDidLoad() {
    const vehicleClaim = this.el.getElementsByTagName('dynamic-claim')[0] as unknown as DynamicClaim;
    const vehicleHistory = this.el.getElementsByTagName('service-history')[0] as unknown as ServiceHistory;
    const vehicleThickness = this.el.getElementsByTagName('paint-thickness')[0] as unknown as PaintThickness;
    const vehicleDetails = this.el.getElementsByTagName('warranty-details')[0] as unknown as WarrantyDetails;
    const vehicleAccessories = this.el.getElementsByTagName('vehicle-accessories')[0] as unknown as VehicleAccessories;
    const vehicleSpecification = this.el.getElementsByTagName('vehicle-specification')[0] as unknown as VehicleSpecification;

    this.componentsList = {
      [componentTags.dynamicClaim]: vehicleClaim,
      [componentTags.serviceHistory]: vehicleHistory,
      [componentTags.warrantyDetails]: vehicleDetails,
      [componentTags.paintThickness]: vehicleThickness,
      [componentTags.vehicleAccessories]: vehicleAccessories,
      [componentTags.vehicleSpecification]: vehicleSpecification,
    } as const;

    Object.values(this.componentsList).forEach(element => {
      if (!element) return;

      element.errorCallback = this.syncErrorAcrossComponents;
      element.loadingStateChange = this.loadingStateChangingMiddleware;
      element.loadedResponse = newResponse => this.handleLoadData(newResponse, element);
    });
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

    if (!activeElement) return;

    if (vin == '') return (this.wrapperErrorState = this.locale.errors.vinNumberRequired);

    if (!validateVin(vin)) return (this.wrapperErrorState = this.locale.errors.invalidVin);

    activeElement.fetchData(vin, headers);
  }

  render() {
    const props = {
      [componentTags.dynamicClaim]: {},
      [componentTags.paintThickness]: {},
      [componentTags.serviceHistory]: {},
      [componentTags.warrantyDetails]: {},
      [componentTags.vehicleAccessories]: {},
      [componentTags.vehicleSpecification]: {},
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

        <div class={cn('w-full', { hidden: this.activeElement !== componentTags.dynamicClaim })}>
          <dynamic-claim {...props[componentTags.dynamicClaim]} language={this.language} base-url={this.baseUrl} query-string={this.queryString}></dynamic-claim>
        </div>
      </Host>
    );
  }
}
