var tsc = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var merge = require('merge2');
var path = require('path');
var taskUtils = require('./taskUtils');

/**
 * This function will generate two 'build' tasks based on the following params.
 * First task is just 'build'.
 * Second is 'build:watch' which will auto 'build' when the sources change.
 * @param {object} gulp instance from require('gulp')
 * @param {object} config options of the form
 * {
 *   taskName?: "name", //default value is 'build'
 *   srcBaseDir?: "./dir", //default value is 'src'
 *   srcs?: [index.ts], //relative from srcBaseDir, default value is ['/<asterisk><asterisk>/<asterisk>.ts']
 *   outDir?: "./outDir", //default value is './dist'
 *   tsconfigPath?: "./tsconfig.json", //default value is 'tsconfig.json'
 * }
 */
exports.build = function(gulp, config) {
	config = config || {};
	var tsBuildTaskName = taskUtils.getValueOrDefault('build', config.taskName);
	var tsWatchBuildTaskname = tsBuildTaskName + ':watch';
	var compileOutDir = taskUtils.getValueOrDefault('./dist', config.outDir);
	var tsConfigPath = taskUtils.getValueOrDefault('tsconfig.json', config.tsconfigPath);
	var tsSourceBase = taskUtils.getValueOrDefault('src', config.srcBaseDir);
	var tsSource = taskUtils.getValueOrDefault(['/**/*.ts'], config.srcs)
		.map(function(value){ return path.join(tsSourceBase, value); });
	var tsProject = tsc.createProject(tsConfigPath, { declaration: true, outDir: compileOutDir });

	gulp.task(tsBuildTaskName, function() {
		var tsResult = gulp.src(tsSource, { base: tsSourceBase })
			.pipe(sourcemaps.init())
			.pipe(tsc(tsProject));

		return merge([
			tsResult.js
				.pipe(sourcemaps.write('./'))
				.pipe(gulp.dest(compileOutDir)),
			tsResult.dts.pipe(gulp.dest(compileOutDir))
		]);
	});

	gulp.task(tsWatchBuildTaskname, [tsBuildTaskName], function() {
		gulp.watch(tsSource, [tsBuildTaskName]);
	});

}