import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';
import { getLocaleLanguage, LanguageKeys, Locale, localeSchema } from '~types/locale-schema';

import { ServiceItem } from '~types/vehicle-information';
import cn from '~lib/cn';

@Component({
  shadow: true,
  tag: 'dynamic-redeem',
  styleUrl: 'dynamic-redeem.css',
})
export class DynamicRedeem {
  @Prop() vin?: string = '';
  @Prop() item?: ServiceItem = null;
  @Prop() language: LanguageKeys = 'en';
  @Prop() canceledItems?: ServiceItem[] = null;
  @Prop() unInvoicedByBrokerName?: string = null;
  @Prop() handleScanner?: (code: string) => void;
  @Prop() handleQrChanges?: (code: string) => void;
  @Prop() loadingStateChange?: (isLoading: boolean) => void;

  @State() locale: Locale = localeSchema.getDefault();

  @State() isLoading: boolean = false;
  @State() internalVin?: string = '';
  @State() isOpened?: boolean = false;
  @State() internalItem?: ServiceItem = null;
  @State() confirmServiceCancellation: boolean = false;
  @State() internalCanceledItem?: ServiceItem[] = null;
  @State() confirmUnInvoicedTBPVehicles: boolean = false;

  @Element() el: HTMLElement;

  input: HTMLInputElement;
  dynamicClaimProcessor: HTMLElement;

  closeModalListenerRef: (event: KeyboardEvent) => void;

  async componentWillLoad() {
    await this.changeLanguage(this.language);
  }

  @Watch('language')
  async changeLanguage(newLanguage: LanguageKeys) {
    this.locale = await getLocaleLanguage(newLanguage);
  }

  @Watch('isLoading')
  onIsLoadingChange(newValue: boolean) {
    if (this.loadingStateChange) this.loadingStateChange(newValue);
  }

  async componentDidLoad() {
    this.input = this.el.shadowRoot.querySelector('.dynamic-claim-processor .qr-input');
    this.dynamicClaimProcessor = this.el.shadowRoot.querySelector('.dynamic-claim-processor');

    if (this.unInvoicedByBrokerName === null) {
      this.confirmUnInvoicedTBPVehicles = true;
    } else {
      this.confirmUnInvoicedTBPVehicles = false;
    }
  }

  private focusInput() {
    setTimeout(() => {
      this.input.focus();
    }, 100);
  }

  @Watch('canceledItems')
  async changeInternalCanceledItem(newInternalCanceledItem) {
    this.internalCanceledItem = newInternalCanceledItem;

    if (this.internalCanceledItem.length > 0) {
      this.confirmServiceCancellation = false;
    } else {
      this.confirmServiceCancellation = true;
    }
  }

  @Watch('unInvoicedByBrokerName')
  async changeConfirmUnInvoicedTBPVehicles(newUnInvoicedByBrokerName) {
    if (newUnInvoicedByBrokerName === null) {
      this.confirmUnInvoicedTBPVehicles = true;
    } else {
      this.confirmUnInvoicedTBPVehicles = false;
    }
  }

  @Watch('vin')
  async changeInternalVin(newInternalVin) {
    this.internalVin = newInternalVin;
  }

  @Watch('item')
  async changeInternalItem(newItem) {
    this.isOpened = !!newItem;
    if (newItem) this.internalItem = newItem;

    if (newItem) {
      this.closeModalListenerRef = (event: KeyboardEvent) => event.key === 'Escape' && this.quite();

      window.addEventListener('keydown', this.closeModalListenerRef);

      await new Promise(r => setTimeout(r, 300));
      this.input.focus();
    } else {
      window.removeEventListener('keydown', this.closeModalListenerRef);
      this.quite();
    }
  }

  closeModal = async () => {
    this.isOpened = false;
    this.item = null;
    await new Promise(r => setTimeout(r, 500));
    this.canceledItems = [];
    this.unInvoicedByBrokerName = null;
    this.input.value = '';
    this.isLoading = false;
    this.input.readOnly = false;
  };

  @Method()
  async quite() {
    this.closeModal();
  }

  @Method()
  async getQrValue() {
    return this.input.value;
  }

