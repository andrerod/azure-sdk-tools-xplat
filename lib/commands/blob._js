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

var utils = require('../util/utils');
var interaction = require('../util/interaction');
var validation = require('../util/validation');

exports.init = function (cli) {
  var log = cli.output;

  var storage = cli.category('storage')
    .description('Commands to manage your storage accounts');

  var container = storage.category('container')
    .description('Commands to manage your storage containers');

  container.command('create [accountName] [containerName]')
    .description('Creates a new container')
    .usage('<accountName> <containerName> [options]')
    .option('--accountName <accountName>', 'The storage account name')
    .option('--accountKey <accountKey>', 'The storage account key')
    .option('--containerName <containerName>', 'The container name')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (accountName, containerName, options, _) {
      var params = utils.normalizeParameters({
        accountName: [accountName, options.accountName],
        containerName: [containerName, options.containerName]
      });

      if (params.err) { throw params.err; }

      accountName = interaction.promptIfNotGiven(cli, 'Account name: ', params.values.accountName, _);
      containerName = interaction.promptIfNotGiven(cli, 'Container name: ', params.values.containerName, _);

      var blobService = createBlobService(options.subscription, accountName, options.accountKey, _);

      var progress = cli.progress('Creating container');

      try {
        blobService.createContainer(containerName, options, _);
      } finally {
        progress.end();
      }
    });

  container.command('delete [accountName] [containerName]')
    .description('Deletes a container')
    .usage('<accountName> <containerName> [options]')
    .option('-q, --quiet', 'quiet mode, do not ask for delete confirmation')
    .option('--accountName <accountName>', 'The storage account name')
    .option('--accountKey <accountKey>', 'The storage account key')
    .option('--containerName <containerName>', 'The container name')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (accountName, containerName, options, _) {
      var params = utils.normalizeParameters({
        accountName: [accountName, options.accountName],
        containerName: [containerName, options.containerName]
      });

      if (params.err) { throw params.err; }

      accountName = interaction.promptIfNotGiven(cli, 'Account name: ', params.values.accountName, _);
      containerName = interaction.promptIfNotGiven(cli, 'Container name: ', params.values.containerName, _);

      if (!options.quiet && !interaction.confirm(cli, 'Delete ' + containerName + ' container? (y/n) ', _)) {
        return;
      }

      var blobService = createBlobService(options.subscription, accountName, options.accountKey, _);

      var progress = cli.progress('Deleting container');

      try {
        blobService.deleteContainer(containerName, options, _);
      } finally {
        progress.end();
      }
    });

  container.command('show [accountName] [containerName]')
    .description('Display container details')
    .usage('<accountName> <containerName> [options]')
    .option('--accountName <accountName>', 'The storage account name')
    .option('--accountKey <accountKey>', 'The storage account key')
    .option('--containerName <containerName>', 'The container name')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (accountName, containerName, options, _) {
      var params = utils.normalizeParameters({
        accountName: [accountName, options.accountName],
        containerName: [containerName, options.containerName]
      });

      if (params.err) { throw params.err; }

      accountName = interaction.promptIfNotGiven(cli, 'Account name: ', params.values.accountName, _);
      containerName = interaction.promptIfNotGiven(cli, 'Container name: ', params.values.containerName, _);

      var blobService = createBlobService(options.subscription, accountName, options.accountKey, _);

      var result;
      var progress = cli.progress('Retrieving container');

      try {
        result = blobService.getContainerMetadata(containerName, options, _);
        var containerAcl = blobService.getContainerAcl(containerName, options, _);
        Object.keys(containerAcl).forEach(function (property) {
          result[property] = containerAcl[property];
        });
      } finally {
        progress.end();
      }

      interaction.formatOutput(cli, result, function(outputData) {
        if(!outputData) {
          log.error('Container not found');
        } else {
          interaction.logEachData(cli, 'Container', outputData);
        }
      });
    });

  container.command('acl [accountName] [containerName]')
    .description('Display container details')
    .usage('<accountName> <containerName> [options]')
    .option('--accountName <accountName>', 'The storage account name')
    .option('--accountKey <accountKey>', 'The storage account key')
    .option('--containerName <containerName>', 'The container name')
    .option('--publicAccessLevel <publicAccessLevel>', 'The container public access level')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (accountName, containerName, options, _) {
      var params = utils.normalizeParameters({
        accountName: [accountName, options.accountName],
        containerName: [containerName, options.containerName]
      });

      if (params.err) { throw params.err; }

      accountName = interaction.promptIfNotGiven(cli, 'Account name: ', params.values.accountName, _);
      containerName = interaction.promptIfNotGiven(cli, 'Container name: ', params.values.containerName, _);

      var blobService = createBlobService(options.subscription, accountName, options.accountKey, _);

      if (options && options.publicAccessLevel) {
        validation.isValidEnumValue(options.publicAccessLevel, Object.keys(azure.Constants.BlobConstants.BlobContainerPublicAccessType));
      }

      var progress = cli.progress('Updating container');

      try {
        blobService.setContainerAcl(containerName, options.publicAccessLevel, options, _);
      } finally {
        progress.end();
      }
    });

  container.command('list [accountName]')
    .description('Lists existing containers')
    .usage('<accountName> [options]')
    .option('--accountName <accountName>', 'The storage account name')
    .option('--accountKey <accountKey>', 'The storage account key')
    .option('-p, --prefix <prefix>', 'The container name prefix')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (accountName, options, _) {
      var params = utils.normalizeParameters({
        accountName: [accountName, options.accountName]
      });

      if (params.err) { throw params.err; }

      accountName = interaction.promptIfNotGiven(cli, 'Account name: ', params.values.accountName, _);

      var blobService = createBlobService(options.subscription, accountName, options.accountKey, _);

      var results;
      var progress = cli.progress('Listing containers');

      try {
        results = blobService.listContainers(options, _);
      } finally {
        progress.end();
      }

      interaction.formatOutput(cli, results, function(outputData) {
        if(outputData.length === 0) {
          log.info('No containers exist');
        } else {
          log.table(outputData, function (row, item) {
            row.cell('Name', item.name);
          });
        }
      });
    });

  var blob = storage.category('blob')
    .description('Commands to manage your storage blobs');

  blob.command('create [accountName] [containerName] [blobName]')
    .description('Deletes a blob')
    .usage('<accountName> <containerName> [options]')
    .option('-q, --quiet', 'quiet mode, do not ask for delete confirmation')
    .option('--accountName <accountName>', 'The storage account name')
    .option('--accountKey <accountKey>', 'The storage account key')
    .option('--containerName <containerName>', 'The container name')
    .option('--blobName <blobName>', 'The blob name')
    .option('--content <content>', 'The blob content')
    .option('--file <filename>', 'The file to upload')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (accountName, containerName, blobName, options, _) {
      // TODO: add metadata and page blobs support

      var params = utils.normalizeParameters({
        accountName: [accountName, options.accountName],
        containerName: [containerName, options.containerName],
        blobName: [blobName, options.blobName]
      });

      if (params.err) { throw params.err; }

      accountName = interaction.promptIfNotGiven(cli, 'Account name: ', params.values.accountName, _);
      containerName = interaction.promptIfNotGiven(cli, 'Container name: ', params.values.containerName, _);
      blobName = interaction.promptIfNotGiven(cli, 'Blob name: ', params.values.blobName, _);

      if (!options.content && !options.filename) {
        throw new Error('Either --file or --content needs to be provided to create a blob');
      }

      var blobService = createBlobService(options.subscription, accountName, options.accountKey, _);

      var progress = cli.progress('Creating blob');

      try {
        if (options.content) {
          blobService.createBlockBlobFromText(containerName, blobName, options.content, options, _);
        } else {
          blobService.createBlockBlobFromFile(containerName, blobName, options.filename, options, _);
        }
      } finally {
        progress.end();
      }
    });

  blob.command('delete [accountName] [containerName] [blobName]')
    .description('Deletes a blob')
    .usage('<accountName> <containerName> [options]')
    .option('-q, --quiet', 'quiet mode, do not ask for delete confirmation')
    .option('--accountName <accountName>', 'The storage account name')
    .option('--accountKey <accountKey>', 'The storage account key')
    .option('--containerName <containerName>', 'The container name')
    .option('--blobName <blobName>', 'The blob name')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (accountName, containerName, blobName, options, _) {
      var params = utils.normalizeParameters({
        accountName: [accountName, options.accountName],
        containerName: [containerName, options.containerName],
        blobName: [blobName, options.blobName]
      });

      if (params.err) { throw params.err; }

      accountName = interaction.promptIfNotGiven(cli, 'Account name: ', params.values.accountName, _);
      containerName = interaction.promptIfNotGiven(cli, 'Container name: ', params.values.containerName, _);
      blobName = interaction.promptIfNotGiven(cli, 'Blob name: ', params.values.blobName, _);

      if (!options.quiet && !interaction.confirm(cli, 'Delete ' + containerName + ' blob ? (y/n) ', _)) {
        return;
      }

      var blobService = createBlobService(options.subscription, accountName, options.accountKey, _);

      var progress = cli.progress('Deleting blob');

      try {
        blobService.deleteBlob(containerName, blobName, options, _);
      } finally {
        progress.end();
      }
    });

  blob.command('show [accountName] [containerName] [blobName]')
    .description('Lists existing blobs')
    .usage('<accountName> <containerName> [options]')
    .option('--accountName <accountName>', 'The storage account name')
    .option('--accountKey <accountKey>', 'The storage account key')
    .option('--containerName <containerName>', 'The container name')
    .option('--blobName <blobName>', 'The blob name')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (accountName, containerName, blobName, options, _) {
      var params = utils.normalizeParameters({
        accountName: [accountName, options.accountName],
        containerName: [containerName, options.containerName],
        blobName: [blobName, options.blobName]
      });

      if (params.err) { throw params.err; }

      accountName = interaction.promptIfNotGiven(cli, 'Account name: ', params.values.accountName, _);
      containerName = interaction.promptIfNotGiven(cli, 'Container name: ', params.values.containerName, _);
      blobName = interaction.promptIfNotGiven(cli, 'Blob name: ', params.values.blobName, _);

      var blobService = createBlobService(options.subscription, accountName, options.accountKey, _);

      var result;
      var progress = cli.progress('Retrieving blob');

      try {
        result = blobService.getBlobProperties(containerName, blobName, options, _);
      } finally {
        progress.end();
      }

      interaction.formatOutput(cli, result, function(outputData) {
        if(!outputData) {
          log.error('Blob not found');
        } else {
          interaction.logEachData(cli, 'Blob', outputData);
        }
      });
    });

  blob.command('download [accountName] [containerName] [blobName]')
    .description('Downloads a blob content')
    .usage('<accountName> <containerName> [options]')
    .option('--accountName <accountName>', 'The storage account name')
    .option('--accountKey <accountKey>', 'The storage account key')
    .option('--containerName <containerName>', 'The container name')
    .option('--blobName <blobName>', 'The blob name')
    .option('--file <filename>', 'The target file')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (accountName, containerName, blobName, options, _) {
      var params = utils.normalizeParameters({
        accountName: [accountName, options.accountName],
        containerName: [containerName, options.containerName],
        blobName: [blobName, options.blobName]
      });

      if (params.err) { throw params.err; }

      accountName = interaction.promptIfNotGiven(cli, 'Account name: ', params.values.accountName, _);
      containerName = interaction.promptIfNotGiven(cli, 'Container name: ', params.values.containerName, _);
      blobName = interaction.promptIfNotGiven(cli, 'Blob name: ', params.values.blobName, _);

      var blobService = createBlobService(options.subscription, accountName, options.accountKey, _);

      var result;
      var progress = cli.progress('Downloading blob');

      try {
        if (options.file) {
          blobService.getBlobToFile(containerName, blobName, options.file, options, _);
        } else {
          result = blobService.getBlobToText(containerName, blobName, options, _);
        }
      } finally {
        progress.end();
      }

      if (result !== undefined) {
        interaction.formatOutput(cli, result, function(outputData) {
          if(!outputData) {
            log.error('Blob not found');
          } else {
            log.data(outputData);
          }
        });
      }
    });

  blob.command('list [accountName] [containerName]')
    .description('Lists existing blobs')
    .usage('<accountName> <containerName> [options]')
    .option('--accountName <accountName>', 'The storage account name')
    .option('--accountKey <accountKey>', 'The storage account key')
    .option('--containerName <containerName>', 'The container name')
    .option('-p, --prefix <prefix>', 'The container name prefix')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (accountName, containerName, options, _) {
      var params = utils.normalizeParameters({
        accountName: [accountName, options.accountName],
        containerName: [containerName, options.containerName]
      });

      if (params.err) { throw params.err; }

      accountName = interaction.promptIfNotGiven(cli, 'Account name: ', params.values.accountName, _);
      containerName = interaction.promptIfNotGiven(cli, 'Container name: ', params.values.containerName, _);

      var blobService = createBlobService(options.subscription, accountName, options.accountKey, _);

      var results;
      var progress = cli.progress('Listing blobs');

      try {
        results = blobService.listBlobs(containerName, options, _);
      } finally {
        progress.end();
      }

      interaction.formatOutput(cli, results, function(outputData) {
        if(outputData.length === 0) {
          log.info('No blobs exist');
        } else {
          log.table(outputData, function (row, item) {
            row.cell('Name', item.name);
          });
        }
      });
    });

  var copy = blob.category('copy')
    .description('Commands to manage your storage blobs copy operations');

  copy.command('start [accountName] [srcBlobUri] [destContainerName] [destBlobName]')
    .description('Starts existing blobs')
    .usage('<accountName> <containerName> [options]')
    .option('--accountName <accountName>', 'The storage account name')
    .option('--srcBlobUri <srcBlobUri>', 'The source blob URI')
    .option('--destContainerName <destContainerName>', 'The destination container name')
    .option('--destBlobName <destBlobName>', 'The destination blob name')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (accountName, srcBlobUri, destContainerName, destBlobName, options, _) {
      var params = utils.normalizeParameters({
        accountName: [accountName, options.accountName],
        srcBlobUri: [srcBlobUri, options.srcBlobUri],
        destContainerName: [destContainerName, options.destContainerName],
        destBlobName: [destBlobName, options.destBlobName]
      });

      if (params.err) { throw params.err; }

      srcBlobUri = interaction.promptIfNotGiven(cli, 'Source blob URI: ', params.values.srcBlobUri, _);
      destContainerName = interaction.promptIfNotGiven(cli, 'Desination container name: ', params.values.destContainerName, _);
      destBlobName = interaction.promptIfNotGiven(cli, 'Destination blob name: ', params.values.destBlobName, _);

      var blobService = createBlobService(options.subscription, accountName, options.accountKey, _);

      var progress = cli.progress('Copying blob');

      try {
        var result = blobService.copyBlob(srcBlobUri, destContainerName, destBlobName, options, _);

        console.log(result);
        // TODO: print out copy identifier
      } finally {
        progress.end();
      }
    });

  copy.command('stop [accountName] [containerName] [blobName] [copyId]')
    .description('Starts existing blobs')
    .usage('<accountName> <containerName> [options]')
    .option('--accountName <accountName>', 'The storage account name')
    .option('--accountKey <accountKey>', 'The storage account key')
    .option('--containerName <destContainerName>', 'The destination container name')
    .option('--blobName <destBlobName>', 'The destination blob name')
    .option('--copyId <copyId>', 'The copy operation identifier')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (accountName, containerName, blobName, copyId, options, _) {
      var params = utils.normalizeParameters({
        accountName: [accountName, options.accountName],
        containerName: [containerName, options.containerName],
        blobName: [blobName, options.blobName],
        copyId: [copyId, options.copyId]
      });

      if (params.err) { throw params.err; }

      containerName = interaction.promptIfNotGiven(cli, 'Container name: ', params.values.containerName, _);
      blobName = interaction.promptIfNotGiven(cli, 'Blob name: ', params.values.blobName, _);
      copyId = interaction.promptIfNotGiven(cli, 'Copy identifier: ', params.values.copyId, _);

      var blobService = createBlobService(options.subscription, accountName, options.accountKey, _);

      var progress = cli.progress('Aborting copy operation');

      try {
        blobService.abortCopyBlob(containerName, blobName, copyId, options, _);
      } finally {
        progress.end();
      }
    });

  copy.command('state [accountName] [containerName] [blobName]')
    .description('Starts existing blobs')
    .usage('<accountName> <containerName> [options]')
    .option('--accountName <accountName>', 'The storage account name')
    .option('--accountKey <accountKey>', 'The storage account key')
    .option('--containerName <containerName>', 'The container name')
    .option('--blobName <blobName>', 'The blob name')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (accountName, containerName, blobName, options, _) {
      var params = utils.normalizeParameters({
        accountName: [accountName, options.accountName],
        containerName: [containerName, options.containerName],
        blobName: [blobName, options.blobName]
      });

      if (params.err) { throw params.err; }

      containerName = interaction.promptIfNotGiven(cli, 'Container name: ', params.values.containerName, _);
      blobName = interaction.promptIfNotGiven(cli, 'Blob name: ', params.values.blobName, _);

      var blobService = createBlobService(options.subscription, accountName, options.accountKey, _);

      var result;
      var progress = cli.progress('Retrieving copy operation status');

      try {
        result = blobService.getBlobProperties(containerName, blobName, options, _);
      } finally {
        progress.end();
      }

      interaction.formatOutput(cli, result, function(outputData) {
        log.data('Copy status', outputData.copyStatus);
      });
    });

  function createBlobService(subscription, accountName, accountKey, _) {
    if (!accountKey) {
      // Use RDFE to try to fetch account key if no explicit one was passed
      var serviceManagementService = createServiceManagementService(subscription);
      var accountKeys = serviceManagementService.getStorageAccountKeys(accountName, _);
      accountKey = accountKeys.body.StorageServiceKeys.Primary;
    }

    return utils.createBlobService(accountName, accountKey);
  }

  function createServiceManagementService(subscription) {
    var account = cli.category('account');
    var subscriptionId = account.lookupSubscriptionId(subscription);
    return utils.createServiceManagementService(subscriptionId, account, log);
  }
};