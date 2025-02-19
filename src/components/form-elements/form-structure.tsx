import { Component, Fragment, Host, Prop, State, Watch, h } from '@stencil/core';

import cn from '~lib/cn';
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

  @State() showSuccess: boolean = false;
  @State() structureObject: StructureObject = null;
  @State() locale: Locale = localeSchema.getDefault();

  async componentWillLoad() {
    this.form.setSuccessAnimation(() => {
      this.showSuccess = true;
      setTimeout(() => {
        this.showSuccess = false;
      }, 1500);
    });

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

    // @ts-ignore
    window.ff = this.form;

    return (
      <Host>
        <form class="relative overflow-hidden" dir={this.locale.direction} {...formController}>
          <div
            class={cn('absolute -translate-x-full transition duration-1000 flex items-center justify-center size-full opacity-0', {
              'opacity-100 translate-x-0': this.showSuccess,
            })}
          >
            <div class="flex flex-col gap-[16px] items-center">
              <svg
                fill="none"
                stroke-width="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                class="size-[70px] stroke-green-700"
              >
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>

              <div class="text-[20px]">{this.locale.general.formSubmittedSuccessfully}</div>
            </div>
          </div>
          <form-dialog dialogClosed={resetFormErrorMessage} language={this.language} errorMessage={this.errorMessage} />
          <div class={cn('transition duration-1000', { 'translate-x-full opacity-0': this.showSuccess })}>{this.renderLoop(this.structureObject)}</div>
        </form>
      </Host>
    );
  }
}