  qrCodeKeyDown = async (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      if (!this.confirmServiceCancellation || !this.confirmUnInvoicedTBPVehicles) return;

      event.preventDefault();
      if (!this?.handleScanner) return;

      const inputValue = this.input.value;
      this.input.value = '';
      this.isLoading = true;
      this.input.readOnly = true;

      this.handleScanner(inputValue);
    }
  };

  onValueChanges = (event: Event) => {
    if (this.handleQrChanges) {
      const input = event.target as HTMLInputElement;
      this.handleQrChanges(input.value);
    }
  };

  render() {
    const texts = this.locale.vehicleLookup.dynamicRedeem;
    const disableInput = !this.confirmServiceCancellation || !this.confirmUnInvoicedTBPVehicles;

    if (!disableInput) this.focusInput();
    return (
      <Host>
        <div dir={this.locale.direction} class={cn('dynamic-claim-processor', this?.isOpened && 'active')}>
          <svg id="dynamic-claim-processor-close-icon" onClick={this.closeModal} viewBox="-0.5 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <path d="M3 21.32L21 3.32001" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
              <path d="M3 3.32001L21 21.32" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
            </g>
          </svg>
          <div class="dynamic-claim-processor-wrapper">
            <div class="dynamic-claim-processor-info-box">
              <div class="dynamic-claim-processor-info-box-header">
                <strong class="dynamic-claim-header-vin">{this?.internalVin}</strong>
              </div>

              <div class="dynamic-claim-processor-info-box-body">
                <table class="border-separate">
                  <tr>
                    <th>{texts.serviceType}</th>
                    <td>{this?.internalItem?.type}</td>

                    <th>{texts.name}</th>
                    <td>{this?.internalItem?.name}</td>
                  </tr>

                  <tr>
                    <th>{texts.activationDate}</th>
                    <td>{this?.internalItem?.activatedAt}</td>

                    <th>{texts.expireDate}</th>
                    <td>{this?.internalItem?.expiresAt}</td>
                  </tr>

                  <tr>
                    <th>{texts.menuCode}</th>
                    <td>{this?.internalItem?.menuCode}</td>
                  </tr>
                </table>
              </div>
            </div>

            <div style={{ flex: '1', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
              {this?.internalCanceledItem && Array.isArray(this.internalCanceledItem) && !!this.internalCanceledItem.length && (
                <div class="admonition warning">
                  <p class="admonition-title">{texts.warning}</p>
                  <div style={{ padding: '0 30px' }}>
                    <p class="my-4">{texts.skipServicesWarning}</p>
                    <ul class="dynamic-claim-processor-to-be-cancelled-list warning-ul my-4 list-disc">
                      {this.internalCanceledItem.map(({ name }) => (
                        <li id={name}>{name}</li>
                      ))}
                    </ul>

                    <div class="cancel-confirmation-box">
                      <label>
                        <input
                          type="checkbox"
                          class="confirm-cancellation-input m-[3px] ml-1"
                          onChange={() => {
                            this.confirmServiceCancellation = !this.confirmServiceCancellation;
                          }}
                        />
                        {texts.confirmSkipServices}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {true && this.unInvoicedByBrokerName && (
                <div class="admonition warning">
                  <p class="admonition-title">{texts.warning}</p>
                  <div style={{ padding: '0 30px' }}>
                    <p class="my-4">{texts.notInvoiced}</p>
                    <div>
                      <strong>{this.unInvoicedByBrokerName}</strong>
                    </div>

                    <div class="cancel-confirmation-box">
                      <label>
                        <input
                          type="checkbox"
                          class="confirm-cancellation-input m-[3px] ml-1"
                          onChange={() => {
                            this.confirmUnInvoicedTBPVehicles = !this.confirmUnInvoicedTBPVehicles;
                          }}
                        />
                        {texts.confirmNotInvoiced}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div class={cn('dynamic-claim-processor-progress', (!this.confirmServiceCancellation || !this.confirmUnInvoicedTBPVehicles) && 'disabled')}>
                <div id="scan-invoice-step" class={cn('dynamic-claim-processor-progress-step', this.isLoading && 'processing')}>
                  <div style={{ position: 'relative', width: '130px', height: '130px', display: 'block', margin: 'auto', marginTop: '15px' }}>
                    <div style={{ position: 'absolute' }} class="scan-invoice-wrapper flex flex-col gap-1 justify-center items-center">
                      <svg fill="#3071a9" height="100px" width="100px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" stroke="#ffffff">
                        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                        <g id="SVGRepo_iconCarrier">
                          <g>
                            <g>
                              <path d="M354.338,34.205h-61.71c-3.354-9.93-12.752-17.102-23.8-17.102h-17.547C243.359,6.451,230.813,0,217.521,0 s-25.839,6.451-33.76,17.102h-17.547c-11.048,0-20.446,7.172-23.8,17.102H80.701c-18.566,0-33.67,15.105-33.67,33.67v359.148 c0,18.566,15.105,33.67,33.67,33.67h171.023c4.427,0,8.017-3.589,8.017-8.017c0-4.427-3.589-8.017-8.017-8.017H80.701 c-9.725,0-17.637-7.912-17.637-17.637V67.875c0-9.725,7.912-17.637,17.637-17.637h60.394v26.188c0,4.427,3.589,8.017,8.017,8.017 H285.93c4.427,0,8.017-3.589,8.017-8.017V50.238h60.391c9.725,0,17.637,7.912,17.637,17.637v230.881 c0,4.427,3.589,8.017,8.017,8.017c4.427,0,8.017-3.589,8.017-8.017V67.875C388.008,49.309,372.904,34.205,354.338,34.205z M277.914,68.409H157.129V42.252c0-0.011,0.001-0.02,0.001-0.031c0-0.005-0.001-0.011-0.001-0.015 c0.009-5.004,4.08-9.071,9.085-9.071h21.846c2.854,0,5.493-1.517,6.929-3.985c4.781-8.213,13.204-13.117,22.532-13.117 s17.751,4.904,22.532,13.117c1.435,2.467,4.075,3.985,6.929,3.985h21.846c4.999,0,9.067,4.059,9.085,9.055 c0,0.011-0.001,0.02-0.001,0.031c0,0.021,0.003,0.041,0.003,0.062V68.409z"></path>
                            </g>
                          </g>
                          <g>
                            <g>
                              <path d="M251.722,410.455H97.269V84.443h17.64c4.427,0,8.017-3.589,8.017-8.017s-3.589-8.017-8.017-8.017H89.253 c-4.427,0-8.017,3.589-8.017,8.017v342.046c0,4.427,3.589,8.017,8.017,8.017h162.47c4.427,0,8.017-3.589,8.017-8.017 C259.739,414.044,256.15,410.455,251.722,410.455z"></path>
                            </g>
                          </g>
                          <g>
                            <g>
                              <path d="M345.787,68.409h-25.653c-4.427,0-8.017,3.589-8.017,8.017s3.589,8.017,8.017,8.017h17.637v214.311 c0,4.427,3.589,8.017,8.017,8.017s8.017-3.589,8.017-8.017V76.426C353.804,71.999,350.214,68.409,345.787,68.409z"></path>
                            </g>
                          </g>
                          <g>
                            <g>
                              <path d="M371.44,324.944c-51.572,0-93.528,41.956-93.528,93.528S319.869,512,371.44,512s93.528-41.956,93.528-93.528 S423.012,324.944,371.44,324.944z M371.44,495.967c-42.731,0-77.495-34.764-77.495-77.495s34.764-77.495,77.495-77.495 s77.495,34.764,77.495,77.495S414.172,495.967,371.44,495.967z"></path>
                            </g>
                          </g>
                          <g>
                            <g>
                              <path d="M217.607,34.205h-0.086c-4.427,0-7.974,3.589-7.974,8.017c0,4.427,3.631,8.017,8.059,8.017 c4.427,0,8.017-3.589,8.017-8.017C225.624,37.794,222.035,34.205,217.607,34.205z"></path>
                            </g>
                          </g>
                          <g>
                            <g>
                              <path d="M419.865,387.15c-3.13-3.131-8.207-3.131-11.337,0l-54.19,54.19l-28.536-28.536c-3.131-3.131-8.207-3.131-11.337,0 c-3.131,3.131-3.131,8.207,0,11.337l34.205,34.205c1.565,1.565,3.617,2.348,5.668,2.348s4.103-0.782,5.668-2.348l59.858-59.858 C422.995,395.356,422.995,390.28,419.865,387.15z"></path>
                            </g>
                          </g>
                          <g>
                            <g>
                              <path d="M182.781,177.309v-32.338c11.295,1.934,18.171,7.688,18.171,11.889c0,4.427,3.589,8.017,8.017,8.017 s8.017-3.589,8.017-8.017c0-14.171-14.492-25.621-34.205-28.092v-1.036c0-4.427-3.589-8.017-8.017-8.017s-8.017,3.589-8.017,8.017 v1.036c-19.713,2.47-34.205,13.92-34.205,28.092c0,20.074,18.829,27.788,34.205,32.461v32.338 c-11.295-1.934-18.171-7.688-18.171-11.889c0-4.427-3.589-8.017-8.017-8.017s-8.017,3.589-8.017,8.017 c0,14.171,14.492,25.621,34.205,28.092v1.036c0,4.427,3.589,8.017,8.017,8.017s8.017-3.589,8.017-8.017v-1.036 c19.713-2.47,34.205-13.92,34.205-28.092C216.985,189.697,198.157,181.982,182.781,177.309z M166.747,172.411 c-13.524-4.713-18.171-8.963-18.171-15.551c0-2.535,2.236-5.335,6.134-7.68c3.294-1.982,7.473-3.415,12.037-4.198V172.411z M194.818,217.45c-3.294,1.982-7.473,3.415-12.037,4.198v-27.429c13.524,4.713,18.171,8.963,18.171,15.551 C200.952,212.306,198.716,215.105,194.818,217.45z"></path>
                            </g>
                          </g>
                          <g>
                            <g>
                              <path d="M294.48,136.818h-42.756c-4.427,0-8.017,3.589-8.017,8.017s3.589,8.017,8.017,8.017h42.756 c4.427,0,8.017-3.589,8.017-8.017S298.908,136.818,294.48,136.818z"></path>
                            </g>
                          </g>
                          <g>
                            <g>
                              <path d="M277.378,171.023h-25.653c-4.427,0-8.017,3.589-8.017,8.017s3.589,8.017,8.017,8.017h25.653 c4.427,0,8.017-3.589,8.017-8.017S281.805,171.023,277.378,171.023z"></path>
                            </g>
                          </g>
                          <g>
                            <g>
                              <path d="M294.48,205.228h-42.756c-4.427,0-8.017,3.589-8.017,8.017s3.589,8.017,8.017,8.017h42.756 c4.427,0,8.017-3.589,8.017-8.017S298.908,205.228,294.48,205.228z"></path>
                            </g>
                          </g>
                          <g>
                            <g>
                              <path d="M157.662,282.188H140.56c-4.427,0-8.017,3.589-8.017,8.017s3.589,8.017,8.017,8.017h17.102 c4.427,0,8.017-3.589,8.017-8.017S162.089,282.188,157.662,282.188z"></path>
                            </g>
                          </g>
                          <g>
                            <g>
                              <path d="M157.662,350.597H140.56c-4.427,0-8.017,3.589-8.017,8.017s3.589,8.017,8.017,8.017h17.102 c4.427,0,8.017-3.589,8.017-8.017S162.089,350.597,157.662,350.597z"></path>
                            </g>
                          </g>
                          <g>
                            <g>
                              <path d="M157.662,316.393H140.56c-4.427,0-8.017,3.589-8.017,8.017s3.589,8.017,8.017,8.017h17.102 c4.427,0,8.017-3.589,8.017-8.017S162.089,316.393,157.662,316.393z"></path>
                            </g>
                          </g>
                          <g>
                            <g>
                              <path d="M294.48,282.188H191.866c-4.427,0-8.017,3.589-8.017,8.017s3.589,8.017,8.017,8.017H294.48 c4.427,0,8.017-3.589,8.017-8.017S298.908,282.188,294.48,282.188z"></path>
                            </g>
                          </g>
                          <g>
                            <g>
                              <path d="M268.827,350.597h-76.96c-4.427,0-8.017,3.589-8.017,8.017s3.589,8.017,8.017,8.017h76.96 c4.427,0,8.017-3.589,8.017-8.017S273.254,350.597,268.827,350.597z"></path>
                            </g>
                          </g>
                          <g>
                            <g>
                              <path d="M294.48,316.393H191.866c-4.427,0-8.017,3.589-8.017,8.017s3.589,8.017,8.017,8.017H294.48 c4.427,0,8.017-3.589,8.017-8.017S298.908,316.393,294.48,316.393z"></path>
                            </g>
                          </g>
                        </g>
                      </svg>
                      <div>{texts.scanTheInvoice}</div>
                    </div>
                    <div style={{ position: 'absolute' }} class="loading-wrapper">
                      <div class={cn('lds-ripple', this.isLoading && 'active')}>
                        <div></div>
                        <div></div>
                      </div>
                      <div class={cn('lds-ripple-loading', this.isLoading && 'active')}>{texts.processing}</div>
                    </div>
                  </div>

                  <input
                    dir="ltr"
                    class="qr-input"
                    spellcheck="false"
                    onInput={this.onValueChanges}
                    onKeyDown={this.qrCodeKeyDown}
                    onBlur={() => this.input.focus()}
                    autocomplete="off"
                    disabled={disableInput}
                    placeholder=""
                    autofocus
                    style={{ marginTop: '20px', padding: '10px 0px', fontSize: '16px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
