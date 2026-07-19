/** Generated from: e2e/features/ride.feature */
import { test } from "playwright-bdd";

test.describe("Kago Ride Lifecycle", () => {

  test.beforeEach(async ({ Given }) => {
    await Given("the API base is \"/api/grpc/etzhayyim.kago.v1.KagoRideService\"");
  });

  test("Estimate fare between two Tokyo locations", async ({ When, request, Then, And }) => {
    await When("I POST \"/EstimateFare\" with JSON:", {"docString":{"content":"{\n  \"pickup_lat\": 35.6812,\n  \"pickup_lng\": 139.7671,\n  \"dropoff_lat\": 35.6585,\n  \"dropoff_lng\": 139.7454\n}"}}, { request });
    await Then("the HTTP status is 200");
    await And("the response JSON has \"fare\"");
    await And("the response JSON has \"distance_meters\"");
    await And("the response JSON nested \"fare.total_amount\" is greater than 0");
  });

  test("List rides returns paginated results", async ({ When, request, Then }) => {
    await When("I POST \"/ListRides\" with JSON:", {"docString":{"content":"{\n  \"limit\": 10,\n  \"offset\": 0\n}"}}, { request });
    await Then("the HTTP status is 200");
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use("e2e/features/ride.feature"),
  $bddFileMeta: ({}, use) => use(bddFileMeta),
});

const bddFileMeta = {
  "Estimate fare between two Tokyo locations": {"pickleLocation":"6:3"},
  "List rides returns paginated results": {"pickleLocation":"21:3"},
};
