<template>
  <div class="progress-section">
    <div class="progress-info">
      <div class="progress-numbers">
        <span>{{ current }}</span>
        <span>/</span>
        <span>{{ total }}</span>
      </div>
      <div class="progress-percentage">{{ Math.round(percentage) }}%</div>
    </div>
    
    <div class="progress-bar" @click="handleProgressClick" ref="progressBarRef">
      <div 
        class="progress-fill" 
        :style="{ width: `${percentage}%` }"
      ></div>
    </div>
    
    <div v-if="showTime && estimatedTime" class="progress-time">
      <span class="time-remaining">剩余 {{ formatTime(estimatedTime) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  current: number
  total: number
  percentage?: number
  showTime?: boolean
  estimatedTime?: number
  interactive?: boolean
}

interface Emits {
  seek: [position: number]
}

const props = withDefaults(defineProps<Props>(), {
  percentage: 0,
  showTime: false,
  interactive: true
})

const emit = defineEmits<Emits>()

const progressBarRef = ref<HTMLElement>()

const calculatedPercentage = computed(() => {
  if (props.percentage !== undefined) {
    return props.percentage
  }
  return props.total > 0 ? (props.current / props.total) * 100 : 0
})

const handleProgressClick = (event: MouseEvent) => {
  if (!props.interactive || !progressBarRef.value) return
  
  const rect = progressBarRef.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = (clickX / rect.width) * 100
  const newPosition = Math.round((percentage / 100) * props.total)
  
  emit('seek', Math.max(0, Math.min(newPosition, props.total)))
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
.progress-section {
  margin-bottom: $spacing-4;
}

.progress-info {
  @include flex-between;
  margin-bottom: $spacing-2;
  font-size: $font-size-xs;
  color: $gray-500;

  .progress-numbers {
    display: flex;
    gap: $spacing-1;
  }

  .progress-percentage {
    font-weight: $font-weight-semibold;
    color: $primary-color;
  }
}

.progress-bar {
  @include progress-bar(6px);
  cursor: pointer;
  position: relative;
  
  &:hover {
    .progress-fill {
      box-shadow: 0 0 8px rgba($primary-color, 0.4);
    }
  }
  
  .progress-fill {
    transition: width $transition-slow, box-shadow $transition-base;
  }
}

.progress-time {
  margin-top: $spacing-2;
  text-align: center;
  
  .time-remaining {
    font-size: $font-size-xs;
    color: $gray-500;
    font-weight: $font-weight-medium;
  }
}
</style>