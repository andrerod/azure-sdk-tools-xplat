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

function ServiceSettings() {
}

_.extend(ServiceSettings, {
  loadDefaults: function (path, slot, location, affinityGroup, subscription, storageAccountName, suppliedServiceName, serviceDefinitionName) {
    // TODO: add support for local settings
    var serviceName = ServiceSettings.getServiceName(suppliedServiceName, serviceDefinitionName);

    return {
      slot: ServiceSettings.getDefaultSlot(null, null, slot),
      location: ServiceSettings.getDefaultLocation(),
      subscription: ServiceSettings.getDefaultSubscription(null, subscription),
      serviceName: serviceName,
      storageAccountName: ServiceSettings.getDefaultStorageName(null, null, storageAccountName, serviceName),
      affinityGroup: affinityGroup
    };
  },

  getDefaultLocation: function (localLocation, location) {
    if (location) {
      return location.toLowerCase();
    }

    if (localLocation) {
      return localLocation.toLowerCase();
    }

    // TODO: dont return null here but rather a default location
    return null;
  },

  getDefaultSlot: function (localSlot, globalSlot, slot) {
    if (slot) {
      return slot;
    } else if (localSlot) {
      return localSlot;
    } else if (globalSlot) {
      return globalSlot;
    }

    // If none of previous succeed, use Production as default slot
    return 'production';
  },

  getDefaultSubscription: function (localSubscription, subscription) {
    if (subscription) {
      return subscription;
    }

    if (localSubscription) {
      return localSubscription;
    }

    return null;
  },

  getServiceName: function (suppliedServiceName, serviceDefinitionName) {
    if (suppliedServiceName) {
      return suppliedServiceName;
    }

    return serviceDefinitionName;
  },

  getDefaultStorageName: function (localStorageName, globalStorageName, storageAccountName, serviceName) {
    if (storageAccountName) {
      return storageAccountName;
    } else if (localStorageName) {
      return localStorageName;
    } else if (globalStorageName) {
      return globalStorageName;
    }

    return serviceName;
  }
});

module.exports = ServiceSettings;