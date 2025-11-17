<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Check, ChevronDown, RotateCcw, X } from 'lucide-vue-next'
import AppButton from './ui/AppButton.vue'
import { exercises } from '../data/exercises'
import { shuffleArray } from '../utils'
import {
  sendAnswerStat,
  sendPlatformStartEvent,
  sendPlatformAnswerEvent,
} from '../services/statistics'

const currentExerciseIndex = ref(0)
const correctCount = ref(0)
const incorrectCount = ref(0)
const timer = ref(0)
const selectedPart = ref(null)
const placedParts = ref([])
const availableParts = ref([])
const dropdownOpen = ref(false)
const dropdownContainer = ref(null)
const attemptCounter = ref(0)

let timerInterval = null
const timeoutIds = new Set()
let platformStartSent = false

const isPlatform = import.meta.env.VITE_IS_PLATFORM === 'true'
const testId = import.meta.env.VITE_TEST_ID || null

const extractCourseIdFromUrl = () => {
  const hashMatch = window.location.hash.match(/course\/(\d+)/i)
  if (hashMatch) return hashMatch[1]
  const pathMatch = window.location.pathname.match(/course\/(\d+)/i)
  if (pathMatch) return pathMatch[1]
  return import.meta.env.VITE_COURSE_ID || null
}

const courseId = ref(extractCourseIdFromUrl())

const currentExercise = computed(() => exercises[currentExerciseIndex.value])

const leftCommonPart = computed(() => currentExercise.value.commonPart.split(' / ')[0])
const rightCommonPart = computed(() => {
  const hasDelimiter = currentExercise.value.commonPart.includes('/')
  const parts = currentExercise.value.commonPart.split(' / ')
  return hasDelimiter ? parts[1] || parts[0] : parts[0]
})

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formattedTime = computed(() => formatTime(timer.value))

const isExerciseComplete = computed(
  () => placedParts.value.filter((item) => item.status === 'correct').length === 10,
)

const resetExerciseState = (index) => {
  availableParts.value = shuffleArray([...exercises[index].parts])
  placedParts.value = []
  selectedPart.value = null
  attemptCounter.value = 0
}

watch(
  () => currentExerciseIndex.value,
  (value) => {
    resetExerciseState(value)
  },
  { immediate: true },
)

const removeAvailablePart = (part) => {
  const idx = availableParts.value.indexOf(part)
  if (idx === -1) return
  const updated = [...availableParts.value]
  updated.splice(idx, 1)
  availableParts.value = updated
}

const handlePartClick = (part) => {
  selectedPart.value = part
}

const scheduleIncorrectRemoval = (part, position, column) => {
  const timeoutId = window.setTimeout(() => {
    placedParts.value = placedParts.value.filter(
      (item) => !(item.part === part && item.position === position && item.column === column),
    )
    timeoutIds.delete(timeoutId)
  }, 5000)
  timeoutIds.add(timeoutId)
}

const buildWord = (partValue, column) =>
  column === 'left' ? `${partValue}${leftCommonPart.value}` : `${rightCommonPart.value}${partValue}`

const getWordsSnapshot = () =>
  placedParts.value.map((item) => buildWord(item.part, item.column))

const reportAnswer = (partValue, column, position, isCorrect) => {
  attemptCounter.value += 1
  const currentWord = buildWord(partValue, column)
  if (isPlatform) {
    sendPlatformAnswerEvent({
      courseId: courseId.value,
      testId,
      body: {
        answers: [currentWord],
        isRight: isCorrect,
        numberTry: attemptCounter.value,
        isHint: false,
      },
    })
  } else {
    sendAnswerStat({
      questionText: `Задание ${currentExercise.value.id}`,
      answers: getWordsSnapshot(),
      currentWord,
      isRight: isCorrect,
      numberTry: attemptCounter.value,
      column,
      position,
      timerSeconds: timer.value,
      timestamp: new Date().toISOString(),
    })
  }
}

const handleSlotClick = (position, column) => {
  if (!selectedPart.value) return

  const existingPart = placedParts.value.find(
    (item) => item.position === position && item.column === column,
  )
  if (existingPart) return

  const partValue = selectedPart.value
  const isCorrect =
    column === 'left'
      ? currentExercise.value.endsWith.includes(partValue)
      : currentExercise.value.startsWith.includes(partValue)

  placedParts.value = [
    ...placedParts.value,
    {
      part: partValue,
      position,
      column,
      status: isCorrect ? 'correct' : 'incorrect',
    },
  ]

  if (isCorrect) {
    correctCount.value += 1
    removeAvailablePart(partValue)
  } else {
    incorrectCount.value += 1
    scheduleIncorrectRemoval(partValue, position, column)
  }

  reportAnswer(partValue, column, position, isCorrect)

  selectedPart.value = null
}

const clearAllTimeouts = () => {
  timeoutIds.forEach((id) => clearTimeout(id))
  timeoutIds.clear()
}

const handleRestart = () => {
  correctCount.value = 0
  incorrectCount.value = 0
  timer.value = 0
  currentExerciseIndex.value = 0
  dropdownOpen.value = false
  clearAllTimeouts()
  resetExerciseState(0)
}

const handleExerciseChange = (index) => {
  currentExerciseIndex.value = index
  dropdownOpen.value = false
}

const handleNextExercise = () => {
  if (currentExerciseIndex.value < exercises.length - 1) {
    currentExerciseIndex.value += 1
  }
}

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const handleDocumentClick = (event) => {
  if (!dropdownOpen.value) return
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target)) {
    dropdownOpen.value = false
  }
}

