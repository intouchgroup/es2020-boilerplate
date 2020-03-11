const { createWebpackConfig } = require('../lib');

module.exports = (env, argv) => createWebpackConfig({
    argv,
    entries: {
        primary: './scripts/index.js',
        styles: './styles/styles.scss',
        'styles/test999': './styles/test/test.scss',
        'nopoly/primary': {
            file: './scripts/index.js',
            plugins: [],
            polyfill: false,
        },
    },
    nodeModulesToBabel: [],
});