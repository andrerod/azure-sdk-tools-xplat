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

var MockedTestUtils = require('../framework/mocked-test-utils');

var suit;
var testPrefix = 'cli.site.handler-tests';

var createdSites = [];
var siteNamePrefix = 'cli';
var siteNames = [];

var location = process.env.AZURE_SITE_TEST_LOCATION || 'East US';

describe('cli', function(){
  describe('handler', function() {

    before(function (done) {
      suit = new MockedTestUtils(testPrefix);
      suit.setupSuite(done);
    });

    after(function (done) {
      suit.teardownSuite(done);
    });

    beforeEach(function (done) {
      suit.setupTest(done);
    });

    afterEach(function (done) {
      function removeSite() {
        if (createdSites.length === 0) {
          return suit.teardownTest(done);
        }

        var siteName = createdSites.pop();
        suit.execute(util.format('site delete %s --json --quiet', siteName), function () {
          removeSite();
        });
      }

      removeSite();
    });

    it('should list, add and delete site handler', function(done) {
      var siteName = suit.generateId(siteNamePrefix, siteNames);
      var extension = '.js';

      // Create site
      suit.execute(util.format('site create %s --json --location "%s"', siteName, location), function (result) {
        result.text.should.equal('');
        result.exitStatus.should.equal(0);

        suit.execute(util.format('site handler list %s --json', siteName), function (result) {
          result.exitStatus.should.equal(0);

          suit.execute(util.format('site handler add %s c: %s --json', extension, siteName), function (result) {
            result.text.should.equal('');
            result.exitStatus.should.equal(0);

            suit.execute(util.format('site handler list %s --json', siteName), function (result) {
              var handlers = JSON.parse(result.text);

              should.exist(handlers.filter(function (d) {
                return d.Extension === extension;
              })[0]);

              suit.execute(util.format('node cli.js site handler delete %s %s --quiet --json', extension, siteName), function (result) {
                result.text.should.equal('');
                result.exitStatus.should.equal(0);

                suit.execute(util.format('node cli.js site handler list %s --json', siteName), function (result) {
                  handlers = JSON.parse(result.text);

                  should.not.exist(handlers.filter(function (d) {
                    return d.Extension === extension;
                  })[0]);

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