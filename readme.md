<img src="./docs/shift-software.png" alt="By Shift software" style="max-width: 333px;">

<br>
<br>
<br>

_Built by [Shift Software](https://shift.software/)_

# ADP Web Components

The **ADP Web Components** project provides reusable web components designed to enhance the functionality of web applications for ADP Platform. ensuring the components are lightweight, efficient, and compatible with various frameworks and environments. The components can be used **standalone** or as part of a **bundle** and are designed to integrate seamlessly into any web project.

<br>

## Table of Contents

- [Stand Alone Installation (Lazy loading) (Recommended)](#stand-alone-installation)
- [Bundle Installation](#bundle-installation)
- [Components List](#components-list)

## Stand Alone Installation

<div style="border: 1px solid red;border-radius:5px; padding: 10px;font-size: 18px;">
  <b style="color:red;">⚠️ Important:</b> You must use the <b>document.addEventListener('DOMContentLoaded',()=>{})</b> event listener when using standalone components. Because stand alone importing are <b>lazy loaded</b>
</div>

<br>

```javascript
document.addEventListener('DOMContentLoaded', () => {});
```

always up-to-date version:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/adp-web-components@latest/dist/components/dynamic-claim.js"></script>
```

current version version:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/adp-web-components@0.0.6/dist/components/dynamic-claim.js"></script>
```

This will give you access to single component which you imported from the ADP Web Components library.

#### Example Usage

Full Code [here](./docs/stand-alone-example.html)

```html
<dynamic-claim is-dev="true" base-url="http://localhost:7174/api/secure-vehicle-lookup-test/" id="dynamic-claim"></dynamic-claim>

<script>
   document.addEventListener('DOMContentLoaded', () => {
     const dynamicClaim = document.getElementById('dynamic-claim');

     ...
  });
</script>
```

## Bundle Installation

To use the entire component bundle, include the following script in your HTML:

always up-to-date version:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/adp-web-components@latest/dist/shift-components/shift-components.esm.js"></script>
```

current version version:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/adp-web-components@0.0.6/dist/shift-components/shift-components.esm.js"></script>
```

This will give you access to all components in the ADP Web Components library.

#### Example Usage

Full Code [here](./docs/bundle-example.html)

```html
<dynamic-redeem id="dynamic-redeem"></dynamic-redeem>
<dynamic-claim is-dev="true" base-url="http://localhost:7174/api/secure-vehicle-lookup-test/" id="dynamic-claim"></dynamic-claim>

<script>
  const dynamicClaim = document.getElementById('dynamic-claim');
  const dynamicRedeem = document.getElementById('dynamic-redeem');

  ...
</script>
```

## Components List

This is the complete list of the components with their documentation:

- [Dynamic Claim](./src/components/dynamic-claim/readme.md)
- [Dynamic Redeem](./src/components/dynamic-redeem/readme.md)

_Built by [Shift Software](https://shift.software/)_
