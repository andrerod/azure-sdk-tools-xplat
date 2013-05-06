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

exports.init = function (cli) {

  var log = cli.output;
  var site = cli.category('site');
  var siteConfig = site.category('config');
  var diagostics = siteConfig.category('diagnostics')
    .description('Commands to manage your Web Site diagnostics');

  diagostics.command('enable [name]')
    .usage('[options] [name]')
    .description('Enable your site diagnostics')
    .option('-t, --type <type>', 'the diagnostics type')
    .option('--logging <logging>', 'the logging type')
    .option('--loggingLevel <loggingLevel>', 'the logging level')
    .option('--detailedErrors <detailedErrors>', 'the detailed error messages')

    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (name, options, _) {

      var params = utils.normalizeParameters({
        instances: [instances, options.instances],
        size: [size, options.size]
      });

      if (params.err) { throw params.err; }

      instances = interaction.promptPasswordIfNotGiven(cli, 'Number of instances', params.values.instances, _);

      var context = {
        subscription: cli.category('account').lookupSubscriptionId(options.subscription),
        site: {
          name: name
        }
      };

      site.lookupSiteNameAndWebSpace(context, _);
      var siteConfigurations = site.doSiteGet(context, _);

      
  });
};