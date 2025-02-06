import { Component, Event, Host, Prop, h } from '@stencil/core';

import cn from '~lib/cn';

import { FormInputInterface } from '~types/forms';

@Component({
  shadow: false,
  tag: 'form-input',
  styleUrl: 'form-input.css',
})
export class FormInput implements FormInputInterface {
  @Prop() name: string;
  @Prop() label: string;
  @Prop() class: string;
  @Prop() isError: boolean;
  @Prop() disabled: boolean;
  @Prop() labelClass: string;
  @Prop() errorClass: string;
  @Prop() placeholder: string;
  @Prop() errorMessage: string;
  @Prop() containerClass: string;
  @Event() inputChanges: (event: InputEvent) => void;

  render() {
    const { class: inputClass, errorClass, containerClass, disabled, label, isError, labelClass, name, errorMessage, placeholder, inputChanges } = this;

    return (
      <Host>
        <label class={cn('relative w-full pb-[20px] inline-flex flex-col', containerClass)}>
          {label && <div class={cn('mb-[4px]', labelClass)}>{label}</div>}
          <input
            name={name}
            disabled={disabled}
            onInput={inputChanges}
            placeholder={placeholder}
            class={cn(
              'border disabled:opacity-75 flex-1 py-[6px] px-[12px] transition-all duration-300 rounded-md outline-none focus:border-slate-600 focus:shadow-[0_0_0_0.2rem_rgba(71,85,105,0.25)] w-full',
              { '!border-red-500 focus:shadow-[0_0_0_0.2rem_rgba(239,68,68,0.25)]': isError },
              inputClass,
            )}
          />
          <div class={cn('absolute bottom-0 -z-10 text-red-500 transition-all duration-300', { '-translate-y-full opacity-0': !isError }, errorClass)}>{errorMessage}</div>
        </label>
      </Host>
    );
  }
}
