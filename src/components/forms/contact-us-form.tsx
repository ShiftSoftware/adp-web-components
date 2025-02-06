import { InferType, object, string } from 'yup';
import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';

import { LanguageKeys, Locale, localeSchema } from '~types/locales';
import { FormElementMapper, FormFieldParams, FormHookInterface, StructureObject } from '~types/forms';

import { FormHook } from '~lib/form-hook';
import { isValidStructure } from '~lib/validate-form-structure';

const contactUsSchema = object({
  name2: string().required(),
  name: string().required('r').min(4, 'kd').max(7, 'kk'),
});

type ContactUs = InferType<typeof contactUsSchema>;

const formElementMapper: FormElementMapper = {
  name: 'text',
  name2: 'text',
};

const formFieldParams: FormFieldParams = {
  name: {
    placeholder: 'askjhd',
    label: 'kodo',
  },
  name2: {
    label: 'k333333odo',
  },
};

@Component({
  shadow: false,
  tag: 'contact-us-form',
  styleUrl: 'contact-us-form.css',
})
export class ContactUsForm implements FormHookInterface<ContactUs> {
  @Prop() structure: string = '[]';
  @Prop() language: LanguageKeys = 'en';

  @State() isLoading: boolean;
  @State() renderControl = {};
  @State() structureObject: StructureObject = null;
  @State() locale: Locale = localeSchema.getDefault();

  @Element() el: HTMLElement;

  async componentWillLoad() {
    await this.structureValidation(this.structure);
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
      <Host>
        <form-structure
          form={this.form}
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
