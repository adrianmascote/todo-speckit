<script setup>
import { onMounted, ref } from "vue";
import TodoServices from "../services/todoServices.js";

const lists = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const addDialog = ref(false);
const editDialog = ref(false);
const deleteDialog = ref(false);
const addForm = ref(null);
const editForm = ref(null);
const newListName = ref("");
const editListName = ref("");
const selectedList = ref(null);
const saving = ref(false);

const itemsDialog = ref(false);
const addItemDialog = ref(false);
const editItemDialog = ref(false);
const deleteTodoDialog = ref(false);
const addTodoForm = ref(null);
const editTodoForm = ref(null);
const todos = ref([]);
const todosLoading = ref(false);
const todoErrorMessage = ref("");
const selectedTodo = ref(null);
const newTodoTitle = ref("");
const editTodoTitle = ref("");
const savingTodo = ref(false);

const listNameRules = [(value) => !!value?.trim() || "List name is required."];
const todoTitleRules = [(value) => !!value?.trim() || "Todo title is required."];

function apiErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

async function loadLists() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const res = await TodoServices.getLists();
    lists.value = res.data;
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, "Unable to load lists.");
  } finally {
    loading.value = false;
  }
}

function openAddDialog() {
  newListName.value = "";
  addDialog.value = true;
}

function openEditDialog(list) {
  selectedList.value = list;
  editListName.value = list.name;
  editDialog.value = true;
}

function openDeleteDialog(list) {
  selectedList.value = list;
  deleteDialog.value = true;
}

async function createList() {
  errorMessage.value = "";
  const { valid } = await addForm.value.validate();
  if (!valid) {
    return;
  }

  saving.value = true;
  try {
    await TodoServices.createList({ name: newListName.value.trim() });
    addDialog.value = false;
    newListName.value = "";
    await loadLists();
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, "Unable to create list.");
  } finally {
    saving.value = false;
  }
}

async function saveList() {
  errorMessage.value = "";
  const { valid } = await editForm.value.validate();
  if (!valid) {
    return;
  }

  saving.value = true;
  try {
    await TodoServices.updateList(selectedList.value.id, {
      name: editListName.value.trim(),
    });
    editDialog.value = false;
    await loadLists();
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, "Unable to rename list.");
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  errorMessage.value = "";
  saving.value = true;

  try {
    await TodoServices.deleteList(selectedList.value.id);
    deleteDialog.value = false;
    await loadLists();
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, "Unable to delete list.");
  } finally {
    saving.value = false;
  }
}

async function loadTodos() {
  if (!selectedList.value) {
    return;
  }

  todosLoading.value = true;
  todoErrorMessage.value = "";

  try {
    const res = await TodoServices.getTodos(selectedList.value.id);
    todos.value = res.data;
  } catch (error) {
    todoErrorMessage.value = apiErrorMessage(error, "Unable to load todos.");
  } finally {
    todosLoading.value = false;
  }
}

async function openItemsDialog(list) {
  selectedList.value = list;
  todos.value = [];
  itemsDialog.value = true;
  await loadTodos();
}

function closeItemsDialog() {
  itemsDialog.value = false;
  addItemDialog.value = false;
  editItemDialog.value = false;
  deleteTodoDialog.value = false;
}

function openAddItemDialog() {
  newTodoTitle.value = "";
  addItemDialog.value = true;
}

function openEditTodoDialog(todo) {
  selectedTodo.value = todo;
  editTodoTitle.value = todo.title;
  editItemDialog.value = true;
}

function openDeleteTodoDialog(todo) {
  selectedTodo.value = todo;
  deleteTodoDialog.value = true;
}

async function createTodo() {
  todoErrorMessage.value = "";
  const { valid } = await addTodoForm.value.validate();
  if (!valid) {
    return;
  }

  savingTodo.value = true;
  try {
    await TodoServices.createTodo(selectedList.value.id, {
      title: newTodoTitle.value.trim(),
    });
    addItemDialog.value = false;
    newTodoTitle.value = "";
    await loadTodos();
  } catch (error) {
    todoErrorMessage.value = apiErrorMessage(error, "Unable to create todo.");
  } finally {
    savingTodo.value = false;
  }
}

async function saveTodo() {
  todoErrorMessage.value = "";
  const { valid } = await editTodoForm.value.validate();
  if (!valid) {
    return;
  }

  savingTodo.value = true;
  try {
    await TodoServices.updateTodo(selectedTodo.value.id, {
      title: editTodoTitle.value.trim(),
    });
    editItemDialog.value = false;
    await loadTodos();
  } catch (error) {
    todoErrorMessage.value = apiErrorMessage(error, "Unable to update todo.");
  } finally {
    savingTodo.value = false;
  }
}

async function toggleTodo(todo, completed) {
  todoErrorMessage.value = "";
  const nextCompleted = typeof completed === "boolean" ? completed : !todo.completed;
  try {
    const res = await TodoServices.updateTodo(todo.id, { completed: nextCompleted });
    todo.completed = res.data.completed;
  } catch (error) {
    todoErrorMessage.value = apiErrorMessage(error, "Unable to update todo.");
    await loadTodos();
  }
}

