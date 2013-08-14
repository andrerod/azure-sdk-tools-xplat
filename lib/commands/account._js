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

var util = require('util');
var path = require('path');

var interaction = require('../util/interaction');
var utils = require('../util/utils');
var cacheUtils = require('../util/cacheUtils');

var $ = utils.getLocaleString;

var AccountClient = require('./account/accountclient');

exports.init = function (cli) {
  var log = cli.output;
  var azureDirectory = utils.azureDir();
  var pemPath = path.join(azureDirectory, 'managementCertificate.pem');
  var publishSettingsFilePath = path.join(azureDirectory, 'publishSettings.xml');

  var account = cli.category('account')
    .description($('Commands to manage your account information and publish settings'));

  var accountClient = new AccountClient(cli);

  account.command('download')
    .description($('Launch a browser to download your publishsettings file'))
    .option('-e, --environment <environment>', $('the publish settings download environment'))
    .option('-r, --realm <realm>', $('the organization\'s realm'))
    .execute(function (options) {
      var url = cli.environmentManager.getPublishingProfileUrl(options.realm, options.environment);
      interaction.launchBrowser(url);
      log.help($('Save the downloaded file, then execute the command'));
      log.help('  account import <file>');
    });

  account.command('list')
    .description($('List the imported subscriptions'))
    .execute(function () {
      var currentSubscription = accountClient.getCurrentSubscription();
      var subscriptions = accountClient.getSubscriptions();

      log.table(subscriptions, function (row, s) {
        row.cell($('Name'), s.Name);
        row.cell($('Id'), s.Id);
        row.cell($('Current'), s.Id === currentSubscription);
      });
    });

  account.command('set <subscription>')
    .description($('Set the current subscription'))
    .execute(function (subscription) {
      var subscriptions = accountClient.getSubscriptions();

      // Try to match based on name first
      var importByName = true;
      var filtered = subscriptions.filter(function (s) { return utils.ignoreCaseEquals(s.Name, subscription); });
      if (!filtered.length) {
        // If nothing was found try matching on Id
        importByName = false;
        filtered = subscriptions.filter(function (s) { return utils.ignoreCaseEquals(s.Id, subscription); });

        if (!filtered.length) {
          // if still nothing found, just throw
          throw new Error(util.format($('Invalid subscription "%s"'), subscription));
        }
      }

      var subscriptionObject = filtered[0];
      var subscriptionTag = importByName ? subscriptionObject.Name : subscriptionObject.Id;
      log.info(util.format($('Setting subscription to "%s"'), subscriptionTag));

      accountClient.setSubscription(subscriptionObject.Id);

      log.info($('Changes saved'));
    });

  account.command('import <file>')
    .description($('Import a publishsettings file or certificate for your account'))
    .option('--skipregister', $('skip registering resources'))
    .execute(function (file, options, callback) {
      accountClient.importPublishSettings(file, options, callback);
    });

  account.command('clear')
    .description($('Remove any of the stored account info stored by import or config set'))
    .action(function () {
      function deleteIfExists(file, isDir) {
        if (utils.pathExistsSync(file)) {
          log.silly(util.format($('Removing %s'), file));
          (isDir ? fs.rmdirSync : fs.unlinkSync)(file);
          return true;
        } else {
          log.silly(util.format($('%s does not exist'), file));
        }
      }

      var isDeleted = deleteIfExists(pemPath);
      isDeleted = deleteIfExists(publishSettingsFilePath) || isDeleted; // in this order only
      isDeleted = utils.clearConfig() || isDeleted;
      isDeleted = cacheUtils.clear() || isDeleted;
      try {
        deleteIfExists(azureDirectory, true);
      } catch (err) {
        log.warn(util.format($('Couldn\'t remove %s'), azureDirectory));
      }
      log.info(isDeleted ? $('Account settings cleared successfully')
          : $('Account settings are already clear'));
    });

  var affinityGroup = account.category('affinity-group')
    .description($('Commands to manage your Affinity Groups'));

  affinityGroup.command('list')
    .description($('List locations available for your account'))
    .option('-s, --subscription <id>', $('the subscription id'))
    .execute(function (options, callback) {
      listLAG('AffinityGroups', options, callback);
    });

  affinityGroup.command('create <name>')
    .description($('Create an affinity group'))
    .option('-s, --subscription <id>', $('the subscription id'))
    .option('-l, --location <name>', $('the data center location'))
    .option('-e, --label <label>', $('the affinity group label'))
    .option('-d, --description <description>', $('the affinity group description'))
    .execute(function (name, options, callback) {
      var channel = utils.createServiceManagementService(cli.category('account').lookupSubscriptionId(options.subscription),
          cli.category('account'), log);

      var affinityGroupOptions = {
        Label: options.label,
        Description: (typeof options.description === 'string' ? options.description : undefined),
        Location: options.location
      };

      var progress = cli.progress($('Creating affinity group'));
      utils.doServiceManagementOperation(channel, 'createAffinityGroup', name, affinityGroupOptions, function (error) {
        progress.end();

        callback(error);
      });
    });

  affinityGroup.command('show <name>')
    .description($('Show details about an affinity group'))
    .option('-s, --subscription <id>', $('the subscription id'))
    .execute(function (name, options, callback) {
      var channel = utils.createServiceManagementService(cli.category('account').lookupSubscriptionId(options.subscription),
          cli.category('account'), log);

      var progress = cli.progress($('Getting affinity groups'));
      utils.doServiceManagementOperation(channel, 'getAffinityGroup', name, function(error, response) {
        progress.end();
        if (!error) {
          delete response.body['@']; // skip @ xmlns and @ xmlns:i
          if (log.format().json) {
            log.json(response.body);
          } else {
            utils.logLineFormat(response.body, log.data);
          }
        }
        callback(error);
      });
    });

  affinityGroup.command('delete <name>')
    .description($('Delete an affinity group'))
    .option('-q, --quiet', $('quiet mode, do not ask for delete confirmation'))
    .option('-s, --subscription <id>', $('the subscription id'))
    .execute(function (name, options, _) {
      var channel = utils.createServiceManagementService(cli.category('account').lookupSubscriptionId(options.subscription),
          cli.category('account'), log);

      if (!options.quiet && !interaction.confirm(cli, util.format($('Delete affinity group %s? [y/n] '), name), _)) {
        return;
      }

      var progress = cli.progress($('Deleting affinity group'));
      try {
        utils.doServiceManagementOperation(channel, 'deleteAffinityGroup', name, _);
      } finally {
        progress.end();
      }
    });

  function listLAG(what, options, callback) {
    var channel = utils.createServiceManagementService(cli.category('account').lookupSubscriptionId(options.subscription),
      cli.category('account'), log);

    var textName = what.replace(/([A-Z])/g, ' $1').toLowerCase();
    var progress = cli.progress(util.format($('Getting %s'), textName));
    utils.doServiceManagementOperation(channel, 'list' + what, function (error, response) {
      progress.end();
      if (!error) {
        if (response.body.length > 0) {
          log.table(response.body, function (row, item) {
            if ('DisplayName' in item) { // for location
              row.cell($('Name'), item.DisplayName);
            } else {
              row.cell($('Name'), item.Name);
            }

            if ('Label' in item) {
              row.cell($('Label'), new Buffer(item.Label, 'base64').toString());
            }
            if ('Location' in item) {
              row.cell($('Location'), item.Location || '');
            }
          });
        } else {
          if (log.format().json) {
            log.json([]);
          } else {
            log.info(util.format($('No %s found'), textName));
          }
        }
      }
      callback(error);
    });
  }
  account.listLAG = listLAG;

  // TODO: remove and use accountClient directly where needed
  account.readPublishSettings = accountClient.readPublishSettings;
  account.readSubscriptions = accountClient.getSubscriptions;
  account.lookupSubscriptionId = accountClient.getCurrentSubscription;
  account.setSubscription = accountClient.setSubscription;
  account.defaultSubscriptionId = accountClient.defaultSubscriptionId;
  account.managementCertificate = accountClient.managementCertificate;
  account.managementEndpointUrl = accountClient.managementEndpointUrl;
  account.registerResourceType = accountClient.registerResourceType;
};