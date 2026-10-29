/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Login from "../src/views/Login.vue";
import AuthServices from "../src/services/authServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

const setFields = async (wrapper, values) => {
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

  describe("US-1.2 — Sign in", () => {
    it("User signs in with invalid password", async () => {
      AuthServices.loginUser.mockRejectedValue({
        response: {
          status: 401,
          data: { message: "Invalid username or password." },
        },
      });

      const { wrapper, router } = await mountWithPlugins(Login);
      await router.push({ name: "login" });
      await setFields(wrapper, { Username: "jdoe", Password: "wrong-password" });
      await submitForm(wrapper);

      expect(AuthServices.loginUser).toHaveBeenCalled();
      expect(wrapper.find(".v-alert").exists()).toBe(true);
      expect(wrapper.text()).toContain("Invalid username or password.");
      expect(router.currentRoute.value.name).toBe("login");
    });

    it("User signs in with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Login);
      await setFields(wrapper, { Username: "", Password: "password123" });
      await submitForm(wrapper);

      expect(wrapper.text()).toContain("Username is required.");
      expect(AuthServices.loginUser).not.toHaveBeenCalled();
    });

    it("User signs in with missing password", async () => {
      const { wrapper } = await mountWithPlugins(Login);
      await setFields(wrapper, { Username: "jdoe", Password: "" });
      await submitForm(wrapper);

      expect(wrapper.text()).toContain("Password is required.");
      expect(AuthServices.loginUser).not.toHaveBeenCalled();
    });
  });
});
