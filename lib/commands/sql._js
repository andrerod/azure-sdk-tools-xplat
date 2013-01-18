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
      throw Error('not implemented');
    });

  server.command('remove')
    .description('Remove a server')
    .option('-s, --subscription <id>', 'use the subscription id')
    .execute(function (options, _) {
      throw Error('not implemented');
    });
};