/** Generated from: e2e/features/health.feature */
import { test } from "playwright-bdd";

test.describe("Kago Ride Service Health", () => {

  test("Health endpoint returns 200", async ({ Given, request, Then, And }) => {
    await Given("I request GET \"/health\"", null, { request });
    await Then("the HTTP status is 200");
    await And("the response body contains \"healthy\"");
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use("e2e/features/health.feature"),
  $bddFileMeta: ({}, use) => use(bddFileMeta),
});

const bddFileMeta = {
  "Health endpoint returns 200": {"pickleLocation":"3:3"},
};
