<template>
  <div class="playback-controls">
    <button
      v-if="!isReading"
      class="control-btn primary"
      :disabled="disabled"
      @click="$emit('play')"
    >
      <span class="btn-icon">▶️</span>
      <span class="btn-text">播放</span>
    </button>
    
    <button
      v-if="isReading && !isPaused"
      class="control-btn"
      :disabled="disabled"
      @click="$emit('pause')"
    >
      <span class="btn-icon">⏸️</span>
      <span class="btn-text">暂停</span>
    </button>
    
    <button
      v-if="isReading && isPaused"
      class="control-btn primary"
      :disabled="disabled"
      @click="$emit('resume')"
    >
      <span class="btn-icon">▶️</span>
      <span class="btn-text">继续</span>
    </button>
    
    <button
      class="control-btn"
      :disabled="disabled || (!isReading && !hasProgress)"
      @click="$emit('stop')"
    >
      <span class="btn-icon">⏹️</span>
      <span class="btn-text">停止</span>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isReading: boolean
  isPaused: boolean
  disabled?: boolean
  hasProgress?: boolean
}

interface Emits {
  play: []
  pause: []
  resume: []
  stop: []
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  hasProgress: false
})

defineEmits<Emits>()
</script>

<style lang="scss" scoped>
.playback-controls {
  display: flex;
  gap: $spacing-2;
  margin-bottom: $spacing-4;
}

.control-btn {
  @include button-base;
  @include button-size('md');
  @include flex-center;
  gap: $spacing-2;
  background: $gray-50;
  color: $gray-600;
  flex: 1;
  min-height: 44px;
  
  &:hover:not(:disabled) {
    background: $gray-100;
    transform: translateY(-1px);
    box-shadow: $shadow-sm;
  }
  
  &.primary {
    @include button-variant($primary-color, $white, $primary-dark);
  }

  .btn-icon {
    font-size: $font-size-base;
  }

  .btn-text {
    font-weight: $font-weight-medium;
  }
}
</style>