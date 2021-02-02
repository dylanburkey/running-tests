const gulp = require('gulp');

//Styles, scripts and optimisation there of
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const terser = require('gulp-terser');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const postcss = require('gulp-postcss');
const postcssCustomProperties = require('postcss-custom-properties');
const postcssclean = require('postcss-clean');

//Images
const imagemin = require('gulp-imagemin');
const responsive = require('gulp-responsive');

//Build tools
const data = require('gulp-data');
const nunjucks = require('nunjucks');
const markdown = require('nunjucks-markdown');
const marked = require('marked');
const gulpnunjucks = require('gulp-nunjucks');
const banner = require('gulp-banner');
const htmlmin = require('gulp-htmlmin');
const dateFilter = require('nunjucks-date-filter');

//System and Utilities
const extReplace = require("gulp-ext-replace");
const del = require('del');
const path = require('path');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const bump = require('gulp-bump');
const merge = require('merge-stream');
const mergeJson = require('gulp-merge-json');
const shell = require('gulp-shell');
const exec = require('child_process').exec;
const browserSync = require('browser-sync').create();
const log = require('fancy-log');
const colors = require('ansi-colors');

//Ger package vars
const pkg = require('./package.json');

// Variables
// -----------------
const dir = {
 dist: './docs/',
 src: './src/',
 styles: './assets/styles/',
 scripts: './assets/scripts/'
};

// Banner to be injected into production build CSS file
const comment = '/*\n' +
    ' * Automatically Generated - DO NOT EDIT \n' +
    ' * Generated on <%= new Date().toISOString().substr(0, 19) %> \n' +
    ' * <%= pkg.name %> <%= pkg.version %>\n' +
    ' * <%= pkg.description %>\n' +
    ' * <%= pkg.homepage %>\n' +
    ' *\n' +
    ' * Copyright <%= new Date().getFullYear() %>, <%= pkg.author %>\n' +
    ' * Released under the <%= pkg.license %> license.\n' +
    '*/\n\n';


// Development Tasks
// -----------------

//Nunjucks

// Markdown vars
var env = new nunjucks.Environment(new nunjucks.FileSystemLoader(dir.src));
markdown.register(env, marked);

//Add global context {{ getContext() | dump| safe }}
env.addGlobal('getContext', function() { 
  return this.ctx;
})

// Get version from package.json
env.addGlobal('pkgVersion', function (str) {
  var cbVersion = pkg.version;
    return cbVersion;
});

//Add date - {{ creation_date | date("YYYY") }}
env.addFilter('date', dateFilter);

//Nunjucks
gulp.task('nunjucks', () => {
  return gulp
    .src(path.join(dir.src, '/*.html'))
    //Get some data
    .pipe(data(function(file) {
      //Set up a global variable site - e.g. site.name
      //Redfined in layout.njk {% set global = data.site[0] %} - allows for global.name, get the first item in the object e.g. [0]
      return { 'data': require('./data/data.json') }
    }))
    .pipe(gulpnunjucks.compile("", {env: env}))
    .pipe(gulp.dest(dir.dist))
});

//  Sass: compile sass to css
//===========================================
gulp.task('sass', () => {
  return gulp
    .src(path.join(dir.styles, '*.scss'))
    .pipe(plumber(function(error) {
      // Output an error message
      log(colors.bold.red('Error (' + error.plugin + '): ' + error.message));
      // emit the end event, to properly end the task
      this.emit('end');
    })
    )
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(path.join(dir.dist, 'css'))) // Outputs it in the css folder
    .pipe(browserSync.stream()); // reload
});

// Build the production CSS
gulp.task('sass-build', () => {
  return gulp
    .src(path.join(dir.styles, '*.scss'))
    .pipe(plumber(function(error) {
      // Output an error message
      log(colors.bold.red('Error (' + error.plugin + '): ' + error.message));
      // emit the end event, to properly end the task
      this.emit('end');
    })
    )
    .pipe(sass())
    //Polyfill for object fit
    .pipe(postcss([require('postcss-object-fit-images')]))
    //Polyfill for css vars
    .pipe(postcss([postcssCustomProperties()]))
    //Minify
    .pipe(postcss([postcssclean()]))
    .pipe(gulp.dest(path.join(dir.dist, 'css')))
});

