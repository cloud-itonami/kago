Feature: Debug White Screen

  Scenario: Page loads without JS errors
    Given I visit "/" and capture errors
    Then I capture a screenshot
