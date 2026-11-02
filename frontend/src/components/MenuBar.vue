<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const hiddenRouteNames = ["login", "register"];
const route = useRoute();
const router = useRouter();
const user = ref(Utils.getStore("user"));

const visible = computed(() => !hiddenRouteNames.includes(route.name));
const displayName = computed(() => {
  if (!user.value) {
    return "";
  }

  const fullName = [user.value.fName, user.value.lName].filter(Boolean).join(" ");
  return fullName || user.value.username || "";
});

function refreshUser() {
  user.value = Utils.getStore("user");
}

async function signOut() {
  try {
    await AuthServices.logoutUser();
  } finally {
    Utils.removeItem("user");
    refreshUser();
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
    <span class="text-body-1 mr-4">{{ displayName }}</span>
    <v-btn color="secondary" variant="outlined" class="oc-cta mr-2" @click="signOut">
      Sign out
    </v-btn>
  </v-app-bar>
</template>
