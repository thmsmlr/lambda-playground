var gulp = require('gulp')
  , notify = require('gulp-notify')
  , watch = require('gulp-watch')
  , plumber = require('gulp-plumber')
  , mocha = require('gulp-mocha')
  , util = require('gulp-util');


gulp.task('test', function() {
  return gulp.src('./test/**/*.js', { read: false })
             .pipe(mocha({ reporter: 'dot' }))
});

gulp.task('watch', function() {
  gulp.src(['js/**/*.js', 'test/**/*.js'], { read: false })
      .pipe(watch(function(events, cb) {
        gulp.run('test', function() {
          cb();
        });
      }));
});
