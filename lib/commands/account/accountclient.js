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
  }
});

module.exports = AccountClient;