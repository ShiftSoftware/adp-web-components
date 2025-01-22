import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';
import { ErrorKeys, getLocaleLanguage, LanguageKeys, Locale, localeSchema } from '~types/locale-schema';

import cn from '~lib/cn';

import expiredIcon from './assets/expired.svg';
import pendingIcon from './assets/pending.svg';
import cancelledIcon from './assets/cancelled.svg';
import processedIcon from './assets/processed.svg';

import { MockJson } from '~types/components';
import { ServiceItem, VehicleInformation } from '~types/vehicle-information';

import { getVehicleInformation, VehicleInformationInterface } from '~api/vehicleInformation';
import { DynamicRedeem } from './dynamic-redeem';

let mockData: MockJson<VehicleInformation> = {};

const icons = {
  expired: expiredIcon,
  pending: pendingIcon,
  processed: processedIcon,
  cancelled: cancelledIcon,
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
  @Prop() language: LanguageKeys = 'en';
  @Prop() loadingStateChange?: (isLoading: boolean) => void;
  @Prop() loadedResponse?: (response: VehicleInformation) => void;

  @State() locale: Locale = localeSchema.getDefault();

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
    this.locale = await getLocaleLanguage(newLanguage);
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
        if (!Array.isArray(vehicleResponse.serviceItems)) throw new Error('No Service Available');
        this.vehicleInformation = vehicleResponse;
      }

      this.errorMessage = null;
      this.isLoading = false;
    } catch (error) {
      if (error && error?.name === 'AbortError') return;

      this.isLoading = false;
      this.vehicleInformation = null;
      this.errorMessage = error.message;
    }
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
      if (serviceItems.length === 0) this.dynamicClaimProgressBar.style.width = '0%';
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

    serviceDataClone[index].status = 'processed';

    pendingItemsBefore.forEach(function (otherItem) {
      otherItem.status = 'cancelled';
    });

    this.pendingItemHighlighted = false;

    const vehicleDataClone = JSON.parse(JSON.stringify(this.vehicleInformation)) as VehicleInformation;
    vehicleDataClone.serviceItems = serviceDataClone;
    this.vehicleInformation = JSON.parse(JSON.stringify(vehicleDataClone));
  }

  claim(item: ServiceItem) {
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

  private async handleRedeemScanner() {
    if (this.isDev) {
      this.dynamicRedeem.handleScanner = async _ => {
        await new Promise(r => setTimeout(r, 500));
        this.dynamicRedeem.quite();
        this.completeClaim();
        this.dynamicRedeem.handleScanner = null;
      };
    } else {
      this.dynamicRedeem.handleScanner = async code => {
        try {
          const vehicleInformation = this.vehicleInformation as VehicleInformation;

          const payload = {
            vin: vehicleInformation.vin,
            brandIntegrationID: vehicleInformation.identifiers.brandIntegrationID,
            invoice: code,
            saleInformation: vehicleInformation.saleInformation,
            serviceItem: this.dynamicRedeem.item,
            cancelledServiceItems: this.dynamicRedeem.canceledItems,
          };

          const response = await fetch('/api/vehicle/swift-claim', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const data = await response.json();

          if (!data.Success) {
            alert(data.Message);
            this.dynamicRedeem.quite();
            this.dynamicRedeem.handleScanner = null;
            return;
          }

          this.dynamicRedeem.quite();
          this.completeClaim();
          this.dynamicRedeem.handleScanner = null;
        } catch (error) {
          console.error(error);
          alert('Request failed please try again later');
          this.dynamicRedeem.quite();
          this.dynamicRedeem.handleScanner = null;
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

    this.handleRedeemScanner();
  }

  createPopup(item: ServiceItem) {
    const texts = this.locale.vehicleLookup.dynamicClaim;

    return (
      <div dir={this.locale.direction} class="popup-position-ref">
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
                  <td>{item.redeemDate}</td>
                </tr>

                <tr>
                  <th>{texts.redeemingDealer}</th>
                  <td>{item.dealerName}</td>
                </tr>

                <tr>
                  <th>{texts.invoiceNumber}</th>
                  <td>{item.invoiceNumber}</td>
                </tr>

                <tr>
                  <th>{texts.wip}</th>
                  <td>{item.wip}</td>
                </tr>

                <tr>
                  <th>{texts.claim}</th>
                  <td>{item.menuCode}</td>
                </tr>
              </tbody>
            </table>

            {item.status === 'pending' && (
              <button onClick={() => this.claim(item)} class="dynamic-claim-button claim-button">
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
    const texts = this.locale.vehicleLookup.dynamicClaim;

    return (
      <Host>
        <dynamic-redeem id="dynamic-redeem"></dynamic-redeem>
        <div class={cn('dynamic-claim-wrapper', { loading: this.isLoading, idle: this.isIdle })}>
          <div class="dynamic-claim-header">
            <strong onAnimationEnd={this.removeLoadAnimationClass} class="dynamic-claim-header-vin load-animation">
              {this.errorMessage && <span style={{ color: 'red' }}>{this.errorMessage}</span>}
              {!this.errorMessage && this.vehicleInformation?.vin}
            </strong>
          </div>

          <div class="dynamic-claim-body">
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
          </div>
        </div>
      </Host>
    );
  }
}
