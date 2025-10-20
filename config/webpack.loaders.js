const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const fs = require('fs');
const config = require('./site.config');

// Define common loader constants
const sourceMap = config.env !== 'production';

const processNestedHtml = (content, loaderContext) => {
  const INCLUDE_PATTERN = /<include src="(.+)"\/?>(?:<\/include>)?/gi;
  if (!INCLUDE_PATTERN.test(content)) {
    return content;
  }
  return content.replace(INCLUDE_PATTERN, (m, src) => processNestedHtml(fs.readFileSync(path.resolve(loaderContext.context, src), 'utf8'), loaderContext));
};

function processHtmlLoader(content, loaderContext) {
  const newContent = processNestedHtml(content, loaderContext);
  return newContent;
}

// HTML loaders
const html = {
  test: /\.(html)$/,
  use: [
    {
      loader: 'html-loader',
      options: {
        attributes: {
          list: [
            '...',
            {
              tag: 'a',
              attribute: 'href',
              type: 'src',
            },
          ],
          urlFilter: (attribute, value) => {
            // The `attribute` argument contains a name of the HTML attribute.
            // The `value` argument contains a value of the HTML attribute.

            if (/\.pdf$/.test(value)) {
              return false;
            }

            return true;
          },
        },
        preprocessor: processHtmlLoader,
      },
    },
  ],
};

// Javascript loaders
const js = {
  test: /\.js(x)?$/,
  exclude: /node_modules/,
  use: [
    {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env'],
      },
    },
    'eslint-loader',
  ],
};

// Style loaders
const styleLoader = {
  loader: 'style-loader',
};

const cssLoader = {
  loader: 'css-loader',
  options: {
    sourceMap,
  },
};

const postcssLoader = {
  loader: 'postcss-loader',
  options: {
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    plugins: [require('autoprefixer')()],
    sourceMap,
  },
};

const css = {
  test: /\.css$/,
  use: [
    config.env === 'production' ? MiniCssExtractPlugin.loader : styleLoader,
    cssLoader,
    postcssLoader,
  ],
};

const sass = {
  test: /\.s[c|a]ss$/,
  use: [
    config.env === 'production' ? MiniCssExtractPlugin.loader : styleLoader,
    cssLoader,
    postcssLoader,
    {
      loader: 'sass-loader',
      options: {
        sourceMap,
      },
    },
  ],
};

const imageCompress = {
  loader: 'image-webpack-loader',
  options: {
    bypassOnDebug: true,
    gifsicle: {
      interlaced: false,
    },
    optipng: {
      optimizationLevel: 7,
    },
    pngquant: {
      quality: '65-90',
      speed: 4,
    },
    mozjpeg: {
      progressive: true,
    },
  },
};

const images = {
  test: /\.(gif|png|jpe?g|webp|svg)$/i,
  exclude: /assets\/fonts/,
  use: [
    {
      loader: 'file-loader',
      options: {
        context: config.src,
        name: config.env === 'production' ? '[path][name].[contenthash:8].[ext]' : '[path][name].[ext]',
      },
    },
  ],
};

if (config.env === 'production') {
  images.use.push(imageCompress);
}

// Video loaders
const videos = {
  test: /\.(mp4|webm)$/,
  use: [
    {
      loader: 'file-loader',
      query: {
        name: config.env === 'production' ? '[name].[contenthash:8].[ext]' : '[name].[ext]',
        outputPath: 'assets/videos/',
      },
    },
  ],
};

module.exports = [html, js, css, sass, images, videos];
