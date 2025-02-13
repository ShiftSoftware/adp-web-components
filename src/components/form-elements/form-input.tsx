import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';

import cn from '~lib/cn';
import { getLocaleLanguage } from '~lib/get-local-language';

import { FormInputChanges, LocaleFormKeys } from '~types/forms';
import { LanguageKeys, Locale, localeSchema } from '~types/locales';

@Component({
  shadow: false,
  tag: 'form-input',
  styleUrl: 'form-input.css',
})
export class FormInput {
  @Prop() name: string;
  @Prop() type: string;
  @Prop() label: string;
  // this will be class = 'hydrate' and it will render last component render
  @Prop() class: string;
  @Prop() isError: boolean;
  @Prop() disabled: boolean;
  @Prop() componentId: string;
  @Prop() inputPreFix: string;
  @Prop() isRequired: boolean;
  @Prop() placeholder: string;
  @Prop() errorMessage: string;
  @Prop() defaultValue?: string;
  @Prop() componentClass: string;
  @Prop() numberDirection?: boolean;
  @Prop() language: LanguageKeys = 'en';
  @Prop() formLocaleName: LocaleFormKeys;
  @Prop() inputChanges: FormInputChanges;
  @Prop() onChangeMiddleware?: (event: InputEvent) => InputEvent;

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

    const onInput = this.onChangeMiddleware ? event => inputChanges(this.onChangeMiddleware(event)) : inputChanges;

    return (
      <Host>
        <label id={this.componentId} class={cn('relative w-full inline-flex flex-col', this.componentClass)}>
          {label && (
            <div class="mb-[4px]">
              {texts[label] || label}
              {isRequired && <span class="ms-0.5 text-red-600">*</span>}
            </div>
          )}
          <div dir={this.numberDirection ? 'ltr' : this.locale.direction} class={cn('relative', { 'opacity-75': disabled })}>
            {this.inputPreFix && <div class="prefix absolute h-[38px] px-2 left-0 top-0 pointer-events-none items-center justify-center flex">{this.inputPreFix}</div>}
            <input
              name={name}
              type={type}
              onInput={onInput}
              disabled={disabled}
              defaultValue={this.defaultValue}
              style={{ ...(prefixWidth ? { paddingLeft: `${prefixWidth}px` } : {}) }}
              placeholder={texts[placeholder] || texts[label] || placeholder || label}
              class={cn(
                'border appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none form-input disabled:bg-white flex-1 py-[6px] px-[12px] transition duration-300 rounded-md outline-none focus:border-slate-600 focus:shadow-[0_0_0_0.2rem_rgba(71,85,105,0.25)] w-full',
                { '!border-red-500 focus:shadow-[0_0_0_0.2rem_rgba(239,68,68,0.25)]': isError, 'rtl-form-input': this.locale.direction === 'rtl' && this.numberDirection },
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
