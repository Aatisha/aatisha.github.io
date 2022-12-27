const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const config = require("./site.config");
const path = require('path');
const fs = require('fs');

// Define common loader constants
const sourceMap = config.env !== "production";

// function processNestedHtml(content, loaderContext, resourcePath = "") {
//   console.log(resourcePath, 'Resouurce aPath');
//   let fileDir = (resourcePath === "") ? path.dirname(loaderContext.resourcePath) : path.dirname(resourcePath)
//   console.log(fileDir, 'fileDir');
//   const INCLUDE_PATTERN = /\<include src=\"(\.\/)?(.+)\"\/?\>(?:\<\/include\>)?/gi;
  
//   function replaceHtml(match, pathRule, src) {
//     console.log(pathRule, 'Path rile', src, 'srcccc', match, 'match');
//     if(pathRule === "./"){
//       fileDir = loaderContext.context
//     }
//     console.log(fileDir, 'file dir 22');
//     const filePath = path.resolve(fileDir, src)
//     console.log(filePath, 'file pathh');
//     loaderContext.dependency(filePath)
//     const html = fs.readFileSync(filePath, 'utf8')
//     return processNestedHtml(html, loaderContext, filePath)
//   }

//   if (!INCLUDE_PATTERN.test(content)) {
//     return content
//   } else {
//     return content.replace(INCLUDE_PATTERN, replaceHtml);
//   }
// }

const processNestedHtml = (content, loaderContext) => {
  const INCLUDE_PATTERN = /\<include src=\"(.+)\"\/?\>(?:\<\/include\>)?/gi;
  if (!INCLUDE_PATTERN.test(content)) {
    return content;
  } else {
    return content.replace(INCLUDE_PATTERN, (m, src) => {
      // // console.log(fs.readFileSync(path.resolve(loaderContext.context, src), "utf8"), 'FSSSSSSSSSSSSSS');
      // console.log(loaderContext.context, 'context');
      // console.log(src, 'SRCCCCCCCCCCCCCCCCCC');
      // console.log('---------------------------------------------------------------------------------------------------------------------------');
      return processNestedHtml(fs.readFileSync(path.resolve(loaderContext.context, src), "utf8"), loaderContext);
    });
  }
}

function processHtmlLoader(content, loaderContext){
    let newContent = processNestedHtml(content, loaderContext)
    return newContent
}

// HTML loaders
const html = {
  test: /\.(html)$/,
  use: [
    {
      loader: "html-loader",
      options: {
        attributes: {
          list: [
            '...',
            {
              tag: 'a',
              attribute: 'href',
              type: 'src'
            }
          ]
        },
        preprocessor: processHtmlLoader
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
      loader: "babel-loader",
      options: {
        presets: ["@babel/preset-env"],
      },
    },
    "eslint-loader",
  ],
};

// Style loaders
const styleLoader = {
  loader: "style-loader",
};

const cssLoader = {
  loader: "css-loader",
  options: {
    sourceMap,
  },
};

const postcssLoader = {
  loader: "postcss-loader",
  options: {
    plugins: [require("autoprefixer")()],
    sourceMap,
  },
};

const css = {
  test: /\.css$/,
  use: [
    config.env === "production" ? MiniCssExtractPlugin.loader : styleLoader,
    cssLoader,
    postcssLoader,
  ],
};

const sass = {
  test: /\.s[c|a]ss$/,
  use: [
    config.env === "production" ? MiniCssExtractPlugin.loader : styleLoader,
    cssLoader,
    postcssLoader,
    {
      loader: "sass-loader",
      options: {
        sourceMap,
      },
    },
  ],
};

const less = {
  test: /\.less$/,
  use: [
    config.env === "production" ? MiniCssExtractPlugin.loader : styleLoader,
    cssLoader,
    postcssLoader,
    {
      loader: "less-loader",
      options: {
        sourceMap,
      },
    },
  ],
};

const imageCompress = {
  loader: "image-webpack-loader",
  options: {
    bypassOnDebug: true,
    gifsicle: {
      interlaced: false,
    },
    optipng: {
      optimizationLevel: 7,
    },
    pngquant: {
      quality: "65-90",
      speed: 4,
    },
    mozjpeg: {
      progressive: true,
    },
  },
};

const images = {
  test: /\.(gif|png|jpe?g|webp|svg|pdf)$/i,
  exclude: /assets\/fonts/,
  use: [
    {
      loader: "file-loader",
      options: {
        context: config.src,
        name: '[path][name].[hash].[ext]'
      },
    }
  ],
};

if (config.env === "production") {
  images.use.push(imageCompress);
}

// Font loaders
const fonts = {
  test: /\.(woff|woff2|eot|ttf|otf)$/,
  exclude: /assets\/images/,
  use: [
    {
      loader: "file-loader",
      query: {
        name: "[name].[hash].[ext]",
        outputPath: "fonts/",
      },
    },
  ],
};

// Video loaders
const videos = {
  test: /\.(mp4|webm)$/,
  use: [
    {
      loader: "file-loader",
      query: {
        name: "[name].[hash].[ext]",
        outputPath: "assets/videos/",
      },
    },
  ],
};

module.exports = [html, js, css, sass, less, images, fonts, videos];
