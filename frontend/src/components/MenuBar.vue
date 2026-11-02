<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import AuthServices from "../services/authServices.js";
import UserServices from "../services/userServices.js";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";
import router from "../router.js";

const hiddenRouteNames = ["login", "register"];
const routeName = computed(() => router.currentRoute.value.name);
const user = ref(Utils.getStore("user"));
const menuOpen = ref(false);
const editDialog = ref(false);
const form = ref(null);
const loading = ref(false);
const errorMessage = ref("");
const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");

const visible = computed(() => !hiddenRouteNames.includes(routeName.value));
const fullName = computed(() => {
  if (!user.value) {
    return "";
  }

  return [user.value.fName, user.value.lName].filter(Boolean).join(" ");
});

const firstNameRules = [(value) => !!value?.trim() || "First name is required."];
const lastNameRules = [(value) => !!value?.trim() || "Last name is required."];
const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [
  (value) => !value || value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [(value) => value === password.value || "Passwords do not match."];

function refreshUser() {
  user.value = Utils.getStore("user");
}

function openEditDialog() {
  errorMessage.value = "";
  fName.value = user.value?.fName || "";
  lName.value = user.value?.lName || "";
  email.value = user.value?.email || "";
  username.value = user.value?.username || "";
  password.value = "";
  confirmPassword.value = "";
  menuOpen.value = false;
  editDialog.value = true;
}

async function saveProfile() {
  errorMessage.value = "";
  const { valid } = await form.value.validate();
  if (!valid) {
    return;
  }

  const userId = user.value?.userId;
  loading.value = true;
  try {
    const payload = {
      fName: fName.value.trim(),
      lName: lName.value.trim(),
      email: email.value.trim(),
      username: username.value.trim(),
    };

    if (password.value) {
      payload.password = password.value;
    }

    const res = await UserServices.updateUser(userId, payload);
    const current = Utils.getStore("user") || {};
    Utils.setStore("user", {
      ...current,
      userId: res.data.id ?? current.userId,
      fName: res.data.fName,
      lName: res.data.lName,
      email: res.data.email,
      username: res.data.username,
      role: res.data.role,
    });
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    editDialog.value = false;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Unable to update profile.";
  } finally {
    loading.value = false;
  }
}

async function logOut() {
  try {
    await AuthServices.logoutUser();
  } finally {
    Utils.removeItem("user");
    refreshUser();
    menuOpen.value = false;
    await router.push({ name: "login" });
  }
}

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
});
</script>

<template>
  <v-app-bar v-if="visible" color="surface" elevation="1">
    <v-app-bar-title class="text-primary">Todo</v-app-bar-title>
    <v-spacer />
    <v-menu v-model="menuOpen">
      <template #activator="{ props }">
        <v-btn
          icon="mdi-account-circle"
          variant="text"
          class="mr-2"
          aria-label="Profile"
          v-bind="props"
        />
      </template>
      <v-card min-width="280" class="pa-2">
        <v-list>
          <v-list-item :title="fullName">
            <template #subtitle>
              <div>{{ user?.username }}</div>
              <div>{{ user?.email }}</div>
            </template>
          </v-list-item>
        </v-list>
        <v-card-actions>
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="openEditDialog">
            Edit Profile
          </v-btn>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="logOut">Log out</v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </v-app-bar>

  <v-dialog v-model="editDialog" max-width="520">
    <v-card>
      <v-card-title>Edit Profile</v-card-title>
      <v-card-text>
        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <v-form ref="form" @submit.prevent="saveProfile">
          <v-text-field v-model="fName" label="First name" :rules="firstNameRules" class="mb-2" />
          <v-text-field v-model="lName" label="Last name" :rules="lastNameRules" class="mb-2" />
          <v-text-field v-model="email" label="Email" type="email" :rules="emailRules" class="mb-2" />
          <v-text-field v-model="username" label="Username" :rules="usernameRules" class="mb-2" />
          <v-text-field
            v-model="password"
            label="New password"
            type="password"
            autocomplete="new-password"
            :rules="passwordRules"
            class="mb-2"
          />
          <v-text-field
            v-model="confirmPassword"
            label="Confirm password"
            type="password"
            autocomplete="new-password"
            :rules="confirmPasswordRules"
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
          :loading="loading"
          @click="saveProfile"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
