!function (async, child_process, date, fs, linq, number, os, path) {
    'use strict';

    var RECORDED_TV_PATH = '\\\\SERVER\\Recorded TV (Phone)',
        SYNC_PATH = path.resolve(process.env.PUBLIC, 'Videos\\Recorded TV'),
        BLACKLISTS = [/^忍者亂太郎/, /^櫻桃小丸子/, /_TEMP\./],
        SIZE_LIMIT = 40 * 1073741824,
        WHITELIST_EXTNAME = '.m4v';

    async.auto({
        syncPath: function (callback) {
            fs.mkdir(SYNC_PATH, function (err) {
                callback(err && err.code === 'EEXIST' ? null : err);
            });
        },
        sourceFiles: function (callback) {
            async.retry(function (callback) {
                fs.readdir(RECORDED_TV_PATH, function (err, files) {
                    if (err) {
                        return setTimeout(function () {
                            callback(err);
                        }, 5000);
                    }

                    var sizeLeft = SIZE_LIMIT;

                    linq(files)
                        .async
                        .where(function (s, _, callback) {
                            callback(null, path.extname(s) === WHITELIST_EXTNAME && linq(BLACKLISTS).all(function (pattern) {
                                return !pattern.test(s);
                            }).run());
                        })
                        .select(function (filename, _, callback) {
                            fs.stat(path.resolve(RECORDED_TV_PATH, filename), function (err, stat) {
                                callback(err, err ? null : {
                                    filename: filename,
                                    recorded: parseRecordedTime(filename),
                                    size: stat.size
                                });
                            });
                        })
                        .where(function (entry, _, callback) {
                            callback(null, entry.recorded);
                        })
                        .orderByDescending(function (entry, _, callback) {
                            callback(null, entry.recorded);
                        })
                        .takeWhile(function (entry, _, callback) {
                            sizeLeft -= entry.size;

                            callback(null, sizeLeft > 0);
                        })
                        .run(callback);
                });
            }, callback);
        },
        destFiles: ['syncPath', function (callback) {
            fs.readdir(SYNC_PATH, function (err, files) {
                if (err) { return callback(err); }

                linq(files)
                    .async
                    .where(function (filename, _, callback) {
                        callback(null, path.extname(filename) === WHITELIST_EXTNAME);
                    })
                    .select(function (filename, _, callback) {
                        fs.stat(path.resolve(SYNC_PATH, filename), function (err, stat) {
                            callback(err, err ? null : {
                                filename: filename,
                                recorded: parseRecordedTime(filename),
                                size: stat.size
                            });
                        });
                    })
                    .orderByDescending(function (entry, _, callback) {
                        callback(null, entry.recorded);
                    })
                    .run(callback);
            });
        }]
    }, function (err, results) {
        if (err) {
            console.error(err);

            return process.exit(1);
        }

        var sources = results.sourceFiles,
            dests = results.destFiles,
            filePrefix = path.resolve(path.dirname(module.filename), 'batchfiles\\' + date.format(new Date(), 'yyyy-MM-dd HH-mm-ss')),
            batchFile = filePrefix + '.cmd',
            logFile = '"' + filePrefix + '.log"',
            outputs = ['@ECHO OFF', 'SETLOCAL', 'SET LOGFILE=' + logFile, 'CHCP 65001', 'POWERCFG /LASTWAKE> %LOGFILE%', 'ECHO.>> %LOGFILE%', 'ECHO %TIME% - Sync started>> %LOGFILE%'],
            willCopy = linq(sources)
                .where(function (source) {
                    return linq(dests).all(function (dest) {
                        return source.filename !== dest.filename && source.size !== dest.size;
                    }).run();
                })
                .orderByDescending(function (source) {
                    return source.recorded;
                })
                .run(),
            willDelete = linq(dests)
                .where(function (dest) {
                    return linq(sources).all(function (source) {
                        return source.filename !== dest.filename;
                    }).run();
                })
                .orderBy(function (source) {
                    return source.recorded;
                })
                .run();

        outputs.push('ECHO %TIME% - Last 30 source files interested:>> %LOGFILE%');

        linq(sources).take(30).run().forEach(function (entry) {
            outputs.push('ECHO               ' + entry.filename + ' (' + number.bytes(entry.size) + ')>> %LOGFILE%');
        });

        outputs.push('ECHO.>> %LOGFILE%');

        outputs.push('ECHO %TIME% - Existing destination files:>> %LOGFILE%');

        dests.forEach(function (entry) {
            outputs.push('ECHO               ' + entry.filename + ' (' + number.bytes(entry.size) + ')>> %LOGFILE%');
        });

        outputs.push('ECHO.>> %LOGFILE%');

        if (willCopy.length) {
            var totalSize = 0;

            outputs.push('ECHO %TIME% - Will copy the following files:>> %LOGFILE%');

            willCopy.forEach(function (entry) {
                outputs.push('ECHO               ' + entry.filename + ' (' + number.bytes(entry.size) + ')>> %LOGFILE%');
                totalSize += entry.size;
            });

            outputs.push('ECHO %TIME% - Will copy ' + number.bytes(totalSize) + ' of files>> %LOGFILE%');
        }

        outputs.push('ECHO.>> %LOGFILE%');

        if (willDelete.length) {
            outputs.push('ECHO %TIME% - Will delete the following files:>> %LOGFILE%');

            willDelete.forEach(function (entry) {
                outputs.push('ECHO               ' + entry.filename + ' (' + number.bytes(entry.size) + ')>> %LOGFILE%');
            });

            outputs.push('ECHO.>> %LOGFILE%');
        }

        var diskSize = linq(dests).sum(function (dest) { return dest.size }).run();

        outputs.push('ECHO %TIME - Currently occupied ' + number.bytes(diskSize) + '>>%LOGFILE%');
        outputs.push('ECHO %TIME - Deleting incomplete files from last session>>%LOGFILE%');
        outputs.push('DEL "' + path.resolve(SYNC_PATH, '*.sync') + '"');

        var nextCopy, nextDelete, hasDelete;

        while (willCopy.length) {
            nextCopy = willCopy.shift();
            hasDelete = 0;

            outputs.push('ECHO %TIME% - We want to copy ' + nextCopy.filename + ' (' + number.bytes(nextCopy.size) + '), we have ' + number.bytes(SIZE_LIMIT - diskSize) + ' left>> %LOGFILE%');

            while (nextCopy.size + diskSize > SIZE_LIMIT && willDelete.length) {
                nextDelete = willDelete.shift();

                diskSize -= nextDelete.size;
                outputs.push('ECHO %TIME% - Deleting ' + nextDelete.filename + ' (' + nextDelete.size + ')>> %LOGFILE%');
                outputs.push('DEL "' + path.resolve(SYNC_PATH, nextDelete.filename) + '"');
                hasDelete = 1;
            }

            if (hasDelete) {
                outputs.push('ECHO %TIME% - After deletion, we currently occupying ' + number.bytes(diskSize) + ' (' + number.bytes(SIZE_LIMIT - diskSize) + ' left)>>%LOGFILE%');
            }

            var filename = nextCopy.filename;

            outputs.push('ECHO %TIME% - Copying ' + filename + ' (' + number.bytes(nextCopy.size) + ')>> %LOGFILE%');
            outputs.push('COPY "' + path.resolve(RECORDED_TV_PATH, filename) + '" "' + path.resolve(SYNC_PATH, filename) + '.sync"');
            outputs.push('IF %ERRORLEVEL% EQU 0 (');
            outputs.push('  ECHO %TIME% - Copy completed>> %LOGFILE%');
            outputs.push('  REN "' + path.resolve(SYNC_PATH, filename) + '.sync" "' + filename + '"');
            outputs.push(') ELSE (');
            outputs.push('  ECHO %TIME% - Copy failed>> %LOGFILE%');
            outputs.push('  DEL "' + path.resolve(SYNC_PATH, filename) + '.sync"');
            outputs.push(')');
            outputs.push('ECHO.>> %LOGFILE%');

            diskSize += nextCopy.size;
        }

        outputs.push('ECHO %TIME% - Sync completed>> %LOGFILE%');
        outputs.push('node sendmail.js %LOGFILE%');
        outputs.push('ECHO %TIME% - Report email sent>> %LOGFILE%');
        outputs.push('ENDLOCAL');

        fs.writeFile(batchFile, outputs.join('\r\n'), { encoding: 'utf8' }, function (err) {
            if (err) {
                console.error('Failed to write batch file');
                console.error(err);

                return process.exit(1);
            }

            console.log('"' + batchFile + '"');
        });
    });

    function parseRecordedTime(filename) {
        var match = /__(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})\./.exec(filename);

        return match && new Date(+match[1], (+match[2]) - 1, +match[3], +match[4], +match[5], +match[6]);
    }

    function trim(s) {
        return s.replace(/(^\s+)|(\s+$)/g, '');
    }

    function runProcess(command, args, options, callback) {
        var cp = child_process.spawn(command, args, options),
            stdout = [],
            numStdout = 0;

        cp.on('exit', function () {
            callback && callback(null, Buffer.concat(stdout, numStdout));
            callback = 0;
        }).on('error', function (err) {
            callback && callback(err);
            callback = 0;
        }).stdout.on('data', function (data) {
            stdout.push(data);
            numStdout += data.length;
        });
    }
}(
    require('async'),
    require('child_process'),
    require('./date'),
    require('fs'),
    require('async-linq'),
    require('./number'),
    require('os'),
    require('path')
);