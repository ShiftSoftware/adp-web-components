import { Component, Prop, h } from '@stencil/core';

import cn from '~lib/cn';

import { FormFieldParams, StructureObject } from '~types/forms';

import Loader from '~assets/white-loader.svg';

@Component({
  shadow: false,
  tag: 'form-submit',
  styleUrl: 'form-submit.css',
})
export class FormSubmit {
  @Prop() isLoading: boolean;
  @Prop() params: FormFieldParams = {};
  @Prop() structureElement: StructureObject;

  render() {
    return (
      <button
        type="submit"
        {...this.params}
        disabled={this.isLoading}
        id={this.structureElement.id}
        class={cn(
          'h-[38px] relative overflow-hidden px-4 enabled:hover:bg-slate-600 transition-colors duration-300 bg-slate-700 enabled:active:bg-slate-800 rounded text-white flex items-center',
          {
            'bg-slate-600': this.isLoading,
          },
        )}
      >
        <div class="opacity-0">{this.structureElement.class}</div>
        <div class={cn('absolute size-full top-0 left-0 flex items-center justify-center transition !duration-1000', { 'translate-y-full': this.isLoading })}>
          {this.structureElement.class}
        </div>

        <div class={cn('absolute flex justify-center items-center top-0 left-0 size-full transition !duration-1000 -translate-y-full', { 'translate-y-0': this.isLoading })}>
          <img class="animate-spin-2s size-[22px]" src={Loader} />
        </div>
      </button>
    );
  }
}
