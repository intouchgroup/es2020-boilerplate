'use strict';

const pkg = require('../package.json');
const webpack = require('webpack');
const path = require('path');
const sass = require('sass');
const fibers = require('fibers');
const autoPrefix = require('autoprefixer');
const PluginCopy = require('copy-webpack-plugin');
const PluginStyleLint = require('stylelint-webpack-plugin');
const PluginCSSExtract = require('extract-css-chunks-webpack-plugin');
const PluginOptimizeCSS = require('optimize-css-assets-webpack-plugin');
const PluginIgnoreEmit = require('ignore-emit-webpack-plugin');

const DEFAULT_ENTRY_FILE = './scripts/index.js';
const DEFAULT_SCRIPTS_OUTPUT_FILENAME = './scripts/bundle.js';
const DEFAULT_STYLES_OUTPUT_FILENAME = './styles/styles.css';
const VALID_FILE_EXTENSIONS = [ '.js', '.scss', '.css' ];
const FILE_EXTENSION_REGEX = /\.[0-9a-z]+$/i;

const SOURCE_DIRECTORY = path.resolve('.', 'src');
const OUTPUT_DIRECTORY = path.resolve('.', 'dist');
const LIB_PATH = path.resolve('node_modules', pkg.name, 'lib');
const ESLINTRC_PATH = path.resolve(LIB_PATH, '.eslintrc');
const STYLELINTRC_PATH = path.resolve(LIB_PATH, '.stylelintrc');
const BABEL_CONFIG_PATH = path.resolve(LIB_PATH, 'babel.config.js');
const CSS_GLOBAL_LOADER_INCLUDES = [ path.resolve(SOURCE_DIRECTORY, 'styles') ];
const POLYFILLS_MODULE = 'core-js/stable';

const defineEntry = (polyfill, filename) => ({ entry: polyfill ? [ POLYFILLS_MODULE, filename ] : [ filename ] });

const defineOutput = filename => ({ output: { path: OUTPUT_DIRECTORY, filename } });

const commonSettings = devMode => ({
    mode: devMode ? 'development' : 'production',
    context: SOURCE_DIRECTORY,
    resolve: {
		extensions: [ '.js' ],
		alias: {
			Assets: path.resolve(SOURCE_DIRECTORY, 'assets'),
			Constants: path.resolve(SOURCE_DIRECTORY, 'constants'),
			Data: path.resolve(SOURCE_DIRECTORY, 'data'),
			Services: path.resolve(SOURCE_DIRECTORY, 'services'),
			Styles: path.resolve(SOURCE_DIRECTORY, 'styles'),
		},
	},
    devtool: devMode ? 'eval' : '', // Script source maps
    performance: {
		hints: devMode ? false : 'warning',
    },
    stats: 'normal',
});

const devServerSettings = (devMode, useHttps) => ({
    devServer: {
		contentBase: OUTPUT_DIRECTORY,
		hot: devMode,
        historyApiFallback: true,
        https: useHttps,
	},
});

const rulesForScripts = (devMode, nodeModulesToBabel, skipLinting) => ([
    skipLinting ? {} : (
        {
            test: /\.js$/,
            loader: 'eslint-loader',
            enforce: 'pre',
            include: [
                SOURCE_DIRECTORY,
            ],
            options: {
                configFile: ESLINTRC_PATH,
                fix: true,
            },
        }
    ),
    {
        test: /\.js$/,
        loader: 'babel-loader',
        include: nodeModulesToBabel ? [ SOURCE_DIRECTORY, ...nodeModulesToBabel.map(moduleName => path.resolve('.', 'node_modules', moduleName)) ] : [ SOURCE_DIRECTORY ],
        options: {
            configFile: BABEL_CONFIG_PATH,
        },
    },
]);

const rulesForStyles = devMode => ([
    {
        test: /\.(scss|css)$/,
        include: CSS_GLOBAL_LOADER_INCLUDES,
        use: [
            {
                loader: PluginCSSExtract.loader,
                options: {
                    hot: devMode,
                },
            },
            {
                loader: 'css-loader',
                options: {
                    url: false,
                },
            },
            {
                loader: 'postcss-loader',
                options: {
                    plugins: [
                        autoPrefix(),
                    ],
                },
            },
            {
                loader: 'sass-loader',
                options: {
                    implementation: sass,
                    sassOptions: {
                        fiber: fibers,
                    },
                },
            },
        ],
    },
]);

const pluginCopyFiles = (...pathObjects) => new PluginCopy(pathObjects.map(({ from, to }) => ({ from: path.resolve(SOURCE_DIRECTORY, from), to: path.resolve(OUTPUT_DIRECTORY, to) })), { info: true });

const pluginIgnoreOutput = (...filenames) => new PluginIgnoreEmit(filenames);

const pluginLintStyles = () => new PluginStyleLint({ configFile: STYLELINTRC_PATH, fix: true, allowEmptyInput: true });

