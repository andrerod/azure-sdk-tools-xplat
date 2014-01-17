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

var CLITest = require('../framework/cli-test');

var suiteUtil;
var testPrefix = 'cli.service.project-tests';

describe('cli', function () {
  describe('service project', function () {
    before(function (done) {
      suite = new CLITest(testPrefix);
      suite.setupSuite(done);
    });

    after(function (done) {
      suite.teardownSuite(done);
    });

    beforeEach(function (done) {
      suite.setupTest(done);
    });

    afterEach(function (done) {
      suite.teardownTest(done);
    });

    describe('publish', function () {
      it('should work', function (done) {
        suite.execute('service project publish --packageFile %s --serviceName %s --configFile %s --json',
          path.join(__dirname, '../data/package.cspkg'),
          'rname123',
          path.join(__dirname, '../data/project/ServiceConfiguration.Cloud.cscfg'),
          function(result) {
            result.exitStatus.should.equal(0);

            done();
          });
      });
    });
  });
});