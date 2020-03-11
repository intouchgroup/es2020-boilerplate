# @intouchgroup/es2020-boilerplate

🔮 Build processes for ES2020 and SCSS with IE11 support<br>
<br>

### Goals

&nbsp;&nbsp;&nbsp;&nbsp;🌈 Excellent developer experience<br>
&nbsp;&nbsp;&nbsp;&nbsp;🚀 Powerful advanced tooling<br>
&nbsp;&nbsp;&nbsp;&nbsp;🏛 Standardized project architecture<br>
<br>

#### Simplicity

Provides cutting edge build and bundle capabilities with zero configuration required by default.
<br>

```js
// webpack.config.js
const { createWebpackConfig } = require('@intouchgroup/es2020-boilerplate');

module.exports = (env, argv) => createWebpackConfig({ argv });
```

#### Elegance

Exposes functions that can be used as building blocks to compose more complex build processes.<br>
The zero configuration build process was built using these functions.<br>

```js
// webpack.config.js
const { createWebpackConfig } = require('@intouchgroup/es2020-boilerplate');

module.exports = (env, argv) => createWebpackConfig({
    argv,
    entries: {
        main: './scripts/index.js',
        styles: './styles/styles.scss',
        'test/styles': './styles/test/test.scss',
        'advanced/bundle': {
            file: './scripts/index.js',
            plugins: [],
            polyfill: false,
        },
    },
    nodeModulesToBabel: [],
});
```
<br>

### Getting Started

#### New Project

1. Install the module globally:<br>
`npm i -g @intouchgroup/es2020-boilerplate`<br><br>

2. Bootstrap a new project:<br>
`es2020-boilerplate my-new-project`<br><br>

#### Existing Project

1. Install the module as a dev dependency:<br>
`npm i -D @intouchgroup/es2020-boilerplate`<br><br>

2. Generate configuration files:<br>
`es2020-boilerplate`<br><br>

3. Update `webpack.config.js` as necessary<br><br>


### API Reference

A valid Webpack configuration has three main parts: **settings**, **module rules**, and **plugins**.

Calling `createWebpackConfig` with an optional settings object will generate a fully valid Webpack configuration.

You may also choose to build your own Webpack configuration using the available building block functions.

All of the **settings** and **module rules** functions use the spread operator. The `generateConfig` function is a good example of building a valid config.

```js
// webpack.config.js
import { defineEntry, defineOutput, commonSettings, devServerSettings, rulesForScripts, rulesForStyles, pluginLintStyles, pluginExtractStyles, pluginOptimizeStyles, pluginCopyFiles } from '@intouchgroup/es2020-boilerplate';

module.exports = {
    ...defineEntry(doPolyfill, entryFilename),
    ...defineOutput(jsOutputFilename),
    ...commonSettings(devMode),
    ...devServerSettings(devMode),

    module: {
        rules: [
            ...rulesForScripts(devMode, nodeModuleToBabel),
            ...rulesForStyles(devMode),
        ],
    },

    plugins: [
        pluginLintStyles(),
        pluginExtractStyles(cssOutputFilename),
        pluginOptimizeStyles(devMode),
        pluginCopyFiles({ from: 'index.html', to: 'index.html' }),
    ],
};
```
<br>

#### Utility:

`createWebpackConfig` - create cutting edge Webpack configs

`generateConfig` - built out of the other functions below, and called by `createWebpackConfig` to generate the config object
<br>

#### Settings:

Some settings are required by Webpack. These settings are included automatically when using `createWebpackConfig`. You can also use these settings to build your own Webpack config.

`defineEntry` - includes input file setting, **required**

`defineOutput` - includes output file setting, **required**

`commonSettings` - includes default general settings for Webpack, **recommended**

`devServerSettings` - includes default settings for Webpack Dev Server
<br>

#### Module Rules:

At least one set of rules is required for Webpack to process any file type. These rules are included automatically when using `createWebpackConfig`. You can also use these rules to build your own Webpack config.

`rulesForScripts` - includes default rules for processing JS with Webpack loaders

`rulesForStyles` - includes default rules for processing CSS with Webpack loaders
<br>

#### Plugins

Plugins are all optional. The style plugins are included automatically when using `createWebpackConfig`. Plugins can be passed with individual `entries` when using `createWebpackConfig`. You can also use these plugins to build your own Webpack config.

`pluginCopyFiles` - copy files from the source directory to the output directory 

`pluginIgnoreOutput` - ignores files that Webpack tries to output with the specifies names

`pluginLintStyles` - lints styles with stylelint, runs by default when using `createWebpackConfig`

`pluginExtractStyles` - process CSS in JS and enable HMR, runs by default when using `createWebpackConfig`

`pluginOptimizeStyles` - minimize CSS and update source maps, runs by default when using `createWebpackConfig`
<br>