const pluginExtractStyles = styleOutputFilename => new PluginCSSExtract({ filename: styleOutputFilename, chunkFilename: '[id].css' });

const pluginOptimizeStyles = devMode => new PluginOptimizeCSS({
    cssProcessorOptions: {
        minimize: !devMode,
        map: { inline: !devMode, annotation: devMode }, // Style source maps
    },
});

const generateConfig = ({ entryFile, scriptOutputFilename, styleOutputFilename, devMode, nodeModulesToBabel, plugins, ignoredOutputFiles, polyfill, skipLinting, useHttps }) => ({
    ...defineEntry(polyfill, entryFile),
    ...defineOutput(scriptOutputFilename),
    ...commonSettings(devMode),
    ...devServerSettings(devMode, useHttps),
    module: {
        rules: [
            ...rulesForScripts(devMode, nodeModulesToBabel, skipLinting),
            ...rulesForStyles(devMode),
        ],
    },
    plugins: [
        skipLinting ? () => {} : pluginLintStyles(),
        pluginExtractStyles(styleOutputFilename),
        pluginOptimizeStyles(devMode),
        pluginCopyFiles({ from: 'index.html', to: 'index.html' }),
        pluginIgnoreOutput(ignoredOutputFiles),
        new webpack.DefinePlugin({ 'testKey': 'test1' }),
        ...plugins,
    ],
});

const createWebpackConfig = ({ argv, entries, nodeModulesToBabel, useHttps = true, env }) => {
    try {
        if (env) {
            throw new Error('You passed the env prop to createWebpackConfig. Did you mean to pass argv?')
        }

        const devMode = argv === undefined || argv.prod === undefined;
        const analyzeMode = argv && argv.analyze !== undefined;

        if (!entries) {
            return generateConfig({
                entryFile: DEFAULT_ENTRY_FILE,
                scriptOutputFilename: DEFAULT_SCRIPTS_OUTPUT_FILENAME,
                styleOutputFilename: DEFAULT_STYLES_OUTPUT_FILENAME,
                devMode,
                nodeModulesToBabel,
                plugins: [],
                ignoredOutputFiles: [],
                polyfill: true,
                skipLinting: false,
                useHttps,
            });
        }
        
        return Object.entries(entries).map(([ entryKey, entryValue ]) => {
            if (typeof entryValue === 'string') {
                const fileExtensionMatches = entryValue.match(FILE_EXTENSION_REGEX);

                if (!fileExtensionMatches) {
                    throw new Error(`Invalid entry with key ${entryKey}: ${entryValue}`);
                }

                const fileExtension = fileExtensionMatches[0];

                if (!VALID_FILE_EXTENSIONS.includes(fileExtension)) {
                    throw new Error(`Invalid file extension "${fileExtension}" in entry with key ${entryKey}: ${entryValue}`);
                }

                return generateConfig({
                    entryFile: entryValue,
                    scriptOutputFilename: `${entryKey}.js`,
                    styleOutputFilename: `${entryKey}.css`,
                    devMode,
                    nodeModulesToBabel,
                    plugins: [],
                    ignoredOutputFiles: fileExtension !== '.js' ? [ `${entryKey}.js` ] : [],
                    polyfill: true,
                    skipLinting: false,
                    useHttps,
                });
            }
            else {
                const { file, plugins = [], polyfill = true, skipLinting = false } = entryValue;

                const fileExtensionMatches = file.match(FILE_EXTENSION_REGEX);

                if (!fileExtensionMatches) {
                    throw new Error(`Invalid entry with key ${entryKey}:\n\n${JSON.stringify(entryValue)}`);
                }

                const fileExtension = fileExtensionMatches[0];

                if (!Array.isArray(plugins)) {
                    throw new Error(`Invalid plugins format in entry with key ${entryKey}:\n\n${JSON.stringify(plugins)}`);
                }

                return generateConfig({
                    entryFile: file,
                    scriptOutputFilename: `${entryKey}.js`,
                    styleOutputFilename: `${entryKey}.css`,
                    devMode,
                    nodeModulesToBabel,
                    plugins,
                    ignoredOutputFiles: fileExtension !== '.js' ? [ `${entryKey}.js` ] : [],
                    polyfill,
                    skipLinting,
                    useHttps,
                });
            }
        });
    }
    catch (error) {
        console.error('\n\n\x1b[31m%s\x1b[0m', error, '\n\n');
        process.exit(1)
    }
};

module.exports = {
    defineEntry,
    defineOutput,
    commonSettings,
    devServerSettings,
    rulesForScripts,
    rulesForStyles,
    pluginCopyFiles,
    pluginIgnoreOutput,
    pluginLintStyles,
    pluginExtractStyles,
    pluginOptimizeStyles,
    generateConfig,
    createWebpackConfig,
};