const path = require('path');

module.exports = {
    entry: {
        // Scripts
        // Pages
    },
    output: {
        path: path.resolve(__dirname, 'assets/js/'),
        filename: '[name].js',
    },
};