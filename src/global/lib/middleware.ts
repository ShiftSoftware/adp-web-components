(function () {
  if (!window['blazorInvoke']) {
    window['blazorInvoke'] = function (selector, functionName, ...args) {
      const element = document.querySelector(selector);

      if (!element) {
        console.error(`Element with selector "${selector}" not found.`);
        return;
      }

      if (typeof element[functionName] !== 'function') {
        console.error(`Function "${functionName}" not found on the element.`);
        return;
      }

      try {
        return element[functionName](...args);
      } catch (error) {
        console.error(`Error invoking function "${functionName}" on element "${selector}":`, error);
      }
    };
    console.log('Global blazorInvoke initialized.');
  }
})();
