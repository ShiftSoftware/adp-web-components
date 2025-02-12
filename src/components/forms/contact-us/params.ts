import { CITY_ENDPOINT } from '~api/urls';

import { getLocaleLanguage } from '~lib/get-local-language';

import { LanguageKeys } from '~types/locales';
import { FormFieldParams, FormSelectItem, Params } from '~types/forms';

const name: Params = {
  label: 'fullName',
  formLocaleName: 'contactUs',
};

const email: Params = {
  type: 'email',
  label: 'emailAddress',
  formLocaleName: 'contactUs',
};

const message: Params = {
  label: 'writeAMessage',
  formLocaleName: 'contactUs',
  placeholder: 'leaveUsMessage',
};

const phone: Params = { inputPreFix: '+964', type: 'number', label: 'phoneNumber', formLocaleName: 'contactUs' };

const cityId: Params = {
  label: 'city',
  placeholder: 'selectCity',
  formLocaleName: 'contactUs',
  fetcher: async (language: LanguageKeys, signal: AbortSignal): Promise<FormSelectItem[]> => {
    const response = await fetch(CITY_ENDPOINT, { signal, headers: { 'Accept-Language': language } });

    const arrayRes = (await response.json()) as { Name: string; ID: string; IntegrationId: string }[];

    const selectItems = arrayRes.map(item => ({ label: item.Name, value: item.ID })) as FormSelectItem[];

    return selectItems;
  },
};

const generalTicketType: Params = {
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
};

export const formFieldParams: FormFieldParams = {
  name,
  email,
  message,
  phone,
  cityId,
  generalTicketType,
};
