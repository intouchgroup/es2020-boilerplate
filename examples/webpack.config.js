const { createWebpackConfig } = require('../lib');

module.exports = (env, argv) => createWebpackConfig({
    entries: {
        primary: './scripts/index.js',
        styles: './styles/styles.scss',
        test999: './styles/test/test.scss',
        nopoly: {
            file: './scripts/index.js',
            plugins: [],
            polyfill: false,
        },
    },
});