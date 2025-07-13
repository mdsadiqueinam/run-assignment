<script setup>
import { useTimeoutFn } from '@vueuse/core';
import { micromark } from 'micromark';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/vue/24/outline';
import { CheckBadgeIcon, ExclamationCircleIcon } from '@heroicons/vue/24/solid';

// --- Use ---
const { t } = useI18n();

// --- Props & models ---
const props = defineProps({
  toast: {
    type: Object,
    required: true,
  },
});

// --- Emits ---
const emit = defineEmits(['delete']);

// --- Vars ---
// None

// --- Handlers ---
const deleteToast = () => {
  emit('delete', props.toast.id);
};

const deleteTimer = useTimeoutFn(deleteToast, 6000);

function onClick() {
  if (props.toast.onClick) {
    props.toast.onClick();
    deleteToast();
  }
}

// --- Watchers & computed ---
const component = computed(() => {
  if (props.toast.onClick) {
    return 'button';
  }

  return 'div';
});

// --- Lifecycle hooks & related ---
// None
</script>

<template>
  <component
    :is="component"
    class="items-top z-10 flex w-full transform gap-2 overflow-hidden rounded-lg border border-divider bg-main-unselected px-3 py-2 text-[13px] shadow-2xl transition-all hover:border-divider-hover"
    @mouseover="deleteTimer.stop"
    @mouseout="deleteTimer.start"
    @click="onClick"
  >
    <div class="size-5">
      <ExclamationCircleIcon v-if="props.toast.type === 'error'" class="size-5 text-bad" />
      <CheckBadgeIcon v-else-if="props.toast.type === 'success'" class="size-5 text-good" />
      <InformationCircleIcon v-else class="size-5" />
    </div>

    <div class="flex w-full grow-0 flex-col gap-2 overflow-hidden">
      <div v-html="micromark(props.toast.text)" class="font-semibold" />

      <template v-if="props.toast.objectName">
        <div class="w-full overflow-hidden">
          {{ props.toast.objectName }}
        </div>
        <div v-if="props.toast.objectPath">
          <RouterLink :to="props.toast.objectPath" @click="deleteToast">
            <BaseButton variant="text-link" class="-my-2">
              {{ t('View') }}
            </BaseButton>
          </RouterLink>
        </div>
      </template>
    </div>

    <!-- Close -->
    <div class="w-5">
      <button
        class="rounded-lg px-1.5 py-1 transition-[border,background-color,color,opacity] duration-300 hover:bg-main-unselected-hover hover:text-main-text-hover"
        @click="deleteToast"
      >
        <XMarkIcon class="size-4" />
      </button>
    </div>
  </component>
</template>
