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

var fs = require('fs');
var path = require('path');

var should = require('should');

var executeCommand = require('../framework/cli-executor').execute;
var MockedTestUtils = require('../framework/mocked-test-utils');

var suiteUtil;
var testPrefix = 'cli.cloudservice.project-tests';

var executeCmd = function (cmd, callback) {
  if (suiteUtil.isMocked && !suiteUtil.isRecording) {
    cmd.push('-s');
    cmd.push(process.env.AZURE_SUBSCRIPTION_ID);
  }

  executeCommand(cmd, callback);
};

describe('CLI', function () {
  describe('Cloud Service project', function () {
    before(function (done) {
      suiteUtil = new MockedTestUtils(testPrefix, true);
      suiteUtil.setupSuite(done);
    });

    after(function (done) {
      suiteUtil.teardownSuite(done);
    });

    beforeEach(function (done) {
      suiteUtil.setupTest(done);
    });

    afterEach(function (done) {
      suiteUtil.teardownTest(done);
    });

    describe('publish', function () {
      it('should work', function (done) {
        var cmd = ('node cli.js service project publish --json').split(' ');
        cmd.push('--packageFile');
        cmd.push(path.join(__dirname, '../data/package.cspkg'));
        cmd.push('--serviceName');
        cmd.push('rname123');
        cmd.push('--configFile');
        cmd.push(path.join(__dirname, '../data/project/ServiceConfiguration.Cloud.cscfg'));

        executeCmd(cmd, function(result) {
          result.exitStatus.should.equal(0);

          done();
        });
      });
    });
  });
});