Feature: Website creation

  Scenario: Non Coadmin Git creation
    Given a not coadmin subscription publishsettings file
    And I clone the git repo https://github.com/azuresdkci/azuresdkci-repo
    When I import the publishsettings file
    Then current subscription is set correctly
    When I create a new website mytstsite with git integration using location West US
    Then the website mytstsite should be created in location West US
    And the local git repo should contain a remote called azure