import { h } from '@stencil/core';

import { InputParams } from '~types/general';
import { LanguageKeys } from '~types/locales';
import { FormElementMapper } from '~types/forms';
import { FormSelectFetcher, FormSelectItem } from '~types/forms';

import { ContactUs, phoneValidator } from './validations';
import { getLocaleLanguage } from '~lib/get-local-language';
import { CITY_ENDPOINT } from '~api/urls';

export const contactUsElements: FormElementMapper<ContactUs> = {
  submit: formContext => {
    return <form-submit {...formContext} />;
  },

  name: ({ form, language }) => {
    const { disabled, errorMessage, isError, isRequired, name } = form.newController('name');

    const inputParams: InputParams = {
      name,
      disabled,
      type: 'text',
      placeholder: 'fullName',
    };

    return (
      <form-input
        form={form}
        label="fullName"
        isError={isError}
        language={language}
        isRequired={isRequired}
        inputParams={inputParams}
        formLocaleName="contactUs"
        errorMessage={errorMessage}
      />
    );
  },

  email: ({ form, language }) => {
    const { disabled, errorMessage, isError, isRequired, name } = form.newController('email');

    const inputParams: InputParams = {
      name,
      disabled,
      type: 'email',
      placeholder: 'emailAddress',
    };

    return (
      <form-input
        form={form}
        isError={isError}
        language={language}
        label="emailAddress"
        isRequired={isRequired}
        inputParams={inputParams}
        formLocaleName="contactUs"
        errorMessage={errorMessage}
      />
    );
  },

  phone: ({ form, language }) => {
    const { disabled, errorMessage, isError, isRequired, name } = form.newController('phone');

    const inputParams: InputParams = {
      name,
      disabled,
      type: 'text',
      placeholder: 'phoneNumber',
      defaultValue: phoneValidator.default,
      onInput: (event: InputEvent) => {
        const target = event.target as HTMLInputElement;

        phoneValidator.reset();
        target.value = phoneValidator.input(target.value as string);
      },
    };

    return (
      <form-input
        form={form}
        numberDirection
        isError={isError}
        language={language}
        label="phoneNumber"
        isRequired={isRequired}
        inputParams={inputParams}
        formLocaleName="contactUs"
        errorMessage={errorMessage}
      />
    );
  },

  message: ({ form, language }) => {
    const { disabled, errorMessage, isError, isRequired, name } = form.newController('message');

    const inputParams: InputParams = {
      name,
      disabled,
      type: 'email',
      placeholder: 'leaveUsMessage',
    };

    return (
      <form-text-area
        form={form}
        isError={isError}
        language={language}
        label="writeAMessage"
        isRequired={isRequired}
        inputParams={inputParams}
        formLocaleName="contactUs"
        errorMessage={errorMessage}
      />
    );
  },

  generalTicketType: ({ form, language }) => {
    const { disabled, errorMessage, isError, isRequired, name } = form.newController('generalTicketType');

    const fetcher: FormSelectFetcher = async (language: LanguageKeys, _: AbortSignal): Promise<FormSelectItem[]> => {
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
    };

    return (
      <form-select
        name={name}
        form={form}
        fetcher={fetcher}
        isError={isError}
        disabled={disabled}
        language={language}
        label="inquiryType"
        isRequired={isRequired}
        formLocaleName="contactUs"
        errorMessage={errorMessage}
        placeholder="selectInquiryType"
      />
    );
  },

  cityId: ({ form, language }) => {
    const { disabled, errorMessage, isError, isRequired, name } = form.newController('cityId');

    const fetcher: FormSelectFetcher = async (language: LanguageKeys, signal: AbortSignal): Promise<FormSelectItem[]> => {
      const response = await fetch(CITY_ENDPOINT, { signal, headers: { 'Accept-Language': language } });

      const arrayRes = (await response.json()) as { Name: string; ID: string; IntegrationId: string }[];

      const selectItems = arrayRes.map(item => ({ label: item.Name, value: item.ID })) as FormSelectItem[];

      return selectItems;
    };

    return (
      <form-select
        name={name}
        form={form}
        label="city"
        fetcher={fetcher}
        isError={isError}
        disabled={disabled}
        language={language}
        isRequired={isRequired}
        placeholder="selectCity"
        formLocaleName="contactUs"
        errorMessage={errorMessage}
      />
    );
  },
};
