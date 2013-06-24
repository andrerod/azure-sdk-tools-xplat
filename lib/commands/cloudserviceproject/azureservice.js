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

var fs = require('fs');

var _ = require('underscore');

var CloudRuntime = require('./cloudruntimes/cloudruntime');
var CloudRuntimeCollection = require('./cloudruntimes/cloudruntimecollection');
var utils = require('../../util/utils');
var js2xml = require('../../../node_modules/azure/lib/util/js2xml');

function AzureService(definitionFile) {
  this.definitionFile = definitionFile;
}

_.extend(AzureService.prototype, {
  resolveRuntimePackageUrls: function (callback) {
    var self = this;

    utils.parseXmlFile(self.definitionFile, function (err, parsedDefinition) {
      if (err) { return callback(err); }

      CloudRuntimeCollection.createCloudRuntimeCollection(function (err, runtimePackages) {
        if (err) { return callback(err); }

        var workerRoles = [];
        if (parsedDefinition.ServiceDefinition.WorkerRole) {
          workerRoles = parsedDefinition.ServiceDefinition.WorkerRole;

          if (!_.isArray(workerRoles)) {
            workerRoles = [ workerRoles ];
          }
        }

        var webRoles = [];
        if (parsedDefinition.ServiceDefinition.WebRole) {
          webRoles = parsedDefinition.ServiceDefinition.WebRole;

          if (!_.isArray(webRoles)) {
            webRoles = [ webRoles ];
          }
        }

        var roles = workerRoles.concat(webRoles);
        roles.forEach(function (role) {
          if (role.Startup) {
            var startupTask = CloudRuntime.getRuntimeStartupTask(role.Startup);
            if (startupTask) {
              self.clearRuntime(startupTask);
              var runtimes = self.createRuntime(startupTask);
              runtimes.forEach(function (runtime) {
                var match = runtimePackages.filter(function (runtimePackage) {
                  return runtimePackage.type === runtime.runtime;
                })[0];

                if (match) {
                  runtime.applyRuntime(match, role);
                }
              });
            }
          }
        });

        // Update definition file
        var updatedDefinition = js2xml.serialize(parsedDefinition);
        fs.writeFile(self.definitionFile, updatedDefinition, callback);
      });
    });
  },

  createRuntime: function (task) {
    var self = this;

    var settings = self.getStartupEnvironment(task);
    var runtimeTypes = self.getRuntimeTypes(settings);

    var runtimes = [];
    runtimeTypes.forEach(function (runtimeType) {
      var cloudRuntime = self.createRuntimeInternal(runtimeType);
      runtimes.push(cloudRuntime);
    });

    return runtimes;
  },

  createRuntimeInternal: function (runtimeType) {
    var runtime = new CloudRuntime();
    runtime.runtime = runtimeType;
    return runtime;
  },

  clearRuntime: function (task) {
    var variables = task.Environment.Variable;
    if (!_.isArray(variables)) {
      variables = [ variables ];
    }

    variables.forEach(function (variable) {
      if (variable['$']['name'] === 'RUNTIMEURL') {
        variable['$']['value'] = '';
      }
    });
  },

  getStartupEnvironment: function (startupTask) {
    var settings = {};

    var variables = startupTask.Environment.Variable;
    if (!_.isArray(variables)) {
      variables = [ variables ];
    }

    variables.forEach(function (variable) {
      settings[variable['$'].name] = variable['$'].value;
    });

    return settings;
  },

  getRuntimeTypes: function (settings) {
    var runtimes = [];

    if (settings['RUNTIMEOVERRIDEURL']) {
      runtimes.push('null');
    }

    if (settings['RUNTIMEID']) {
      var runtimeIds = settings['RUNTIMEID'].split(',');
      runtimeIds.forEach(function (runtimeId) {
        runtimes.push(runtimeId);
      });
    }

    return runtimes;
  }
});

module.exports = AzureService;