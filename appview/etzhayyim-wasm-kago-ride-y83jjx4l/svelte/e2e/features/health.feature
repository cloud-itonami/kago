Feature: Kago Ride Service Health

  Scenario: Health endpoint returns 200
    Given I request GET "/health"
    Then the HTTP status is 200
    And the response body contains "healthy"
