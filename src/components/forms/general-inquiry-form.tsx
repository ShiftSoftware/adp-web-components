import { InferType, object, string } from 'yup';
import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';

import { StructureObject } from '~types/forms';

import { FormHook, FormHookInterface } from '~lib/form-hook';
import { isValidStructure } from '~lib/validate-form-structure';

const inquirySchema = object({
  name: string().required('r').min(4, 'kd').max(7, 'kk'),
  name2: string().required(),
});

type Inquiry = InferType<typeof inquirySchema>;

@Component({
  shadow: false,
  tag: 'general-inquiry-form',
  styleUrl: 'genera-form.css',
})
export class GeneralInquiryForm implements FormHookInterface<Inquiry> {
  @State() isLoading: boolean;
  @State() renderControl = {};
  @Prop() structure: string = '[]';
  @Prop() structureObject: StructureObject = null;

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

  private form = new FormHook(this, inquirySchema);

  private nameController = this.form.newController('name', 'text');
  private name2Controller = this.form.newController('name2', 'text');

  async formSubmit(formValues: Inquiry) {
    console.log(formValues);
  }

  render() {
    const { formController } = this.form;

    if (this.structureObject === null) return <form-structure-error />;

    return (
      <Host>
        <form {...formController}>
          <form-input {...this.nameController} label="Name" name="name"></form-input>
          <form-input {...this.name2Controller} label="Name2" name="name2"></form-input>
          <button type="submit">sd</button>
        </form>
      </Host>
    );
  }
}
