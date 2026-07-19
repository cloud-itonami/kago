/** Generated from: e2e/features/driver.feature */
import { test } from "playwright-bdd";

test.describe("Kago Driver Operations", () => {

  test.beforeEach(async ({ Given }) => {
    await Given("the API base is \"/api/grpc/etzhayyim.kago.v1.KagoRideService\"");
  });

  test("Register a new driver", async ({ When, request, Then, And }) => {
    await When("I POST \"/DriverRegister\" with JSON:", {"docString":{"content":"{\n  \"name\": \"Test Driver\",\n  \"vehicle_type\": \"sedan\",\n  \"lat\": 35.6812,\n  \"lng\": 139.7671\n}"}}, { request });
    await Then("the HTTP status is 200");
    await And("the response JSON has \"driver\"");
    await And("the response JSON nested \"driver.id\" is not empty");
  });

  test("Register and update driver location", async ({ Given, request, When, Then }) => {
    await Given("a registered driver", null, { request });
    await When("I POST \"/DriverUpdateLocation\" with the driver ID and JSON:", {"docString":{"content":"{\n  \"lat\": 35.6900,\n  \"lng\": 139.7600\n}"}}, { request });
    await Then("the HTTP status is 200");
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use("e2e/features/driver.feature"),
  $bddFileMeta: ({}, use) => use(bddFileMeta),
});

const bddFileMeta = {
  "Register a new driver": {"pickleLocation":"6:3"},
  "Register and update driver location": {"pickleLocation":"20:3"},
};
