import { Component, Element, Host, State, h } from '@stencil/core';
import { InferType, object, string } from 'yup';
import { FormHook, FormHookInterface } from '~lib/form-hook';

const inquirySchema = object({
  name: string().required('r').min(4, 'kd').max(7, 'kk'),
  name2: string().required(),
});

type Inquiry = InferType<typeof inquirySchema>;

@Component({
  shadow: true,
  tag: 'general-inquiry-form',
  styleUrl: 'general-inquiry-form.css',
})
export class GeneralInquiryForm implements FormHookInterface<Inquiry> {
  @State() isLoading: boolean;
  @Element() el: HTMLElement;
  @State() renderControl = {};

  private form = new FormHook(this, inquirySchema);

  private nameController = this.form.newController('name', 'text');
  private name2Controller = this.form.newController('name2', 'text');

  async formSubmit(formValues: Inquiry) {
    console.log(formValues);
  }

  render() {
    const { formController } = this.form;

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
