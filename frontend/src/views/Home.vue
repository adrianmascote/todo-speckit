<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const user = computed(() => Utils.getStore("user"));
const firstName = computed(() => user.value?.fName || "there");

async function signOut() {
  try {
    await AuthServices.logoutUser();
  } finally {
    Utils.removeItem("user");
    await router.push({ name: "login" });
  }
}
</script>

<template>
  <v-container class="py-10">
    <h1 class="text-h4 mb-4">Welcome, {{ firstName }}</h1>
    <p class="text-body-1 mb-6">You are signed in. Todo lists arrive in a later feature.</p>
    <v-btn color="secondary" variant="outlined" class="oc-cta" @click="signOut">
      Sign out
    </v-btn>
  </v-container>
</template>
