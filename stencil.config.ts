import { Config } from '@stencil/core';
import alias from '@rollup/plugin-alias';
import path from 'path';
import { sass } from '@stencil/sass';
import tailwind, { tailwindHMR, setPluginConfigurationDefaults } from 'stencil-tailwind-plugin';
import tailwindcss from 'tailwindcss';
import tailwindConf from './tailwind.config';
import autoprefixer from 'autoprefixer';

setPluginConfigurationDefaults({
  tailwindConf,
  postcss: {
    plugins: [tailwindcss(), autoprefixer()],
  },
});

export const config: Config = {
  devMode: false,
  minifyJs: true,
  minifyCss: true,
  sourceMap: false,
  globalScript: 'src/global/lib/middleware.ts',
  namespace: 'shift-components',
  plugins: [
    sass(),
    tailwind(),
    tailwindHMR(),
    alias({
      entries: [
        { find: '~api', replacement: path.resolve('src/global/api') },
        { find: '~lib', replacement: path.resolve('src/global/lib') },
        { find: '~locales', replacement: path.resolve('src/locales') },
        { find: '~types', replacement: path.resolve('src/global/types') },
        { find: '~assets', replacement: path.resolve('src/global/assets') },
      ],
    }),
  ],
  preamble: 'Built by ShiftSoftware\nCopyright (c)',
  outputTargets: [
    {
      type: 'dist',
      polyfills: true,
      esmLoaderPath: '../loader',
    },
    {
      minify: true,
      externalRuntime: false,
      type: 'dist-custom-elements',
      copy: [{ src: 'assets/locales', dest: 'dist/locales' }],
      customElementsExportBehavior: 'auto-define-custom-elements',
    },
    {
      type: 'www',
      serviceWorker: null,
      copy: [{ src: 'index.html' }, { src: 'templates' }, { src: 'assets/locales', dest: 'locales' }],
    },
  ],
  devServer: {
    reloadStrategy: 'pageReload',
  },
  testing: {
    browserHeadless: 'new',
  },
};
