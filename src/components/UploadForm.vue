<template>
  <div class="upload-form">
    <h2>上傳照片</h2>
    <!-- The form posts directly to the server's /upload endpoint -->
    <form action="/upload" method="post" enctype="multipart/form-data">
      <div class="form-field">
        <label for="email">電子郵件:</label>
        <input type="email" id="email" name="email" v-model="email" required />
      </div>
      <div class="form-field">
        <label for="nickname">昵稱:</label>
        <input type="text" id="nickname" name="nickname" v-model="nickname" required />
      </div>
      <div class="form-field">
        <label for="photo">照片:</label>
        <input
          type="file"
          id="photo"
          name="photo"
          accept="image/*"
          @change="onFileChange"
          required
        />
      </div>
      <!-- Display a preview of the selected image -->
      <div class="preview" v-if="previewUrl">
        <p>預覽:</p>
        <img :src="previewUrl" alt="圖片預覽" />
      </div>
      <button type="submit">上傳照片</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const email = ref<string>('')
const nickname = ref<string>('')
const previewUrl = ref<string>('')

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        previewUrl.value = e.target.result as string
      }
    }
    reader.readAsDataURL(file)
  }
}
</script>

<style scoped></style>
