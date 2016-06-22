'use strict';

var fs = require('fs');
var enabledTest = process.env.TEST;
var path = require('path');
var assert = require('assert');

var enabledTestNames = enabledTest && enabledTest.split(/[\s*,\s*/]/);
var enabledTests = null;

if (enabledTestNames && enabledTestNames.length > 1) {
    enabledTests = {};
    enabledTest = null;
    enabledTestNames.forEach((testName) => {
        enabledTests[testName] = true;
    });
}

var fs = require('fs');
var enabledTest = process.env.TEST;
var path = require('path');
var assert = require('assert');


function compareHelper(dir, actual, suffix) {
    var actualPath = path.join(dir, 'actual' + suffix);
    var expectedPath = path.join(dir, 'expected' + suffix);

    var isObject = typeof actual === 'string' ? false : true;
    var actualString = isObject ? JSON.stringify(actual, null, 4) : actual;
    fs.writeFileSync(actualPath, actualString, { encoding: 'utf8' });

    var expectedString;

    try {
        expectedString = fs.readFileSync(expectedPath, { encoding: 'utf8' });
    } catch(e) {
        expectedString = isObject ? '"TBD"' : 'TBD';
        fs.writeFileSync(expectedPath, expectedString, {encoding: 'utf8'});
    }

    if (isObject) {
        actual = JSON.parse(actualString);
    } else {
        // ignore sourcemap at the moment
        actual = removeSourceMap(actual);
    }


    var expected = isObject ? JSON.parse(expectedString) : expectedString;
    assert.deepEqual(actual, expected);
}

function removeSourceMap(sourceString) {
    let lines = sourceString.split('\n');
    let result = sourceString;

    if (lines.length > 1) {
        const sourcemapLineNum = lines.length - 2;
        let sourcemapLine = lines[sourcemapLineNum];

        // move the line that containing source map
        if (sourcemapLine.startsWith('//# sourceMappingURL')) {
            lines.splice(sourcemapLineNum, 1);
            result = lines.join('\n');
        }
    }

    return result;
}

function autoTest(name, dir, run, options, done) {
    options = options || {};

    var helpers = {
        compare(actual, suffix) {
            compareHelper(dir, actual, suffix);
        }
    };

    run(dir, helpers, done);
}

exports.scanDir = function(autoTestDir, run, options) {
    describe('autotest', function() {
        fs.readdirSync(autoTestDir)
            .forEach(function(name) {
                if (name.charAt(0) === '.') {
                    return;
                }

                if (enabledTests && !enabledTests[name]) {
                    return;
                }

                var itFunc = it;

                if (enabledTest && name === enabledTest) {
                    itFunc = it.only;
                }

                var dir = path.join(autoTestDir, name);

                itFunc(`[${name}] `, function(done) {
                    autoTest(name, dir, run, options, done);
                });

            });
    });
};