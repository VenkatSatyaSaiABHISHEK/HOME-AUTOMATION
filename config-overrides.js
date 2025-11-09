const webpack = require('webpack');

module.exports = function override(config) {
    config.resolve.fallback = {
        ...config.resolve.fallback,
        "url": require.resolve("url/"),
        "buffer": require.resolve("buffer/"),
        "stream": require.resolve("stream-browserify"),
        "crypto": require.resolve("crypto-browserify"),
        // fully-specified import to satisfy ESM module resolution
        "process": require.resolve("process/browser.js"),
    };
    // explicit alias to ensure 'process/browser' resolves to the .js file (fixes fully-specified ESM imports)
    config.resolve.alias = {
        ...(config.resolve.alias || {}),
        'process/browser': require.resolve('process/browser.js'),
        'process': require.resolve('process/browser.js'),
    };
    
    config.plugins = [
        ...config.plugins,
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            // point to the browser.js file to avoid "extension is mandatory" errors
            process: require.resolve('process/browser.js')
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        })
    ];
    
    return config;
};