// Watchers
gulp.task('watch', () => {
  gulp.watch(path.join(dir.styles, '**/*.scss'), gulp.series('sass'));
  gulp.watch(path.join(dir.scripts, '**/*.js'), gulp.series('scripts'));
  gulp.watch(path.join(dir.src, '**/*.+(html|njk|md)'), gulp.series('nunjucks'));
  gulp.watch(path.join(dir.dist, '*.+(html|njk|md)')).on('change', browserSync.reload);
});


// Scripts
gulp.task('scripts', () => {  
  return gulp
    .src([
      'assets/vendor/photoswipe.min.js', //Galery plugin - https://photoswipe.com/documentation/getting-started.html
      'assets/vendor/photoswipe-ui-default.min.js',
      'assets/vendor/validate.js',  //Validation plugin - https://github.com/cferdinandi/validate
		  'assets/vendor/validate.polyfills.min.js', //Validation plugin - polyfill
      'assets/scripts/scripts.js'
    ])
    .pipe(concat('app.js'))
    .pipe(gulp.dest(path.join(dir.dist, 'scripts')))
});

// Scripts
gulp.task('babel', () => {  
  return gulp.src([
    'assets/scripts/scripts.js'
  ])
  .pipe(babel({
    presets: ['@babel/env'],
    plugins: ['@babel/plugin-transform-template-literals']
   }))
  .pipe(gulp.dest('assets/scripts/babel/'))
});


// Build the production Scripts
gulp.task('scripts-build', () => {  
  return gulp
  .src([
    'assets/vendor/photoswipe.min.js', //Galery plugin - https://photoswipe.com/documentation/getting-started.html
    'assets/vendor/photoswipe-ui-default.min.js',
    'assets/vendor/validate.js',  //Validation plugin - https://github.com/cferdinandi/validate
		'assets/vendor/validate.polyfills.min.js', //Validation plugin - polyfill
    'assets/scripts/babel/scripts.js'
  ])
  .pipe(concat('app.js'))
  .pipe(terser()) //accepts ES6 template literals 
  .pipe(gulp.dest(path.join(dir.dist, 'scripts')))
});

// Cleaning
gulp.task('clean', () => del([ dir.dist ]) );

// Images
gulp.task('images', () => {
  return gulp
    .src('assets/images/**/*.+(png|jpg|jpeg|gif|svg|json|ico|json)')
    .pipe(gulp.dest(path.join(dir.dist, 'images')))
});


// Favicon
gulp.task('favicon', () => {
  return gulp
    .src('assets/images/fav/favicon.png')
    .pipe(
      responsive(
        {
          // Resize all JPG images to three different sizes: 180, and 512 pixels
          '**/*.png': [
            {
              width: 180,
              rename: { suffix: '-180x180' }
            },
            {
              width: 192,
              rename: { suffix: '-192x192' }
            },
            {
              width: 512,
              rename: { suffix: '-512x512' }
            }
          ]
        },
        {
          // Global configuration for all images
          // Use progressive (interlace) scan for JPEG and PNG output
          progressive: true,
          // Strip all metadata
          withMetadata: false
        }
      )
    )
    .pipe(gulp.dest('assets/images/fav'))
});

gulp.task('responsive', () => {
  return gulp
    // assets/images/**/*.jpg
    // **/*.jpg
    .src('assets/images/blocks/**/*.jpg')
    .pipe(
      responsive(
        {
          // Resize all JPG images to three different sizes: 200, 500, and 630 pixels
          '**/*.jpg': [
            {
              width: 640,
              rename: { suffix: '-640w' }
            },
            {
              width: 1920,
              rename: { suffix: '-1920w' }
            },
            {
              // Compress, strip metadata, and rename original image
              rename: { suffix: '-original' }
            }
          ]
        },
        {
          // Global configuration for all images
          // The output quality for JPEG, WebP and TIFF output formats
          quality: 70,
          // Use progressive (interlace) scan for JPEG and PNG output
          progressive: true,
          // Strip all metadata
          withMetadata: false
        }
      )
    )
    .pipe(gulp.dest(path.join(dir.dist, 'images/blocks/')))
});


