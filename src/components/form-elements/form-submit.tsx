import { Component, Prop, h } from '@stencil/core';
import cn from '~lib/cn';
import { FormFieldParams, StructureObject } from '~types/forms';

@Component({
  shadow: false,
  tag: 'form-submit',
  styleUrl: 'form-submit.css',
})
export class FormSubmit {
  @Prop() isLoading: boolean;
  @Prop() params: FormFieldParams;
  @Prop() structureElement: StructureObject;

  render() {
    return (
      <button class={cn('bg-red-500')} type="submit" id={this.structureElement.id} {...this.params}>
        {this.structureElement.class}
      </button>
    );
  }
}
