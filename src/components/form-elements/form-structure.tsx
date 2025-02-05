import { Component, Host, Prop, State, Watch, h } from '@stencil/core';

import { FormHook } from '~lib/form-hook';
import { getLocaleLanguage } from '~lib/get-local-language';

import { StructureObject } from '~types/forms';
import { LanguageKeys, Locale, localeSchema } from '~types/locales';

@Component({
  shadow: false,
  tag: 'form-structure',
  styleUrl: 'form-structure.css',
})
export class FormStructure {
  @Prop() isLoading: boolean;
  @Prop() renderControl = {};
  @Prop() form: FormHook<any>;
  @Prop() language: LanguageKeys = 'en';
  @Prop() structureObject: StructureObject = null;

  @State() locale: Locale = localeSchema.getDefault();

  private nameController;
  private name2Controller;

  async componentWillLoad() {
    await this.changeLanguage(this.language);

    this.nameController = this.form.newController('name', 'text');
    this.name2Controller = this.form.newController('name2', 'text');
  }

  @Watch('language')
  async changeLanguage(newLanguage: LanguageKeys) {
    this.locale = await getLocaleLanguage(newLanguage);
  }

  render() {
    const { formController } = this.form;

    console.log(this.nameController);

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
