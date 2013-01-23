/**
* Copyright 2012 Microsoft Corporation
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

var _ = require('underscore');

var should = require('should');
var mocha = require('mocha');

var executeCmd = require('../framework/cli-executor').execute;

describe('CLI', function () {
  describe('SQL Commandlets', function () {
    var oldServerNames;

    before(function (done) {
      var cmd = ('node cli.js sql server list --json').split(' ');
      executeCmd(cmd, function (result) {
        oldServerNames = JSON.parse(result.text).map(function (server) {
          return server.Name;
        });

        done();
      });
    });

    after(function (done) {
      function deleteUsedServers (serverNames) {
        if (serverNames.length > 0) {
          var serverName = serverNames.pop();

          var cmd = ('node cli.js sql server delete ' + serverName + ' --json').split(' ');
          executeCmd(cmd, function (result) {
            deleteUsedServers(serverNames);
          });
        } else {
          done();
        }
      };

      var cmd = ('node cli.js sql server list --json').split(' ');
      executeCmd(cmd, function (result) {
        var servers = JSON.parse(result.text);

        var usedServers = [ ];
        _.each(servers, function (server) {
          if (!_.contains(oldServerNames, server.Name)) {
            usedServers.push(server.Name);
          }
        });

        deleteUsedServers(usedServers);
      });
    });

    describe('Create SQL Server', function () {
      it('should create a server', function (done) {
        done();
        /*
        var cmd = ('node cli.js sql server create ' + storageName + ' --json --location').split(' ');
        cmd.push('West US');
        executeCmd(cmd, function (result) {
          result.text.should.equal('');
          result.exitStatus.should.equal(0);

          done();
        });
*/
      });
    });
  });
});