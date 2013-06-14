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

var http = require('http');

var _ = require('underscore');

var utils = require('../../../util/utils');

function CloudRuntimeCollection() {
}

_.extend(CloudRuntimeCollection, {
  createCloudRuntimeCollection: function (callback) {
    var self = this;

    self.getManifest(function (err, manifest) {
      if (err) { return callback(err); }

      var baseUri = self.getBlobUriFromManifest(manifest);
      var runtimes = manifest.runtimemanifest.runtimes.runtime;

      if (!_.isArray(runtimes)) {
        runtimes = [ runtimes ];
      }

      var runtimePackages = [];
      runtimes.forEach(function (runtime) {
        runtime['$'].baseUri = baseUri;
        runtimePackages.push(runtime['$']);
      });

      callback(null, runtimePackages);
    });
  },

  getBlobUriFromManifest: function (manifest) {
    return manifest.runtimemanifest.baseuri['$'].uri;
  },

  getManifest: function(callback) {
    this.downloadManifest(function (err, manifest) {
      if (err) { return callback(err); }

      utils.parseXml(manifest, callback);
    });
  },

  downloadManifest: function (callback) {
    http.get('http://az413943.vo.msecnd.net/node/runtimemanifest_v3.xml', function(response) {
      response.setEncoding('utf8');

      var manifest = '';

      response.on('error', callback);
      response.on('data', function (chunk) {
        manifest += chunk;
      });

      response.on('end', function () {
        callback(null, manifest);
      });
    }).on('error', callback);
  }
});

module.exports = CloudRuntimeCollection;