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

var csPack = require('node-opc');

var utils = require('../../util/utils');

exports.publishCloudService = function (options, callback) {
  var context = {
    serviceDefinitionFile: './ServiceDefinition.csdef',
    storageAccountName: 'somerndmname',
    location: 'North Europe',
    affinityGroup: undefined
  };

  var serviceManagement = createServiceManagementService(options.cli, options.subscription);

  // Verify storage account exists
  var progress = options.cli.progress('Creating storage account');
  utils.doServiceManagementOperation(serviceManagement,
    'createStorageAccount',
    context.storageAccountName, {
      Location: context.location,
      AffinityGroup: context.affinityGroup
    },
    function (err, rsp) {
      progress.end();

      if (err && rsp.statusCode !== 409) {
        return callback(err);
      }

      csPack.generate({
        serviceDefinitionFile: context.serviceDefinitionFile,
        outputDirectory: process.cwd()
      }, callback);
    });
};

function createServiceManagementService(cli, subscription) {
  var account = cli.category('account');
  var subscriptionId = account.lookupSubscriptionId(subscription);
  return utils.createServiceManagementService(subscriptionId, account, cli.output);
}