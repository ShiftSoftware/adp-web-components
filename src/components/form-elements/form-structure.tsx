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

    if (this.formElementMapper[structureElement.element]) return this.formElementMapper[structureElement.element](this.form, this.isLoading, structureElement);

    // if (structureElement.element === 'submit') return <form-submit isLoading={this.isLoading} params={params} structureElement={structureElement} />;

    // if (this.fieldControllers[structureElement.element]) {
    //   const fieldController = this.fieldControllers[structureElement.element];

    //   if (fieldController.fieldType === 'text' || fieldController.fieldType === 'number')
    //     return <form-input form={this.form} componentId={structureElement.id} componentClass={structureElement.class} language={this.language} {...fieldController} {...params} />;

    //   if (fieldController.fieldType === 'text-area')
    //     return (
    //       <form-text-area form={this.form} componentId={structureElement.id} componentClass={structureElement.class} language={this.language} {...fieldController} {...params} />
    //     );

    //   if (fieldController.fieldType === 'select')
    //     return <form-select form={this.form} componentId={structureElement.id} componentClass={structureElement.class} language={this.language} {...fieldController} {...params} />;
    // }

    return false;
  }

  render() {
    const { formController, resetFormErrorMessage } = this.form;

    return (
      <Host>
        <form
          onInput={(event: Event) => {
            const target = event.target as HTMLInputElement;

            console.log('Form data updated:', target);
          }}
          dir={this.locale.direction}
          {...formController}
        >
          <form-dialog dialogClosed={resetFormErrorMessage} language={this.language} errorMessage={this.errorMessage} />
          {this.renderLoop(this.structureObject)}
        </form>
      </Host>
    );
  }
}
