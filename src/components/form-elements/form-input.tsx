import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';

import cn from '~lib/cn';
import { getLocaleLanguage } from '~lib/get-local-language';

import { LanguageKeys, Locale, localeSchema } from '~types/locales';
import { FormInputChanges, LocaleFormKeys } from '~types/forms';

@Component({
  shadow: false,
  tag: 'form-input',
  styleUrl: 'form-input.css',
})
export class FormInput {
  @Prop() id: string;
  @Prop() name: string;
  @Prop() type: string;
  @Prop() label: string;
  // this will be class = 'hydrate' and it will render last component render
  @Prop() class: string;
  @Prop() isError: boolean;
  @Prop() className: string;
  @Prop() disabled: boolean;
  @Prop() inputPreFix: string;
  @Prop() isRequired: boolean;
  @Prop() placeholder: string;
  @Prop() errorMessage: string;
  @Prop() language: LanguageKeys = 'en';
  @Prop() formLocaleName: LocaleFormKeys;
  @Prop() inputChanges: FormInputChanges;

  @State() locale: Locale = localeSchema.getDefault();

  @Element() el!: HTMLElement;

  async componentWillLoad() {
    await this.changeLanguage(this.language);
  }

  @Watch('language')
  async changeLanguage(newLanguage: LanguageKeys) {
    this.locale = await getLocaleLanguage(newLanguage);
  }

  render() {
    const { class: inputClass, type, disabled, label, isError, name, errorMessage, placeholder, isRequired, inputChanges } = this;

    const prefix = this.el.getElementsByClassName('prefix')[0];

    const prefixWidth = prefix ? prefix.getBoundingClientRect().width : 0;

    const texts = this.locale.forms[this.formLocaleName];

    return (
      <Host>
        <label id={this.id} class={cn('relative w-full inline-flex flex-col', this.className)}>
          {label && (
            <div class="mb-[4px]">
              {texts[label] || label}
              {isRequired && <span class="ms-0.5 text-red-600">*</span>}
            </div>
          )}
          <div dir={type === 'number' ? 'ltr' : this.locale.direction} class={cn('relative', { 'opacity-75': disabled })}>
            {this.inputPreFix && <div class="prefix absolute h-[38px] px-2 left-0 top-0 pointer-events-none items-center justify-center flex">{this.inputPreFix}</div>}
            <input
              name={name}
              type={type}
              disabled={disabled}
              onInput={inputChanges}
              style={{ ...(prefixWidth ? { paddingLeft: `${prefixWidth}px` } : {}) }}
              placeholder={texts[placeholder] || texts[label] || placeholder || label}
              class={cn(
                'border form-input disabled:bg-white flex-1 py-[6px] px-[12px] transition duration-300 rounded-md outline-none focus:border-slate-600 focus:shadow-[0_0_0_0.2rem_rgba(71,85,105,0.25)] w-full',
                { '!border-red-500 focus:shadow-[0_0_0_0.2rem_rgba(239,68,68,0.25)]': isError, 'rtl-form-input': this.locale.direction === 'rtl' && type === 'number' },
                inputClass,
              )}
            />
          </div>
          <div
            class={cn('absolute text-[12px] pt-[1px] -z-10 text-red-500 opacity-0 -translate-y-[4px] bottom-0 transition duration-300', {
              'translate-y-full error-message opacity-100': isError,
            })}
          >
            {texts[errorMessage] || this.locale.forms.inputValueIsIncorrect || errorMessage}
          </div>
        </label>
      </Host>
    );
  }
}
