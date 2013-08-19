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
var xml2js = require('xml2js');

var __ = require('underscore');

var utils = require('../../util/utils');

var $ = utils.getLocaleString;

function SubscriptionClient(cli) {
  this.cli = cli;

  this.azureDirectory = utils.azureDir();
  this.pemPath = path.join(azureDirectory, 'managementCertificate.pem');
  this.publishSettingsFilePath = path.join(azureDirectory, 'publishSettings.xml');
}

__.extend(SubscriptionClient.prototype, {
  getCurrentSubscription: function (subscription) {
    var self = this;

    // use default subscription if not passed as an argument
    if (subscription === undefined) {
      subscription = account.readConfig().subscription;
    }

    // load and normalize publish settings
    var publishSettings = self.readPublishSettings();

    if (publishSettings && publishSettings.PublishProfile) {
      var subs = publishSettings.PublishProfile.Subscription;
      if (subs === 'undefined') {
        subs = [];
      } else if (typeof (subs[0]) === 'undefined') {
        subs = [subs];
      }

      // use subscription id when the subscription name matches
      for (var index in subs) {
        if (subs[index]['@'].Name === subscription) {
          return subs[index]['@'].Id;
        }
      }
    }

    return subscription;
  },


  getSubscriptions: function() {
    var self = this;

    if (!utils.pathExistsSync(self.publishSettingsFilePath)) {
      throw new Error($('No publish settings file found. Please use "azure account import" first'));
    }

    var settings = self.readPublishSettings();
    var publishSettings = self.getPublishSettings(settings);
    return publishSettings.subscriptions;
  },

  setSubscription: function (id) {
    var self = this;

    var subscriptions = self.getSubscriptions();
    var subscription = subscriptions.filter(function (subscription) {
      return subscription.Id === id;
    })[0];

    if (!subscription) {
      throw new Error(util.format($('Invalid subscription %s'), id));
    } else {
      var config = account.readConfig();

      if (subscription.ServiceManagementUrl && subscription.ServiceManagementUrl !== config.endpoint) {
        var endpointInfo = utils.validateEndpoint(subscription.ServiceManagementUrl);
        config.endpoint = endpointInfo;
        log.info(util.format($('Setting service endpoint to: %s'), config.endpoint));
      }

      if (subscription.ManagementCertificate) {
        log.verbose($('Parsing management certificate'));
        var pfx = new Buffer(subscription.ManagementCertificate, 'base64');
        convertPfx(pfx);
      }

      config.subscription = id;
      account.writeConfig(config);
    }
  },

  getPublishSettings: function(settings) {
    if (!settings.PublishProfile ||
        !settings.PublishProfile['@'] ||
        (!settings.PublishProfile['@'].ManagementCertificate &&
         settings.PublishProfile['@'].SchemaVersion !== '2.0')) {
      throw new Error($('Invalid publishSettings file. Use "azure account download" to download publishing credentials.'));
    }

    var attribs = settings.PublishProfile['@'];
    var subs = settings.PublishProfile.Subscription;
    if (!subs) {
      subs = [];
    } else if (!subs[0]) {
      subs = [ subs ];
    }

    subs.forEach(function (sub) {
      sub.Id = sub['@'].Id;
      sub.Name = sub['@'].Name;

      if (attribs.ManagementCertificate) {
        sub.ManagementCertificate = attribs.ManagementCertificate;
      }

      delete sub['@'];
    });

    return {
      url: attribs.Url,
      subscriptions: subs
    };
  },

  readPublishSettings: function (filePath) {
    var self = this;
    var publishSettings;

    if (!filePath) {
      filePath = self.publishSettingsFilePath;
    }

    var parser = new xml2js.Parser();
    parser.on('end', function (settings) { console.log('ai'); publishSettings = settings; });
    try {
      log.silly(util.format($('Reading publish settings %s'), filePath));
      var readBuffer = fs.readFileSync(filePath);
      parser.parseString(readBuffer);
    } catch (err) {
      // publish settings file is not expected for all scenarios
    }

    return publishSettings;
  }
});

module.exports = SubscriptionClient;