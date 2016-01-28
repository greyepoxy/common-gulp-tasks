var forEach = require('gulp-foreach');
var browserify = require('browserify');
var watchify = require('watchify');
var gutil = require('gulp-util');
var path = require('path');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var taskUtils = require('./taskUtils');

/**
 * This function will generate three 'bundle' tasks based on the following params.
 * First task is just 'bundle'.
 * Second is 'bundle:publish' which is used to produce minified versions.
 * Third is 'bundle:watch' which will auto 'bundle' when the sources change.
 * @param {object} gulp instance from require('gulp')
 * @param {object} config options of the form
 * {
 *   taskName?: "name", //default value is bundle
 *   browserifyTransforms?: [{ transform:babelify, configParams:{ presets: ["es2015"] } }], //default value is []
 *   srcBaseDir?: "./dir", //default value is './dist'
 *   srcs?: [index.js], //relative from srcBaseDir, default value is ['index.js']
 *   outDir?: "./outDir", //default value is './dist/bundles'
 * }
 */
exports.bundle = function(gulp, config) {
	config = config || {};
	var bundleTaskName = taskUtils.getValueOrDefault('bundle', config.taskName);
	var bundleUglifyTaskName = bundleTaskName + ':publish';
	var bundleWatchTaskName = bundleTaskName + ':watch';
	var sourcesBaseDir = taskUtils.getValueOrDefault('./dist', config.srcBaseDir);
	var sources = taskUtils.getValueOrDefault(['index.js'], config.srcs)
		.map(function(value){ return path.join(sourcesBaseDir, value); });
	var outDir = taskUtils.getValueOrDefault('./dist/bundles', config.outDir);
	var browserifyTransforms = taskUtils.getValueOrDefault([], config.browserifyTransforms);
	
	function getBundler(file) {
		var bundler = browserify(file.path, {debug: true});
		
		browserifyTransforms.forEach(function(value){
			bundler.transform(value.transform, value.configParams);
		});
		
		return bundler;
	};

	function bundle(file, bundler, outDirectory, shouldUglify) {
		var fileName = path.basename(file.path);
		
		return bundler
			.bundle()
			.on('error', function(err) {
				gutil.log("error:", err.message);
				this.emit('end');
			})
			.pipe(source(fileName))
			.pipe(buffer())
			.pipe(sourcemaps.init({ loadMaps: true }))
			.pipe(shouldUglify ? uglify() : gutil.noop())
				.on('error', gutil.log)
			.pipe(shouldUglify ? rename({ suffix: '.min' }) : gutil.noop())
			.pipe(sourcemaps.write('./'))
			.pipe(gulp.dest(outDirectory));
	};

	function bundleTask(sources, sourcesBaseDir, outDir, isPublishVer){
		return gulp.src(sources, { base: sourcesBaseDir })
			.pipe(forEach(function (stream, file) {
				var bundler = getBundler(file);
				
				bundle(file, bundler, outDir, isPublishVer);
			}));
	}

	gulp.task(bundleTaskName, function () {
		return bundleTask(sources, sourcesBaseDir, outDir, false /* shouldUglify */)
	});

	gulp.task(bundleUglifyTaskName, function () {
		return bundleTask(sources, sourcesBaseDir, outDir, true /* shouldUglify */)
	});

	gulp.task(bundleWatchTaskName, function () {
		return gulp.src(sources, { base: sourcesBaseDir })
			.pipe(forEach(function (stream, file) {
				var bundler = watchify(getBundler(file));

				function rebundle() {
					gutil.log('Updated', file.path);

					return bundle(file, bundler, outDir, false /* outputMinJs */);
				}

				bundler.on("update", rebundle);
				bundler.on("log", gutil.log);

				return rebundle();
			}));
	});
}
