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

var CloudServiceClient = require('./cloudserviceproject/cloudserviceclient');

var utils = require('../util/utils');
var Constants = require('../util/constants');

exports.init = function (cli) {
  var cloudService = cli.category('service');

  var project = cloudService.category('project')
    .description('Commands to manage your Cloud Services projects');

  project.command('package [definitionFile]')
    .description('Create an Azure cloud service package')
    .usage('<definitionFile> [options]')
    .option('--definitionFile <definitionFile>', 'The definition file path')
    .option('--out <outputFile>', 'The output package file path')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (definitionFile, options, _) {
      var params = utils.normalizeParameters({
        definitionFile: [definitionFile, options.definitionFile]
      });

      if (params.err) { throw params.err; }

      if (!params.values.definitionFile) {
        params.values.definitionFile = path.resolve(process.cwd(), 'ServiceDefinition.csdef');
      }

      definitionFile = path.resolve(process.cwd(), params.values.definitionFile);
      inputDirectory = path.dirname(definitionFile);

      var outputFile;
      if (options.outputFile) {
        outputFile = path.resolve(process.cwd(), options.outputFile);
      } else {
        outputFile = path.join(process.cwd(), Constants.DEFAULT_PACKAGE_NAME);
      }

      var cloudServiceClient = new CloudServiceClient(cli, options.subscription);
      cloudServiceClient.createPackage(outputFile, definitionFile, _);
    });

  project.command('publish [packageFile]')
    .description('Publish an Azure cloud service project')
    .usage('<packageFile> [options]')
    .option('--configFile <configFile>', 'The configurations file path')
    .option('--definitionFile <definitionFile>', 'The definition file path')
    .option('--packageFile <packageFile>', 'The package file path')
    .option('--serviceName <serviceName>', 'The service name')
    .option('--storageAccountName <storageAccountName>', 'The storage account name')
    .option('--affinityGroup <affinityGroup>', 'The affinity group')
    .option('--location <location>', 'The location')
    .option('--slot <slot>', 'The slot')
    .option('--deploymentName <deploymentName>', 'The deployment name')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (packageFile, options, _) {
      var params = utils.normalizeParameters({
        packageFile: [packageFile, options.packageFile]
      });

      if (params.err) { throw params.err; }

      if (options.definitionFile && options.packageFile) {
        throw new Error('Only one of --definitionFile and --packageFile can be specified');
      }

      if (options.packageFile && !options.serviceName) {
        throw new Error('--serviceName must be specified if using --packageFile');
      }

      if (!params.values.packageFile && !options.definitionFile) {
        options.definitionFile = path.resolve(process.cwd(), 'ServiceDefinition.csdef');
      }

      if (!options.configFile) {
        options.configFile = path.join(path.dirname(options.definitionFile), 'ServiceConfiguration.Cloud.cscfg');
      }

      var cloudServiceClient = new CloudServiceClient(cli, options.subscription);
      cloudServiceClient.publishCloudService(
        options.packageFile,
        options.definitionFile,
        options.configFile,
        options.serviceName,
        options.slot,
        options.location,
        options.affinityGroup,
        options.storageAccountName,
        options.deploymentName,
        _);
    });
};