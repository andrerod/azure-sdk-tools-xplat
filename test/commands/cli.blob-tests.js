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

var util = require('util');
var executeCommand = require('../framework/cli-executor').execute;
var MockedTestUtils = require('../framework/mocked-test-utils');

var suiteUtil;
var testPrefix = 'cli.blob-tests';

var containerNamesPrefix = 'xplat';
var containerNames = [];

var blobNamesPrefix = 'blob';
var blobNames = [];

var previousDeleted = [];

var executeCmd = function (cmd, callback) {
  if (suiteUtil.isMocked && !suiteUtil.isRecording) {
    cmd.push('-s');
    cmd.push(process.env.AZURE_SUBSCRIPTION_ID);
  }

  executeCommand(cmd, callback);
};

describe('CLI', function () {
  describe('Storage', function () {
    describe('Blob', function () {
      before(function (done) {
        if (process.env.AZURE_TEST_MC) {
          suiteUtil = new MockedTestUtils(testPrefix);
        } else {
          suiteUtil = new MockedTestUtils(testPrefix, true);
        }

        suiteUtil.setupSuite(done);
      });

      after(function (done) {
        suiteUtil.teardownSuite(done);
      });

      beforeEach(function (done) {
        suiteUtil.setupTest(done);
      });

      afterEach(function (done) {
        function deleteUsedContainers (toDelete) {
          if (toDelete.length > 0) {
            var containerName = toDelete.pop();
            previousDeleted.push(containerName);

            var cmd = util.format('node cli.js storage container delete %s %s -q --json', process.env.AZURE_STORAGE_ACCOUNT, containerName).split(' ');
            executeCmd(cmd, function () {
              deleteUsedContainers(toDelete);
            });
          } else {
            suiteUtil.teardownTest(done);
          }
        }

        var toDelete = containerNames.filter(function (container) {
          return !previousDeleted.some(function (other) {
            return other === container;
          });
        });

        deleteUsedContainers(toDelete);
      });

      describe('container create', function () {
        it('should work', function (done) {
          var containerName = suiteUtil.generateId(containerNamesPrefix, containerNames);

          var cmd = util.format('node cli.js storage container create %s %s --json', process.env.AZURE_STORAGE_ACCOUNT, containerName).split(' ');
          executeCmd(cmd, function (result) {
            result.exitStatus.should.equal(0);

            done();
          });
        });
      });

      describe('when a container exists', function () {
        var containerName;
        var blobName;
        var blobContent = 'hello world';

        beforeEach(function (done) {
          containerName = suiteUtil.generateId(containerNamesPrefix, containerNames);
          blobName = suiteUtil.generateId(blobNamesPrefix, blobNames);

          var cmd = util.format('node cli.js storage container create %s %s --json', process.env.AZURE_STORAGE_ACCOUNT, containerName).split(' ');
          executeCmd(cmd, function () {
            done();
          });
        });

        it('should list it', function (done) {
          var cmd = util.format('node cli.js storage container list %s --json', process.env.AZURE_STORAGE_ACCOUNT).split(' ');
          executeCmd(cmd, function (result) {
            var containers = JSON.parse(result.text);
            containers.some(function (container) {
              return container.name === containerName;
            }).should.equal(true);

            done();
          });
        });

        it('should show it', function (done) {
          var cmd = util.format('node cli.js storage container show %s %s --json', process.env.AZURE_STORAGE_ACCOUNT, containerName).split(' ');
          executeCmd(cmd, function (result) {
            result.exitStatus.should.equal(0);
            var container = JSON.parse(result.text);
            container.name.should.not.equal(null);

            done();
          });
        });

        it('should be able to create a blob in it', function (done) {
          var cmd = util.format('node cli.js storage blob create %s %s %s --content %s --json', process.env.AZURE_STORAGE_ACCOUNT, containerName, blobName, blobContent).split(' ');
          executeCmd(cmd, function (result) {
            result.exitStatus.should.equal(0);

            done();
          });
        });

        describe('and a blob in it', function () {
          var containerName;
          var blobName;
          var blobContent = 'helloworld';

          beforeEach(function (done) {
            containerName = suiteUtil.generateId(containerNamesPrefix, containerNames);
            blobName = suiteUtil.generateId(blobNamesPrefix, blobNames);

            var cmd = util.format('node cli.js storage container create %s %s --json', process.env.AZURE_STORAGE_ACCOUNT, containerName).split(' ');
            executeCmd(cmd, function () {

              cmd = util.format('node cli.js storage blob create %s %s %s --content %s --json', process.env.AZURE_STORAGE_ACCOUNT, containerName, blobName, blobContent).split(' ');
              executeCmd(cmd, function () {
                done();
              });
            });
          });

          it('should be able to list the blobs in it', function (done) {
            var cmd = util.format('node cli.js storage blob list %s %s %s --json', process.env.AZURE_STORAGE_ACCOUNT, containerName, blobName).split(' ');
            executeCmd(cmd, function (result) {
              var blobs = JSON.parse(result.text);

              blobs.some(function (blob) {
                return blob.name === blobName;
              }).should.equal(true);

              done();
            });
          });

          it('should be able to download the blobs in it', function (done) {
            var cmd = util.format('node cli.js storage blob download %s %s %s --json', process.env.AZURE_STORAGE_ACCOUNT, containerName, blobName).split(' ');
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