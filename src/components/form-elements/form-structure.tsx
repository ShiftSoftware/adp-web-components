import { Component, Fragment, Host, Prop, State, Watch, h } from '@stencil/core';

import { FormHook } from '~lib/form-hook';
import { getLocaleLanguage } from '~lib/get-local-language';

import { LanguageKeys, Locale, localeSchema } from '~types/locales';
import { FormElementMapper, StructureObject } from '~types/forms';

@Component({
  shadow: false,
  tag: 'form-structure',
  styleUrl: 'form-structure.css',
})
export class FormStructure {
  @Prop() renderControl = {};
  @Prop() isLoading: boolean;
  @Prop() form: FormHook<any>;
  @Prop() errorMessage: string;
  @Prop() language: LanguageKeys = 'en';
  @Prop() structureObject: StructureObject = null;
  @Prop() formElementMapper: FormElementMapper<any>;

  @State() locale: Locale = localeSchema.getDefault();

  async componentWillLoad() {
    await this.changeLanguage(this.language);
  }

  @Watch('language')
  async changeLanguage(newLanguage: LanguageKeys) {
    this.locale = await getLocaleLanguage(newLanguage);
  }

  private renderLoop(structureElement: StructureObject) {
    if (structureElement.element === '') return <Fragment>{structureElement.children.map(child => this.renderLoop(child))}</Fragment>;

    if (structureElement.element === 'div')
      return (
        <div class={structureElement.class} id={structureElement.id}>
          {structureElement.children.map(child => this.renderLoop(child))}
        </div>
      );

    if (structureElement.element === 'slot') return <slot />;

    if (this.formElementMapper[structureElement.element])
      return this.formElementMapper[structureElement.element]({ form: this.form, isLoading: this.isLoading, structureElement, language: this.language });

    return false;
  }

  render() {
    const { formController, resetFormErrorMessage } = this.form;

    return (
      <Host>
        <form dir={this.locale.direction} {...formController}>
          <form-dialog dialogClosed={resetFormErrorMessage} language={this.language} errorMessage={this.errorMessage} />
          {this.renderLoop(this.structureObject)}
        </form>
      </Host>
    );
  }
}
