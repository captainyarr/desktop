var gulp = require('gulp');
var NwBuilder = require('nw-builder');
var os = require('os');
var del = require('del');
var detectCurrentPlatform = require('nw-builder/lib/detectCurrentPlatform.js');
var zip = require('gulp-zip');
var unzip = require('gulp-unzip');
var gzip = require('gulp-gzip');
var tar = require('gulp-tar');
var download = require('gulp-download');
var package = require('./package.json');
var merge2 = require('merge2');

//Commandline 
var argv = require('yargs')
    .alias('p', 'platforms')
    .options({
        'nwversion': {
            alias: 'nwv',
            describe: 'Set nw.js version'
        },
        'nwdownloadurl': {
            alias: 'nwurl',
            describe: 'Provide an alt download URL'
        }
    })
    .help()
    .argv;

//Set Default nw.js version
var nwVersion = '0.31.5';
var buildDownloadUrl = 'https://dl.nwjs.io/';

nwVersion = argv.nwv ? argv.nwv : nwVersion;
buildDownloadUrl = argv.nwurl ? argv.nwurl : buildDownloadUrl;

var buildplatforms = argv.p ? argv.p.split(',') : [detectCurrentPlatform()];

//Example URL FFMPEG Location:
//https://github.com/iteufel/nwjs-ffmpeg-prebuilt/releases/download/0.31.4/0.31.4-osx-x64.zip
var ffmpegDownloadurl = 'https://github.com/iteufel/nwjs-ffmpeg-prebuilt/releases/download/' + nwVersion;

//Platform specific overrides if needed

if (buildplatforms.indexOf("linuxarm") >= 0) {
    nwVersion = '0.31.2';
}

if (buildplatforms.indexOf("linuxarm") >= 0) {
    buildDownloadUrl = 'https://github.com/LeonardLaszlo/nw.js-armv7-binaries/releases/download/v0.27.6/nwjs-sdk-v0.27.6-linux-arm-chrome-branding.tar.gz';
}

var nw = new NwBuilder({
    files: ['./src/**', './node_modules/**', './package.json', './install', 'LICENSE.txt', 'CHANGELOG.md', 'README.md'],
    version: nwVersion,
    zip: false,
    downloadUrl: buildDownloadUrl,
    platforms: buildplatforms,
}).on('log', console.log);

gulp.task('run', function() {
    nw.options.files = './**';
    return nw.run().catch(function(error) {
        console.error(error);
    });
});

gulp.task('build', ['clean'], function() {
    return nw.build().catch(function(error) {
        console.error(error);
    });
});

gulp.task('clean', function() {
    return del('build/');
});

gulp.task('ffmpegbuild', function() {
    var downloadArray = merge2();
    var item = 0;
    buildplatforms.forEach(item => {
        switch (item) {
            case "linux64":
                //Copy updated FFMPEG into the cache directory before building
                downloadArray.add(download(ffmpegDownloadurl + '/' + nwVersion + '-linux-x64.zip')
                    .pipe(unzip())
                    .pipe(gulp.dest("./pre/" + item))
                    .pipe(gulp.dest("./build/Popcorn-Time-CE/" + item + "/lib")));
                break;
            case "linux32":
                //Copy updated FFMPEG into the cache directory before building
                downloadArray.add(download(ffmpegDownloadurl + '/' + nwVersion + '-linux-ia32.zip')
                    .pipe(unzip())
                    .pipe(gulp.dest("./pre/" + item))
                    .pipe(gulp.dest("./build/Popcorn-Time-CE/" + item + "/lib")));
                break;
            case "win32":
                //Copy updated FFMPEG into the cache directory before building
                downloadArray.add(download(ffmpegDownloadurl + '/' + nwVersion + '-win-ia32.zip')
                    .pipe(unzip())
                    .pipe(gulp.dest("./pre/" + item))
                    .pipe(gulp.dest("./build/Popcorn-Time-CE/" + item)));
                break;
            case "win64":
                //Copy updated FFMPEG into the cache directory before building
                downloadArray.add(download(ffmpegDownloadurl + '/' + nwVersion + '-win-x64.zip')
                    .pipe(unzip())
                    .pipe(gulp.dest("./pre/" + item))
                    .pipe(gulp.dest("./build/Popcorn-Time-CE/" + item)));
                break;
            case "osx64":
                var fs = require("fs");
                var osxBuilddir = "./build/Popcorn-Time-CE/" + item + '/' + 'Popcorn-Time-CE.app/Contents/Versions/';
                var files = fs.readdirSync(osxBuilddir);
                if (files.length > 0) {
                    //osxCachedir = './cache/' + nwVersion + '-sdk/osx64/nwjs.app/Contents/Versions/' + files[0];
                    osxBuilddir = "./build/Popcorn-Time-CE/" + item + '/' + 'Popcorn-Time-CE.app/Contents/Versions/' + files[0];
                }
                //Copy updated FFMPEG into the cache directory before building
                //https://github.com/iteufel/nwjs-ffmpeg-prebuilt/releases/download/0.31.4/0.31.4-osx-x64.zip
                downloadArray.add(download(ffmpegDownloadurl + '/' + nwVersion + '-osx-x64.zip')
                    .pipe(unzip())
                    .pipe(gulp.dest("./pre/" + item))
                    .pipe(gulp.dest(osxBuilddir)));
                break;
        }
    });
    return downloadArray;
});

