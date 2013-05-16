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

var cloudServiceProject = require('./cloudService/cloudServiceProject');

exports.init = function (cli) {
  var cloudService = cli.category('service')
    .description('Commands to manage your Cloud Services');

  var project = cloudService.category('project')
    .description('Commands to manage your Cloud Service projects');

  project.command('publish [serviceName]')
    .description('Create a new Azure cloud service')
    .usage('<serviceName> [options]')
    .option('--storageAccountName <storageAccountName>', 'The storage account name')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (serviceName, options, _) {
      cloudServiceProject.publishCloudService({
        subscription: options.subscription,
        cli: cli
      }, _);
    });
};