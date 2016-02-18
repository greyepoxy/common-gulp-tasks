var path = require('path');
var htmlReplace = require('gulp-html-replace');
var browserSync = require('browser-sync');
var taskUtils = require('./taskUtils');

var gutil = require('gulp-util');

/**
 * This function will generate two 'browserTests' tasks based on the following params.
 * First task is a browserTests task that will execute the browserTests.
 * Second is 'bundle:watch' which will auto 'bundle' when the sources change.
 * @param {object} gulp instance from require('gulp')
 * @param {object?} config options of the form
 *   {
 *     taskName?: "name", //default value is 'browserTests'
 *     outDir?:"./outDir", //default value is './dist'
 *     specRunnerDir?:'./dir', // relative from given outDir, defaults to '_specRunner'
 *     testFile?:'./testFile.js', // relative from given outDir, defaults to '_bundles/tests.js'
 *   }
 */
exports.browserTests = function(gulp, config) {
	config = config || {};
	var taskName = taskUtils.getValueOrDefault('browserTests', config.taskName);
	var outDir = taskUtils.getValueOrDefault('./dist', config.outDir);
	var specRunnerDir = taskUtils.getValueOrDefault('_specRunner', config.specRunnerDir);
	var bundledtestFile = taskUtils.getValueOrDefault('_bundles/tests.js', config.testFile);
	var pathToSpecRunnerDir =  path.join(outDir, specRunnerDir);
	var pathToBundledTestFile =  path.join(outDir, bundledtestFile);
	
	var thisModuleDir = path.join(path.dirname(module.filename), '../');
	var specRunnerFileName = 'SpecRunner.html'
	var specRunnerFileSrc = path.join(thisModuleDir, 'supportFiles', specRunnerFileName);
	
	var prepSpecRunnerTask = taskName + ':prepSpecRunner';
	gulp.task(prepSpecRunnerTask, function () {
		return gulp.src(path.join('./', specRunnerFileSrc))
			.pipe(htmlReplace({ jstests: path.basename(pathToBundledTestFile) }))
			.pipe(gulp.dest(pathToSpecRunnerDir));
	});
	
	var prepJasmineLib = taskName + ':prepJasmineLib';
	gulp.task(prepJasmineLib, function () {
		var tempPath = path.join(thisModuleDir, 'node_modules/jasmine-core/');
		return gulp.src([path.join(tempPath, 'images/jasmine_favicon.png'),
						path.join(tempPath, 'lib/jasmine-core/boot.js'),
						path.join(tempPath, 'lib/jasmine-core/jasmine*')])
			.pipe(gulp.dest(path.join(pathToSpecRunnerDir, 'lib/jasmine')));
	});
	
	var jasmineTestServer = browserSync.create('JasmineTestServer');
	
	gulp.task(taskName + ':start', [prepJasmineLib, prepSpecRunnerTask], function () {
		jasmineTestServer.init({
			server: {
				baseDir: [path.dirname(pathToBundledTestFile), pathToSpecRunnerDir],
				index: specRunnerFileName
			},
			ui: {
				port: taskUtils.getNextBrowserSyncPort()
			},
			port: taskUtils.getNextBrowserSyncPort()
		});

		gulp.watch(pathToBundledTestFile).on('change', jasmineTestServer.reload);
	});
};