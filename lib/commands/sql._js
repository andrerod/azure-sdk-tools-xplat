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

var url = require('url');

var Channel = require('../channel');
var utils = require('../utils');

exports.init = function (cli) {
  var log = cli.output;

  var sql = cli.category('sql')
    .description('Commands to manage your SQL accounts');

  var server = sql.category('server')
    .description('Commands to manage your database servers');

  server.command('create')
    .description('Create a new database server')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (options, _) {
      throw Error('not implemented');
    });

  server.command('show')
    .description('Display server details')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (options, _) {
      throw Error('not implemented');
    });

  server.command('list')
    .description('Get the list of servers')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (options, _) {
      var servers = listSqlServers(options, _);
      log.table(servers, function (row, item) {
        row.cell('Name', item.Name);
        row.cell('Location', item.Location);
      });
    });

  server.command('remove [name]')
    .description('Remove a server')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (name, options, _) {
      removeSqlServer(name, options, _);
    });

  function getSqlChannel(options) {
    options.subscription = options.subscription || cli.category('account').lookupSubscriptionId(options.subscription);
    var account = cli.category('account');
    var managementEndpoint = url.parse(utils.getSqlManagementEndpointUrl());
    var pem = account.managementCertificate();
    var host = managementEndpoint.hostname;
    var port = managementEndpoint.port;

    var channel = new Channel({
      host: host,
      port: port,
      key: pem.key,
      cert: pem.cert
    }).header('x-ms-version', '1.0')
      .path(options.subscription)

    return channel;
  }

  function listSqlServers (options, _) {
    var channel = getSqlChannel(options)
      .path('servers');

    var progress = cli.progress('Retrieving SQL servers');
    try {
      var servers = channel.GET(_);
      servers = servers.Server;
      if (!Array.isArray(servers)) {
        servers = [ servers ];
      }

      return servers;
    } finally {
      progress.end();
    }
  };

  function removeSqlServer (name, options, _) {
    var channel = getSqlChannel(options)
      .path('servers')
      .path(name);

    var progress = cli.progress('Removing SQL server');
    try {
      return channel.DELETE(_);
    } finally {
      progress.end();
    }
  };
};