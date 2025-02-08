import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';

import cn from '~lib/cn';

import { getLocaleLanguage } from '~lib/get-local-language';

import { ErrorKeys, LanguageKeys, Locale, localeSchema } from '~types/locales';
import { FormInputChanges, FormSelectFetcher, FormSelectItem } from '~types/forms';

import Loader from '~assets/loader.svg';

@Component({
  shadow: false,
  tag: 'form-select',
  styleUrl: 'form-select.css',
})
export class FormSelect {
  @Prop() name: string;
  @Prop() label: string;
  @Prop() isError: boolean;
  @Prop() disabled: boolean;
  @Prop() isRequired: boolean;
  @Prop() errorMessage: string;
  @Prop() formLocaleName: string;
  @Prop() fetcher: FormSelectFetcher;
  @Prop() language: LanguageKeys = 'en';
  @Prop() inputChanges: FormInputChanges;
  @Prop() placeholder: string = 'Select an option';

  @State() isLoading: boolean;
  @State() isOpen: boolean = false;
  @State() selectedValue: string = '';
  @State() openUpwards: boolean = false;
  @State() options: FormSelectItem[] = [];
  @State() fetchingErrorMessage?: ErrorKeys = null;
  @State() locale: Locale = localeSchema.getDefault();

  @Element() el!: HTMLElement;
  private abortController: AbortController;

  @Watch('language')
  async changeLanguage(newLanguage: LanguageKeys) {
    this.locale = await getLocaleLanguage(newLanguage);
    this.fetch();
  }

  dropdownRef!: HTMLElement;

  async componentWillLoad() {
    await this.changeLanguage(this.language);
  }

  toggleDropdown = () => {
    if (this.isOpen) this.isOpen = false;
    else this.adjustDropdownPosition();
  };

  adjustDropdownPosition() {
    requestAnimationFrame(() => {
      const selectButton = this.el.getElementsByClassName('select-button')[0] as HTMLDivElement;
      const selectContainer = this.el.getElementsByClassName('select-container')[0] as HTMLDivElement;

      const rect = selectButton.getBoundingClientRect();

      const spaceBelow = window.innerHeight - rect.bottom - 20; // 20 is padding

      this.openUpwards = spaceBelow < selectContainer.getBoundingClientRect().height;

      setTimeout(() => {
        this.isOpen = true;
      }, 10);
    });
  }

  handleSelection(option: FormSelectItem) {
    this.selectedValue = option.value;
    this.inputChanges(option.value);
    this.isOpen = false;
  }

  handleKeyDown(event: KeyboardEvent) {
    if (!this.isOpen) return;

    if (event.key === 'Escape') {
      this.isOpen = false;
    }
  }

  closeDropdown = (event: MouseEvent) => {
    if (!this.el.contains(event.target as Node)) {
      this.isOpen = false;
    }
  };

  async fetch() {
    try {
      this.isLoading = true;

      if (this.abortController) this.abortController.abort();

      this.abortController = new AbortController();

      const options = await this.fetcher(this.language, this.abortController.signal);

      this.fetchingErrorMessage = null;
      this.options = options;
    } catch (error) {
      if (error && error?.name === 'AbortError') return;
      console.error(error);
      this.options = [];
      this.fetchingErrorMessage = error.message;
    } finally {
      this.isLoading = false;
    }
  }

  async componentDidLoad() {
    document.addEventListener('click', this.closeDropdown);
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  async disconnectedCallback() {
    this.abortController.abort();
    document.removeEventListener('click', this.closeDropdown);
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  render() {
    const texts = this.locale.forms[this.formLocaleName];

    const selectedItem = this.options.find(item => this.selectedValue === item.value);

    if (!selectedItem) {
      this.inputChanges('');
      this.selectedValue = '';
    }

    return (
      <Host>
        <label class="relative w-full pb-[20px] inline-flex flex-col">
          {this.label && (
            <div class="mb-[4px]">
              {texts[this.label] || this.label}
              {this.isRequired && <span class="ms-0.5 text-red-600">*</span>}
            </div>
          )}

          <input name={this.name} type="string" hidden value={this.selectedValue} />

          <div class="relative">
            <button
              type="button"
              name={this.name}
              disabled={this.disabled}
              onClick={this.toggleDropdown}
              class={cn(
                'select-button enabled:focus:border-slate-600 enabled:focus:shadow-[0_0_0_0.2rem_rgba(71,85,105,0.25)] border mb-[4px] bg-white h-[38px] flex justify-between overflow-hidden disabled:opacity-75 flex-1 py-[6px] px-[12px] transition-all duration-300 rounded-md outline-none w-full',
                {
                  'text-[#9CA3AF]': !selectedItem,
                  '!border-red-500 focus:shadow-[0_0_0_0.2rem_rgba(239,68,68,0.25)]': this.isError,
                  'enabled:border-slate-600 enabled:shadow-[0_0_0_0.2rem_rgba(71,85,105,0.25)]': this.isOpen,
                },
              )}
            >
              {selectedItem ? selectedItem.label : <span>{texts[this.placeholder]}</span>}
              <svg
                fill="none"
                stroke-width="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                class={cn('select-arrow size-6 transition duration-300', { 'rotate-180': this.isOpen })}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            <div
              class={cn(
                'select-container z-[10] flex flex-col pointer-events-none absolute w-full bg-white border rounded-md shadow opacity-0 transition-opacity duration-300 max-h-[250px] overflow-auto',
                {
                  'opacity-100 pointer-events-auto': this.isOpen,
                  'top-0 -mt-[8px] -translate-y-full': this.openUpwards,
                  'top-0 mt-[8px] translate-y-[38px]': !this.openUpwards,
                },
              )}
            >
              {!!this.options.length &&
                this.options.map(option => (
                  <button
                    type="button"
                    onClick={() => this.handleSelection(option)}
                    class={cn('select-option flex justify-between px-4 py-2 hover:bg-slate-100 transition-colors duration-300', {
                      'bg-slate-200': this.selectedValue === option.value,
                    })}
                  >
                    <div>{option.label}</div>
                    <svg
                      fill="none"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class={cn('size-5 opacity-0 transition duration-300', { 'opacity-100': this.selectedValue === option.value })}
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </button>
                ))}
              {!this.options.length && (
                <div class={cn('select-empty-container h-[100px] flex items-center justify-center', { 'text-red-500': this.fetchingErrorMessage })}>
                  {this.fetchingErrorMessage && (this.locale.errors[this.fetchingErrorMessage] || this.locale.errors.wildCard)}
                  {!this.fetchingErrorMessage && (this.isLoading ? <img class="animate-spin-2s size-[22px]" src={Loader} /> : this.locale.general.noSelectOptions)}
                </div>
              )}
            </div>
          </div>

          <div class={cn('absolute bottom-0 -z-10 !text-red-500 transition-all duration-300', { '-translate-y-full opacity-0': !this.isError })}>
            {texts[this.errorMessage] || this.locale.forms.inputValueIsIncorrect || this.errorMessage}
          </div>
        </label>
      </Host>
    );
  }
}
