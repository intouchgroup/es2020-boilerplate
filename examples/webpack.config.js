const { createWebpackConfig } = require('../lib');

module.exports = (env, argv) => createWebpackConfig({
    entries: {
        primary: './scripts/index.js',
        cody: './styles/styles.scss',
        nopoly: {
            file: './scripts/index.js',
            plugins: [],
            polyfill: false,
        },
    },
});