const formatStartDate = (date) => {
  const pad = (num) => num.toString().padStart(2, '0')
  const day = pad(date.getDate())
  const month = pad(date.getMonth() + 1)
  const year = date.getFullYear()
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())
  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`
}

const maybeSendStartEvent = () => {
  if (!isPlatform || platformStartSent) return
  platformStartSent = true
  sendPlatformStartEvent({
    courseId: courseId.value,
    testId,
    startDate: formatStartDate(new Date()),
  })
}

onMounted(() => {
  timerInterval = window.setInterval(() => {
    timer.value += 1
  }, 1000)
  document.addEventListener('click', handleDocumentClick)
  maybeSendStartEvent()
})

onBeforeUnmount(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  clearAllTimeouts()
  document.removeEventListener('click', handleDocumentClick)
})

const getPlacedPart = (position, column) =>
  placedParts.value.find((item) => item.position === position && item.column === column)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
    <div class="mx-auto max-w-6xl">
      <div class="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-lg">
        <div class="text-lg font-semibold text-gray-700">Словообразование</div>

        <div class="relative" ref="dropdownContainer">
          <AppButton variant="outline" class="gap-2 bg-transparent" @click="toggleDropdown">
            Задание: {{ currentExercise.id }}
            <ChevronDown class="h-4 w-4" />
          </AppButton>
          <div
            v-if="dropdownOpen"
            class="absolute right-0 z-20 mt-2 max-h-[400px] w-64 overflow-y-auto rounded-lg border bg-white shadow-xl"
          >
            <button
              v-for="(exercise, index) in exercises"
              :key="exercise.id"
              @click="handleExerciseChange(index)"
              class="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left text-sm hover:bg-blue-50"
              :class="{
                'bg-blue-100 font-semibold': currentExerciseIndex === index,
              }"
            >
              <span>Задание {{ exercise.id }}</span>
              <span class="text-xs text-gray-500">({{ exercise.commonPart }})</span>
            </button>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <Check class="h-5 w-5 text-green-600" />
            </div>
            <span class="font-semibold text-green-600">{{ correctCount }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
              <X class="h-5 w-5 text-red-600" />
            </div>
            <span class="font-semibold text-red-600">{{ incorrectCount }}</span>
          </div>
          <div class="font-mono text-lg font-medium text-gray-600">{{ formattedTime }}</div>
          <AppButton variant="outline" size="icon" class="bg-transparent" @click="handleRestart">
            <RotateCcw class="h-4 w-4" />
          </AppButton>
        </div>
      </div>

      <div class="space-y-6">
        <div class="text-center text-xl font-medium text-gray-700">Добавьте части слова</div>

        <div class="rounded-xl bg-white p-6 shadow-lg">
          <div class="flex flex-wrap justify-center gap-3">
            <button
              v-for="(part, index) in availableParts"
              :key="`${part}-${index}`"
              @click="handlePartClick(part)"
              class="rounded-lg border-2 px-4 py-3 text-lg font-semibold transition-all hover:scale-105"
              :class="
                selectedPart === part
                  ? 'border-blue-500 bg-blue-100 text-blue-700'
                  : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-blue-300'
              "
            >
              {{ part }}
            </button>
          </div>
        </div>

        <div class="grid gap-8 md:grid-cols-2">
          <div class="rounded-xl bg-white p-6 shadow-lg">
            <div class="space-y-3">
              <div v-for="position in 5" :key="`left-${position}`" class="flex items-center gap-2">
                <button
                  @click="handleSlotClick(position - 1, 'left')"
                  class="flex h-14 flex-1 items-center justify-center rounded-lg border-2 text-lg font-bold transition-all"
                  :class="{
                    'border-green-500 bg-green-100 text-green-700':
                      getPlacedPart(position - 1, 'left')?.status === 'correct',
                    'border-red-500 bg-red-100 text-red-700':
                      getPlacedPart(position - 1, 'left')?.status === 'incorrect',
                    'border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50':
                      !getPlacedPart(position - 1, 'left'),
                  }"
                >
                  {{ getPlacedPart(position - 1, 'left')?.part ?? '____' }}
                </button>
                <div
                  class="flex h-14 w-20 items-center justify-center rounded-lg bg-indigo-100 text-lg font-bold text-indigo-700"
                >
                  {{ leftCommonPart }}
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-xl bg-white p-6 shadow-lg">
            <div class="space-y-3">
              <div v-for="position in 5" :key="`right-${position}`" class="flex items-center gap-2">
                <div
                  class="flex h-14 w-20 items-center justify-center rounded-lg bg-indigo-100 text-lg font-bold text-indigo-700"
                >
                  {{ rightCommonPart }}
                </div>
                <button
                  @click="handleSlotClick(position - 1, 'right')"
                  class="flex h-14 flex-1 items-center justify-center rounded-lg border-2 text-lg font-bold transition-all"
                  :class="{
                    'border-green-500 bg-green-100 text-green-700':
                      getPlacedPart(position - 1, 'right')?.status === 'correct',
                    'border-red-500 bg-red-100 text-red-700':
                      getPlacedPart(position - 1, 'right')?.status === 'incorrect',
                    'border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50':
                      !getPlacedPart(position - 1, 'right'),
                  }"
                >
                  {{ getPlacedPart(position - 1, 'right')?.part ?? '____' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="isExerciseComplete && currentExerciseIndex < exercises.length - 1"
          class="flex justify-center"
        >
          <AppButton size="lg" class="bg-green-600 text-lg hover:bg-green-700" @click="handleNextExercise">
            Следующее задание
          </AppButton>
        </div>

        <div
          v-if="isExerciseComplete && currentExerciseIndex === exercises.length - 1"
          class="rounded-xl bg-green-100 p-6 text-center"
        >
          <div class="text-2xl font-bold text-green-700">Поздравляем! Вы завершили все задания! 🎉</div>
        </div>
      </div>
    </div>
  </div>
</template>

