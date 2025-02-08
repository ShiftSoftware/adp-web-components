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
  @Prop() class: string;
  @Prop() isError: boolean;
  @Prop() disabled: boolean;
  @Prop() labelClass: string;
  @Prop() errorClass: string;
  @Prop() isRequired: boolean;
  @Prop() placeholder: string;
  @Prop() errorMessage: string;
  @Prop() containerClass: string;
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
    const { class: inputClass, errorClass, containerClass, disabled, label, isError, labelClass, name, errorMessage, placeholder, isRequired, inputChanges } = this;

    const prefix = this.el.getElementsByClassName('prefix')[0];

    const prefixWidth = prefix ? prefix.getBoundingClientRect().width : 0;

    const texts = this.locale.forms[this.formLocaleName];

    return (
      <Host>
        <label class={cn('relative w-full pb-[20px] inline-flex flex-col', containerClass)}>
          {label && (
            <div class={cn('mb-[4px]', labelClass)}>
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
                'border h-[200px] form-input resize-none mb-[4px] disabled:bg-white flex-1 py-[6px] px-[12px] transition duration-300 rounded-md outline-none focus:border-slate-600 focus:shadow-[0_0_0_0.2rem_rgba(71,85,105,0.25)] w-full',
                { '!border-red-500 focus:shadow-[0_0_0_0.2rem_rgba(239,68,68,0.25)]': isError },
                inputClass,
              )}
            />
          </div>
          <div class={cn('absolute bottom-0 -z-10 text-red-500 transition-all duration-300', { '-translate-y-full opacity-0': !isError }, errorClass)}>
            {texts[errorMessage] || this.locale.forms.inputValueIsIncorrect || errorMessage}
          </div>
        </label>
      </Host>
    );
  }
}
