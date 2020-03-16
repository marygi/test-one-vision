const gulp         = require('gulp');
const $            = require('gulp-load-plugins')();
const browserSync  = require('browser-sync');
const concat       = require('gulp-concat');
const uglify       = require('gulp-uglify');
const rename       = require('gulp-rename');
const plumber      = require('gulp-plumber');
const postcss      = require('gulp-postcss');
const assets       = require('postcss-assets');
const babel        = require('gulp-babel');
const autoprefixer = require('autoprefixer');
const fs           = require('fs');
const cache        = require('gulp-cache');
const del          = require('del');

const config = {
	appDir:      'app',
	distDir:     'dist',
	appJsDir:    'app/js',
	appSassDir:  'app/sass',
	appImgDir:   'app/images',
	appFontDir:  'app/fonts',
	distJsDir:   'dist/js',
	distCssDir:  'dist/css',
	distImgDir:  'dist/images',
	distFontDir: 'dist/fonts'
};

gulp.task('scripts', () => {
	return gulp.src(`${config.appJsDir}/main.js`)
		.pipe(plumber())
		.pipe(concat('main.js'))
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(uglify())
		.pipe(rename({suffix: '.min'}))
		.pipe(gulp.dest(config.distJsDir));
});

gulp.task('sass', () => {
	return gulp.src(`${config.appSassDir}/*.+(sass|scss)`)
		.pipe($.sass({
			outputStyle: 'compressed'
		}).on('error', $.sass.logError))
		.pipe(postcss(
			[
				assets({
					relative: true,
					loadPaths: [config.appImgDir,config.appFontDir],
					cachebuster: function (filePath) {
						return fs.statSync(filePath).size.toString(36);
					}
				}),
				autoprefixer({
					remove: false,
					browsers: ['last 2 versions', 'ie >= 9']
				})
			]
		))
		.pipe(gulp.dest(config.distCssDir));
});

gulp.task('images', function(){
	return gulp.src(`${config.appImgDir}/**/*`)
		.pipe(gulp.dest(config.distImgDir));
});

gulp.task('fonts', function() {
	return gulp.src(`${config.appFontDir}/**/*`)
		.pipe(gulp.dest(config.distFontDir));
});

gulp.task('svgsprite', () => {

	return gulp.src(`${config.appImgDir}/svg/*.svg`)
		.pipe($.svgmin({
			plugins: [{
				removeDoctype: true
			},
			{
				removeComments: true
			}]

		}))
		.pipe($.svgstore({
			inlineSvg: true
		}))
		.pipe($.rename('sprite.svg'))
		.pipe($.cheerio({
			run: function($) {
				$('svg').attr({
					'width' : '0',
					'height' : '0',
					'display' : 'none',
					'aria-hidden' : 'true'
				});
			},
			parserOptions: {
				xmlMode: true
			}
		}))
		.pipe(gulp.dest(config.distImgDir));
});

gulp.task('browser-sync', () =>
	browserSync({
		server: {
			baseDir: "./"
		},
		notify: false
	})
);

gulp.task('clear', () => cache.clearAll());

gulp.task('watch', () => {
	gulp.watch(`${config.appImgDir}/**`, gulp.series('images'));
	gulp.watch(`${config.appFontDir}/**`, gulp.series('fonts'));
	gulp.watch(`${config.appSassDir}/**`, gulp.series('sass'));
	gulp.watch(`${config.appJsDir}/**`, gulp.series('scripts'));
});

gulp.task('default', gulp.parallel('sass','scripts','images','fonts','watch'));
