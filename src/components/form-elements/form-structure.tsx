import { Component, Fragment, Host, Prop, State, Watch, h } from '@stencil/core';

import { FormHook } from '~lib/form-hook';
import { getLocaleLanguage } from '~lib/get-local-language';

import { LanguageKeys, Locale, localeSchema } from '~types/locales';
import { FieldControllers, FormElementMapper, FormFieldParams, StructureObject } from '~types/forms';

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
  @Prop() formFieldParams: FormFieldParams;
  @Prop() formElementMapper: FormElementMapper;
  @Prop() structureObject: StructureObject = null;

  @State() fieldControllers: FieldControllers;
  @State() locale: Locale = localeSchema.getDefault();

  async componentWillLoad() {
    await this.changeLanguage(this.language);

    const tempFieldContext = {};

    Object.entries(this.formElementMapper).forEach(([key, value]) => {
      tempFieldContext[key] = this.form.newController(key, value);
    });

    this.fieldControllers = tempFieldContext;
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

    if (structureElement.element === 'button')
      return (
        <button type="button" id={structureElement.id}>
          {structureElement.class}
        </button>
      );

    const params = this.formFieldParams[structureElement.element] ? this.formFieldParams[structureElement.element] : {};

    if (structureElement.element === 'submit') return <form-submit isLoading={this.isLoading} params={params} structureElement={structureElement} />;

    if (this.fieldControllers[structureElement.element]) {
      const fieldController = this.fieldControllers[structureElement.element];

      if (fieldController.fieldType === 'text' || fieldController.fieldType === 'number')
        return <form-input form={this.form} componentId={structureElement.id} componentClass={structureElement.class} language={this.language} {...fieldController} {...params} />;

      if (fieldController.fieldType === 'text-area')
        return <form-text-area componentId={structureElement.id} componentClass={structureElement.class} language={this.language} {...fieldController} {...params} />;

      if (fieldController.fieldType === 'select')
        return <form-select componentId={structureElement.id} componentClass={structureElement.class} language={this.language} {...fieldController} {...params} />;
    }

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
