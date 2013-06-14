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

var path = require('path');

var CsPack = require('cspack');

var utils = require('../util/utils');
var interaction = require('../util/interaction');
var Constants = require('../util/constants');

exports.init = function (cli) {
  var cloudService = cli.category('service');

  var project = cloudService.category('project')
    .description('Commands to manage your Cloud Service projects');

  project.command('package [definitionFile]')
    .description('Create a new Azure cloud service package')
    .usage('<definitionFile> [options]')
    .option('--definitionFile <definitionFile>', 'The definition file path')
    .option('--out <outFile>', 'The output package file path')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (definitionFile, options, _) {
      var params = utils.normalizeParameters({
        definitionFile: [definitionFile, options.definitionFile]
      });

      if (params.err) { throw params.err; }

      definitionFile = interaction.promptIfNotGiven(cli, 'The definition filename path: ', params.values.definitionFile, _);

      definitionFile = path.resolve(process.cwd(), definitionFile);
      inputDirectory = path.dirname(definitionFile);

      var outputFile;
      if (options.outputFile) {
        outputFile = path.resolve(process.cwd(), options.outputFile);
      } else {
        outputFile = path.join(inputDirectory, Constants.DEFAULT_PACKAGE_NAME);
      }

      var csPack = new CsPack({
        inputDirectory: inputDirectory,
        outputFile: outputFile,
        serviceDefinitionFile: definitionFile
      });

      csPack.execute(_);
    });
};