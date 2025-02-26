import { h } from '@stencil/core';

import { LanguageKeys } from '~types/locales';
import { FormElementMapper, FormSelectItem } from '~types/forms';

import { getLocaleLanguage } from '~lib/get-local-language';

import { ServiceBooking } from './validations';
import { TIQ_CAR_MODELS } from '~api/urls';

let vehicles: { id: number; title: string; image: string }[] = [];

export const serviceBookingElements: FormElementMapper<ServiceBooking> = {
  submit: formContext => {
    return <form-submit {...formContext} />;
  },

  vehicleId: ({ form, language, structureElement }) => {
    const { disabled, errorMessage, isError, isRequired, name } = form.getInputState('vehicleId');

    const fetcher = async (language: LanguageKeys, signal: AbortSignal): Promise<FormSelectItem[]> => {
      const response = await fetch(TIQ_CAR_MODELS, { signal, headers: { 'Accept-Language': language } });

      const arrayRes = (await response.json()) as typeof vehicles;
      vehicles = arrayRes;

      const selectItems = arrayRes.map(vehicle => ({ label: vehicle.title, value: vehicle.id.toString() })) as FormSelectItem[];

      return selectItems;
    };

    const ComponentRerender = (newValue: string) => {
      if (newValue) {
        const numericValue = +newValue;
      }
      const selectedValue;
      console.log(form.getFormElement().getElementsByClassName('vehicleImageElement'));
    };

    return (
      <form-select
        name={name}
        form={form}
        label="vehicle"
        fetcher={fetcher}
        isError={isError}
        disabled={disabled}
        language={language}
        class="vehicle-select"
        isRequired={isRequired}
        errorMessage={errorMessage}
        onSelect={ComponentRerender}
        placeholder="vehicleSelection"
        formLocaleName="serviceBooking"
        wrapperId={structureElement.id}
        wrapperClass={structureElement.class}
      />
    );
  },

  vehicleImage: ({ structureElement }) => {
    return <img id={structureElement.id} class={structureElement.class} />;
  },
};
