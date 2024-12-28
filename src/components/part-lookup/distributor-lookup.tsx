import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';
import Loading from '../parts/Loading';
import { AppStates, MockJson } from '~types/components';
import cn from '~lib/cn';
import { PartInformation } from '~types/part-information';
import { getPartInformation, PartInformationInterface } from '~api/partInformation';

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

  //@State() componentHeight = '0px';
  @State() state: AppStates = 'idle';
  @State() externalPartNumber?: string = null;
  @State() errorMessage?: string = null;
  @State() partInformation?: PartInformation;

  //private wrapperRef?: HTMLDivElement;
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
        //this.componentHeight = '0px';
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
  //calculateHeight(componentState: string) {
  //  if (componentState.includes('loading') && this.componentHeight === '0px') {
  //    this.componentHeight = '100px';
  //  } else if (componentState !== 'idle') {
  //    setTimeout(() => {
  //      this.componentHeight = `${this.wrapperRef.clientHeight}px`;
  //    }, 50);
  //  } else {
  //    this.componentHeight = '0px';
  //  }
  //}

  @Watch('state')
  async loadingListener() {
    //this.calculateHeight(newState);

    if (this.loadingStateChange) this.loadingStateChange(this.state.includes('loading'));
  }

  @Method()
  async setMockData(newMockData: MockJson<PartInformation>) {
    mockData = newMockData;
  }

  render() {
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

                    <div style={{ padding: '10px 30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{ display: 'flex', gap: '50px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', 'flex': '1' }}>
                          <strong style={{ padding: '10px 0', borderBottom: '1px solid grey', }}>Description</strong>
                          <div style={{ padding: '10px 0px' }}>{this.partInformation.stockParts[0].partDescription}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', 'flex': '1' }}>
                          <strong style={{ padding: '10px 0', borderBottom: '1px solid grey', }}>Product Group</strong>
                          <div style={{ padding: '10px 0px' }}>{this.partInformation.stockParts[0].group}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', 'flex': '1' }}>
                          <strong style={{ padding: '10px 0', borderBottom: '1px solid grey', }}>Price</strong>
                          <div style={{ padding: '10px 0px' }}>{this.partInformation.stockParts[0].price}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '50px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', 'flex': '1' }}>
                          <strong style={{ padding: '10px 0', borderBottom: '1px solid grey', }}>Superseded To</strong>
                          <div style={{ padding: '10px 0px' }}>{this.partInformation.stockParts[0].supersededTo}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', 'flex': '1' }}>
                          <strong style={{ padding: '10px 0', borderBottom: '1px solid grey', }}>Superseded From</strong>
                          <div style={{ padding: '10px 0px' }}>{this.partInformation.stockParts[0].supersededFrom}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', 'flex': '1' }}>
                        </div>
                      </div>
                    </div>
                  </div>

                  {this.partInformation.stockParts.filter(y => { return y.quantityLookUpResult === 'LookupIsSkipped' || y.quantityLookUpResult === 'QuantityNotWithinLookupThreshold'; }).length === 0 && (
                    <div class="flex mt-[12px] max-h-[70dvh] overflow-hidden rounded-[4px] flex-col border border-[#d6d8dc]">
                      <div class="w-full h-[40px] flex shrink-0 justify-center text-[18px] items-center text-[#383c43] text-center bg-[#e1e3e5]">Distributor Stock</div>

                      <div style={{ padding: '10px 30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>

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
                            {this.partInformation?.stockParts.map((stock) => (
                              <tr class="transition-colors duration-100 hover:bg-slate-100" key={stock.locationID}>
                                <td class={cn('px-[10px] py-[20px] text-center whitespace-nowrap border-b border-[#d6d8dc]')}>
                                  {stock.locationName}
                                </td>

                                <td class={cn('px-[10px] py-[20px] text-center whitespace-nowrap border-b border-[#d6d8dc]')}>
                                  <div class={stock.quantityLookUpResult === 'Available' ? 'success' : stock.quantityLookUpResult === 'PartiallyAvailable' ? 'warning' : 'reject'}>
                                    <strong>{stock.quantityLookUpResult === 'Available' ? 'Available' : stock.quantityLookUpResult === 'PartiallyAvailable' ? 'Partially Available' : 'Not Available'}</strong>
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
