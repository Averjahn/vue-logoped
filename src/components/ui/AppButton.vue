<script setup>
import { computed } from 'vue'
import { cn } from '../../utils'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
  },
  size: {
    type: String,
    default: 'default',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed'

const variantClasses = {
  default: 'bg-blue-600 text-white hover:bg-blue-700',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600',
  ghost: 'text-gray-600 hover:bg-gray-100',
}

const sizeClasses = {
  default: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-lg',
  icon: 'h-10 w-10 p-0',
}

const classes = computed(() => cn(baseClasses, variantClasses[props.variant], sizeClasses[props.size]))
</script>

<template>
  <button :class="classes" :disabled="disabled" v-bind="$attrs">
    <slot />
  </button>
</template>

