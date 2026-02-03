<template>
  <div v-if="visible" class="pin-dialog-overlay" @click.self="handleCancel">
    <div class="pin-dialog">
      <h2>输入 PIN</h2>
      <div class="pin-input-group">
        <input
          ref="pinInput"
          v-model="pinValue"
          type="password"
          maxlength="10"
          placeholder="请输入 PIN"
          @keyup.enter="handleConfirm"
          @input="handleInput"
          class="pin-input"
        />
      </div>
      <div class="pin-error" v-if="error">{{ error }}</div>
      <div class="pin-actions">
        <button @click="handleCancel" class="btn-cancel">取消</button>
        <button @click="handleConfirm" class="btn-confirm">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const pinValue = ref('')
const error = ref('')
const pinInput = ref(null)

const CORRECT_PIN = '1234'

watch(() => props.visible, (newVal) => {
  if (newVal) {
    pinValue.value = ''
    error.value = ''
    nextTick(() => {
      if (pinInput.value) {
        pinInput.value.focus()
      }
    })
  }
})

const handleInput = () => {
  error.value = ''
}

const handleConfirm = () => {
  if (pinValue.value === CORRECT_PIN) {
    error.value = ''
    emit('confirm')
  } else {
    error.value = 'PIN 错误，请重试'
    pinValue.value = ''
    nextTick(() => {
      if (pinInput.value) {
        pinInput.value.focus()
      }
    })
  }
}

const handleCancel = () => {
  pinValue.value = ''
  error.value = ''
  emit('cancel')
}
</script>

<style scoped>
.pin-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.pin-dialog {
  background: #1a1f2e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 32px;
  min-width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.pin-dialog h2 {
  margin: 0 0 24px 0;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  text-align: center;
}

.pin-input-group {
  margin-bottom: 16px;
}

.pin-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 18px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #fff;
  text-align: center;
  letter-spacing: 4px;
  font-family: monospace;
  box-sizing: border-box;
}

.pin-input:focus {
  outline: none;
  border-color: #2d6cff;
  background: rgba(255, 255, 255, 0.08);
}

.pin-error {
  color: #ff4444;
  font-size: 14px;
  text-align: center;
  margin-bottom: 16px;
  min-height: 20px;
}

.pin-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 20px;
  border: 0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-confirm {
  background: #2d6cff;
  color: #fff;
}

.btn-confirm:hover {
  background: #1e5ae6;
}
</style>
