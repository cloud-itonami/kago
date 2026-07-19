/** Generated from: e2e/features/debug.feature */
import { test } from "playwright-bdd";

test.describe("Debug White Screen", () => {

  test("Page loads without JS errors", async ({ Given, page, Then }) => {
    await Given("I visit \"/\" and capture errors", null, { page });
    await Then("I capture a screenshot", null, { page });
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use("e2e/features/debug.feature"),
  $bddFileMeta: ({}, use) => use(bddFileMeta),
});

const bddFileMeta = {
  "Page loads without JS errors": {"pickleLocation":"3:3"},
};
