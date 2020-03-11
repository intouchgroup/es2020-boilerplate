# @intouchgroup/es2020-boilerplate

🔮 Build processes for ES2020 and SCSS with IE11 support<br>
<br>

### Goals


&nbsp;&nbsp;&nbsp;&nbsp;🌈 Excellent developer experience<br>
&nbsp;&nbsp;&nbsp;&nbsp;🚀 Powerful advanced tooling<br>
&nbsp;&nbsp;&nbsp;&nbsp;🏛 Standardized project architecture<br>


#### Simplicity

Provides cutting edge build and bundle capabilities with zero configuration required by default.


#### Elegance

Exposes functions that can be used as building blocks to compose more complex build processes.
The zero configuration build process was built using these functions.


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

`defineEntry`

`defineOutput`

`commonConfiguration`

`devServerConfiguration`

`rulesForScripts`

`rulesForStyles`

`pluginCopyFiles`

`pluginIgnoreOutput`

`pluginLintStyles`

`pluginExtractStyles`

`pluginOptimizeStyles`

`generateConfig`

`createWebpackConfig`