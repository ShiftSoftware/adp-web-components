import { Component, Element, Prop, State, Watch, h } from '@stencil/core';
import cn from '~lib/cn';

@Component({
  shadow: false,
  tag: 'flexible-container',
  styleUrl: 'flexible-container.css',
})
export class FlexibleContainer {
  @Prop() classes?: string;
  @Prop() alwaysStrict?: boolean;
  @Prop() containerClasses?: string;
  @Prop() isOpened?: boolean = true;

  @Element() el: HTMLElement;
  @State() content: HTMLDivElement;
  @State() container: HTMLDivElement;

  private mutationObserver: MutationObserver;

  private ChildUpdatesActionTimeout: ReturnType<typeof setTimeout>;

  async componentDidLoad() {
    this.container = this.el.querySelector('.flexible-container');
    this.content = this.el.querySelector('.flexible-container-content');

    this.mutationObserver = new MutationObserver(this.handleChildUpdates);

    this.mutationObserver.observe(this.content, {
      childList: true, // watches child nodes added/removed
      subtree: true, // watches all descendants, not just direct children
      characterData: true, // watches text content changes
      attributes: true, // watches attribute changes
      attributeOldValue: true, // optional: track old attribute value
      characterDataOldValue: true, // optional: track old text content
    });

    setTimeout(() => {
      this.startTransition(true);
    }, 1000);
  }

  async disconnectedCallback() {
    if (this.mutationObserver) this.mutationObserver.disconnect();
  }

  private startTransition = (strict = false) => {
    console.log(100);

    if (!this.isOpened) this.container.style.height = '0px';
    else if (strict || this.alwaysStrict) this.container.style.height = `${this.content.clientHeight}px`;
    else this.container.style.height = `${this.content.clientHeight ? this.content.clientHeight + 4 : this.content.clientHeight}px`;
  };

  private handleChildUpdates = () => {
    console.log(99);

    clearTimeout(this.ChildUpdatesActionTimeout);
    this.ChildUpdatesActionTimeout = setTimeout(() => {
      this.startTransition();
    }, 50);
  };

  @Watch('isOpened')
  async handleOpenChanges() {
    this.handleChildUpdates();
  }

  render() {
    return (
      <div class={cn('flexible-container transition-all overflow-hidden duration-500', { 'h-0': !this.isOpened }, this.containerClasses)}>
        <div class={cn('flexible-container-content', this.classes)}>
          <slot></slot>
        </div>
      </div>
    );
  }
}
