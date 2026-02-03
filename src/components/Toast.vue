<template>
  <Transition name="toast">
    <div v-if="visible" :class="['toast', `toast-${type}`]">
      <div class="toast-content">
        <span class="toast-icon">{{ icon }}</span>
        <span class="toast-message">{{ message }}</span>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'error', // error, success, info
    validator: (value) => ['error', 'success', 'info'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['close'])

const iconMap = {
  error: '⚠️',
  success: '✓',
  info: 'ℹ️'
}

const icon = iconMap[props.type] || iconMap.error

watch(() => props.visible, (newVal) => {
  if (newVal && props.duration > 0) {
    setTimeout(() => {
      emit('close')
    }, props.duration)
  }
})
</script>

<style scoped>
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  min-width: 300px;
  max-width: 500px;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10001;
  animation: slideIn 0.3s ease-out;
}

.toast-error {
  background: #ff4444;
  color: #fff;
  border: 1px solid #ff6666;
}

.toast-success {
  background: #44ff44;
  color: #000;
  border: 1px solid #66ff66;
}

.toast-info {
  background: #2d6cff;
  color: #fff;
  border: 1px solid #4d8cff;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toast-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.toast-message {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
