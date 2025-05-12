import { InferType } from 'yup';
import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';

import cn from '~lib/cn';
import { ErrorKeys, getLocaleLanguage, getSharedLocal, SharedLocales, sharedLocalesSchema } from '~lib/get-local-language';

import { LanguageKeys } from '~types/locale';
import { MockJson } from '~types/components';
import { ClaimPayload, ServiceItem, VehicleInformation } from '~types/vehicle-information';

import expiredIcon from './assets/expired.svg';
import pendingIcon from './assets/pending.svg';
import cancelledIcon from './assets/cancelled.svg';
import processedIcon from './assets/processed.svg';
import activationRequiredIcon from './assets/activationRequired.svg';

import { getVehicleInformation, VehicleInformationInterface } from '~api/vehicleInformation';

import { DynamicRedeem } from './dynamic-redeem';
import dynamicClaimSchema from '~locales/vehicleLookup/dynamicClaim/type';

let mockData: MockJson<VehicleInformation> = {};

const icons = {
  expired: expiredIcon,
  pending: pendingIcon,
  processed: processedIcon,
  cancelled: cancelledIcon,
  activationRequired: activationRequiredIcon,
};

@Component({
  shadow: true,
  tag: 'dynamic-claim',
  styleUrl: 'dynamic-claim.css',
})
export class DynamicClaim implements VehicleInformationInterface {
  @Prop() baseUrl: string;
  @Prop() isDev: boolean = false;
  @Prop() queryString: string = '';
  @Prop() claimEndPoint: string = 'api/vehicle/swift-claim';
  @Prop() headers: any = {};
  @Prop() language: LanguageKeys = 'en';
  @Prop() errorCallback: (errorMessage: ErrorKeys) => void;
  @Prop() loadingStateChange?: (isLoading: boolean) => void;
  @Prop() loadedResponse?: (response: VehicleInformation) => void;
  @Prop() activate?: (vehicleInformation: VehicleInformation) => void;

  @State() sharedLocales: SharedLocales = sharedLocalesSchema.getDefault();
  @State() locale: InferType<typeof dynamicClaimSchema> = dynamicClaimSchema.getDefault();

  @State() isIdle: boolean = true;
  @State() popupClasses: string = '';
  @State() isLoading: boolean = false;
  @State() externalVin?: string = null;
  @State() errorMessage?: ErrorKeys = null;
  @State() activePopupIndex: null | number = null;
  @State() vehicleInformation?: VehicleInformation;

  pendingItemHighlighted = false;

  @Element() el: HTMLElement;

  scrollListenerRef: () => void;
  abortController: AbortController;
  timeoutRef: ReturnType<typeof setTimeout>;
  networkTimeoutRef: ReturnType<typeof setTimeout>;

  cachedClaimItem: ServiceItem;

  dynamicRedeem: DynamicRedeem;
  dynamicClaimBody: HTMLElement;
  popupPositionRef: HTMLElement;
  dynamicClaimProgressBar: HTMLElement;

  async componentWillLoad() {
    await this.changeLanguage(this.language);
  }

  @Watch('language')
  async changeLanguage(newLanguage: LanguageKeys) {
    const localeResponses = await Promise.all([getLocaleLanguage(newLanguage, 'vehicleLookup.dynamicClaim', dynamicClaimSchema), getSharedLocal(newLanguage)]);
    this.locale = localeResponses[0];
    this.sharedLocales = localeResponses[1];
  }

  async componentDidLoad() {
    this.dynamicClaimBody = this.el.shadowRoot.querySelector('.dynamic-claim-body');
    this.dynamicRedeem = this.el.shadowRoot.getElementById('dynamic-redeem') as unknown as DynamicRedeem;
    this.dynamicClaimProgressBar = this.el.shadowRoot.querySelector('.dynamic-claim-progress-bar');
  }

  @Method()
  async setMockData(newMockData: MockJson<VehicleInformation>) {
    mockData = newMockData;
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
        this.isIdle = true;
        return;
      }