// Copying fonts
gulp.task('fonts', () => {  
  return gulp.src('assets/fonts/**/*')
    .pipe(gulp.dest(path.join(dir.dist, 'fonts')))
});

// Banner
gulp.task('banner', () => {
  return gulp
    .src(path.join(dir.dist, 'css/main.css'))
    .pipe(banner(comment, {
        pkg: pkg
    }))
    .pipe(gulp.dest(path.join(dir.dist, 'css')));
});

// Minify HTML
gulp.task('htmlminify', () => {
  return gulp
    .src(path.join(dir.dist, '*.html'))
    .pipe(htmlmin({ 
      collapseWhitespace: true, 
      preserveLineBreaks: true,
      removeComments: true
    }))
    .pipe(gulp.dest(dir.dist));
});

// Versioning
gulp.task('bump', () => {
  return gulp
    .src('./package.json')
    .pipe(bump({key: 'version', type:'minor'}))
    .pipe(gulp.dest('./'));
});

// Service worker with versioning
gulp.task('serviceworker', () => {
  return gulp
      .src(path.join(dir.src, 'sw.njk.js'))
      .pipe(gulpnunjucks.compile("", {env: env}))
      .pipe(rename('sw.js'))
      .pipe(gulp.dest(dir.dist));
});


// Moving files
gulp.task('move-files', () => {  
  let cname = gulp.src(['assets/CNAME'])
    .pipe(gulp.dest(path.join(dir.dist)));
  let readme = gulp.src(['README.md'])
    .pipe(gulp.dest(path.join(dir.src, 'markdown')));
  let scripts = gulp.src(['assets/scripts/gallery.js', 'assets/vendor/js.cookie.js'])
    .pipe(gulp.dest(path.join(dir.dist, 'scripts')));
    return merge(cname, readme, scripts);
});

// Static Server + watching scss/html files
gulp.task('serve', () => {

  browserSync.init({
    server: dir.dist
  });

});

//Get data from google sheets

// JSON
gulp.task('parsedata', function (cb) {
  //Clean the folder
  del('./json/**')
  //Run the command
  exec('ruby scripts/update_data.rb', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
})

// JSON combine
gulp.task('combine', () => {
  return gulp
    .src('./json/*.json')
    .pipe(mergeJson({
      fileName: 'data.json',
      edit: (json, file) => {
        // Extract the filename and strip the extension
        var filename = path.basename(file.path),
            primaryKey = filename.replace(path.extname(filename), '');

        // Set the filename as the primary key for our JSON data
        var data = {};
        data[primaryKey] = json;

        return data;
     }
    }))
    .pipe(gulp.dest('./data/'))
})

//  Testing
//===========================================
gulp.task('tests', shell.task('$(npm bin)/cypress run'))


//Parallel tasks
gulp.task('compile', gulp.parallel(
  'sass',
  'scripts',
  'serve', 
  'watch'
))

gulp.task('data', gulp.series(
  'parsedata',
  'combine'
))

gulp.task('imageassets', gulp.series(
  'favicon',
  'images'
))

gulp.task('build', gulp.parallel(
  'sass-build', 
  'scripts-build',
  'fonts', 
  'imageassets', 
  'responsive'
))


gulp.task('tidy', gulp.parallel(
  'bump', 
  'serviceworker',
  'banner',
  'move-files',
  'htmlminify'
))

const dev = gulp.series(
  'nunjucks',
  'compile'
);

const build = gulp.series(
  'clean',
  'babel', 
  'data', 
  'nunjucks',
  'build', 
  'tidy'
);

//gulp dev
exports.dev = dev;

//gulp build
exports.build = build;