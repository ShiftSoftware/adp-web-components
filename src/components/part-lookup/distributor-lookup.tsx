import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';

import cn from '~lib/cn';
import { capitalize } from '~lib/general';
import { AppStates, MockJson } from '~types/components';
import { PartInformation } from '~types/part-information';
import { getPartInformation, PartInformationInterface } from '~api/partInformation';

import Loading from '../parts/Loading';

let mockData: MockJson<PartInformation> = {};

@Component({
  shadow: true,
  tag: 'distributor-lookup',
  styleUrl: 'distributor-lookup.css',
})
export class DistributorLookup implements PartInformationInterface {
  @Prop() baseUrl: string = '';
  @Prop() isDev: boolean = false;
  @Prop() queryString: string = '';
  @Prop() loadingStateChange?: (isLoading: boolean) => void;
  @Prop() loadedResponse?: (response: PartInformation) => void;

  @State() state: AppStates = 'idle';
  @State() externalPartNumber?: string = null;
  @State() errorMessage?: string = null;
  @State() partInformation?: PartInformation;

  abortController: AbortController;
  networkTimeoutRef: ReturnType<typeof setTimeout>;

  @Element() el: HTMLElement;

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
        if (!partResponse) throw new Error('Wrong response format');

        this.handleSettingData(partResponse);
      }

      this.errorMessage = null;
      this.state = 'data';
    } catch (error) {
      if (error && error?.name === 'AbortError') return;

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
    const localName = this.partInformation ? this.partInformation?.localName || 'russian' : 'russian';

    const hiddenFields = this.partInformation ? this.partInformation.stockParts[0]?.hiddenFields || [] : [];

    const partsInformation = this.partInformation
      ? [
          { label: 'Description', key: 'partDescription', value: this.partInformation.stockParts[0].partDescription },
          { label: 'Product Group', key: 'group', value: this.partInformation.stockParts[0].group },
          { label: `${capitalize(localName)} Description`, key: 'localDescription', value: this.partInformation.stockParts[0].localDescription },
          { label: 'Dealer Purchase price', key: 'fob', value: this.partInformation.stockParts[0].fob?.toFixed(2) },
          { label: 'Recommended Retail price', key: 'price', value: this.partInformation.stockParts[0].price?.toFixed(2) },
          { label: 'Superseded From', key: 'supersededFrom', value: this.partInformation.stockParts[0].supersededFrom },
          { label: 'Superseded To', key: 'supersededTo', value: this.partInformation.stockParts[0].supersededTo },
        ]
      : [];

    const displayedFields = partsInformation.filter(part => !hiddenFields.includes(part.key));

    const displayDistributer = this.partInformation
      ? !this.partInformation.stockParts.some(
          ({ quantityLookUpResult }) => quantityLookUpResult === 'LookupIsSkipped' || quantityLookUpResult === 'QuantityNotWithinLookupThreshold',
        )
      : false;

    return (
      <Host>
        <div class="min-h-[100px] relative transition-all duration-300 overflow-hidden">
          <div>
            <Loading isLoading={this.state.includes('loading')} />
            <div class={cn('transition-all duration-700', { 'scale-0': this.state.includes('loading') || this.state === 'idle', 'opacity-0': this.state.includes('loading') })}>
              {['error', 'error-loading'].includes(this.state) && (
                <div class="py-[16px]">
                  <div class=" px-[16px] py-[8px] border reject-card text-[20px] rounded-[8px] w-fit mx-auto">{this.errorMessage}</div>
                </div>
              )}

              {['data', 'data-loading'].includes(this.state) && (
                <div>
                  <div class="flex mt-[12px] max-h-[70dvh] overflow-hidden rounded-[4px] flex-col border border-[#d6d8dc]">
                    <div class="w-full h-[40px] flex shrink-0 justify-center text-[18px] items-center text-[#383c43] text-center bg-[#e1e3e5]">Info</div>

                    <div class="py-[10px] px-[30px] flex flex-col gap-[15px]">
                      <div class="grid grid-cols-3 gap-[50px]">
                        {displayedFields.map(({ label, value, key }) => (
                          <div key={key} class="flex flex-col flex-1">
                            <strong class="py-[10px] px-0 border-b-[gray] border-b">{label}</strong>
                            <div class="py-[10px] px-0">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {displayDistributer && (
                    <div class="flex mt-[12px] max-h-[70dvh] overflow-hidden rounded-[4px] flex-col border border-[#d6d8dc]">
                      <div class="w-full h-[40px] flex shrink-0 justify-center text-[18px] items-center text-[#383c43] text-center bg-[#e1e3e5]">Distributor Stock</div>

                      <div class="flex flex-col gap-[15px]">
                        <table class="w-full overflow-auto relative border-collapse">
                          <thead class="top-0 font-bold sticky bg-white">
                            <tr>
                              {['Location', 'Availability'].map(title => (
                                <th key={title} class="px-[10px] py-[20px] text-center whitespace-nowrap border-b border-[#d6d8dc]">
                                  {title}
                                </th>
                              ))}
                            </tr>
                          </thead>

                          <tbody>
                            {this.partInformation?.stockParts.map(stock => (
                              <tr class="transition-colors duration-100 border-b border-[#d6d8dc] last:border-none hover:bg-slate-100" key={stock.locationID}>
                                <td class={cn('px-[10px] py-[20px] text-center whitespace-nowrap')}>{stock.locationName}</td>

                                <td class={cn('px-[10px] py-[20px] text-center whitespace-nowrap')}>
                                  <div
                                    class={cn('text-[red]', {
                                      'text-[green]': stock.quantityLookUpResult === 'Available',
                                      'text-[orange]': stock.quantityLookUpResult === 'PartiallyAvailable',
                                    })}
                                  >
                                    <strong>
                                      {stock.quantityLookUpResult === 'Available'
                                        ? 'Available'
                                        : stock.quantityLookUpResult === 'PartiallyAvailable'
                                        ? 'Partially Available'
                                        : 'Not Available'}
                                    </strong>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