      this.isLoading = true;
      this.isIdle = false;

      await new Promise(r => {
        scopedTimeoutRef = setTimeout(r, 1000);
        this.networkTimeoutRef = scopedTimeoutRef;
      });

      const vehicleResponse = isVinRequest ? await getVehicleInformation(this, { scopedTimeoutRef, vin, mockData }, headers) : newData;

      if (this.networkTimeoutRef === scopedTimeoutRef) {
        if (!vehicleResponse) throw new Error('wrongResponseFormat');
        if (!Array.isArray(vehicleResponse.serviceItems)) throw new Error('noServiceAvailable');
        this.vehicleInformation = vehicleResponse;
      }

      this.errorMessage = null;
      this.isLoading = false;
    } catch (error) {
      if (error && error?.name === 'AbortError') return;
      if (this.errorCallback) this.errorCallback(error.message);
      console.error(error);
      this.setErrorMessage(error.message);
    }
  }

  @Method()
  async setErrorMessage(message: ErrorKeys) {
    this.isIdle = false;
    this.isLoading = false;
    this.vehicleInformation = null;
    this.errorMessage = message;
  }

  @Method()
  async fetchData(requestedVin: string = this.externalVin, headers: any = {}) {
    await this.setData(requestedVin, headers);
  }

  @Watch('isLoading')
  onLoadingChange(newValue: boolean) {
    if (this.loadingStateChange) this.loadingStateChange(newValue);
    this.setLoadingUi(newValue);
  }

  async setLoadingUi(isLoading: boolean) {
    if (!isLoading) {
      this.dynamicClaimProgressBar.style.width = '0';
      await new Promise(r => setTimeout(r, 200));
      this.updateProgressBar();
    }
  }

  updateProgressBar() {
    const serviceItems = this.vehicleInformation?.serviceItems || [];

    if (serviceItems.filter(x => x.status === 'pending').length === 0) {
      if (serviceItems.length === 0 || serviceItems.filter(x => x.status === 'activationRequired').length === serviceItems.length) this.dynamicClaimProgressBar.style.width = '0%';
      else this.dynamicClaimProgressBar.style.width = '100%';
      this.dynamicClaimBody.scrollTo({
        left: this.dynamicClaimBody.scrollWidth,
        behavior: 'smooth',
      });
    } else {
      const firstPendingItem = serviceItems.find(x => x.status === 'pending');
      const firstPendingItemIndex = serviceItems.indexOf(firstPendingItem) + 1;
      const firstPendingItemRef = this.dynamicClaimBody.getElementsByClassName('dynamic-claim-item')[firstPendingItemIndex - 1] as HTMLElement;
      this.dynamicClaimProgressBar.style.width = (firstPendingItemIndex / serviceItems.length - 1 / (serviceItems.length * 2)) * 100 + '%';
      this.dynamicClaimBody.scrollTo({
        left: firstPendingItemRef.offsetLeft - firstPendingItemRef.clientWidth * 3,
        behavior: 'smooth',
      });
    }
  }

  @Watch('vehicleInformation')
  resetProgressBar() {
    setTimeout(() => {
      this.updateProgressBar();
    }, 100);
  }

  @Watch('popupClasses')
  windowScrollListener(newValue) {
    if (newValue) {
      this.scrollListenerRef = () => this.calculatePopupPos(this.el.shadowRoot);
      window.addEventListener('scroll', this.scrollListenerRef);
      this.dynamicClaimBody.addEventListener('scroll', this.scrollListenerRef);
    } else {
      window.removeEventListener('scroll', this.scrollListenerRef);
      this.dynamicClaimBody.removeEventListener('scroll', this.scrollListenerRef);
    }
  }

  onMouseLeave = () => {
    clearTimeout(this.timeoutRef);

    this.popupClasses = '';

    this.timeoutRef = setTimeout(() => {
      this.activePopupIndex = null;
    }, 400);
  };

  onMouseEnter = (dynamicClaimItemHeader: HTMLElement, idx: number) => {
    clearTimeout(this.timeoutRef);

    this.activePopupIndex = idx;

    this.timeoutRef = setTimeout(() => {
      const positionRef = dynamicClaimItemHeader.querySelector('.popup-position-ref') as HTMLElement;

      this.popupPositionRef = positionRef;
      this.calculatePopupPos(this.el.shadowRoot);

      this.popupClasses = 'show';
    }, 50);
  };

  calculatePopupPos(root: ShadowRoot) {
    const popupPositionRef = root.querySelector('.popup-position-ref') as HTMLElement;

    let { x, y } = popupPositionRef.getBoundingClientRect();
    const popupContainer = popupPositionRef.querySelector('.popup-container') as HTMLElement;

    const { width } = popupContainer.getBoundingClientRect();

    const popupInfo = popupContainer.querySelector('.dynamic-claim-item-popup-info') as HTMLElement;

    const windowWidth = window.innerWidth; // Get the viewport's width

    popupContainer.style.top = `${y}px`;
    popupContainer.style.left = `${x - width / 2}px`;

    const offsetFromLeft = x - width / 2; // Distance from left side of the viewport
    const offsetFromRight = windowWidth - (x + width / 2); // Distance from right side of the viewport

    let movingNeeded = 0;
    let horizontalMargin = 16;
    if (offsetFromRight < horizontalMargin) movingNeeded = offsetFromRight - horizontalMargin;
    else if (offsetFromLeft < horizontalMargin) movingNeeded = Math.abs(offsetFromLeft - horizontalMargin);

    popupInfo.style.transform = `translateX(${movingNeeded}px)`;
  }

  removeLoadAnimationClass(event: AnimationEvent) {
    const component = event.target as HTMLDivElement;
    component.classList.remove('load-animation');
  }

  @Method()
  async completeClaim() {
    const serviceItems = this.vehicleInformation?.serviceItems || [];

    const item = this.cachedClaimItem;
    const serviceDataClone = JSON.parse(JSON.stringify(serviceItems));

    const index = serviceItems.indexOf(item);
    const pendingItemsBefore = serviceDataClone.slice(0, index).filter(x => x.status === 'pending');

    serviceDataClone[index].claimable = false;
    serviceDataClone[index].status = 'processed';

    pendingItemsBefore.forEach(function (otherItem) {
      otherItem.status = 'cancelled';
    });

    this.pendingItemHighlighted = false;

    const vehicleDataClone = JSON.parse(JSON.stringify(this.vehicleInformation)) as VehicleInformation;
    vehicleDataClone.serviceItems = serviceDataClone;
    this.vehicleInformation = JSON.parse(JSON.stringify(vehicleDataClone));
  }

  @Method()
  async claim(item: ServiceItem) {
    const serviceItems = this.vehicleInformation?.serviceItems || [];

    const vinDataClone = JSON.parse(JSON.stringify(serviceItems));
    const index = serviceItems.indexOf(item);

    //Find other items before this item that have status 'pending'
    let pendingItemsBefore = vinDataClone.slice(0, index).filter(x => x.status === 'pending') as ServiceItem[];

    this.cachedClaimItem = item;

    if (item.maximumMileage === null) {
      pendingItemsBefore = [];
    }

    this.onMouseLeave();

    this.openRedeem(item, pendingItemsBefore);
  }

  private async handleClaiming() {
    if (this.isDev) {
      this.dynamicRedeem.handleClaiming = async (payload: ClaimPayload) => {
        await new Promise(r => setTimeout(r, 500));

        console.log({
          ...payload,
          vin: this.vehicleInformation.vin,
          saleInformation: this.vehicleInformation.saleInformation,
          serviceItem: this.dynamicRedeem.item,
          cancelledServiceItems: this.dynamicRedeem.canceledItems,
        });

        this.dynamicRedeem.quite();
        this.completeClaim();
        this.dynamicRedeem.handleClaiming = null;
      };
    } else {
      this.dynamicRedeem.handleClaiming = async (payload: ClaimPayload) => {
        try {
          const response = await fetch(this.claimEndPoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...this.headers,
            },
            body: JSON.stringify({
              ...payload,
              vin: this.vehicleInformation.vin,
              saleInformation: this.vehicleInformation.saleInformation,
              serviceItem: this.dynamicRedeem.item,
              cancelledServiceItems: this.dynamicRedeem.canceledItems,
            }),
          });

          const data = await response.json();

          if (!data.Success) {
            alert(data.Message);
            this.dynamicRedeem.quite();
            this.dynamicRedeem.handleClaiming = null;
            return;
          }

          this.dynamicRedeem.quite();
          this.completeClaim();
          this.dynamicRedeem.handleClaiming = null;
        } catch (error) {
          console.error(error);
          alert(this.sharedLocales.errors.requestFailedPleaseTryAgainLater);
          this.dynamicRedeem.quite();
          this.dynamicRedeem.handleClaiming = null;
        }
      };
    }
  }

  private openRedeem(item: ServiceItem, oldItems: ServiceItem[]) {
    const vehicleInformation = this.vehicleInformation as VehicleInformation;

    this.dynamicRedeem.vin = vehicleInformation?.vin;
    this.dynamicRedeem.item = item;
    this.dynamicRedeem.canceledItems = oldItems;

    if (vehicleInformation?.saleInformation?.broker !== null && vehicleInformation?.saleInformation?.broker?.invoiceDate === null)
      this.dynamicRedeem.unInvoicedByBrokerName = vehicleInformation?.saleInformation?.broker?.brokerName;
    else this.dynamicRedeem.unInvoicedByBrokerName = null;

    this.handleClaiming();
  }

  createPopup(item: ServiceItem) {
    const texts = this.locale;

    return (
      <div dir={this.sharedLocales.direction} class="popup-position-ref">
        <div class="popup-container">
          <div class={cn('dynamic-claim-item-popup-info-triangle', this.popupClasses)}>
            <div class="dynamic-claim-item-popup-info-triangle-up"></div>
            <div class="dynamic-claim-item-popup-info-triangle-up2"></div>
          </div>
          <div class={cn('dynamic-claim-item-popup-info', this.popupClasses)}>
            <table>
              <tbody>
                <tr>
                  <th>{texts.serviceType}</th>
                  <td>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</td>
                </tr>

                <tr>
                  <th>{texts.activationDate}</th>
                  <td>{item.activatedAt}</td>
                </tr>

                <tr>
                  <th>{texts.expireDate}</th>
                  <td>{item.expiresAt}</td>
                </tr>

                <tr>
                  <th>{texts.claimAt}</th>
                  <td>{item.claimDate}</td>
                </tr>

                <tr>
                  <th>{texts.claimingCompany}</th>
                  <td>{item.companyName}</td>
                </tr>

                <tr>
                  <th>{texts.invoiceNumber}</th>
                  <td>{item.invoiceNumber}</td>
                </tr>

                <tr>
                  <th>{texts.jobNumber}</th>
                  <td>{item.jobNumber}</td>
                </tr>

                <tr>
                  <th>{texts.packageCode}</th>
                  <td>{item.packageCode}</td>
                </tr>
              </tbody>
            </table>

            {item.claimable && (
              <button onClick={() => this.claim(item)} class="claim-button dynamic-claim-button">
                <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g stroke-width="0"></g>
                  <g stroke-linecap="round" stroke-linejoin="round"></g>
                  <g>
                    <circle cx="12" cy="12" r="8" fill-opacity="0.24"></circle>
                    <path d="M8.5 11L11.3939 13.8939C11.4525 13.9525 11.5475 13.9525 11.6061 13.8939L19.5 6" stroke-width="1.2"></path>
                  </g>
                </svg>
                <span>{texts.claim}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const serviceItems = this.vehicleInformation?.serviceItems || [];
    const texts = this.locale;

    console.log(this.errorMessage);

    return (
      <Host>
        <dynamic-redeem language={this.language} id="dynamic-redeem"></dynamic-redeem>
        <div class={cn('dynamic-claim-wrapper', { loading: this.isLoading, idle: this.isIdle })}>
          <div class="dynamic-claim-header">
            <strong onAnimationEnd={this.removeLoadAnimationClass} class="dynamic-claim-header-vin load-animation">
              {this.errorMessage && (
                <span dir={this.sharedLocales.direction} style={{ color: 'red' }}>
                  {this.sharedLocales.errors[this.errorMessage] || this.sharedLocales.errors.wildCard}
                </span>
              )}
              {!this.errorMessage && this.vehicleInformation?.vin}
            </strong>
          </div>

          <div
            class={cn('dynamic-claim-body', {
              'has-activation-box': this.vehicleInformation && this.vehicleInformation.serviceItems.filter(x => x.status === 'activationRequired').length > 0,
            })}
          >
            <div class="loading-lane">
              <div class="dynamic-claim-loading-slider">
                <div class="dynamic-claim-loading-slider-line"></div>
                <div class="dynamic-claim-loading-slider-subline dynamic-claim-inc"></div>
                <div class="dynamic-claim-loading-slider-subline dynamic-claim-dec"></div>
              </div>
            </div>

            <div class="dynamic-claim-progress-lane">
              {serviceItems.map((item: ServiceItem, idx) => {
                let statusClass = '';

                if (item.status === 'pending') {
                  if (serviceItems.findIndex(i => i.status === 'pending') === idx) statusClass = item.status;
                } else statusClass = item.status;

                return (
                  <div key={item.name} class={cn('dynamic-claim-item', statusClass)} onMouseLeave={this.onMouseLeave}>
                    <div
                      onAnimationEnd={this.removeLoadAnimationClass}
                      class="dynamic-claim-item-header load-animation"
                      onMouseEnter={event => this.onMouseEnter(event.target as HTMLElement, idx)}
                    >
                      <img src={icons[item.status]} alt="status icon" />
                      <span>{texts[item.status]}</span>
                      {this.activePopupIndex === idx && this.createPopup(item)}
                    </div>
                    <div onAnimationEnd={this.removeLoadAnimationClass} class="dynamic-claim-item-circle load-animation"></div>
                    <p onAnimationEnd={this.removeLoadAnimationClass} class="dynamic-claim-item-footer load-animation">
                      {item.name}
                    </p>
                  </div>
                );
              })}

              <div class="dynamic-claim-progress-bar"></div>
            </div>

            <div class="dynamic-claim-activation-box">
              <div
                class={cn('card warning-card span-entire-1st-row activation-panel', {
                  loading: this.isLoading,
                  visible: this.vehicleInformation && this.vehicleInformation.serviceItems.filter(x => x.status === 'activationRequired').length > 0,
                })}
                onAnimationEnd={this.removeLoadAnimationClass}
              >
                <p class="no-padding flex gap-2">
                  <span class="font-semibold">{texts.warrantyAndServicesNotActivated}</span>
                </p>

                <button
                  onClick={() => {
                    if (this.activate) {
                      this.activate(this.vehicleInformation);
                    }
                  }}
                  class="claim-button dynamic-claim-button"
                >
                  <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g stroke-width="0"></g>
                    <g stroke-linecap="round" stroke-linejoin="round"></g>
                    <g>
                      <circle cx="12" cy="12" r="8" fill-opacity="0.24"></circle>
                      <path d="M8.5 11L11.3939 13.8939C11.4525 13.9525 11.5475 13.9525 11.6061 13.8939L19.5 6" stroke-width="1.2"></path>
                    </g>
                  </svg>
                  <span>{texts.activateNow}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
