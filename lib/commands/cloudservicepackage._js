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

var azure = require('azure');

exports.init = function (cli) {
  var log = cli.output;

  var cloudService = cli.category('service');
  var project = cloudService.category('project')
    .description('Commands to manage a Cloud Service project');

  project.command('package [path]')
    .description('Create a Cloud Service Package')
    .usage('<path> [options]')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (path, options, _) {
      throw new Error('Not implemented yet');
    });
};

