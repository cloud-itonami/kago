import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import * as fs from "fs";

const { Given, When, Then } = createBdd();

// -- State --
let apiBase = "";
let response: { status: number; body: any; text: string } | null = null;
let driverId = "";

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((o, k) => o?.[k], obj);
}

// -- Given --

Given("I request GET {string}", async ({ request }, path: string) => {
  const res = await request.get(path);
  const text = await res.text();
  let body: any = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  response = { status: res.status(), body, text };
});

Given("the API base is {string}", async ({}, base: string) => {
  apiBase = base;
});

Given("a registered driver", async ({ request }) => {
  const res = await request.post(`${apiBase}/DriverRegister`, {
    headers: { "Content-Type": "application/json" },
    data: {
      name: "E2E Test Driver",
      'vehicleType': "sedan",
      lat: 35.6812,
      lng: 139.7671,
    },
  });
  const body = await res.json();
  driverId = body.driver?.id || "";
});

// -- When --

When(
  "I POST {string} with JSON:",
  async ({ request }, path: string, docString: string) => {
    const url = apiBase ? `${apiBase}${path}` : path;
    const data = JSON.parse(docString);
    const res = await request.post(url, {
      headers: { "Content-Type": "application/json" },
      data,
    });
    const text = await res.text();
    let body: any = null;
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
    response = { status: res.status(), body, text };
  },
);

When(
  "I POST {string} with the driver ID and JSON:",
  async ({ request }, path: string, docString: string) => {
    const url = apiBase ? `${apiBase}${path}` : path;
    const data = { ...JSON.parse(docString), id: driverId };
    const res = await request.post(url, {
      headers: { "Content-Type": "application/json" },
      data,
    });
    const text = await res.text();
    let body: any = null;
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
    response = { status: res.status(), body, text };
  },
);

// -- Then --

Then("the HTTP status is {int}", async ({}, status: number) => {
  expect(response).not.toBeNull();
  expect(response!.status).toBe(status);
});

Then("the response body contains {string}", async ({}, expected: string) => {
  expect(response).not.toBeNull();
  expect(response!.text).toContain(expected);
});

Then("the response JSON has {string}", async ({}, key: string) => {
  expect(response).not.toBeNull();
  expect(response!.body).toBeDefined();
  expect(response!.body).toHaveProperty(key);
});

Then(
  "the response JSON {string} equals {string}",
  async ({}, key: string, expected: string) => {
    expect(response).not.toBeNull();
    expect(response!.body[key]).toBe(expected);
  },
);

Then(
  "the response JSON {string} is greater than {int}",
  async ({}, key: string, min: number) => {
    expect(response).not.toBeNull();
    expect(Number(response!.body[key])).toBeGreaterThan(min);
  },
);

Then(
  "the response JSON nested {string} is greater than {int}",
  async ({}, path: string, min: number) => {
    expect(response).not.toBeNull();
    const val = getNestedValue(response!.body, path);
    expect(Number(val)).toBeGreaterThan(min);
  },
);

Then(
  "the response JSON nested {string} is not empty",
  async ({}, path: string) => {
    expect(response).not.toBeNull();
    const val = getNestedValue(response!.body, path);
    expect(val).toBeTruthy();
  },
);

// -- Browser steps --

Given("I visit {string} and capture errors", async ({ page }, url: string) => {
  const errors: string[] = [];
  const logs: string[] = [];
  const failedReqs: string[] = [];
  page.on("console", (msg) => {
    const line = `[${msg.type()}] ${msg.text()}`;
    logs.push(line);
    if (msg.type() === "error") errors.push(line);
  });
  page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));
  page.on("requestfailed", (req) =>
    failedReqs.push(`[reqfail] ${req.url()} ${req.failure()?.errorText}`),
  );
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(3000);
  (page as any).__errors = errors;
  (page as any).__logs = logs;
  (page as any).__failedReqs = failedReqs;
});

Given("I visit {string}", async ({ page }, url: string) => {
  await page.goto(url, { waitUntil: "load", timeout: 15000 });
});

Then("the page title contains {string}", async ({ page }, text: string) => {
  const title = await page.title();
  expect(title).toContain(text);
});

Then("I capture a screenshot", async ({ page }) => {
  const errors: string[] = (page as any).__errors || [];
  const logs: string[] = (page as any).__logs || [];
  const failedReqs: string[] = (page as any).__failedReqs || [];
  const screenshot = await page.screenshot({ fullPage: true });
  fs.writeFileSync("/tmp/kago-screenshot.png", screenshot);
  console.log("\n=== ALL CONSOLE LOGS ===");
  logs.forEach((l) => console.log(l));
  console.log("\n=== FAILED REQUESTS ===");
  failedReqs.forEach((r) => console.log(r));
  console.log("\n=== JS ERRORS ===");
  errors.forEach((e) => console.log(e));
  const bodyText = await page.textContent("body");
  console.log("\n=== BODY TEXT ===", bodyText?.trim().substring(0, 500) || "(empty)");
  const html = await page.content();
  console.log("\n=== HTML HEAD (title/meta) ===");
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/);
  console.log("Title:", titleMatch?.[1] || "(none)");
});
