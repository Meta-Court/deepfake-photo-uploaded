<template>
  <div class="upload-form">
    <div class="form-group">
      <label for="email">電子郵件</label>
      <input id="email" type="email" v-model="email" placeholder="請輸入您的電子郵件" />
    </div>
    <div class="form-group">
      <label for="nickname">暱稱</label>
      <input id="nickname" type="text" v-model="nickname" placeholder="請輸入您的暱稱" />
    </div>
    <div class="form-group">
      <label for="photo">選擇照片</label>
      <input id="photo" type="file" accept="image/*" @change="onFileChange" />
    </div>
    <!-- Only show preview if a photo is selected -->
    <div class="preview" v-if="previewUrl">
      <p>照片預覽：</p>
      <img :src="previewUrl" alt="照片預覽" />
    </div>
    <button @click="onSubmit">上傳照片</button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const email = ref('')
const nickname = ref('')
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string>('')

// Triggered on file selection to set a preview
function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
    const reader = new FileReader()
    reader.readAsDataURL(selectedFile.value)
    reader.onload = () => {
      previewUrl.value = String(reader.result)
    }
  }
}

// Submit the form only upon button click
async function onSubmit() {
  if (!email.value || !nickname.value || !selectedFile.value) {
    alert('請完整填寫所有欄位')
    return
  }
  const formData = new FormData()
  formData.append('email', email.value)
  formData.append('nickname', nickname.value)
  formData.append('photo', selectedFile.value)

  // Sends the form data to our backend endpoint
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })
  if (response.ok) {
    alert('上傳成功')
  } else {
    alert('上傳失敗')
  }
}
</script>

<style scoped lang="scss"></style>
