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

var _ = require('underscore');

function CloudRuntime() { }

_.extend(CloudRuntime, {
  getRuntimeStartupTask: function (roleStartup) {
    var tasks = roleStartup.Task;
    if (!_.isArray(tasks)) {
      tasks = [ tasks ];
    }

    var match = tasks.filter(function (task) {
      return task['$'].commandLine === 'setup_worker.cmd > log.txt' ||
        task['$'].commandLine === 'setup_web.cmd &gt; log.txt';
    })[0];

    return match;
  }
});

_.extend(CloudRuntime.prototype, {
  applyRuntime: function (runtimePackage, role) {
    var self = this;

    var changes = self.getChanges(runtimePackage);

    var environment = CloudRuntime.getRuntimeStartupTask(role.Startup).Environment;
    var variables = environment.Variable;
    if (!_.isArray(variables)) {
      variables = [ variables ];
    }

    self.applySettingChanges(changes, variables);
  },

  applySettingChanges: function (settings, roleVariables) {
    Object.keys(settings).forEach(function (setting) {
      var match = roleVariables.filter(function (variable) {
        return variable['$']['name'] === setting;
      })[0];

      if (match) {
        match['$']['value'] = settings[setting];
      }
    });
  },

  getChanges: function (runtimePackage) {
    return {
      'RUNTIMEID': runtimePackage.type,
      'RUNTIMEURL': runtimePackage.baseUri + runtimePackage.filepath
    };
  }
});

module.exports = CloudRuntime;