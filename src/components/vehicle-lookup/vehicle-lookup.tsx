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

@Component({
  shadow: false,
  tag: 'vehicle-lookup',
  styleUrl: 'vehicle-lookup.css',
})
export class VehicleLookup {
  @Prop() activeLookupIndex?: string = '0';

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

  private componentsList: [VehicleSpecification, VehicleAccessories, WarrantyDetails, ServiceHistory, PaintThickness, DynamicClaim];

  async componentDidLoad() {
    const vehicleSpecification = this.el.getElementsByTagName('vehicle-specification')[0] as unknown as VehicleSpecification;
    const vehicleAccessories = this.el.getElementsByTagName('vehicle-accessories')[0] as unknown as VehicleAccessories;
    const vehicleDetails = this.el.getElementsByTagName('warranty-details')[0] as unknown as WarrantyDetails;
    const vehicleHistory = this.el.getElementsByTagName('service-history')[0] as unknown as ServiceHistory;
    const vehicleThickness = this.el.getElementsByTagName('paint-thickness')[0] as unknown as PaintThickness;
    const vehicleClaim = this.el.getElementsByTagName('dynamic-claim')[0] as unknown as DynamicClaim;

    this.componentsList = [vehicleSpecification, vehicleAccessories, vehicleDetails, vehicleHistory, vehicleThickness, vehicleClaim] as const;

    this.componentsList.forEach(element => {
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
    this.componentsList.forEach(element => {
      if (!element) return;

      element.loadingStateChange = newProp;
    });
  }

  @Watch('blazorOnLoadingStateChange')
  async handleBlazorLoadingRefChange(loadingInvokeRef) {
    if (this.blazorRef) {
      this.componentsList.forEach(element => {
        if (!element) return;

        element.loadingStateChange = newState => this.blazorRef.invokeMethodAsync(loadingInvokeRef, newState);
      });
    }
  }

  @Method()
  async setBlazorRef(newBlazorRef: DotNetObjectReference) {
    this.blazorRef = newBlazorRef;
    if (this.blazorOnLoadingStateChange) {
      this.componentsList.forEach(element => {
        if (!element) return;

        element.loadingStateChange = newState => this.blazorRef.invokeMethodAsync(this.blazorOnLoadingStateChange, newState);
      });
    }
  }

  @Method()
  async fetchVin(vin: string, headers: any = {}) {
    const activeElement: (typeof this.componentsList)[number] = this.componentsList[this.activeLookupIndex] || null;

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
    this.componentsList.forEach(element => {
      if (element !== null && element !== activeElement && newResponse) element.setData(newResponse);
    });
  }

  render() {
    return (
      <Host>
        <div class={cn('w-full', { hidden: this.activeLookupIndex !== '0' })}>
          <vehicle-specification isDev={this.isDev} base-url={this.baseUrl} query-string={this.queryString}></vehicle-specification>
        </div>

        <div class={cn('w-full', { hidden: this.activeLookupIndex !== '1' })}>
          <vehicle-accessories isDev={this.isDev} base-url={this.baseUrl} query-string={this.queryString}></vehicle-accessories>
        </div>

        <div class={cn('w-full', { hidden: this.activeLookupIndex !== '2' })}>
          <warranty-details show-ssc="true" show-warranty="true" isDev={this.isDev} base-url={this.baseUrl} query-string={this.queryString}>
            <slot></slot>
          </warranty-details>
        </div>

        <div class={cn('w-full', { hidden: this.activeLookupIndex !== '3' })}>
          <service-history isDev={this.isDev} base-url={this.baseUrl} query-string={this.queryString}></service-history>
        </div>

        <div class={cn('w-full', { hidden: this.activeLookupIndex !== '4' })}>
          <paint-thickness isDev={this.isDev} base-url={this.baseUrl} query-string={this.queryString}></paint-thickness>
        </div>

        <div class={cn('w-full', { hidden: this.activeLookupIndex !== '5' })}>
          <dynamic-claim isDev={this.isDev} base-url={this.baseUrl} query-string={this.queryString}></dynamic-claim>
        </div>
      </Host>
    );
  }
}
