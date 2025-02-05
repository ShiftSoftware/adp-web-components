import { InferType, object, string } from 'yup';
import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';

import { LanguageKeys, Locale, localeSchema } from '~types/locales';
import { StructureObject } from '~types/forms';

import { FormHook, FormHookInterface } from '~lib/form-hook';
import { isValidStructure } from '~lib/validate-form-structure';

const contactUsSchema = object({
  name: string().required('r').min(4, 'kd').max(7, 'kk'),
  name2: string().required(),
});

type ContactUs = InferType<typeof contactUsSchema>;

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

  private nameController = this.form.newController('name', 'text');
  private name2Controller = this.form.newController('name2', 'text');

  async formSubmit(formValues: ContactUs) {
    console.log(formValues);
  }

  render() {
    const { formController } = this.form;

    console.log(formController);

    if (this.structureObject === null) return <form-structure-error language={this.language} />;

    return (
      <Host>
        <form dir={this.locale.direction} {...formController}>
          <form-input {...this.nameController} label="Name" name="name"></form-input>
          <form-input {...this.name2Controller} label="Name2" name="name2"></form-input>
          <button type="submit">sd</button>
        </form>
      </Host>
    );
  }
}
