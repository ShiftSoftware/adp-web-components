import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';

import { LanguageKeys } from '~types/locales';
import { DotNetObjectReference } from '~types/components';

import { DeadStockLookup } from './dead-stock-lookup';
import { DistributorLookup } from './distributor-lookup';
import { ManufacturerLookup } from './manufacturer-lookup';

import cn from '~lib/cn';

const DEAD_STOCK_TAG = 'dead-stock-lookup' as const;
const DISTRIBUTOR_TAG = 'distributor-lookup' as const;
const MANUFACTURER_TAG = 'manufacturer-lookup' as const;

const componentTags = {
  deadStock: DEAD_STOCK_TAG,
  distributor: DISTRIBUTOR_TAG,
  manufacturer: MANUFACTURER_TAG,
} as const;

export type ComponentMap = {
  [componentTags.deadStock]: DeadStockLookup;
  [componentTags.distributor]: DistributorLookup;
  [componentTags.manufacturer]: ManufacturerLookup;
};

export type ActiveElement = (typeof componentTags)[keyof typeof componentTags] | '';

@Component({
  shadow: false,
  tag: 'part-lookup',
  styleUrl: 'part-lookup.css',
})
export class PartLookup {
  @Prop() baseUrl: string = '';
  @Prop() isDev: boolean = false;
  @Prop() queryString: string = '';
  @Prop() language: LanguageKeys = 'en';
  @Prop() blazorErrorStateListener = '';
  @Prop() blazorOnLoadingStateChange = '';
  @Prop() childrenProps?: string | Object = '';
  @Prop() activeElement?: ActiveElement = '';
  @Prop() errorStateListener?: (newError: string) => void;
  @Prop() loadingStateChanged?: (isLoading: boolean) => void;

  @State() wrapperErrorState = '';
  @State() blazorRef?: DotNetObjectReference;

  @Element() el: HTMLElement;

  private componentsList: ComponentMap;

  async componentDidLoad() {
    const deadStockLookup = this.el.getElementsByTagName('dead-stock-lookup')[0] as unknown as DeadStockLookup;
    const distributerLookup = this.el.getElementsByTagName('distributor-lookup')[0] as unknown as DistributorLookup;
    const manufacturerLookup = this.el.getElementsByTagName('manufacturer-lookup')[0] as unknown as ManufacturerLookup;

    this.componentsList = {
      [componentTags.deadStock]: deadStockLookup,
      [componentTags.distributor]: distributerLookup,
      [componentTags.manufacturer]: manufacturerLookup,
    } as const;

    Object.values(this.componentsList).forEach(element => {
      if (!element) return;
      if (this.loadingStateChanged) element.loadingStateChange = this.loadingStateChangingMiddleware;
      element.loadedResponse = newResponse => this.handleLoadData(newResponse, element);
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
  async fetchPartNumber(partNumber: string, quantity: string = '', headers: any = {}) {
    const activeElement = this.componentsList[this.activeElement] || null;

    this.wrapperErrorState = '';

    if (!activeElement) return;

    if (partNumber == '') return (this.wrapperErrorState = 'Part Number is Required');

    const searchingText = quantity.trim() || quantity.trim() === '0' ? `${partNumber.trim()}/${quantity.trim()}` : partNumber.trim();

    activeElement.fetchData(searchingText, headers);
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
    const props = {
      [componentTags.deadStock]: {},
      [componentTags.distributor]: {},
      [componentTags.manufacturer]: {},
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
        <div class={cn('w-full', { hidden: this.activeElement !== componentTags.deadStock })}>
          <dead-stock-lookup
            isDev={this.isDev}
            base-url={this.baseUrl}
            language={this.language}
            query-string={this.queryString}
            {...props[componentTags.deadStock]}
          ></dead-stock-lookup>
        </div>

        <div class={cn('w-full', { hidden: this.activeElement !== componentTags.distributor })}>
          <distributor-lookup
            isDev={this.isDev}
            base-url={this.baseUrl}
            language={this.language}
            query-string={this.queryString}
            {...props[componentTags.distributor]}
          ></distributor-lookup>
        </div>

        <div class={cn('w-full', { hidden: this.activeElement !== componentTags.manufacturer })}>
          <manufacturer-lookup
            isDev={this.isDev}
            base-url={this.baseUrl}
            language={this.language}
            query-string={this.queryString}
            {...props[componentTags.manufacturer]}
          ></manufacturer-lookup>
        </div>

        <slot></slot>
      </Host>
    );
  }
}
