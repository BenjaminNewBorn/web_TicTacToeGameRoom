var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.join(__dirname, 'dist');
var APP_DIR = path.resolve(__dirname, 'src');

var config = {
    entry: APP_DIR + '/index.js',
    output: {
        path: BUILD_DIR,
        filename: 'bundle.js',
        publicPath: '/static/'
    },
    module : {
        rules : [
            {
                test : /\.js$/,
                exclude : /node_modules/,
                loaders : ['babel-loader']
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    }
};

module.exports = config;
