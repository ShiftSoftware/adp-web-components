import { Component, Host, Prop, State, Watch, h } from '@stencil/core';

import { getLocaleLanguage } from '~lib/get-local-language';

import { LanguageKeys, Locale, localeSchema } from '~types/locales';

@Component({
  shadow: false,
  tag: 'form-structure-error',
  styleUrl: 'form-structure-errors.css',
})
export class FormStructureError {
  @Prop() language: LanguageKeys = 'en';

  @State() locale: Locale = localeSchema.getDefault();

  async componentWillLoad() {
    await this.changeLanguage(this.language);
  }

  @Watch('language')
  async changeLanguage(newLanguage: LanguageKeys) {
    this.locale = await getLocaleLanguage(newLanguage);
  }

  render() {
    return (
      <Host>
        <div class="py-[16px] min-h-[100px] flex items-center">
          <div class="px-[16px] py-[8px] border text-[#58151c] border-[#f2aeb5] bg-[#f7d7d8] text-[20px] rounded-[8px] w-fit mx-auto">{this.locale.errors.wrongFormStructure}</div>
        </div>
      </Host>
    );
  }
}
