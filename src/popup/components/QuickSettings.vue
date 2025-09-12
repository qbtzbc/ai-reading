<template>
  <div class="quick-settings">
    <div class="setting-row">
      <label for="speech-rate-slider">语速:</label>
      <input
        id="speech-rate-slider"
        type="range"
        :min="0.5"
        :max="2.0"
        :step="0.1"
        :value="speechRate"
        @input="handleSpeechRateChange"
        class="range-slider"
      />
      <span class="value-display">{{ speechRate.toFixed(1) }}x</span>
    </div>
    
    <div class="setting-row">
      <label for="volume-slider">音量:</label>
      <input
        id="volume-slider"
        type="range"
        :min="0"
        :max="1"
        :step="0.1"
        :value="volume"
        @input="handleVolumeChange"
        class="range-slider"
      />
      <span class="value-display">{{ Math.round(volume * 100) }}%</span>
    </div>
    
    <div v-if="showAdvanced" class="setting-row">
      <label for="pitch-slider">音调:</label>
      <input
        id="pitch-slider"
        type="range"
        :min="0.5"
        :max="2.0"
        :step="0.1"
        :value="pitch"
        @input="handlePitchChange"
        class="range-slider"
      />
      <span class="value-display">{{ pitch.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  speechRate: number
  volume: number
  pitch?: number
  showAdvanced?: boolean
}

interface Emits {
  'update:speechRate': [value: number]
  'update:volume': [value: number]
  'update:pitch': [value: number]
  speechRateChange: [value: number]
  volumeChange: [value: number]
  pitchChange: [value: number]
}

const props = withDefaults(defineProps<Props>(), {
  pitch: 1.0,
  showAdvanced: false
})

const emit = defineEmits<Emits>()

const handleSpeechRateChange = (event: Event) => {
  const value = parseFloat((event.target as HTMLInputElement).value)
  emit('update:speechRate', value)
  emit('speechRateChange', value)
}

const handleVolumeChange = (event: Event) => {
  const value = parseFloat((event.target as HTMLInputElement).value)
  emit('update:volume', value)
  emit('volumeChange', value)
}

const handlePitchChange = (event: Event) => {
  const value = parseFloat((event.target as HTMLInputElement).value)
  emit('update:pitch', value)
  emit('pitchChange', value)
}
</script>

<style lang="scss" scoped>
.quick-settings {
  margin-bottom: $spacing-5;
}

.setting-row {
  @include flex-center;
  gap: $spacing-3;
  margin-bottom: $spacing-3;

  &:last-child {
    margin-bottom: 0;
  }

  label {
    font-size: $font-size-sm;
    color: $gray-600;
    min-width: 50px;
    font-weight: $font-weight-medium;
  }

  .range-slider {
    @include range-slider;
    flex: 1;
  }

  .value-display {
    font-size: $font-size-xs;
    color: $gray-500;
    min-width: 40px;
    text-align: right;
    font-weight: $font-weight-medium;
    background: $gray-100;
    padding: $spacing-1 $spacing-2;
    border-radius: $border-radius-sm;
  }
}
</style>