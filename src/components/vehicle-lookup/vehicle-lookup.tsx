import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';

import { WarrantyDetails } from 'components/warranty-details/warranty-details';
import { VehicleAccessories } from 'components/vehicle-accessories/vehicle-accessories';
import { VehicleSpecification } from 'components/vehicle-specification/vehicle-specification';

import cn from '~lib/cn';
import { ServiceHistory } from 'components/service-history/service-history';
import { PaintThickness } from 'components/paint-thickness/paint-thickness';
import { DynamicClaim } from 'components/dynamic-claim/dynamic-claim';
import validateVin from '~lib/validate-vin';
import { DotNetObjectReference } from '~types/components';

export type ComponentMap = {
  'dynamic-claim': DynamicClaim;
  'paint-thickness': PaintThickness;
  'service-history': ServiceHistory;
  'warranty-details': WarrantyDetails;
  'vehicle-accessories': VehicleAccessories;
  'vehicle-specification': VehicleSpecification;
};

export type ActiveElement = keyof ComponentMap | '';
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

  @Prop() loadingStateChanged?: (isLoading: boolean) => void;
  @Prop() blazorOnLoadingStateChange = '';

  @State() wrapperErrorState = '';
  @Prop() errorStateListener?: (newError: string) => void;
  @Prop() blazorErrorStateListener = '';

  @State() blazorRef?: DotNetObjectReference;

  @Element() el: HTMLElement;

  private componentsList: ComponentMap;

  async componentDidLoad() {
    const vehicleSpecification = this.el.getElementsByTagName('vehicle-specification')[0] as unknown as VehicleSpecification;
    const vehicleAccessories = this.el.getElementsByTagName('vehicle-accessories')[0] as unknown as VehicleAccessories;
    const vehicleDetails = this.el.getElementsByTagName('warranty-details')[0] as unknown as WarrantyDetails;
    const vehicleHistory = this.el.getElementsByTagName('service-history')[0] as unknown as ServiceHistory;
    const vehicleThickness = this.el.getElementsByTagName('paint-thickness')[0] as unknown as PaintThickness;
    const vehicleClaim = this.el.getElementsByTagName('dynamic-claim')[0] as unknown as DynamicClaim;

    this.componentsList = {
      'vehicle-specification': vehicleSpecification,
      'vehicle-accessories': vehicleAccessories,
      'warranty-details': vehicleDetails,
      'service-history': vehicleHistory,
      'paint-thickness': vehicleThickness,
      'dynamic-claim': vehicleClaim,
    } as const;

    Object.values(this.componentsList).forEach(element => {
      if (!element) return;

      if (this.loadingStateChanged) element.loadingStateChange = this.loadingStateChanged;

      element.loadedResponse = newResponse => this.handleLoadData(newResponse, element);
    });
  }

  @Watch('wrapperErrorState')
  async errorListener(newState) {
    if (this.errorStateListener) this.errorStateListener(newState);
    if (this.blazorRef && this.blazorErrorStateListener) this.blazorRef.invokeMethodAsync(this.blazorErrorStateListener, newState);
  }

  @Watch('onLoadingStateChanged')
  async handleLoadingListenerPropChange(newProp) {
    Object.values(this.componentsList).forEach(element => {
      if (!element) return;

      element.loadingStateChange = newProp;
    });
  }

  @Watch('blazorOnLoadingStateChange')
  async handleBlazorLoadingRefChange(loadingInvokeRef) {
    if (this.blazorRef) {
      Object.values(this.componentsList).forEach(element => {
        if (!element) return;

        element.loadingStateChange = newState => this.blazorRef.invokeMethodAsync(loadingInvokeRef, newState);
      });
    }
  }

  @Method()
  async setBlazorRef(newBlazorRef: DotNetObjectReference) {
    this.blazorRef = newBlazorRef;
    if (this.blazorOnLoadingStateChange) {
      Object.values(this.componentsList).forEach(element => {
        if (!element) return;

        element.loadingStateChange = newState => this.blazorRef.invokeMethodAsync(this.blazorOnLoadingStateChange, newState);
      });
    }
  }

  @Method()
  async fetchVin(vin: string, headers: any = {}) {
    const activeElement = this.componentsList[this.activeElement] || null;

    this.wrapperErrorState = '';

    if (!activeElement) return;

    if (vin == '') return (this.wrapperErrorState = 'VIN is required');

    if (!validateVin(vin)) return (this.wrapperErrorState = 'Invalid VIN');

    activeElement.fetchData(vin, headers);
  }

  @Method()
  async getPageContext() {
    return { componentsList: this.componentsList };
  }

  private handleLoadData(newResponse, activeElement) {
    Object.values(this.componentsList).forEach(element => {
      if (element !== null && element !== activeElement && newResponse) element.setData(newResponse);
    });
  }

  render() {
    return (
      <Host>
        <div class={cn('w-full', { hidden: this.activeElement !== 'vehicle-specification' })}>
          <vehicle-specification isDev={this.isDev} base-url={this.baseUrl} query-string={this.queryString}></vehicle-specification>
        </div>

        <div class={cn('w-full', { hidden: this.activeElement !== 'vehicle-accessories' })}>
          <vehicle-accessories isDev={this.isDev} base-url={this.baseUrl} query-string={this.queryString}></vehicle-accessories>
        </div>

        <div class={cn('w-full', { hidden: this.activeElement !== 'warranty-details' })}>
          <warranty-details show-ssc="true" show-warranty="true" isDev={this.isDev} base-url={this.baseUrl} query-string={this.queryString}>
            <slot></slot>
          </warranty-details>
        </div>

        <div class={cn('w-full', { hidden: this.activeElement !== 'service-history' })}>
          <service-history isDev={this.isDev} base-url={this.baseUrl} query-string={this.queryString}></service-history>
        </div>

        <div class={cn('w-full', { hidden: this.activeElement !== 'paint-thickness' })}>
          <paint-thickness isDev={this.isDev} base-url={this.baseUrl} query-string={this.queryString}></paint-thickness>
        </div>

        <div class={cn('w-full', { hidden: this.activeElement !== 'dynamic-claim' })}>
          <dynamic-claim isDev={this.isDev} base-url={this.baseUrl} query-string={this.queryString}></dynamic-claim>
        </div>
      </Host>
    );
  }
}
