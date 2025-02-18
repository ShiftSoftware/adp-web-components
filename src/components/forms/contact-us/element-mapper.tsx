import { h } from '@stencil/core';

import { FormElementMapper } from '~types/forms';

import { ContactUs } from './validations';

export const contactUsElements: FormElementMapper<ContactUs> = {
  submit: (_, isLoading, structureElement) => {
    return <form-submit structureElement={structureElement} isLoading={isLoading} />;
  },
  //   name: form => {
  //     return <form-input />;
  //   },
};
