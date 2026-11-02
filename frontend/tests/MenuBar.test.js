/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises } from "@vue/test-utils";
import MenuBar from "../src/components/MenuBar.vue";
import AuthServices from "../src/services/authServices.js";
import UserServices from "../src/services/userServices.js";
import Utils from "../src/config/utils.js";
import router from "../src/router.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    logoutUser: vi.fn(),
  },
}));

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

const sessionUser = {
  userId: 1,
  fName: "Jane",
  lName: "Doe",
  username: "jdoe",
  email: "jdoe@example.com",
  role: "worker",
  token: "valid-token",
};

const clickAriaLabel = async (wrapper, label) => {
  const fromWrapper = wrapper.find(`[aria-label="${label}"]`);
  if (fromWrapper.exists()) {
    await fromWrapper.trigger("click");
    await flushPromises();
    return;
  }

  const fromBody = document.body.querySelector(`[aria-label="${label}"]`);
  expect(fromBody).toBeTruthy();
  fromBody.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await flushPromises();
};

const clickExactButton = async (wrapper, text) => {
  const vueButton = wrapper
    .findAllComponents({ name: "VBtn" })
    .find((node) => node.text().trim() === text);

  if (vueButton) {
    await vueButton.trigger("click");
    await flushPromises();
    return;
  }

  const domButton = [...document.body.querySelectorAll(".v-btn")].find(
    (node) => node.textContent.trim() === text
  );
  expect(domButton).toBeTruthy();
  domButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await flushPromises();
};

const setFieldByLabel = async (wrapper, label, value) => {
  const field = wrapper
    .findAllComponents({ name: "VTextField" })
    .find((node) => node.props("label") === label);

  if (field) {
    await field.setValue(value);
    return;
  }

  const input = document.body.querySelector(`input[aria-label="${label}"]`);
  expect(input).toBeTruthy();
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await flushPromises();
};

const MenuBarHost = defineComponent({
  components: { MenuBar },
  template: "<v-app><MenuBar /></v-app>",
});

const mountMenuBar = async () => {
  Utils.setStore("user", sessionUser);
  return mountWithPlugins(MenuBarHost, { attachTo: document.body });
};

const openProfileMenu = async (wrapper) => {
  await clickAriaLabel(wrapper, "Profile");
};

const openEditDialog = async (wrapper) => {
  await openProfileMenu(wrapper);
  await clickExactButton(wrapper, "Edit Profile");
};

describe("Feature 4 — User Profile Management", () => {
  beforeEach(async () => {
    localStorage.clear();
    document.body.innerHTML = "";
    vi.clearAllMocks();
    AuthServices.logoutUser.mockResolvedValue({ status: 200 });
    Utils.setStore("user", sessionUser);
    await router.push({ name: "home" });
  });

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      const { wrapper } = await mountMenuBar();
      await openProfileMenu(wrapper);

      expect(document.body.textContent).toContain("Jane Doe");
      expect(document.body.textContent).toContain("jdoe");
      expect(document.body.textContent).toContain("jdoe@example.com");
      expect(document.body.textContent).toContain("Edit Profile");
      expect(document.body.textContent).toContain("Log out");
    });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);

      expect(document.body.textContent).toContain("Edit Profile");
      const firstName = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((node) => node.props("label") === "First name");
      const lastName = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((node) => node.props("label") === "Last name");
      const email = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((node) => node.props("label") === "Email");
      const username = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((node) => node.props("label") === "Username");

      expect(firstName.props("modelValue")).toBe("Jane");
      expect(lastName.props("modelValue")).toBe("Doe");
      expect(email.props("modelValue")).toBe("jdoe@example.com");
      expect(username.props("modelValue")).toBe("jdoe");
    });

    it("User cancels the edit profile dialog", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);
      await setFieldByLabel(wrapper, "First name", "Janet");
      await clickExactButton(wrapper, "Cancel");

      expect(UserServices.updateUser).not.toHaveBeenCalled();
      expect(Utils.getStore("user").fName).toBe("Jane");
      const dialog = wrapper.findComponent({ name: "VDialog" });
      expect(dialog.props("modelValue")).toBe(false);
    });

    it("User saves profile changes", async () => {
      UserServices.updateUser.mockResolvedValue({
        status: 200,
        data: {
          id: 1,
          fName: "Janet",
          lName: "Doe",
          email: "janet@example.com",
          username: "janet",
          role: "worker",
        },
      });

      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);
      await setFieldByLabel(wrapper, "First name", "Janet");
      await setFieldByLabel(wrapper, "Email", "janet@example.com");
      await setFieldByLabel(wrapper, "Username", "janet");
      await clickExactButton(wrapper, "Save");

      expect(UserServices.updateUser).toHaveBeenCalledWith(1, {
        fName: "Janet",
        lName: "Doe",
        email: "janet@example.com",
        username: "janet",
      });
      expect(Utils.getStore("user")).toMatchObject({
        fName: "Janet",
        email: "janet@example.com",
        username: "janet",
        token: "valid-token",
      });
      expect(Utils.getStore("user").password).toBeUndefined();

      await openProfileMenu(wrapper);
      expect(document.body.textContent).toContain("Janet Doe");
      expect(document.body.textContent).toContain("janet@example.com");
    });

    it("User saves profile with invalid email format", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);
      await setFieldByLabel(wrapper, "Email", "notanemail");
      await clickExactButton(wrapper, "Save");

      expect(document.body.textContent).toContain("Enter a valid email address.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with mismatched passwords", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);
      await setFieldByLabel(wrapper, "New password", "password123");
      await setFieldByLabel(wrapper, "Confirm password", "different");
      await clickExactButton(wrapper, "Save");

      expect(document.body.textContent).toContain("Passwords do not match.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with a password that is too short", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);
      await setFieldByLabel(wrapper, "New password", "short");
      await setFieldByLabel(wrapper, "Confirm password", "short");
      await clickExactButton(wrapper, "Save");

      expect(document.body.textContent).toContain("Password must be at least 8 characters.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("Profile update API returns an error", async () => {
      UserServices.updateUser.mockRejectedValue({
        response: {
          status: 400,
          data: { message: "Username is already taken." },
        },
      });

      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);
      await clickExactButton(wrapper, "Save");

      expect(document.body.querySelector(".v-alert")).toBeTruthy();
      expect(document.body.textContent).toContain("Username is already taken.");
      expect(document.body.textContent).toContain("Edit Profile");
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      const { wrapper } = await mountMenuBar();
      await router.push({ name: "home" });
      await openProfileMenu(wrapper);
      await clickExactButton(wrapper, "Log out");
      await flushPromises();

      expect(AuthServices.logoutUser).toHaveBeenCalled();
      expect(Utils.getStore("user")).toBeNull();
      expect(router.currentRoute.value.name).toBe("login");
    });
  });

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      const { wrapper } = await mountMenuBar();

      expect(wrapper.text()).not.toContain("Sign out");
      expect(wrapper.find('[aria-label="Profile"]').exists()).toBe(true);
    });
  });
});
