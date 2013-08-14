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

var fs = require('fs');
var path = require('path');
var util = require('util');

var _ = require('underscore');

var utils = require('../../util/utils');
var interaction = require('../../util/interaction');

var pfx2pem = require('../../util/certificates/pkcs').pfx2pem;

var SubscriptionClient = require('../core/subscriptionclient');

var $ = utils.getLocaleString;

function AccountClient(cli) {
  this.cli = cli;
}

util.inherits(AccountClient, SubscriptionClient);

_.extend(AccountClient.prototype, {
  export: function (options, callback) {
    var self = this;

    var azureDirectory = utils.azureDir();
    var publishSettingsFilePath = path.join(azureDirectory, 'publishSettings.xml');

    if (options.publishsettings) {
      publishSettingsFilePath = options.publishsettings;
    }

    if (!fs.existsSync(publishSettingsFilePath)) {
      callback(new Error($('To export a certificate a valid publish settings file needs to be either specified or imported')));
    }

    var settings = AccountClient['super_'].prototype.readPublishSettings(publishSettingsFilePath);

    console.log('here');
    console.log(settings);
    var publishSettings = AccountClient['super_'].prototype.getPublishSettings(settings);

    var subscription = self.getCurrentSubscription(options.subscription);
    interaction.chooseIfNotGiven(self.cli, $('Subscription: '), $('Getting subscriptions'), subscription,
      function(cb) {
        cb(null, publishSettings.subscriptions.map(function(s) { return s.Name; }));
      }, function (err, subscription) {
        if (err) { return callback(err); }

        subscription = publishSettings.subscriptions.filter(function (s) {
          return utils.ignoreCaseEquals(s.Name, subscription) || utils.ignoreCaseEquals(s.Id, subscription);
        })[0];

        var outputFile = options.file ? options.file : util.format('%s.pem', subscription.Name);
        var pfx = new Buffer(subscription.ManagementCertificate, 'base64');
        self.convertPfx(pfx, outputFile);
        callback();
      });
  },

  convertPfx: function(pfx, pemOutputFile) {
    var self = this;

    var pem = pfx2pem(pfx);
    utils.writeFileSyncMode(pemOutputFile, pem.toString(), 'utf8');
    self.cli.output.verbose(util.format($('Converted PFX data to %s'), pemOutputFile));
  },

  importPublishSettings: function (file, options, callback) {
    log.verbose(util.format($('Importing file %s'), file));

    // Is it a .pem file?
    var keyCertValues = keyFiles.readFromFile(file);
    var keyPresent = !!keyCertValues.key;
    var certPresent = !!keyCertValues.cert;
    var publishSettings = null;
    if (keyPresent + certPresent === 1) {
      // Exactly one of them present.  Tell the user about the error.
      // Do not try this file as xml or pfx
      callback(util.format($('File %s needs to contain both private key and cert, but only %s was found'), file,
              (keyCertValues.key ? 'key' : 'certificate')));
    } else if (keyCertValues.key && keyCertValues.cert) {
      // Both key and cert are present.
      keyFiles.writeToFile(pemPath, keyCertValues);
      log.verbose(util.format($('Key and cert have been written to %s'), pemPath));
    } else {
      // Try to open as publishsettings or pfx.
      log.silly(util.format($('%s does not appear to be a PEM file. Reading as publish settings file'), file));
      var parser = new xml2js.Parser();
      parser.on('end', function (settings) { publishSettings = settings; });
      var readBuffer = fs.readFileSync(file);
      try {
        parser.parseString(readBuffer);
      } catch (err) {
        if (err.toString().indexOf($('Non-whitespace before first tag')) === -1) {
          // This looks like an xml parsing error, not PFX.
          callback(err);
        }

        log.silly($('Unable to read file as xml publish settings file. Assuming it is pfx'));
        publishSettings = null;
      }

      if (publishSettings) {
        processSettings(file, publishSettings);
      } else {
        convertPfx(readBuffer);
      }
    }

    cacheUtils.clear();
    if (!options.skipregister && publishSettings && publishSettings.PublishProfile.Subscription['@']) {
      var progress = cli.progress($('Verifying account'));
      return registerKnownResourceTypes(account.defaultSubscriptionId(), function (error) {
        progress.end();
        callback(error);
      });
    }

    return callback();

    function processSettings(file, settings) {
      var publishSettings = accountClient.getPublishSettings(settings);

      if (publishSettings.subscriptions.length === 0) {
        log.warning($('Imported profile with no subscriptions'));
      } else {
        for (var index in publishSettings.subscriptions) {
          log.info(util.format($('Found subscription: %s'), publishSettings.subscriptions[index].Name));
          log.verbose('  Id:', publishSettings.subscriptions[index].Id);
        }
      }

      if (publishSettings.url) {
        var endpointInfo = utils.validateEndpoint(publishSettings.url);
        var config = account.readConfig();
        config.endpoint = endpointInfo;
        account.writeConfig(config);
        log.info(util.format($('Setting service endpoint to: %s'), config.endpoint));
      }

      log.verbose(util.format($('Storing account information at %s'), publishSettingsFilePath));
      utils.writeFileSyncMode(publishSettingsFilePath, readBuffer); // folder already created by convertPfx()

      if (publishSettings.subscriptions.length !== 0) {
        log.info(util.format($('Setting default subscription to: %s'), publishSettings.subscriptions[0].Name));
        log.info($('Use "azure account set" to change to a different one'));

        setSubscription(publishSettings.subscriptions[0].Id);
      }

      log.warn(util.format($('The "%s" file contains sensitive information'), file));
      log.warn($('Remember to delete it now that it has been imported'));
      log.info($('Account publish settings imported successfully'));
    }
  }
});

module.exports = AccountClient;