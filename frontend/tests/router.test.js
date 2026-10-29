/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

import { beforeEach, describe, expect, it } from "vitest";
import router from "../src/router.js";
import Utils from "../src/config/utils.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(async () => {
    localStorage.clear();
    await router.push({ name: "login" });
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("Signed-in user visits login page", async () => {
      await router.push({ name: "register" });

      Utils.setStore("user", {
        userId: 1,
        username: "jdoe",
        fName: "Jane",
        token: "valid-token",
        role: "worker",
      });

      await router.push({ name: "login" });

      expect(router.currentRoute.value.name).toBe("home");
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      await router.push({ name: "home" });

      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});
