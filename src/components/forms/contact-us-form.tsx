import { InferType, object, string } from 'yup';
import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';

import { LanguageKeys, Locale, localeSchema } from '~types/locales';
import { FormElementMapper, FormFieldParams, FormHookInterface, FormSelectItem, StructureObject } from '~types/forms';

import { FormHook } from '~lib/form-hook';
import { isValidStructure } from '~lib/validate-form-structure';
import { CITY_ENDPOINT } from '~api/urls';
import { getLocaleLanguage } from '~lib/get-local-language';
import cn from '~lib/cn';

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

type ContactUs = InferType<typeof contactUsSchema>;

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
  tiq: '[["div#inputs_wrapper", "name", "email", "cityId", "phone", "generalTicketType" ],"message", "submit.Submit"]',
};

@Component({
  shadow: false,
  tag: 'contact-us-form',
  styleUrl: 'contact-us-form.css',
})
export class ContactUsForm implements FormHookInterface<ContactUs> {
  @Prop() theme: string;
  @Prop() baseUrl: string;
  @Prop() queryString: string;
  @Prop() language: LanguageKeys = 'en';
  @Prop() structure: string = '["submit.Submit"]';

  @State() isLoading: boolean;
  @State() renderControl = {};
  @State() structureObject: StructureObject = null;
  @State() locale: Locale = localeSchema.getDefault();

  @Element() el: HTMLElement;

  async componentWillLoad() {
    let structure;

    if (this.theme && themes[this.theme]) structure = themes[this.theme];
    else structure = this.structure;

    await this.structureValidation(structure);
  }

  @Watch('structure')
  async onStructureChange(newStructure: string) {
    await this.structureValidation(newStructure);
  }

  async structureValidation(structureString: string) {
    this.structureObject = isValidStructure(structureString);
  }

  private form = new FormHook(this, contactUsSchema);

  async formSubmit(formValues: ContactUs) {
    console.log(formValues);

    await new Promise(r => setTimeout(r, 10000));

    console.log(99);
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
