Feature: Kago Driver Operations

  Background:
    Given the API base is "/api/grpc/etzhayyim.kago.v1.KagoRideService"

  Scenario: Register a new driver
    When I POST "/DriverRegister" with JSON:
      """
      {
        "name": "Test Driver",
        "vehicle_type": "sedan",
        "lat": 35.6812,
        "lng": 139.7671
      }
      """
    Then the HTTP status is 200
    And the response JSON has "driver"
    And the response JSON nested "driver.id" is not empty

  Scenario: Register and update driver location
    Given a registered driver
    When I POST "/DriverUpdateLocation" with the driver ID and JSON:
      """
      {
        "lat": 35.6900,
        "lng": 139.7600
      }
      """
    Then the HTTP status is 200
