<template>
  <form @submit.prevent="handleSubmit" class="upload-form">
    <div class="form-group">
      <label for="email">電子郵件</label>
      <input type="email" id="email" v-model="email" required />
    </div>
    <div class="form-group">
      <label for="nickname">暱稱</label>
      <input type="text" id="nickname" v-model="nickname" required />
    </div>
    <div class="form-group">
      <label for="photo">選擇照片</label>
      <input type="file" id="photo" @change="handleFileChange" accept="image/*" required />
    </div>
    <div v-if="previewUrl">
      <ImagePreview :src="previewUrl" />
    </div>
    <button type="submit" class="upload-button">上傳照片</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ImagePreview from './ImagePreview.vue'

const email = ref('')
const nickname = ref('')
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
    previewUrl.value = URL.createObjectURL(selectedFile.value)
  }
}

async function handleSubmit() {
  if (!selectedFile.value) {
    alert('請選擇一張照片')
    return
  }
  const formData = new FormData()
  formData.append('email', email.value)
  formData.append('nickname', nickname.value)
  formData.append('photo', selectedFile.value)

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
    const result = await response.json()
    if (response.ok) {
      alert('上傳成功！請查收您的電子郵件。')
      // Reset form
      email.value = ''
      nickname.value = ''
      selectedFile.value = null
      previewUrl.value = ''
    } else {
      alert(`上傳失敗：${result.error}`)
    }
  } catch {
    alert('上傳時發生錯誤。')
  }
}
</script>

<style scoped lang="scss"></style>
