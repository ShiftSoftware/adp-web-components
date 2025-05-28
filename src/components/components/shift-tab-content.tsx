import { Component, Element, h, Host, Prop, State, Watch } from '@stencil/core';

import cn from '~lib/cn';
import containerHasTag from '~lib/container-has-tag';

import { FlexibleContainer } from './flexible-container';

@Component({
  shadow: false,
  tag: 'shift-tab-content',
  styleUrl: 'shift-tab-content.css',
})
export class ShiftTabContent {
  @Prop() activeComponent: string;
  @Prop() components: { [key: string]: Node };

  @Element() el: HTMLElement;
  @State() lastActiveComponent: string;

  flexibleContainerRef: FlexibleContainer;

  private ChildUpdatesActionTimeout: ReturnType<typeof setTimeout>;

  async componentDidLoad() {
    this.flexibleContainerRef = this.el.getElementsByTagName('flexible-container')[0] as unknown as FlexibleContainer;
  }

  @Watch('activeComponent')
  async onActiveIndexChange(newActiveComponent: string, oldActiveComponent: string) {
    this.lastActiveComponent = oldActiveComponent;

    clearTimeout(this.ChildUpdatesActionTimeout);

    const newActiveElement = this.el.getElementsByClassName(`tab-${newActiveComponent}`)[0] as HTMLElement;

    if (newActiveElement && containerHasTag(newActiveElement, 'flexible-container')) {
      this.flexibleContainerRef.stopAnimation = false;
      this.ChildUpdatesActionTimeout = setTimeout(() => {
        this.flexibleContainerRef.stopAnimation = true;
      }, 600);
    } else this.flexibleContainerRef.stopAnimation = false;
  }

  render() {
    return (
      <Host>
        <flexible-container stopAnimation classes="relative">
          {Object.entries(this.components).map(([componentName, component]) => (
            <div
              class={cn('w-full transition !duration-[0.35s]', `tab-${componentName}`, {
                'opacity-0 absolute top-0 !pointer-events-none [&_*]:!pointer-events-none translate-y-[30%]': componentName !== this.activeComponent,
                'translate-y-[-30%]': this.lastActiveComponent === componentName,
              })}
            >
              {component}
            </div>
          ))}
        </flexible-container>
      </Host>
    );
  }
}
