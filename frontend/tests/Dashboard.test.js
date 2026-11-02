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
    getTodos: vi.fn(),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
  },
}));

const groceries = { id: 1, name: "Groceries", userId: 42 };
const work = { id: 2, name: "Work", userId: 42 };
const personal = { id: 3, name: "Personal", userId: 42 };
const buyMilk = { id: 10, listId: 1, title: "Buy milk", completed: false, userId: 42 };
const callMom = { id: 11, listId: 3, title: "Call mom", completed: false, userId: 42 };
const emailClient = { id: 12, listId: 2, title: "Email client", completed: false, userId: 42 };
const writeReport = { id: 13, listId: 2, title: "Write report", completed: false, userId: 42 };

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

  const input = document.body.querySelector(`input[aria-label="${label}"], input`);
  expect(input).toBeTruthy();
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
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
    TodoServices.getTodos.mockResolvedValue({ data: [] });
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

describe("Feature 3 — Todo List Item Management", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    vi.clearAllMocks();
    TodoServices.getLists.mockResolvedValue({ data: [groceries] });
    TodoServices.getTodos.mockResolvedValue({ data: [] });
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [buyMilk] });
      TodoServices.createTodo.mockResolvedValue({
        status: 201,
        data: buyMilk,
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await wrapper.get('[aria-label="Items"]').trigger("click");
      await flushPromises();
      await clickButtonByText(wrapper, "Add Item");
      await setFieldByLabel(wrapper, "Todo title", "Buy milk");
      await clickExactButton(wrapper, "Add");

      expect(TodoServices.createTodo).toHaveBeenCalledWith(1, { title: "Buy milk" });
      expect(document.body.textContent).toContain("Buy milk");
    });

    it("User adds a todo with an empty title", async () => {
      const { wrapper } = await mountDashboard();
      await flushPromises();

      await wrapper.get('[aria-label="Items"]').trigger("click");
      await flushPromises();
      await clickButtonByText(wrapper, "Add Item");
      await setFieldByLabel(wrapper, "Todo title", "   ");
      await clickExactButton(wrapper, "Add");

      expect(document.body.textContent).toContain("Todo title is required.");
      expect(TodoServices.createTodo).not.toHaveBeenCalled();
    });

    it("Add item is only available inside the items dialog", async () => {
      const { wrapper } = await mountDashboard();
      await flushPromises();

      expect(wrapper.text()).not.toContain("Add Item");
      expect(wrapper.find('[aria-label="Items"]').exists()).toBe(true);
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("List items dialog shows empty state", async () => {
      TodoServices.getLists.mockResolvedValue({ data: [personal] });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await wrapper.get('[aria-label="Items"]').trigger("click");
      await flushPromises();

      expect(document.body.textContent).toContain("No todos in this list yet.");
    });

    it("User opens items for different lists", async () => {
      TodoServices.getLists.mockResolvedValue({ data: [work, personal] });
      TodoServices.getTodos.mockImplementation((listId) => {
        if (listId === personal.id) {
          return Promise.resolve({ data: [callMom] });
        }
        if (listId === work.id) {
          return Promise.resolve({ data: [emailClient, writeReport] });
        }
        return Promise.resolve({ data: [] });
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      const itemButtons = wrapper.findAll('[aria-label="Items"]');
      await itemButtons[1].trigger("click");
      await flushPromises();
      expect(document.body.textContent).toContain("Call mom");
      expect(document.body.textContent).not.toContain("Email client");

      await clickExactButton(wrapper, "Close");
      await itemButtons[0].trigger("click");
      await flushPromises();

      expect(document.body.textContent).toContain("Email client");
      expect(document.body.textContent).toContain("Write report");
      expect(document.body.textContent).not.toContain("Call mom");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      TodoServices.getTodos.mockResolvedValue({ data: [buyMilk] });
      TodoServices.updateTodo.mockResolvedValue({
        status: 200,
        data: { ...buyMilk, completed: true },
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await wrapper.get('[aria-label="Items"]').trigger("click");
      await flushPromises();

      await clickAriaLabel(wrapper, "Toggle Buy milk");

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, { completed: true });
      expect(document.body.querySelector(".text-decoration-line-through")).toBeTruthy();
    });

    it("User marks a completed todo as incomplete", async () => {
      TodoServices.getTodos.mockResolvedValue({
        data: [{ ...buyMilk, completed: true }],
      });
      TodoServices.updateTodo.mockResolvedValue({
        status: 200,
        data: { ...buyMilk, completed: false },
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await wrapper.get('[aria-label="Items"]').trigger("click");
      await flushPromises();

      expect(document.body.querySelector(".text-decoration-line-through")).toBeTruthy();
      await clickAriaLabel(wrapper, "Toggle Buy milk");

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, { completed: false });
      expect(document.body.querySelector(".text-decoration-line-through")).toBeNull();
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [buyMilk] })
        .mockResolvedValueOnce({
          data: [{ ...buyMilk, title: "Buy oat milk" }],
        });
      TodoServices.updateTodo.mockResolvedValue({
        status: 200,
        data: { ...buyMilk, title: "Buy oat milk" },
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await wrapper.get('[aria-label="Items"]').trigger("click");
      await flushPromises();

      await clickAriaLabel(wrapper, "Edit todo");
      await setFieldByLabel(wrapper, "Todo title", "Buy oat milk");
      await clickExactButton(wrapper, "Save");

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, { title: "Buy oat milk" });
      expect(document.body.textContent).toContain("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [buyMilk] })
        .mockResolvedValueOnce({ data: [] });
      TodoServices.deleteTodo.mockResolvedValue({ status: 200 });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await wrapper.get('[aria-label="Items"]').trigger("click");
      await flushPromises();

      await clickAriaLabel(wrapper, "Delete todo");
      await clickExactButton(wrapper, "Delete");

      expect(TodoServices.deleteTodo).toHaveBeenCalledWith(10);
      expect(document.body.textContent).toContain("No todos in this list yet.");
    });
  });
});
