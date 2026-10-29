<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";

const router = useRouter();
const form = ref(null);
const loading = ref(false);
const errorMessage = ref("");
const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");

const firstNameRules = [(value) => !!value?.trim() || "First name is required."];
const lastNameRules = [(value) => !!value?.trim() || "Last name is required."];
const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [
  (value) => !!value?.trim() || "Password is required.",
  (value) => (value?.length ?? 0) >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [(value) => value === password.value || "Passwords do not match."];

async function submit() {
  errorMessage.value = "";
  const { valid } = await form.value.validate();
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    const res = await AuthServices.registerUser({
      fName: fName.value.trim(),
      lName: lName.value.trim(),
      email: email.value.trim(),
      username: username.value.trim(),
      password: password.value,
    });
    Utils.setStore("user", res.data);
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    await router.push({ name: "home" });
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Unable to create account.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="5">
        <v-card class="pa-4" elevation="4">
          <v-card-title class="text-h5">Create account</v-card-title>
          <v-card-text>
            <v-alert v-if="errorMessage" type="error" class="mb-4">
              {{ errorMessage }}
            </v-alert>
            <v-form ref="form" @submit.prevent="submit">
              <v-text-field v-model="fName" label="First name" :rules="firstNameRules" class="mb-2" />
              <v-text-field v-model="lName" label="Last name" :rules="lastNameRules" class="mb-2" />
              <v-text-field v-model="email" label="Email" type="email" :rules="emailRules" class="mb-2" />
              <v-text-field v-model="username" label="Username" :rules="usernameRules" class="mb-2" />
              <v-text-field
                v-model="password"
                label="Password"
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
                class="mb-4"
              />
              <v-btn
                type="submit"
                color="primary"
                variant="elevated"
                class="oc-cta"
                block
                :loading="loading"
              >
                Create account
              </v-btn>
            </v-form>
          </v-card-text>
          <v-card-actions class="justify-center pb-4">
            <v-btn variant="text" color="secondary" :to="{ name: 'login' }">
              Already have an account? Sign in
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
