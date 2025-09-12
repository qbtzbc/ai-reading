<template>
  <div 
    class="status-indicator"
    :class="{ 'active': isActive, [`status-${type}`]: type }"
  >
    <div class="status-icon" v-if="showIcon">
      <span v-if="type === 'success'">✅</span>
      <span v-else-if="type === 'warning'">⚠️</span>
      <span v-else-if="type === 'error'">❌</span>
      <span v-else-if="type === 'info'">ℹ️</span>
      <span v-else>📄</span>
    </div>
    <span class="status-text">{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StatusIndicatorProps } from '@/types'

interface Props {
  isActive: boolean
  message: string
  type?: 'success' | 'warning' | 'error' | 'info'
  showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  showIcon: true
})

const statusClass = computed(() => {
  return {
    'status-indicator': true,
    'active': props.isActive,
    [`status-${props.type}`]: props.type
  }
})
</script>

<style lang="scss" scoped>
.status-indicator {
  display: flex;
  align-items: center;
  padding: $spacing-3;
  background: $gray-50;
  border-radius: $border-radius-md;
  border-left: 4px solid $gray-300;
  transition: all $transition-base;
  
  &.active {
    background: $success-light;
    border-left-color: $success-color;
  }

  &.status-success {
    background: $success-light;
    border-left-color: $success-color;
  }

  &.status-warning {
    background: lighten($warning-color, 35%);
    border-left-color: $warning-color;
  }

  &.status-error {
    background: lighten($error-color, 35%);
    border-left-color: $error-color;
  }

  &.status-info {
    background: lighten($info-color, 35%);
    border-left-color: $info-color;
  }

  .status-icon {
    margin-right: $spacing-2;
    font-size: $font-size-base;
  }

  .status-text {
    font-size: $font-size-sm;
    color: $gray-600;
    flex: 1;
  }
}
</style>