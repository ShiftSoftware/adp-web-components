# Installation

ADP Web Components offers two installation methods: **Bundle Installation** and **Standalone Installation** , depending on your project requirements.

ADP Web Components offers both **Latest version CDN links** and **Versioned CDN links**.

---

## Versioned VS Latest CDN types

- **Versioned CDN (Recommended)**:
  Versioned CDN offers the bundle or standalone component by specifying specific version of the ADP components library. by specifying version after @ symbol in the CDN and example **@0.0.13**.

- **Latest CDN**: Latest CDN offers newest updates on the components when ever new component releases your component will be updated also. by adding latest keyword after @ symbol in the CDN and example **@latest**.

!!! danger "Cons"

    - **Versioned CDN**: if any bugs that are in your version are fixed in the new version you will not get update and you will have to update your version and code manually.
    - **Latest CDN**: if new components are optimized and their methods are callbacks are changed then your code will break and you will have to update it.

!!! success "Cons"

    - **Versioned CDN**: Benefits from stability when new version comes out as you will still use the older version
    - **Latest CDN**: if any bugs are fixed in any components you will get live update

=== "Versioned CDN (Recommended)"

    - Bundle (e.g., 0.0.13)

        ```html
        <script type="module" src="https://cdn.jsdelivr.net/npm/adp-web-components@0.0.13/dist/shift-components/shift-components.esm.js"></script>
        ```

    - Stand alone (e.g., 0.0.13)

        ```html
        <script type="module" src="https://cdn.jsdelivr.net/npm/adp-web-components@0.0.13/dist/components/dynamic-claim.js"></script>
        ```

=== "Latest CDN"

    - Bundle (Latest)

        ```html
        <script type="module" src="https://cdn.jsdelivr.net/npm/adp-web-components@latest/dist/shift-components/shift-components.esm.js"></script>
        ```

    - Stand alone (Latest)

        ```html
        <script type="module" src="https://cdn.jsdelivr.net/npm/adp-web-components@latest/dist/components/dynamic-claim.js"></script>
        ```

---

## Bundled vs Standalone CDN types

ADP Web Components offers two installation methods: **Standalone Installation** (recommended with lighter weight) and **Bundle Installation**, depending on your project requirements.

- **Bundled CDN**:
  Bundled CDN offers all components that are listed at [component list](components/index.md) with single CDN link. bundled CDN link is listed at [component list](components/index.md).

- **Standalone CDN (Recommended & light weight)**: Standalone CDN offers a single component importing with its own CDN link, all component CDN links are documented in each component dedicated documentation file.

!!! danger "Cons"

    - **Bundled CDN**: Bundled CDN possibly have more size compared to standalone components.
    - **Standalone CDN**: Standalone CDN components can't be accessed directly when HTML mounts and instead can be accessed within `document.addEventListener('DOMContentLoaded', () => {})` which runs after Document content is fully loaded. this happens because Standalone components are `lazy-loaded` and HTML will not wait for them to be imported fully from network.

!!! success "Pros"

    - **Bundled CDN**: Great when using multiple ADP-components at the same time where it imports all of them together in optimized way. `Lazy loading` doesn't happens as much as Standalone components but its still **Recommended** to use `document.addEventListener('DOMContentLoaded', () => {})`.
    - **Standalone CDN**: Standalone components have lighter weight compared to Bundled importing.

=== "Bundled CDN Example"

    - Latest

        ```html
        <script type="module" src="https://cdn.jsdelivr.net/npm/adp-web-components@latest/dist/shift-components/shift-components.esm.js"></script>
        ```

    - Versioned (e.g., 0.0.13)

        ```html
        <script type="module" src="https://cdn.jsdelivr.net/npm/adp-web-components@0.0.13/dist/shift-components/shift-components.esm.js"></script>
        ```

=== "Standalone CDN Example"

    - Latest

        ```html
        <script type="module" src="https://cdn.jsdelivr.net/npm/adp-web-components@latest/dist/components/dynamic-claim.js"></script>
        ```

    - Versioned (e.g., 0.0.13)

        ```html
        <script type="module" src="https://cdn.jsdelivr.net/npm/adp-web-components@0.0.13/dist/components/dynamic-claim.js"></script>
        ```

---

## Usage

Components usage are not changed if you use any combination of (Versioned VS latest) and (Bundled VS Standalone). however you can skip using `document.addEventListener('DOMContentLoaded', () => {})` in Bundled mode but it is **highly Recommended** to be used.

=== "Bundle Usage"

    Bundle usage includes all components in one package, making it easier to manage if you're using multiple components.

    First import the components using the script:

    ```html
    <script type="module" src="https://cdn.jsdelivr.net/npm/adp-web-components@latest/dist/shift-components/shift-components.esm.js"></script>
    ```

    HTML Code with DOMContentLoaded **Recommended**:

    ```html
    <dynamic-redeem id="dynamic-redeem"></dynamic-redeem>
    <dynamic-claim is-dev="true" base-url="http://localhost:7174/api/secure-vehicle-lookup-test/" id="dynamic-claim"></dynamic-claim>

    <script>
      let dynamicClaim
      let dynamicRedeem

      document.addEventListener('DOMContentLoaded', () => {

        dynamicClaim = document.getElementById('dynamic-claim');
        dynamicRedeem = document.getElementById('dynamic-redeem');

        // Add your JavaScript logic here

      });
    </script>
    ```

    HTML Code without DOMContentLoaded:

    ```html
    <dynamic-redeem id="dynamic-redeem"></dynamic-redeem>
    <dynamic-claim is-dev="true" base-url="http://localhost:7174/api/secure-vehicle-lookup-test/" id="dynamic-claim"></dynamic-claim>

    <script>

      const dynamicClaim = document.getElementById('dynamic-claim');
      const dynamicRedeem = document.getElementById('dynamic-redeem');

      // Add your JavaScript logic here
    </script>
    ```

=== "Standalone Usage"

    Standalone usage allows you to load individual components on demand, ensuring better performance and reduced load times.

    **Important Note:** Use the `document.addEventListener('DOMContentLoaded', () => {})` event listener when loading standalone components, as they are lazy-loaded.

    ```html
    <script type="module" src="https://cdn.jsdelivr.net/npm/adp-web-components@latest/dist/components/dynamic-claim.js"></script>
    <script type="module" src="https://cdn.jsdelivr.net/npm/adp-web-components@latest/dist/components/dynamic-redeem.js"></script>
    ```

    HTML Code:

    ```html
    <dynamic-redeem id="dynamic-redeem"></dynamic-redeem>
    <dynamic-claim is-dev="true" base-url="http://localhost:7174/api/secure-vehicle-lookup-test/" id="dynamic-claim"></dynamic-claim>

    <script>
      let dynamicClaim
      let dynamicRedeem

      document.addEventListener('DOMContentLoaded', () => {

        dynamicClaim = document.getElementById('dynamic-claim');
        dynamicRedeem = document.getElementById('dynamic-redeem');

        // Add your JavaScript logic here

      });
    </script>
    ```

---

## Next Steps

- Explore the [Theming](theming.md) to customize the components.
- Explore the [Components List](components.md) for demo and detailed documentation on each component.
