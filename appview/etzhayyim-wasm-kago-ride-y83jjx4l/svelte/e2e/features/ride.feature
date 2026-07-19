Feature: Kago Ride Lifecycle

  Background:
    Given the API base is "/api/grpc/etzhayyim.kago.v1.KagoRideService"

  Scenario: Estimate fare between two Tokyo locations
    When I POST "/EstimateFare" with JSON:
      """
      {
        "pickup_lat": 35.6812,
        "pickup_lng": 139.7671,
        "dropoff_lat": 35.6585,
        "dropoff_lng": 139.7454
      }
      """
    Then the HTTP status is 200
    And the response JSON has "fare"
    And the response JSON has "distance_meters"
    And the response JSON nested "fare.total_amount" is greater than 0

  Scenario: List rides returns paginated results
    When I POST "/ListRides" with JSON:
      """
      {
        "limit": 10,
        "offset": 0
      }
      """
    Then the HTTP status is 200
