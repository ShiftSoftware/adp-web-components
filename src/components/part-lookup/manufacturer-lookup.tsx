import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';

import cn from '~lib/cn';
import { capitalize } from '~lib/general';
import { getLocaleLanguage } from '~lib/get-local-language';

import { AppStates, MockJson } from '~types/components';
import { PartInformation } from '~types/part-information';
import { ErrorKeys, LanguageKeys, Locale, localeSchema } from '~types/locales';

import Loading from '../components/Loading';

import { getPartInformation, PartInformationInterface } from '~api/partInformation';

let mockData: MockJson<PartInformation> = {};

@Component({
  shadow: true,
  tag: 'manufacturer-lookup',
  styleUrl: 'manufacturer-lookup.css',
})
export class ManufacturerLookup implements PartInformationInterface {
  @Prop() baseUrl: string = '';
  @Prop() isDev: boolean = false;
  @Prop() queryString: string = '';
  @Prop() hiddenFields: string = '';
  @Prop() language: LanguageKeys = 'en';
  @Prop() localizationName?: string = '';
  @Prop() headerTitle: string = 'Manufacturer';
  @Prop() loadingStateChange?: (isLoading: boolean) => void;
  @Prop() loadedResponse?: (response: PartInformation) => void;

  @State() state: AppStates = 'idle';
  @State() errorMessage?: ErrorKeys = null;
  @State() partInformation?: PartInformation;
  @State() externalPartNumber?: string = null;
  @State() locale: Locale = localeSchema.getDefault();

  abortController: AbortController;
  networkTimeoutRef: ReturnType<typeof setTimeout>;

  @Element() el: HTMLElement;

  async componentWillLoad() {
    await this.changeLanguage(this.language);
  }

  @Watch('language')
  async changeLanguage(newLanguage: LanguageKeys) {
    this.locale = await getLocaleLanguage(newLanguage);
  }

  private handleSettingData(response: PartInformation) {
    this.partInformation = response;
  }

  @Method()
  async setData(newData: PartInformation | string, headers: any = {}) {
    clearTimeout(this.networkTimeoutRef);
    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();
    let scopedTimeoutRef: ReturnType<typeof setTimeout>;

    const isPartNumberRequest = typeof newData === 'string';

    const partNumber = isPartNumberRequest ? newData : newData?.partNumber;
    this.externalPartNumber = partNumber;

    try {
      if (!partNumber || partNumber.trim().length === 0) {
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

      const partResponse = isPartNumberRequest ? await getPartInformation(this, { scopedTimeoutRef, partNumber, mockData }, headers) : newData;

      if (this.networkTimeoutRef === scopedTimeoutRef) {
        if (!partResponse) throw new Error('wrongResponseFormat');

        this.handleSettingData(partResponse);
      }

      this.errorMessage = null;
      this.state = 'data';
    } catch (error) {
      if (error && error?.name === 'AbortError') return;

      console.error(error);
      this.state = 'error';
      this.partInformation = null;
      this.errorMessage = error.message;
    }
  }

  @Method()
  async fetchData(partNumber: string = this.externalPartNumber, headers: any = {}) {
    await this.setData(partNumber, headers);
  }

  @Watch('state')
  async loadingListener() {
    if (this.loadingStateChange) this.loadingStateChange(this.state.includes('loading'));
  }

  @Method()
  async setMockData(newMockData: MockJson<PartInformation>) {
    mockData = newMockData;
  }

  render() {
    const localName = this.partInformation ? this.localizationName || 'russian' : 'russian';

    const hiddenFields = this.partInformation ? this.hiddenFields.split(',').map(field => field.trim()) || [] : [];

    const manufacturerData = this.partInformation
      ? [
          { label: 'Origin', key: 'origin', value: this.partInformation.tmcPart.origin },
          { label: 'Warranty Price', key: 'warrantyPrice', value: this.partInformation.tmcPart.warrantyPrice?.toFixed(2) },
          { label: 'Special Price', key: 'specialPrice', value: this.partInformation.tmcPart.specialPrice?.toFixed(2) },
          { label: 'Wholesales Price', key: 'salesPrice', value: this.partInformation.tmcPart.salesPrice?.toFixed(2) },
          { label: 'PNC', key: 'pnc', value: this.partInformation.tmcPart.pnc },
          { label: `PNC ${capitalize(localName)} Name`, key: 'pncLocalName', value: this.partInformation.tmcPart.pncLocalName },
          { label: 'Bin Code', key: 'binCode', value: this.partInformation.tmcPart.binCode },
          { label: 'Dimension 1', key: 'dimension1', value: this.partInformation.tmcPart.dimension1 },
          { label: 'Dimension 2', key: 'dimension2', value: this.partInformation.tmcPart.dimension2 },
          { label: 'Dimension 3', key: 'dimension3', value: this.partInformation.tmcPart.dimension3 },
          { label: 'Net Weight', key: 'netWeight', value: this.partInformation.tmcPart.netWeight },
          { label: 'Gross Weight', key: 'grossWeight', value: this.partInformation.tmcPart.grossWeight },
          { label: 'Cubic Measure', key: 'cubicMeasure', value: this.partInformation.tmcPart.cubicMeasure },
          { label: 'HS Code', key: 'hsCode', value: this.partInformation.tmcPart.hsCode },
          { label: 'UZ HS Code', key: 'uzHsCode', value: this.partInformation.tmcPart.uzHsCode },
        ]
      : [];

    const displayedManufacturerData = manufacturerData.filter(part => !hiddenFields.includes(part.key));

    return (
      <Host>
        <div dir={this.locale.direction} class="min-h-[100px] relative transition-all duration-300 overflow-hidden">
          <div>
            <Loading isLoading={this.state.includes('loading')} />
            <div class={cn('transition-all duration-700', { 'scale-0': this.state.includes('loading') || this.state === 'idle', 'opacity-0': this.state.includes('loading') })}>
              {['error', 'error-loading'].includes(this.state) && (
                <div class="py-[16px]">
                  <div class=" px-[16px] py-[8px] border reject-card text-[20px] rounded-[8px] w-fit mx-auto">
                    {this.locale.errors[this.errorMessage] || this.locale.errors.wildCard}
                  </div>
                </div>
              )}

              {['data', 'data-loading'].includes(this.state) && (
                <div>
                  <div class="flex mt-[12px] overflow-hidden rounded-[4px] flex-col border border-[#d6d8dc]">
                    <div class="w-full h-[40px] flex shrink-0 justify-center text-[18px] items-center text-[#383c43] text-center bg-[#e1e3e5]">{this.headerTitle}</div>

                    <div class="px-[30px] py-[10px] flex flex-col gap-[15px]">
                      <div class="grid grid-cols-3 gap-[50px]">
                        {displayedManufacturerData.map(({ label, value, key }) => (
                          <div key={key} class="flex flex-col flex-1">
                            <strong class="py-[10px] px-0 border-b-[gray] border-b">{label}</strong>
                            <div class="py-[10px] px-0">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
