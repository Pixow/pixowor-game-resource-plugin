import typescript from "rollup-plugin-typescript2";
import json from "@rollup/plugin-json";
import angular from "rollup-plugin-angular";
import { minify as minifyHtml } from "html-minifier";
import nodeResolve from "rollup-plugin-node-resolve";
import copy from "rollup-plugin-copy";
import sass from "node-sass";
import CleanCSS from "clean-css";

const cssmin = new CleanCSS();
const htmlminOpts = {
  caseSensitive: true,
  collapseWhitespace: true,
  removeComments: true,
};

export default {
  input: "compiler/src/index.js",
  output: {
    file: "dist/index.js",
    format: "umd",
    name: "TestPlugin",
    globals: {
      "@angular/core": "angularCore",
      "@angular/common": "angularCommon",
    },
  },
  plugins: [
    json(),
    angular({
      replace: false,
      preprocessors: {
        template: (template) => minifyHtml(template, htmlminOpts),
        style: (scss) => {
          const css = sass.renderSync({ data: scss }).css;
          return cssmin.minify(css).styles;
        },
      },
    }),
    typescript(),
    nodeResolve({ jsnext: true, main: true }),
    copy({
      targets: [{ src: "manifest.json", dest: "dist" }],
    }),
  ],
  external: [
    "@angular/core",
    "@angular/common",
    "pixowor-core",
    "@ngneat/transloco",
    "game-capsule",
  ],
  onwarn: function (warning) {
    if (
      warning.code === "THIS_IS_UNDEFINED" ||
      warning.code === "UNUSED_EXTERNAL_IMPORT"
    ) {
      return;
    }

    console.warn(warning.code, warning.message);
  },
};
