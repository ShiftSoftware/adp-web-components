import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';

import { Grecaptcha } from '~types/general';
import { FormHookInterface, StructureObject } from '~types/forms';
import { LanguageKeys, Locale, localeSchema } from '~types/locales';

import cn from '~lib/cn';
import { FormHook } from '~lib/form-hook';
import { getLocaleLanguage } from '~lib/get-local-language';
import { isValidStructure } from '~lib/validate-form-structure';

import { formFieldParams } from './contact-us/params';
import { formElementMapper } from './contact-us/mapper';
import { ContactUs, contactUsSchema } from './contact-us/validations';

import themes from './contact-us/themes.json';

declare const grecaptcha: Grecaptcha;

@Component({
  shadow: false,
  tag: 'contact-us-form',
  styleUrl: 'contact-us/form.css',
})
export class ContactUsForm implements FormHookInterface<ContactUs> {
  @Prop() theme: string;
  @Prop() baseUrl: string;
  @Prop() brandId: string;
  @Prop() queryString: string = '';
  @Prop() language: LanguageKeys = 'en';
  @Prop() errorCallback: (error: any) => void;
  @Prop() successCallback: (values: any) => void;
  @Prop() structure: string = '["submit.Submit"]';
  @Prop() loadingChanges: (loading: boolean) => void;
  @Prop() recaptchaKey: string = '6Lehq6IpAAAAAETTDS2Zh60nHIT1a8oVkRtJ2WsA';

  @State() isLoading: boolean;
  @State() renderControl = {};
  @State() errorMessage: string;
  @State() structureObject: StructureObject = null;
  @State() locale: Locale = localeSchema.getDefault();

  recaptchaWidget: number | null = null;

  private form = new FormHook(this, contactUsSchema);

  @Element() el: HTMLElement;

  async componentWillLoad() {
    let structure;

    if (this.theme && themes[this.theme]) structure = themes[this.theme];
    else structure = this.structure;

    await Promise.all([this.structureValidation(structure), this.changeLanguage(this.language)]);
  }

  @Watch('language')
  async changeLanguage(newLanguage: LanguageKeys) {
    this.locale = await getLocaleLanguage(newLanguage);
  }

  @Watch('structure')
  async onStructureChange(newStructure: string) {
    await this.structureValidation(newStructure);
  }

  async structureValidation(structureString: string) {
    this.structureObject = isValidStructure(structureString);
  }

  async componentDidLoad() {
    try {
      if (this.recaptchaKey) {
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${this.recaptchaKey}&hl=${this.language}`;
        script.async = true;
        script.defer = true;

        document.head.appendChild(script);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async formSubmit(formValues: ContactUs) {
    try {
      if (this.loadingChanges) this.loadingChanges(true);

      const token = await grecaptcha.execute(this.recaptchaKey, { action: 'submit' });

      const response = await fetch(`${this.baseUrl}?${this.queryString}`, {
        method: 'post',
        body: JSON.stringify(formValues),
        headers: {
          'Brand': this.brandId,
          'Recaptcha-Token': token,
          'Accept-Language': this.language,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (this.successCallback) this.successCallback(data);

      this.form.reset();
    } catch (error) {
      console.error(error);

      if (this.errorCallback) this.errorCallback(error);
      if (error?.message) this.errorMessage = error.message;
    } finally {
      if (this.loadingChanges) this.loadingChanges(false);
    }
  }

  render() {
    if (this.structureObject === null) return <form-structure-error language={this.language} />;

    return (
      <Host
        class={cn({
          [`contact-us-${this.theme}`]: this.theme,
        })}
      >
        <form-structure
          form={this.form}
          language={this.language}
          isLoading={this.isLoading}
          errorMessage={this.errorMessage}
          formFieldParams={formFieldParams}
          renderControl={this.renderControl}
          formElementMapper={formElementMapper}
          structureObject={this.structureObject}
        >
          <slot></slot>
        </form-structure>
      </Host>
    );
  }
}
