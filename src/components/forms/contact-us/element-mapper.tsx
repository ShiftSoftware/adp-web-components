import { h } from '@stencil/core';

import { FormElementMapper } from '~types/forms';

import { ContactUs } from './validations';

export const contactUsElements: FormElementMapper<ContactUs> = {
  name: form => {
    return <form-input />;
  },
};
