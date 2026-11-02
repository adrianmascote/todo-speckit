/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import TodoServices from "../src/services/todoServices.js";
import router from "../src/router.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/todoServices.js", () => ({
  default: {
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
  },
}));

const groceries = { id: 1, name: "Groceries", userId: 42 };
const work = { id: 2, name: "Work", userId: 42 };
const personal = { id: 3, name: "Personal", userId: 42 };

const clickButtonByText = async (wrapper, text) => {
  const vueButton = wrapper
    .findAllComponents({ name: "VBtn" })
    .find((node) => node.text().includes(text));

  if (vueButton) {
    await vueButton.trigger("click");
    await flushPromises();
    return;
  }

  const domButton = [...document.body.querySelectorAll(".v-btn")].find((node) =>
    node.textContent.includes(text)
  );
  expect(domButton).toBeTruthy();
  domButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await flushPromises();
};

const setListName = async (wrapper, value) => {
  const field = wrapper
    .findAllComponents({ name: "VTextField" })
    .find((node) => node.props("label") === "List name");

  if (field) {
    await field.setValue(value);
    return;
  }

  const input = document.body.querySelector('input[aria-label="List name"], input');
  expect(input).toBeTruthy();
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await flushPromises();
};

const mountDashboard = async () => {
  return mountWithPlugins(Dashboard, { attachTo: document.body });
};

describe("Feature 2 — Todo List Management", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    vi.clearAllMocks();
    TodoServices.getLists.mockResolvedValue({ data: [] });
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      TodoServices.getLists
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [groceries] });
      TodoServices.createList.mockResolvedValue({
        status: 201,
        data: groceries,
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await clickButtonByText(wrapper, "New List");
      await setListName(wrapper, "Groceries");
      await clickButtonByText(wrapper, "Create");

      expect(TodoServices.createList).toHaveBeenCalledWith({ name: "Groceries" });
      expect(wrapper.text()).toContain("Groceries");
      expect(wrapper.text()).not.toContain("New list");
    });

    it("User creates a list with an empty name", async () => {
      const { wrapper } = await mountDashboard();
      await flushPromises();

      await clickButtonByText(wrapper, "New List");
      await setListName(wrapper, "   ");
      await clickButtonByText(wrapper, "Create");

      expect(document.body.textContent).toContain("List name is required.");
      expect(TodoServices.createList).not.toHaveBeenCalled();
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      TodoServices.getLists.mockResolvedValue({ data: [work, personal] });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      expect(wrapper.text()).toContain("Work");
      expect(wrapper.text()).toContain("Personal");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
    });

    it("User has no lists", async () => {
      const { wrapper } = await mountDashboard();
      await flushPromises();

      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
    });
  });

  describe("US-2.3 — Manage list rows", () => {
    it("List rows show edit and delete actions", async () => {
      TodoServices.getLists.mockResolvedValue({ data: [groceries] });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      expect(wrapper.text()).toContain("Groceries");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      TodoServices.getLists
        .mockResolvedValueOnce({ data: [groceries] })
        .mockResolvedValueOnce({
          data: [{ ...groceries, name: "Shopping" }],
        });
      TodoServices.updateList.mockResolvedValue({
        status: 200,
        data: { ...groceries, name: "Shopping" },
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await wrapper.get('[aria-label="Edit list"]').trigger("click");
      await flushPromises();
      await setListName(wrapper, "Shopping");
      await clickButtonByText(wrapper, "Save");

      expect(TodoServices.updateList).toHaveBeenCalledWith(1, { name: "Shopping" });
      expect(wrapper.text()).toContain("Shopping");
      expect(wrapper.text()).not.toContain("Groceries");
    });

    it("User deletes a list", async () => {
      TodoServices.getLists
        .mockResolvedValueOnce({ data: [groceries] })
        .mockResolvedValueOnce({ data: [] });
      TodoServices.deleteList.mockResolvedValue({ status: 200 });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await wrapper.get('[aria-label="Delete list"]').trigger("click");
      await flushPromises();
      await clickButtonByText(wrapper, "Delete");

      expect(TodoServices.deleteList).toHaveBeenCalledWith(1);
      expect(wrapper.text()).not.toContain("Groceries");
    });
  });

  describe("US-2.5 — Private lists only", () => {
    it("Unauthenticated user accesses the dashboard", async () => {
      await router.push({ name: "login" });
      await router.push({ name: "home" });

      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});
