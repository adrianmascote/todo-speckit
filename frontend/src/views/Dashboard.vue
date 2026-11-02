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

const listNameRules = [(value) => !!value?.trim() || "List name is required."];

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
  </v-container>
</template>
