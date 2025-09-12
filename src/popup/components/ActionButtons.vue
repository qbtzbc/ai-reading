<template>
  <div class="action-buttons">
    <button 
      class="action-btn secondary"
      @click="$emit('detect')"
      :disabled="detecting"
    >
      <span v-if="detecting" class="loading-spinner"></span>
      <span v-else class="btn-icon">🔍</span>
      <span class="btn-text">{{ detecting ? '检测中...' : '重新检测' }}</span>
    </button>
    
    <button 
      class="action-btn secondary"
      @click="$emit('openSettings')"
    >
      <span class="btn-icon">⚙️</span>
      <span class="btn-text">设置</span>
    </button>
    
    <button 
      v-if="showExportImport"
      class="action-btn secondary"
      @click="$emit('export')"
    >
      <span class="btn-icon">📤</span>
      <span class="btn-text">导出</span>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  detecting?: boolean
  showExportImport?: boolean
}

interface Emits {
  detect: []
  openSettings: []
  export: []
}

withDefaults(defineProps<Props>(), {
  detecting: false,
  showExportImport: false
})

defineEmits<Emits>()
</script>

<style lang="scss" scoped>
.action-buttons {
  display: flex;
  gap: $spacing-2;
  padding: $spacing-4;
  background: $gray-50;
  border-top: 1px solid $gray-200;
  border-radius: 0 0 $border-radius-lg $border-radius-lg;
}

.action-btn {
  @include button-base;
  @include button-size('sm');
  @include flex-center;
  gap: $spacing-2;
  flex: 1;
  border: 1px solid $gray-200;
  background: $white;
  color: $gray-600;
  
  &:hover:not(:disabled) {
    background: $gray-50;
    border-color: $gray-400;
    transform: translateY(-1px);
  }

  &.secondary {
    @include button-variant($white, $gray-600);
    border: 1px solid $gray-200;
    
    &:hover:not(:disabled) {
      background: $gray-50;
      border-color: $gray-400;
    }
  }

  .btn-icon {
    font-size: $font-size-sm;
  }

  .btn-text {
    font-weight: $font-weight-medium;
  }

  .loading-spinner {
    @include loading-spinner(16px, $primary-color);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    
    .loading-spinner {
      animation-duration: 1s;
    }
  }
}
</style>