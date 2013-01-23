/**
* Copyright (c) Microsoft.  All rights reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

var __ = require('underscore');

exports.prompt = function (cli, msg, callback) {
  cli.prompt(msg, function (result) { 
    callback(null, result);
  });
}

exports.promptPassword = function (cli, msg, callback) {
  cli.password(msg, '*', function (result) {
    callback(null, result);
  });
}

exports.promptPasswordIfNotGiven = function (cli, promptString, currentValue, _) {
  if (__.isUndefined(currentValue)) {
    var value = exports.promptPassword(cli, promptString, _);
    return value;
  } else {
    return currentValue;
  }
}

exports.promptIfNotGiven = function (cli, promptString, currentValue, _) {
  if (__.isUndefined(currentValue)) {
    var value = exports.prompt(cli, promptString, _);
    return value;
  } else {
    return currentValue;
  }
}

exports.choose = function (cli, values, callback) {
  cli.choose(values, function(value) {
    callback(null, value);
  });
}

exports.chooseIfNotGiven = function (cli, promptString, progressString, currentValue, valueProvider, _) {
  if (__.isUndefined(currentValue)) {
    var progress = cli.progress(progressString);
    var values = valueProvider(_);
    progress.end();

    cli.output.help(promptString);
    var i = exports.choose(cli, values, _);
    return values[i];
  } else {
    return currentValue;
  }
}

function formatOutput(cli, outputData, humanOutputGenerator) {
  cli.output.json('silly', outputData);
  if(cli.output.format().json) {
    cli.output.json(outputData);
  } else {
    humanOutputGenerator(outputData);
  }
}

function logEachData(cli, title, data) {
  var cleaned = data;
  for (var property in cleaned) {
    cli.output.data(title + ' ' + property, cleaned[property]);
  }
}