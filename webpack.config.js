const path = require('path');

module.exports = {
    entry: {
        // Scripts
        'main': './scripts/main.js',
        'fastsearch': './scripts/fastsearch.js',
        // 'sentry': './scripts/sentry.js',
        'turbo': './scripts/turbo.js',
        'theme': './scripts/themeToggle.js',
        // 'copyCode': './scripts/copyCode.js',
        'home-agents': './scripts/home-agents.js',
        // Pages
    },
    output: {
        path: path.resolve(__dirname, 'assets/js/'),
        filename: '[name].js',
    },
};