async function confirmDeleteTodo() {
  todoErrorMessage.value = "";
  savingTodo.value = true;

  try {
    await TodoServices.deleteTodo(selectedTodo.value.id);
    deleteTodoDialog.value = false;
    await loadTodos();
  } catch (error) {
    todoErrorMessage.value = apiErrorMessage(error, "Unable to delete todo.");
  } finally {
    savingTodo.value = false;
  }
}

onMounted(loadLists);
</script>

<template>
  <v-container class="py-8">
    <v-row align="center" class="mb-2">
      <v-col>
        <h1 class="text-h4">My Lists</h1>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" variant="elevated" class="oc-cta" @click="openAddDialog">
          + New List
        </v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="errorMessage" type="error" class="mt-4">
      {{ errorMessage }}
    </v-alert>

    <v-progress-linear v-if="loading" indeterminate class="mt-6" />

    <p v-else-if="lists.length === 0" class="text-body-1 mt-6">
      No lists yet. Create your first list.
    </p>

    <v-list v-else class="mt-4 bg-transparent">
      <v-list-item v-for="list in lists" :key="list.id" class="px-0">
        <template #title>{{ list.name }}</template>
        <template #append>
          <v-btn
            icon="mdi-format-list-bulleted"
            size="small"
            variant="text"
            aria-label="Items"
            @click="openItemsDialog(list)"
          />
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            aria-label="Edit list"
            @click="openEditDialog(list)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            aria-label="Delete list"
            @click="openDeleteDialog(list)"
          />
        </template>
      </v-list-item>
    </v-list>

    <v-dialog v-model="addDialog" max-width="480">
      <v-card>
        <v-card-title>New list</v-card-title>
        <v-card-text>
          <v-form ref="addForm" @submit.prevent="createList">
            <v-text-field
              v-model="newListName"
              label="List name"
              :rules="listNameRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="createList"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editDialog" max-width="480">
      <v-card>
        <v-card-title>Rename list</v-card-title>
        <v-card-text>
          <v-form ref="editForm" @submit.prevent="saveList">
            <v-text-field
              v-model="editListName"
              label="List name"
              :rules="listNameRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="editDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="saveList"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="480">
      <v-card>
        <v-card-title>Delete list</v-card-title>
        <v-card-text>
          Delete {{ selectedList?.name }}? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="itemsDialog" max-width="640">
      <v-card>
        <v-card-text class="pb-0">
          <v-row align="center">
            <v-col>
              <h2 class="text-h6">{{ selectedList?.name }} — Items</h2>
            </v-col>
            <v-col cols="auto">
              <v-btn
                color="primary"
                variant="elevated"
                class="oc-cta"
                @click="openAddItemDialog"
              >
                + Add Item
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text>
          <v-alert v-if="todoErrorMessage" type="error" class="mb-4">
            {{ todoErrorMessage }}
          </v-alert>
          <v-progress-linear v-if="todosLoading" indeterminate class="mb-4" />
          <p v-else-if="todos.length === 0" class="text-body-1">
            No todos in this list yet.
          </p>
          <v-list v-else class="bg-transparent">
            <v-list-item v-for="todo in todos" :key="todo.id" class="px-0">
              <template #prepend>
                <v-checkbox
                  :model-value="todo.completed"
                  hide-details
                  :aria-label="`Toggle ${todo.title}`"
                  @update:model-value="(value) => toggleTodo(todo, value)"
                />
              </template>
              <template #title>
                <span :class="todo.completed ? 'text-decoration-line-through text-medium-emphasis' : ''">
                  {{ todo.title }}
                </span>
              </template>
              <template #append>
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  aria-label="Edit todo"
                  @click="openEditTodoDialog(todo)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  aria-label="Delete todo"
                  @click="openDeleteTodoDialog(todo)"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="closeItemsDialog">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="addItemDialog" max-width="480">
      <v-card>
        <v-card-title>Add item</v-card-title>
        <v-card-text>
          <v-form ref="addTodoForm" @submit.prevent="createTodo">
            <v-text-field
              v-model="newTodoTitle"
              label="Todo title"
              :rules="todoTitleRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addItemDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="savingTodo"
            @click="createTodo"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editItemDialog" max-width="480">
      <v-card>
        <v-card-title>Edit item</v-card-title>
        <v-card-text>
          <v-form ref="editTodoForm" @submit.prevent="saveTodo">
            <v-text-field
              v-model="editTodoTitle"
              label="Todo title"
              :rules="todoTitleRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="editItemDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="savingTodo"
            @click="saveTodo"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteTodoDialog" max-width="480">
      <v-card>
        <v-card-title>Delete item</v-card-title>
        <v-card-text>
          Delete {{ selectedTodo?.title }}? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteTodoDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="savingTodo"
            @click="confirmDeleteTodo"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
