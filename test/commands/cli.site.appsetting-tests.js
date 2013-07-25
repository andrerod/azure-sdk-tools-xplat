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

var should = require('should');

var executeCommand = require('../framework/cli-executor').execute;
var MockedTestUtils = require('../framework/mocked-test-utils');

var createdSites = [];

var suiteUtil;
var testPrefix = 'cli.site.appsetting-tests';

var siteNamePrefix = 'clitests';
var siteNames = [];

var location = process.env.AZURE_SITE_TEST_LOCATION || 'East US';

var executeCmd = function (cmd, callback) {
  if (suiteUtil.isMocked && !suiteUtil.isRecording) {
    cmd.push('-s');
    cmd.push(process.env.AZURE_SUBSCRIPTION_ID);
  }

  executeCommand(cmd, callback);
};

describe('cli', function(){
  describe('site appsetting', function() {

    before(function (done) {
      suiteUtil = new MockedTestUtils(testPrefix);
      suiteUtil.setupSuite(done);
    });

    after(function (done) {
      suiteUtil.teardownSuite(done);
    });

    beforeEach(function (done) {
      suiteUtil.setupTest(done);
    });

    afterEach(function (done) {
      function removeSite() {
        if (createdSites.length === 0) {
          return suiteUtil.teardownTest(done);
        }

        var siteName = createdSites.pop();
        var cmd = ('node cli.js site delete ' + siteName + ' --json --quiet').split(' ');
        executeCmd(cmd, function () {
          removeSite();
        });
      }

      removeSite();
    });

    it('should list site appsetting', function(done) {
      var siteName = suiteUtil.generateId(siteNamePrefix, siteNames);

      // Create site
      var cmd = ('node cli.js site create ' + siteName + ' --json --location').split(' ');
      cmd.push(location);
      executeCmd(cmd, function (result) {
        result.text.should.equal('');
        result.exitStatus.should.equal(0);

        // List sites
        cmd = ('node cli.js site appsetting list ' + siteName + ' --json ').split(' ');
        executeCmd(cmd, function (result) {
          // there should be not settings yet as the site was just created
          result.exitStatus.should.equal(0);

          // add a setting
          var cmd = ('node cli.js site appsetting add mysetting=myvalue ' + siteName + ' --json').split(' ');
          executeCmd(cmd, function (result) {
            result.text.should.equal('');
            result.exitStatus.should.equal(0);

            cmd = ('node cli.js site appsetting list ' + siteName + ' --json').split(' ');
            executeCmd(cmd, function (result) {
              var settingsList = JSON.parse(result.text);

              // Listing should return 1 setting now
              settingsList.length.should.equal(1);

              // add another setting
              var cmd = ('node cli.js site appsetting add mysetting2=myvalue ' + siteName + ' --json').split(' ');
              executeCmd(cmd, function (result) {
                result.text.should.equal('');
                result.exitStatus.should.equal(0);

                cmd = ('node cli.js site appsetting list ' + siteName + ' --json').split(' ');
                executeCmd(cmd, function (result) {
                  var settingsList = JSON.parse(result.text);

                  // Listing should return 2 setting now
                  settingsList.length.should.equal(2);

                  done();
                });
              });
            });
          });
        });
      });
    });

    it('should add get and clear site appsetting', function(done) {
      var siteName = suiteUtil.generateId(siteNamePrefix, siteNames);

      // Create site
      var cmd = ('node cli.js site create ' + siteName + ' --json --location').split(' ');
      cmd.push(location);
      executeCmd(cmd, function (result) {
        result.text.should.equal('');
        result.exitStatus.should.equal(0);

        // List sites
        cmd = ('node cli.js site appsetting list ' + siteName + ' --json ').split(' ');
        executeCmd(cmd, function (result) {
          // there should be not settings yet as the site was just created
          result.exitStatus.should.equal(0);

          // add a setting
          var cmd = ('node cli.js site appsetting add mysetting=myvalue ' + siteName + ' --json').split(' ');
          executeCmd(cmd, function (result) {
            result.text.should.equal('');
            result.exitStatus.should.equal(0);

            cmd = ('node cli.js site appsetting show mysetting ' + siteName + ' --json').split(' ');
            executeCmd(cmd, function (result) {
              result.text.should.equal('"myvalue"\n');
              result.exitStatus.should.equal(0);

              // add another setting
              var cmd = ('node cli.js site appsetting delete mysetting ' + siteName + ' --quiet --json').split(' ');
              executeCmd(cmd, function (result) {
                result.text.should.equal('');
                result.exitStatus.should.equal(0);

                cmd = ('node cli.js site appsetting list ' + siteName + ' --json').split(' ');
                executeCmd(cmd, function (result) {
                  result.exitStatus.should.equal(0);

                  done();
                });
              });
            });
          });
        });
      });
    });
  });
});