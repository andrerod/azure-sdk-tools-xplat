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
var path = require('path');
var util = require('util');

var _ = require('underscore');
var CsPack = require('cspack');

var ServiceSettings = require('./servicesettings');
var AzureService = require('./azureservice');

var Constants = require('../../util/constants');
var utils = require('../../util/utils');

function CloudServiceClient(cli, subscription) {
  this.cli = cli;
  this.subscription = subscription;

  this.serviceManagementService = this.createServiceManagementService();
}

_.extend(CloudServiceClient.prototype, {
  publishCloudService: function (packageFile, definitionFile, configFile, name, slot, location, affinityGroup, storageAccount, deploymentName, callback) {
    var self = this;

    // Initialize publish context
    options = self.createPublishContext(
      packageFile,
      definitionFile,
      configFile,
      name,
      slot,
      location,
      affinityGroup,
      storageAccount,
      deploymentName, function (err, context) {
        if (err) { return callback(err); }

        // Verify storage account exists
        self.createStorageServiceIfNotExist(context.storageAccountName, context.label, context.location, context.affinityGroup, function (err) {
          if (err) { return callback(err); }

          // Create cloud package
          if (!packageFile) {
            // Set package runtime information
            self.prepareCloudServicePackagesRuntime(context.definitionFile, function (err) {
              if (err) { return callback(err); }

              self.createPackage(context.packagePath, context.definitionFile, function (err) {
                if (err) { return callback(err); }

                uploadPackageFile();
              });
            });
          } else {
            uploadPackageFile();
          }

          function uploadPackageFile() {
            // Create cloud service
            self.createCloudServiceIfNotExist(context.serviceName, context.label, context.location, context.affinityGroup, function (err) {
              if (err) { return callback(err); }

              // Create or update deployment
              self.deploymentExists(context, function (err, exists) {
                if (err) { return callback(err); }

                if (!exists) {
                  self.createDeployment(context, callback);
                } else {
                  self.updateDeployment(context, callback);
                }
              });
            });
          }
        });
      });
  },

  createPublishContext: function(packageFile, definitionFile, configFile, name, slot, location, affinityGroup, storageAccount, deploymentName, callback) {
    var self = this;

    if (definitionFile) {
      utils.parseXmlFile(definitionFile, function (err, cloudServiceProject) {
        if (err) { return callback(err); }

        createContext(cloudServiceProject.ServiceDefinition['$'].name);
      });
    } else {
      createContext(null);
    }

    function createContext(cloudServiceProjectName) {
      var serviceSettings = ServiceSettings.loadDefaults(
        null,
        slot,
        location,
        affinityGroup,
        null,
        storageAccount,
        name,
        cloudServiceProjectName);

      if (deploymentName) {
        serviceSettings.deploymentName = deploymentName;
      } else {
        var nowDate = new Date();
        serviceSettings.deploymentName = serviceSettings.slot + util.format('%s-%s-%s-%s-%s-%s', nowDate.getYear(), nowDate.getMonth(), nowDate.getDay(), nowDate.getHours(), nowDate.getMinutes(), nowDate.getSeconds());
      }

      serviceSettings.definitionFile = definitionFile;
      serviceSettings.configPath = configFile;
      serviceSettings.packagePath = packageFile;
      if (!serviceSettings.packagePath) {
        serviceSettings.packagePath = path.join(path.dirname(definitionFile), Constants.DEFAULT_PACKAGE_NAME);
      }

      // Use default location if no location and affinity group provided
      if (!serviceSettings.location && !serviceSettings.affinityGroup) {
        self.getDefaultLocation(self.serviceManagementService, function (err, location) {
          if (err) { return callback(err); }

          serviceSettings.location = location;
          callback(null, serviceSettings);
        });
      } else {
        callback(null, serviceSettings);
      }
    }
  },

  createPackage: function (outputFile, definitionFile, callback) {
    var self = this;

    var progress = self.cli.progress('Creating package');

    var csPack = new CsPack({
      inputDirectory: path.dirname(definitionFile),
      outputFile: outputFile,
      serviceDefinitionFile: definitionFile
    });

    csPack.execute(function (err) {
      progress.end();

      callback(err);
    });
  },

  cloudServiceExists: function (name, callback) {
    var self = this;

    var progress = self.cli.progress('Finding cloud service');
    self.serviceManagementService.getHostedService(name, function (err, rsp) {
      progress.end();

      if (err && rsp.statusCode !== 404) { return callback(err); }

      callback(null, rsp.statusCode !== 404);
    });
  },

  createCloudServiceIfNotExist: function (name, label, location, affinityGroup, callback) {
    var self = this;

    self.cloudServiceExists(name, function (err, exists) {
      if (err || exists) { return callback(err); }

      var createOptions = {};
      if (location) {
        createOptions.Location = location;
      }

      if (affinityGroup) {
        createOptions.AffinityGroup = affinityGroup;
      }

      if (label) {
        createOptions.Label = label;
      }

      var progress = self.cli.progress('Creating cloud service');
      self.serviceManagementService.createHostedService(name, createOptions, function (err) {
        progress.end();

        callback(err);
      });
    });
  },

  prepareCloudServicePackagesRuntime: function(definitionFile, callback) {
    var cloudServiceProject = new AzureService(definitionFile);
    cloudServiceProject.resolveRuntimePackageUrls(callback);
  },

  getDefaultLocation: function(serviceManagementService, callback) {
    serviceManagementService.listLocations(function (err, location) {
      if (err) { return callback(err); }

      callback(null, location.body[0].Name);
    });
  },

  createStorageServiceIfNotExist: function(name, label, location, affinityGroup, callback) {
    var self = this;

    var progress = self.cli.progress('Finding storage account');
    utils.doServiceManagementOperation(self.serviceManagementService,
      'getStorageAccountProperties',
      name,
      function (err, rsp) {
        progress.end();

        if (err && rsp.statusCode !== 404) {
          return callback(err);
        }

        if (rsp.statusCode === 404) {
          progress = self.cli.progress('Creating storage account');
          utils.doServiceManagementOperation(self.serviceManagementService,
            'createStorageAccount',
            name, {
              Location: location,
              AffinityGroup: affinityGroup
            },
            function (err, rsp) {
              progress.end();

              if (err && rsp.statusCode !== 409) {
                return callback(err);
              }

              callback();
            });
        } else {
          callback();
        }
      });
  },

  deploymentExists: function(context, callback) {
    var self = this;

    var progress = self.cli.progress('Getting deployments');
    utils.doServiceManagementOperation(self.serviceManagementService,
      'getDeploymentBySlot',
      context.serviceName,
      context.slot,
      function(err, rsp) {
        progress.end();

        if (err && rsp.statusCode !== 404) {
          return callback(err);
        }

        callback(null, rsp.statusCode !== 404);
      });
  },

  createDeployment: function(context, callback) {
    var self = this;

    self.uploadPackage(context, function (err, packageUri) {
      if (err) { return callback(err); }

      var configuration = fs.readFileSync(context.configPath);

      var deploymentOptions = {
        Name: context.deploymentName,
        PackageUrl: packageUri,
        Label: context.serviceName,
        Configuration: new Buffer(configuration.toString()).toString('base64'),
        StartDeployment: true
      };

      progress = self.cli.progress('Creating deployment');

      utils.doServiceManagementOperation(self.serviceManagementService,
        'createDeploymentBySlot',
        context.serviceName,
        context.slot,
        deploymentOptions,
        function (err) {
          progress.end();

          if (err) { return callback(err); }

          callback();
        });
    });
  },

  updateDeployment: function (context, callback) {
    var self = this;

    self.uploadPackage(context, function (err, packageUri) {
      if (err) { return callback(err); }

      var configuration = fs.readFileSync(context.configPath);

      var deploymentOptions = {
        PackageUrl: packageUri,
        Label: context.serviceName,
        Configuration: new Buffer(configuration.toString()).toString('base64'),
        Mode: 'auto',
        Force: true
      };

      progress = self.cli.progress('Upgrading deployment');
      utils.doServiceManagementOperation(self.serviceManagementService,
        'upgradeDeploymentBySlot',
        context.serviceName,
        context.slot,
        deploymentOptions,
        function (err) {
          progress.end();

          if (err) { return callback(err); }

          callback();
        });
    });
  },

  uploadPackage: function (context, callback) {
    var self = this;

    var progress = self.cli.progress('Uploading package');

    utils.doServiceManagementOperation(self.serviceManagementService,
      'getStorageAccountKeys',
      context.storageAccountName,
      function(err, rsp) {
        if (err) { return callback(err); }

        var blobService = utils.createBlobService(context.storageAccountName, rsp.body.StorageServiceKeys.Primary);

        // TODO: add support for packages larger than 32MB
        blobService.createContainerIfNotExists('packages', function (err) {
          if (err) { return callback(err); }

          blobService.createBlockBlobFromFile('packages', path.basename(context.packagePath), context.packagePath, function (err, blob) {
            progress.end();

            if (err) { return callback(err); }

            callback(null, blobService.getBlobUrl(blob.container, blob.blob));
          });
        });
      });
  },

  createServiceManagementService: function() {
    var self = this;
    var account = self.cli.category('account');
    var subscriptionId = account.lookupSubscriptionId(self.subscription);
    return utils.createServiceManagementService(subscriptionId, account, self.cli.output);
  }
});

module.exports = CloudServiceClient;