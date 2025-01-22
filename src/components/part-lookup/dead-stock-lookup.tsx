import { Component, Element, Host, Method, Prop, State, Watch, h } from '@stencil/core';
import { PartInformation } from '~types/part-information';
import { getPartInformation, PartInformationInterface } from '~api/partInformation';
import Loading from '../components/Loading';
import { AppStates, MockJson } from '~types/components';
import cn from '~lib/cn';

let mockData: MockJson<PartInformation> = {};

const closedAccordionHeight = '46px' as const;

@Component({
  tag: 'dead-stock-lookup',
  styleUrl: 'dead-stock-lookup.css',
  shadow: true,
})
export class DeadStockLookup implements PartInformationInterface {
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
        if (!partResponse) throw new Error('wrongResponseFormat');

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

  private toggleAccordion(event: MouseEvent) {
    const container = (event.target as HTMLButtonElement).parentElement as HTMLDivElement;
    const icon = container.getElementsByClassName('icon')[0] as HTMLSpanElement;

    const isExpanded = container.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
      container.style.height = closedAccordionHeight;
      icon.style.transform = 'rotate(0deg)';
      container.setAttribute('aria-expanded', 'false');
    } else {
      const content = container.getElementsByClassName('content')[0] as HTMLDivElement;
      const totalHeight = +closedAccordionHeight.replace('px', '') + content.getClientRects()[0].height;

      container.style.height = `${totalHeight}px`;
      icon.style.transform = 'rotate(180deg)';
      container.setAttribute('aria-expanded', 'true');
    }
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
                    <div class="w-full h-[40px] flex shrink-0 justify-center text-[18px] items-center text-[#383c43] text-center bg-[#e1e3e5]">Dead stock</div>

                    {this.partInformation?.deadStock?.map(deadStock => (
                      <div key={deadStock.companyIntegrationID} class="py-[10px] px-[20px]">
                        <div
                          aria-expanded="false"
                          style={{ height: closedAccordionHeight }}
                          class="border shadow transition-all duration-500 overflow-hidden rounded-md mb-[10px] border-[#d6d8dc]"
                        >
                          <button
                            onClick={this.toggleAccordion}
                            style={{ height: closedAccordionHeight }}
                            class="w-full flex px-[10px] justify-between items-center text-slate-800"
                          >
                            <strong>{deadStock.companyName}</strong>
                            <span class="icon text-slate-800 transition-transform duration-500">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-[22px]">
                                <path
                                  fill-rule="evenodd"
                                  clip-rule="evenodd"
                                  d="M11.78 9.78a.75.75 0 0 1-1.06 0L8 7.06 5.28 9.78a.75.75 0 0 1-1.06-1.06l3.25-3.25a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06Z"
                                />
                              </svg>
                            </span>
                          </button>

                          <div class="content">
                            <table class="w-full overflow-auto relative border-collapse">
                              <thead>
                                <tr>
                                  <th class="py-[20px] px-[10px] text-left whitespace-nowrap border-b border-[#d6d8dc]">Branch</th>
                                  <th class="py-[20px] px-[10px] text-left whitespace-nowrap border-b border-[#d6d8dc]">Available Qty</th>
                                </tr>
                              </thead>

                              <tbody>
                                {deadStock?.branchDeadStock.map(branchDeadStock => (
                                  <tr
                                    class="transition-colors border-b border-[#d6d8dc] last:border-none duration-100 hover:bg-slate-100"
                                    key={branchDeadStock.companyBranchIntegrationID}
                                  >
                                    <td class={cn('py-[20px] px-[10px] text-left whitespace-nowrap')}>{branchDeadStock.companyBranchName}</td>

                                    <td class={cn('py-[20px] px-[10px] text-left whitespace-nowrap')}>
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
