import gulp from 'gulp';
import babel from 'gulp-babel';
import shell from 'gulp-shell';
import { argv } from 'yargs';

gulp.task('build', () => {
  // transpile sources into ./dist
  gulp.src('./src/plugins/*.js')
    .pipe(babel({
      presets: ['es2015'],
      // plugins: ['external-helpers', {}],
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('test', shell.task([
  `./node_modules/.bin/mocha test/${argv.only ? `/${argv.only}` : ''} --compilers js:babel-register --recursive --color`,
]));
