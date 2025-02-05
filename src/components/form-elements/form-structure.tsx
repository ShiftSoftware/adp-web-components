import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  shadow: false,
  tag: 'form-structure',
  styleUrl: 'form-structure.css',
})
export class FormStructure {
  @Prop() structure: any;

  render() {
    return <Host></Host>;
  }
}
