<template>
  <div class="image-preview">
    <img :src="props.src" alt="Image Preview" />
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
const props = defineProps<{
  src: string
}>()
</script>

<style scoped lang="scss"></style>
