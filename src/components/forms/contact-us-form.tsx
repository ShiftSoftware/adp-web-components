import { InferType, object, string } from 'yup';
import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';

import { Grecaptcha } from '~types/general';
import { LanguageKeys, Locale, localeSchema } from '~types/locales';
import { FormElementMapper, FormFieldParams, FormHookInterface, FormSelectItem, StructureObject } from '~types/forms';

import cn from '~lib/cn';
import { FormHook } from '~lib/form-hook';
import { getLocaleLanguage } from '~lib/get-local-language';
import { isValidStructure } from '~lib/validate-form-structure';

import { CITY_ENDPOINT } from '~api/urls';

declare const grecaptcha: Grecaptcha;

const contactUsSchema = object({
  cityId: string(),
  email: string().email('emailAddressNotValid'),
  message: string().required('messageIsRequired'),
  generalTicketType: string().required('inquiryTypeIsRequired'),
  name: string().required('fullNameIsRequired').min(3, 'fullNameMinimum'),
  phone: string()
    .required('phoneNumberIsRequired')
    .transform(value => value.replace(/^0/, ''))
    .matches(/^\d+$/, 'phoneNumberFormatInvalid')
    .length(10, 'phoneNumberFormatInvalid'),
});

export type ContactUs = InferType<typeof contactUsSchema>;

const formElementMapper: FormElementMapper = {
  name: 'text',
  email: 'text',
  phone: 'number',
  cityId: 'select',
  message: 'text-area',
  generalTicketType: 'select',
};

const formFieldParams: FormFieldParams = {
  name: {
    label: 'fullName',
    formLocaleName: 'contactUs',
  },
  email: {
    type: 'email',
    label: 'emailAddress',
    formLocaleName: 'contactUs',
  },
  message: {
    label: 'writeAMessage',
    formLocaleName: 'contactUs',
    placeholder: 'leaveUsMessage',
  },
  phone: { inputPreFix: '+964', type: 'number', label: 'phoneNumber', formLocaleName: 'contactUs' },
  cityId: {
    label: 'city',
    placeholder: 'selectCity',
    formLocaleName: 'contactUs',
    fetcher: async (language: LanguageKeys, signal: AbortSignal): Promise<FormSelectItem[]> => {
      const response = await fetch(CITY_ENDPOINT, { signal, headers: { 'Accept-Language': language } });

      const arrayRes = (await response.json()) as { Name: string; ID: string; IntegrationId: string }[];

      const selectItems = arrayRes.map(item => ({ label: item.Name, value: item.ID })) as FormSelectItem[];

      return selectItems;
    },
  },
  generalTicketType: {
    label: 'inquiryType',
    formLocaleName: 'contactUs',
    placeholder: 'selectInquiryType',
    fetcher: async (language: LanguageKeys, _: AbortSignal): Promise<FormSelectItem[]> => {
      const ticketTypes = (await getLocaleLanguage(language)).generalTicketTypes;

      const generalInquiryTypes: FormSelectItem[] = [
        {
          value: 'GeneralInquiry',
          label: ticketTypes.GeneralInquiry,
        },
        {
          value: 'Complaint',
          label: ticketTypes.Complaint,
        },
      ];

      return generalInquiryTypes;
    },
  },
};

const themes = {
  tiq: '["div#container", ["div#inputs_wrapper", "name", "email", "cityId", "phone", "generalTicketType" ], "message#message",["div#recaptcha_container", "slot"], "submit.Submit"]',
};

@Component({
  shadow: false,
  tag: 'contact-us-form',
  styleUrl: 'contact-us-form.css',
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
    } catch (error) {
      console.log(error);
      if (this.errorCallback) this.errorCallback(error);
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
