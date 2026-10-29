/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Register from "../src/views/Register.vue";
import AuthServices from "../src/services/authServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

const fillValidRegistration = async (wrapper, overrides = {}) => {
  const values = {
    "First name": "Jane",
    "Last name": "Doe",
    Email: "jane@example.com",
    Username: "jdoe",
    Password: "password123",
    "Confirm password": "password123",
    ...overrides,
  };

  for (const field of wrapper.findAllComponents({ name: "VTextField" })) {
    const label = field.props("label");
    if (label in values) {
      await field.setValue(values[label]);
    }
  }
};

const submitForm = async (wrapper) => {
  await wrapper.get("form").trigger("submit.prevent");
  await flushPromises();
};

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-1.1 — Registration", () => {
    it("User submits registration with invalid email format", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fillValidRegistration(wrapper, { Email: "notanemail" });
      await submitForm(wrapper);

      expect(wrapper.text()).toContain("Enter a valid email address.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fillValidRegistration(wrapper, { Username: "" });
      await submitForm(wrapper);

      expect(wrapper.text()).toContain("Username is required.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with password too short", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fillValidRegistration(wrapper, {
        Password: "short",
        "Confirm password": "short",
      });
      await submitForm(wrapper);

      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with mismatched passwords", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fillValidRegistration(wrapper, { "Confirm password": "different1" });
      await submitForm(wrapper);

      expect(wrapper.text()).toContain("Passwords do not match.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });
  });
});
