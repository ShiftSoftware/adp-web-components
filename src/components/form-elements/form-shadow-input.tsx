import { Component, Prop, h, Watch } from '@stencil/core';

import { FormHook } from '~lib/form-hook';

@Component({
  shadow: false,
  tag: 'form-shadow-input',
  styleUrl: 'form-shadow-input.css',
})
export class FormInput {
  @Prop() name: string;
  @Prop() value: string;
  @Prop() form: FormHook<any>;

  @Watch('name')
  async handleNameChange(newName: string) {
    this.form.onChanges(newName, this.value);
  }

  @Watch('value')
  async handleValueChange(newValue: string) {
    this.form.onChanges(this.name, newValue);
  }

  render() {
    return <input name={this.name} type="string" hidden value={this.value} />;
  }
}
