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

var __ = require('underscore');
var util = require('util');

var interaction = require('../util/interaction');
var utils = require('../util/utils');

exports.init = function (cli) {

  var log = cli.output;
  var site = cli.category('site');
  var siteDomain = site.category('domain')
    .description('Commands to manage your Web Site domains');

  siteDomain.command('list [name]')
    .usage('[options] [name]')
    .description('Show your site domains')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (name, options, _) {
      var context = {
        subscription: cli.category('account').lookupSubscriptionId(options.subscription),
        site: { name: name }
      };

      site.lookupSiteNameAndWebSpace(context, _);

      var siteConfigurations = site.doSiteGet(context, _);
      siteConfigurations.HostNames = getHostNames(siteConfigurations.HostNames);
      interaction.formatOutput(cli, siteConfigurations.HostNames['a:string'], function (data) {
        if (data.length > 0) {
          log.table(data, function (row, item) {
            row.cell('Name', item);
          });
        } else {
          log.info('No host names defined yet.');
        }
      });
    });

  siteDomain.command('add')
    .description('Add a site domain')
    .argument({ name: 'domain', short: '-d', long: '--domain', required: true, position: 1, prompt: 'Domain: ', description: 'the new domain' })
    .argument({ name: 'name', required: false, position: 2, description: 'the new domain' })
    .argument({ name: 'subscription', short: '-s', long: '--subscription', required: false, description: 'use the subscription id' })
    .execute(function (options, _) {
      var context = {
        subscription: cli.category('account').lookupSubscriptionId(options.subscription),
        site: { name: options.name }
      };

      site.lookupSiteNameAndWebSpace(context, _);

      var siteConfigurations = site.doSiteGet(context, _);
      siteConfigurations.HostNames = getHostNames(siteConfigurations.HostNames);
      siteConfigurations.HostNames['a:string'].push(options.domain);
      site.doSitePUT(context,  {
        HostNames: siteConfigurations.HostNames
      }, _);
    });

  siteDomain.command('delete [domain] [name]')
    .usage('[options] <domain> [name]')
    .description('Deletes a site domain')
    .option('-d, --domain <domain>', 'the new domain')
    .option('-q, --quiet', 'quiet mode, do not ask for delete confirmation')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (domain, name, options, _) {
      if (options.domain) {
        name = domain;
        domain = undefined;
      }

      var params = utils.normalizeParameters({
        domain: [domain, options.domain]
      });

      if (params.err) { throw params.err; }

      domain = interaction.promptIfNotGiven(cli, 'Domain: ', params.values.domain, _);

      if (!options.quiet && !interaction.confirm(cli, util.format('Delete %s domain? (y/n) ', domain), _)) {
        return;
      }

      var context = {
        subscription: cli.category('account').lookupSubscriptionId(options.subscription),
        site: { name: name }
      };

      site.lookupSiteNameAndWebSpace(context, _);

      var siteConfigurations = site.doSiteGet(context, _);
      var found = false;
      if (siteConfigurations.HostNames && siteConfigurations.HostNames['a:string']) {
        siteConfigurations.HostNames = getHostNames(siteConfigurations.HostNames);

        for (var i = 0; i < siteConfigurations.HostNames['a:string'].length; i++) {
          if (utils.ignoreCaseEquals(siteConfigurations.HostNames['a:string'][i], domain)) {
            siteConfigurations.HostNames['a:string'].splice(i, 1);
            found = true;
            i--;
          }
        }

        if (found) {
          if (siteConfigurations.HostNames['a:string'].length === 0) {
            siteConfigurations.HostNames = { };
          }

          site.doSitePUT(context, {
            HostNames: siteConfigurations.HostNames
          }, _);
        }
      }

      if (!found) {
        throw new Error(util.format('Domain "%s" does not exist.', domain));
      }
    });

  function getHostNames(domains) {
    if (!domains) {
      domains = {
        '$': {
          'xmlns:a': 'http://schemas.microsoft.com/2003/10/Serialization/Arrays'
        }
      };
    }

    if (!domains['a:string']) {
      domains['a:string'] = [ ];
    } else if (!__.isArray(domains['a:string'])) {
      domains['a:string'] = [ domains['a:string'] ];
    }

    return domains;
  }
};