import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';

import cn from '~lib/cn';
import { getLocaleLanguage } from '~lib/get-local-language';

import { LanguageKeys, Locale, localeSchema } from '~types/locales';
import { FormInputChanges, LocaleFormKeys } from '~types/forms';

@Component({
  shadow: false,
  tag: 'form-text-area',
  styleUrl: 'form-text-area.css',
})
export class FormTextArea {
  @Prop() name: string;
  @Prop() label: string;
  @Prop() isError: boolean;
  @Prop() disabled: boolean;
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
    const { disabled, label, isError, name, errorMessage, placeholder, isRequired, inputChanges } = this;

    const prefix = this.el.getElementsByClassName('prefix')[0];

    const prefixWidth = prefix ? prefix.getBoundingClientRect().width : 0;

    const texts = this.locale.forms[this.formLocaleName];

    return (
      <Host>
        <label class="relative w-full inline-flex flex-col">
          {label && (
            <div class="mb-[4px]">
              {texts[label] || label}
              {isRequired && <span class="ms-0.5 text-red-600">*</span>}
            </div>
          )}
          <div class={cn('relative', { 'opacity-75': disabled })}>
            <textarea
              name={name}
              disabled={disabled}
              onInput={inputChanges}
              style={{ ...(prefixWidth ? { paddingLeft: `${prefixWidth}px` } : {}) }}
              placeholder={texts[placeholder] || texts[label] || placeholder || label}
              class={cn(
                'border h-[200px] form-input resize-none disabled:bg-white flex-1 py-[6px] px-[12px] transition duration-300 rounded-md outline-none focus:border-slate-600 focus:shadow-[0_0_0_0.2rem_rgba(71,85,105,0.25)] w-full',
                { '!border-red-500 focus:shadow-[0_0_0_0.2rem_rgba(239,68,68,0.25)]': isError },
              )}
            />
          </div>

          <div class={cn('absolute -z-10 text-red-500 opacity-0 -translate-y-[4px] bottom-0 transition duration-300', { 'translate-y-full error-message opacity-100': isError })}>
            {texts[errorMessage] || this.locale.forms.inputValueIsIncorrect || errorMessage}
          </div>
        </label>
      </Host>
    );
  }
}
