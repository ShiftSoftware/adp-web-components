const updateBodyHeight = (component: any) => {
  if (component.state.includes('loading')) return;

  setTimeout(() => {
    const bodyEl = component.el.shadowRoot.querySelector('.vehicle-info-body');
    const contentEl = component.el.shadowRoot.querySelector('.vehicle-info-content');

    if (contentEl && bodyEl) {
      const { clientHeight } = contentEl;

      if (clientHeight) (bodyEl as HTMLElement).style.height = `${clientHeight}px`;
    }
  }, 50);
};

export default updateBodyHeight;
