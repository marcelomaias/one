// generated on 2019-11-07 using generator-webapp 4.0.0-6
const { src, dest, watch, series, parallel, lastRun } = require("gulp");
const gulpLoadPlugins = require("gulp-load-plugins");
const browserSync = require("browser-sync");
const del = require("del");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const { argv } = require("yargs");
const browserify = require("browserify");
const babelify = require("babelify");
const buffer = require("vinyl-buffer");
const source = require("vinyl-source-stream");

const $ = gulpLoadPlugins();
const server = browserSync.create();

const port = argv.port || 9000;

const isProd = process.env.NODE_ENV === "production";
const isDev = !isProd;

function styles() {
  return src("./src/scss/*.scss")
    .pipe($.plumber())
    .pipe($.if(!isProd, $.sourcemaps.init()))
    .pipe(
      $.sass
        .sync({
          outputStyle: "compressed",
          precision: 10,
          includePaths: ["."]
        })
        .on("error", $.sass.logError)
    )
    .pipe($.postcss([autoprefixer()]))
    .pipe($.if(!isProd, $.sourcemaps.write()))
    .pipe(dest("css"))
    .pipe(server.reload({ stream: true }));
}

function scripts() {
  const b = browserify({
    entries: "./src/js/main.js",
    transform: babelify,
    debug: true
  });
  return b
    .bundle()
    .pipe(source("main.js"))
    .pipe($.plumber())
    .pipe(buffer())
    .pipe($.if(!isProd, $.sourcemaps.init({ loadMaps: true })))
    .pipe($.if(!isProd, $.sourcemaps.write(".")))
    .pipe(dest("js"));
  // .pipe(server.reload({ stream: true }));
}

const lintBase = files => {
  return src(files)
    .pipe($.eslint({ fix: true }))
    .pipe(server.reload({ stream: true, once: true }))
    .pipe($.eslint.format())
    .pipe($.if(!server.active, $.eslint.failAfterError()));
};
function lint() {
  return lintBase("./src/js/**/*.js").pipe(dest("js"));
}

function images() {
  return src("./src/images/**/*", { since: lastRun(images) })
    .pipe($.imagemin())
    .pipe(dest("images"));
}

function fonts() {
  return src("./src/fonts/**/*.{eot,svg,ttf,woff,woff2}").pipe(
    $.if(!isProd, dest("fonts"), dest("fonts"))
  );
}

function clean() {
  return del(["css", "js", "images", "fonts"]);
}

const build = series(
  clean,
  parallel(lint, parallel(styles, scripts), images, fonts)
);

function watchTask() {
  watch(["./src/images/**/*", "./src/fonts/**/*"]).on("change", server.reload);

  watch("./src/scss/**/*.scss", styles);
  watch("./src/js/**/*.js", scripts);
  watch("./src/fonts/**/*", fonts);
}

let serve;
if (isDev) {
  serve = series(clean, parallel(styles, scripts, fonts), watchTask);
} else if (isProd) {
  serve = build;
}

exports.serve = serve;
exports.build = build;
exports.default = build;
