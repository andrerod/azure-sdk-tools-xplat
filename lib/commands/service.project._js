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

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var cloudService = cli.category('service');

  var project = cloudService.category('project')
    .description($('Commands to manage your Cloud Services projects'));

  project.command('create [serviceName]')
    .description($('Create scaffolding for a new hosted service'))
    .option('--serviceName <serviceName>', $('the name of the cloud project'))
    .execute(function (serviceName, options, _) {
      var params = utils.normalizeParameters({
        serviceName: [serviceName, options.serviceName]
      });

      if (params.err) { throw params.err; }

    });

  project.command('package [definitionFile]')
    .description($('Create a cloud service package'))
    .usage('<definitionFile> [options]')
    .option('--definitionFile <definitionFile>', $('the definition file path'))
    .option('--out <outputFile>', $('the output package file path'))
    .option('-s, --subscription <id>', $('the subscription id'))
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
    .description($('Publish a cloud service project'))
    .usage('<packageFile> [options]')
    .option('--configFile <configFile>', $('the configurations file path'))
    .option('--definitionFile <definitionFile>', $('the definition file path'))
    .option('--packageFile <packageFile>', $('the package file path'))
    .option('--serviceName <serviceName>', $('the service name'))
    .option('--storageAccountName <storageAccountName>', $('the storage account name'))
    .option('--affinityGroup <affinityGroup>', $('the affinity group'))
    .option('--location <location>', $('the location'))
    .option('--slot <slot>', $('the slot'))
    .option('--deploymentName <deploymentName>', $('the deployment name'))
    .option('-s, --subscription <id>', $('the subscription id'))
    .execute(function (packageFile, options, _) {
      var params = utils.normalizeParameters({
        packageFile: [packageFile, options.packageFile]
      });

      if (params.err) { throw params.err; }

      if (options.definitionFile && options.packageFile) {
        throw new Error($('Only one of --definitionFile and --packageFile can be specified'));
      }

      if (options.packageFile && !options.serviceName) {
        throw new Error($('--serviceName must be specified if using --packageFile'));
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