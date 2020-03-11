'use strict';

const webpack = require('webpack');
const path = require('path');
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
const ESLINTRC_PATH = path.resolve('.', '.eslintrc');
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

const devServerSettings = devMode => ({
    devServer: {
		contentBase: OUTPUT_DIRECTORY,
		hot: devMode,
		historyApiFallback: true,
	},
});

const rulesForScripts = (devMode, nodeModulesToBabel) => ([
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
    },
    {
        test: /\.js$/,
        loader: 'babel-loader',
        include: nodeModulesToBabel ? [ SOURCE_DIRECTORY, ...nodeModulesToBabel ] : [ SOURCE_DIRECTORY ],
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
            },
        ]
    },
]);

const pluginCopyFiles = (...pathObjects) => new PluginCopy(pathObjects.map(({ from, to }) => ({ from: path.resolve(SOURCE_DIRECTORY, from), to: path.resolve(OUTPUT_DIRECTORY, to) })), { info: true });

const pluginIgnoreOutput = (...filenames) => new PluginIgnoreEmit(filenames);

const pluginLintStyles = () => new PluginStyleLint({ fix: true });

const pluginExtractStyles = styleOutputFilename => new PluginCSSExtract({ filename: styleOutputFilename, chunkFilename: '[id].css' });

const pluginOptimizeStyles = devMode => new PluginOptimizeCSS({
    cssProcessorOptions: {
        minimize: !devMode,
        map: { inline: !devMode, annotation: devMode }, // Style source maps
    },
});

const generateConfig = ({ entryFile, scriptOutputFilename, styleOutputFilename, devMode, nodeModulesToBabel, plugins, ignoredOutputFiles, polyfill }) => ({
    ...defineEntry(polyfill, entryFile),
    ...defineOutput(scriptOutputFilename),
    ...commonSettings(devMode),
    ...devServerSettings(devMode),
    module: {
        rules: [
            ...rulesForScripts(devMode, nodeModulesToBabel),
            ...rulesForStyles(devMode),
        ],
    },
    plugins: [
        pluginLintStyles(),
        pluginExtractStyles(styleOutputFilename),
        pluginOptimizeStyles(devMode),
        pluginCopyFiles({ from: 'index.html', to: 'index.html' }),
        pluginIgnoreOutput(ignoredOutputFiles),
        new webpack.DefinePlugin({ 'testKey': 'test1' }),
        ...plugins,
    ],
});

const createWebpackConfig = ({ argv, entries, nodeModulesToBabel }) => {
    try {
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
                });
            }
            else {
                const { file, plugins = [], polyfill = true } = entryValue;

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