gulp.task('ffmpegcache', function() {
    var cacheDir = './cache/' + nwVersion + '-sdk';
    var downloadArray = merge2();
    var item = 0;

    buildplatforms.forEach(item => {
        switch (item) {
            case "linux64":
                //Copy updated FFMPEG into the cache directory before building
                downloadArray.add(download(ffmpegDownloadurl + '/' + nwVersion + '-linux-x64.zip')
                    .pipe(unzip())
                    .pipe(gulp.dest(cacheDir + '/' + item + "/lib")));
                break;
            case "linux32":
                //Copy updated FFMPEG into the cache directory before building
                downloadArray.add(download(ffmpegDownloadurl + '/' + nwVersion + '-linux-ia32.zip')
                    .pipe(unzip())
                    .pipe(gulp.dest(cacheDir + '/' + item + "/lib")));
                break;
            case "win32":
                //Copy updated FFMPEG into the cache directory before building
                downloadArray.add(download(ffmpegDownloadurl + '/' + nwVersion + '-win-ia32.zip')
                    .pipe(unzip())
                    .pipe(gulp.dest(cacheDir + '/' + item)));
                break;
            case "win64":
                //Copy updated FFMPEG into the cache directory before building
                downloadArray.add(download(ffmpegDownloadurl + '/' + nwVersion + '-win-x64.zip')
                    .pipe(unzip())
                    .pipe(gulp.dest(cacheDir + '/' + item)));
                break;
            case "osx64":
                var fs = require("fs");
                var osxCachedir = './cache/' + nwVersion + '-sdk/osx64/nwjs.app/Contents/Versions/';
                var files = fs.readdirSync(osxCachedir);
                if (files.length > 0) {
                    osxCachedir = './cache/' + nwVersion + '-sdk/osx64/nwjs.app/Contents/Versions/' + files[0];
                }
                downloadArray.add(download(ffmpegDownloadurl + '/' + nwVersion + '-osx-x64.zip')
                    .pipe(unzip())
                    .pipe(gulp.dest(osxCachedir)));
                break;
        }
    });

    return downloadArray;
});

gulp.task('zip', ['ffmpegbuild'], function() {
    var zipArray = merge2();

    buildplatforms.forEach(item => {
        switch (item) {
            case "linux64":
                zipArray.add(gulp.src('./build/Popcorn-Time-CE/linux64/**')
                    .pipe(tar('popcorn-time-ce_linux64_' + package.version + '.tar'))
                    .pipe(gzip())
                    .pipe(gulp.dest('./dist')));
                break;
            case "linux32":
                zipArray.add(gulp.src('./build/Popcorn-Time-CE/linux32/**')
                    .pipe(tar('popcorn-time-ce_linux32_' + package.version + '.tar'))
                    .pipe(gzip())
                    .pipe(gulp.dest('./dist')));
                break;
            case "win32":
                zipArray.add(gulp.src('./build/Popcorn-Time-CE/win32/**')
                    .pipe(zip('popcorn-time-ce_win32_' + package.version + '.zip'))
                    .pipe(gulp.dest('./dist')));
                break;
            case "win64":
                zipArray.add(gulp.src('./build/Popcorn-Time-CE/win64/**')
                    .pipe(zip('popcorn-time-ce_win64_' + package.version + '.zip'))
                    .pipe(gulp.dest('./dist')));
                break;
            case "osx64":
                zipArray.add(gulp.src('./build/Popcorn-Time-CE/osx64/**')
                    .pipe(zip('popcorn-time-ce_osx64_' + package.version + '.zip'))
                    //.pipe(gzip())
                    .pipe(gulp.dest('./dist')));
                break;
        }
    });

    return zipArray;
});

gulp.task('default', function() {
    // place code for your default task here
    console.log(nwVersion);
});