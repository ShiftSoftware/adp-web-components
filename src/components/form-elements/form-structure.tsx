import { Component, Fragment, Host, Prop, State, Watch, h } from '@stencil/core';

import { FormHook } from '~lib/form-hook';
import { getLocaleLanguage } from '~lib/get-local-language';
import { isValidStructure } from '~lib/validate-form-structure';

import { FormElementMapper, StructureObject } from '~types/forms';
import { LanguageKeys, Locale, localeSchema } from '~types/locales';

@Component({
  shadow: false,
  tag: 'form-structure',
  styleUrl: 'form-structure.css',
})
export class FormStructure {
  @Prop() theme: string;
  @Prop() themes: any = {};
  @Prop() renderControl = {};
  @Prop() isLoading: boolean;
  @Prop() form: FormHook<any>;
  @Prop() errorMessage: string;
  @Prop() language: LanguageKeys = 'en';
  @Prop() structure: string = '["submit.Submit"]';
  @Prop() formElementMapper: FormElementMapper<any>;

  @State() structureObject: StructureObject = null;
  @State() locale: Locale = localeSchema.getDefault();

  async componentWillLoad() {
    let structure;

    if (this.theme && this.themes[this.theme]) structure = this.themes[this.theme];
    else structure = this.structure;

    await Promise.all([this.structureValidation(structure), this.changeLanguage(this.language)]);
  }

  @Watch('structure')
  async onStructureChange(newStructure: string) {
    await this.structureValidation(newStructure);
  }

  async structureValidation(structureString: string) {
    this.structureObject = isValidStructure(structureString);
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
    if (this.structureObject === null) return <form-structure-error language={this.language} />;

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
