import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';
import { PartInformation } from '~types/part-information';
import { getPartInformation, PartInformationInterface } from '~api/partInformation';
import Loading from '../parts/Loading';
import { AppStates, MockJson } from '~types/components';
import cn from '~lib/cn';

let mockData: MockJson<PartInformation> = {};

@Component({
  tag: 'dead-stock-lookup',
  styleUrl: 'dead-stock-lookup.css',
  shadow: true,
})
export class DeadStockLookup implements PartInformationInterface {
  @Prop() isDev: boolean = false;
  @Prop() baseUrl: string = '';
  @Prop() queryString: string = '';
  @Prop() loadingStateChange?: (isLoading: boolean) => void;
  @Prop() loadedResponse?: (response: PartInformation) => void;

  @State() state: AppStates = 'idle';
  @State() externalPartNumber?: string = null;
  @State() errorMessage?: string = null;
  @State() partInformation?: PartInformation;
  @State() activeIndex: number | null = null;
  
  abortController: AbortController;
  networkTimeoutRef: ReturnType<typeof setTimeout>;

  @Element() el: HTMLElement;

  private handleSettingData(response: PartInformation) {
    this.partInformation = response;
  }

  toggleAccordion(index: number) {
    this.activeIndex = this.activeIndex === index ? null : index;
  }

  @Method()
  async setData(newData: PartInformation | string) {
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

      const partResponse = isPartNumberRequest ? await getPartInformation(this, { scopedTimeoutRef, partNumber, mockData }) : newData;

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
  async fetchData(requestedVin: string = this.externalPartNumber) {
    await this.setData(requestedVin);
  }
  
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
                    <div class="w-full h-[40px] flex shrink-0 justify-center text-[18px] items-center text-[#383c43] text-center bg-[#e1e3e5]">Deadstock</div>

                    {this.partInformation?.deadStock?.map((deadStock, i) => (
                      <div style={{ padding: '10px 20px' }}>
                        <div class="accordion-item border-b border-slate-200" style={{ boxShadow: 'rgb(225 225 225) 0px 0px 4px 1px', borderRadius: '5px', padding: '0 10px', marginBottom: '10px' }} key={deadStock.companyIntegrationID}>
                          <button class="accordion-header w-full flex justify-between items-center py-5 text-slate-800" onClick={() => this.toggleAccordion(i)}>
                            <strong>{deadStock.companyName}</strong>
                            <span class={`icon text-slate-800 transition-transform duration-300 ${this.activeIndex === i ? 'rotate-180' : ''}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4">
                                <path
                                  fill-rule="evenodd"
                                  d="M11.78 9.78a.75.75 0 0 1-1.06 0L8 7.06 5.28 9.78a.75.75 0 0 1-1.06-1.06l3.25-3.25a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06Z"
                                  clip-rule="evenodd"
                                />
                              </svg>
                            </span>
                          </button>

                          <div class={`accordion-content overflow-hidden transition-all duration-300 ease-in-out ${this.activeIndex === i ? 'max-h-screen' : 'max-h-0'}`}>
                            <table class="w-full overflow-auto relative border-collapse">
                              <thead>
                                <tr>
                                  <th class="px-[10px] py-[20px] text-left whitespace-nowrap border-b border-[#d6d8dc]">Branch</th>
                                  <th class="px-[10px] py-[20px] text-left whitespace-nowrap border-b border-[#d6d8dc]">Available Qty</th>
                                </tr>
                              </thead>

                              <tbody>
                                {deadStock?.branchDeadStock.map(branchDeadStock => (
                                  <tr class="transition-colors duration-100 hover:bg-slate-100" key={branchDeadStock.companyBranchIntegrationID}>
                                    <td class={cn('px-[10px] py-[20px] text-left whitespace-nowrap border-b border-[#d6d8dc]')}>{branchDeadStock.companyBranchName}</td>

                                    <td class={cn('px-[10px] py-[20px] text-left whitespace-nowrap border-b border-[#d6d8dc]')}>
                                      <strong>{branchDeadStock.quantity}</strong>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))}
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
