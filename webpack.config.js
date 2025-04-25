const path = require('path');

module.exports = {
    entry: {
        // Scripts
        'main': './scripts/main.js',
        'fastsearch': './scripts/fastsearch.js',
        'intersect': './scripts/intersect.js',
        // 'sentry': './scripts/sentry.js',
        'turbo': './scripts/turbo.js',
        'theme': './scripts/themeToggle.js',
        // 'copyCode': './scripts/copyCode.js',
        // Pages
    },
    output: {
        path: path.resolve(__dirname, 'assets/js/'),
        filename: '[name].js',
    },
};