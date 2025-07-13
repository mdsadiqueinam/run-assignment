<script setup>
import { CheckIcon } from '@heroicons/vue/24/solid';
import { createSearchRegex } from '@root/utils/search';
import { InformationCircleIcon } from '@heroicons/vue/24/outline';

// --- Use ---
const slots = useSlots();
provideKeyboardShortcut(); // prevent triggering background shorcuts
const isMouseAvailable = useMediaQuery('(pointer: fine)');

// --- Props & models ---
const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  required: {
    type: Boolean,
    default: false,
  },
  closeOnSelect: {
    type: Boolean,
    default: true,
  },
  filterPlaceholder: {
    type: String,
    default: 'Search',
  },
  widthClass: {
    type: String,
    default: 'w-48',
  },
  iconWidthClass: {
    type: String,
    default: 'w-5',
  },
  noOptionsText: {
    type: [String, undefined],
    default: undefined,
  },
  extraSearchFields: {
    type: String,
    default: '',
  },
  showIconSlot: {
    type: Boolean,
    default: true,
  },
  showInfo: {
    type: Boolean,
    default: false,
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  isFilter: {
    type: Boolean,
    default: false,
  },
  useItemIdForShortcut: {
    type: Boolean,
    default: false,
  },
  maxHeight: {
    type: Number,
    default: 310,
  },
});
const selectedItemId = defineModel('selectedItemId');

// --- Emits ---
const emit = defineEmits(['close']);

// --- Vars ---
const el = ref(null);
const scrollEl = ref(null);
const searchFieldElm = ref(null);
const focusItemId = shallowRef(
  props.multiple && Array.isArray(selectedItemId.value) && selectedItemId.value.length
    ? selectedItemId.value[0]
    : selectedItemId.value,
);
const searchVal = shallowRef('');

// --- Handlers ---
function selectItem(itemId, isFromCheckbox = false) {
  if (props.multiple) {
    if (props.isFilter && !isFromCheckbox) {
      selectedItemId.value = [itemId];
      emit('close');
      return;
    }
    if (!Array.isArray(selectedItemId.value)) {
      selectedItemId.value = selectedItemId.value ? [selectedItemId.value] : [];
    }

    const index = selectedItemId.value.indexOf(itemId);
    if (index === -1) {
      selectedItemId.value = [...selectedItemId.value, itemId];
    } else {
      selectedItemId.value = selectedItemId.value.filter((id) => id !== itemId);
    }
  } else {
    selectedItemId.value = itemId;
  }

  if (props.closeOnSelect && !props.multiple) emit('close');
}

// --- Watchers & computed ---
const { y: scrollY } = useScroll(scrollEl, { behavior: 'smooth' });

const filteredItems = computed(() => {
  if (searchVal.value === '') return props.items;

  let search = searchVal.value;
  let items = props.items;

  // Create an array of fields to search
  let fieldsToSearch = ['name'];
  if (props.items[0]?.firstName && props.items[0]?.lastName) {
    fieldsToSearch.push('firstName', 'lastName');
  }
  if (props.extraSearchFields) {
    fieldsToSearch = fieldsToSearch.concat(props.extraSearchFields.split(',').map((field) => field.trim()));
  }

  const searchRegex = createSearchRegex(search);
  items = items.filter((item) => {
    return fieldsToSearch.some((field) => searchRegex.test(item[field]));
  });

  return items;
});

// Select a new item to focus on, if the current item is no longer on the list
watch(filteredItems, (newFilteredItems) => {
  if (newFilteredItems.length === 0) return;
  const pos = newFilteredItems.findIndex((o) => o.id === focusItemId.value);
  if (pos === -1) {
    focusItemId.value = newFilteredItems[0].id;
  }
});

// --- Lifecycle hooks & related ---
const { shortcutsMap } = provideKeyboardShortcut();
function navigationUpDown(direction) {
  if (filteredItems.value.length <= 1) return;
  const currentlySelectedIndex = filteredItems.value.findIndex((user) => user.id === focusItemId.value);
  let nextIndex = currentlySelectedIndex;
  if (direction === 'ArrowDown') {
    nextIndex++;
    if (nextIndex >= filteredItems.value.length) nextIndex = 0;
  } else if (direction === 'ArrowUp') {
    nextIndex--;
    if (nextIndex <= -1) nextIndex = filteredItems.value.length - 1;
  }
  focusItemId.value = filteredItems.value[nextIndex].id;
  scrollY.value = (nextIndex - 3) * 32;
}

useKeyboardShortcut(
  'ArrowUp',
  () => {
    navigationUpDown('ArrowUp');
  },
  { activeOnInput: true, updatedShortcutKey: shortcutsMap },
);

useKeyboardShortcut(
  'ArrowDown',
  () => {
    navigationUpDown('ArrowDown');
  },
  { activeOnInput: true, updatedShortcutKey: shortcutsMap },
);

useKeyboardShortcut(
  'Enter',
  () => {
    if (focusItemId.value !== null) selectItem(focusItemId.value);
  },
  { activeOnInput: true, updatedShortcutKey: shortcutsMap },
);

useKeyboardShortcut(
  'Escape',
  () => {
    emit('close');
  },
  { activeOnInput: true, updatedShortcutKey: shortcutsMap },
);

for (const number of '123456789') {
  useKeyboardShortcut(
    number,
    () => {
      if (!searchVal.value) {
        const elms = el.value.querySelectorAll(`[data-shortcutKey='${number}']`);
        if (!elms.length) return;
        elms[0].click();
        return;
      }
      searchVal.value = `${searchVal.value}${number}`;
    },
    { activeOnInput: true, updatedShortcutKey: shortcutsMap },
  );
}

onMounted(async () => {
  await nextTick();
  if (isMouseAvailable.value) {
    searchFieldElm.value?.focus();
  }
});
</script>

<template>
  <div ref="el" class="flex flex-col gap-px py-1" :class="`${props.widthClass}`">
    <div class="flex h-7 items-center px-1" v-if="props.showSearch">
      <input
        ref="searchFieldElm"
        name="search"
        v-model="searchVal"
        type="text"
        class="placeholder:main-unselected-text block h-7 w-full rounded-lg border border-transparent bg-main-unselected ps-2.5 text-sm ring-0 placeholder:text-sm focus:border-transparent focus:ring-0"
        :placeholder="props.filterPlaceholder"
        :aria-disabled="true"
        autocomplete="off"
      />
    </div>
    <template v-if="filteredItems.length">
      <div class="my-1 block border-t border-divider-hover" v-if="props.showSearch" />
      <div
        ref="scrollEl"
        class="flex flex-col gap-px overflow-y-auto text-nav"
        :style="{ maxHeight: `${props.maxHeight}px` }"
      >
        <template v-for="(item, itemNo) in filteredItems" :key="item.id">
          <div class="h-8 shrink-0 px-1">
            <a
              href="#"
              :data-shortcutKey="useItemIdForShortcut ? item.id : itemNo + 1"
              class="option sidebar-text group/status flex h-full cursor-pointer items-center gap-3 text-nowrap rounded-md pl-2 pr-3"
              :class="{
                'text-main-unselected-text hover:bg-main-unselected-hover hover:text-main-text-hover': !(
                  focusItemId === item.id
                ),
                'bg-main-selected text-main-selected-text': focusItemId === item.id,
              }"
              @focus="focusItemId = item.id"
              @mouseover="focusItemId = item.id"
              @click.prevent="selectItem(item.id)"
            >
              <input
                v-if="props.isFilter"
                :checked="Array.isArray(selectedItemId) && selectedItemId.includes(item.id)"
                type="checkbox"
                class="h-4 w-4 rounded bg-gray-100 cursor-pointer text-black focus:ring-black dark:bg-gray-700 dark:focus:ring-black"
                @click.stop="selectItem(item.id, true)"
              />
              <span
                v-if="props.showIconSlot"
                class="opacity-80 group-hover/status:opacity-100"
                :class="{
                  'w-5': props.iconWidthClass === 'w-5',
                  'w-10': props.iconWidthClass === 'w-10',
                  'hover:brightness-90 dark:hover:brightness-125': !(item.id === focusItemId),
                  'brightness-90 dark:brightness-125': item.id === focusItemId,
                }"
              >
                <slot name="icon" :item="item">
                  <component v-if="item.icon" :is="item.icon" class="size-4" />
                </slot>
              </span>
              <span class="grow overflow-hidden text-ellipsis" :title="item.name">
                <slot name="text" :item="item">
                  {{ item.name }}
                </slot>
              </span>
              <CheckIcon
                v-if="(props.multiple ? selectedItemId.includes(item.id) : item.id === selectedItemId) && !props.isFilter"
                class="size-3 shrink-0"
              />
              <BaseTooltip v-if="props.showInfo">
                <InformationCircleIcon class="ml-2 size-4" />
                <template #content>
                  <slot name="tooltipText" :item="item"></slot>
                </template>
              </BaseTooltip>

              <span class="shrink-0 text-xs opacity-50" v-if="useItemIdForShortcut && item.id < 10">{{ item.id }}</span>
              <span class="shrink-0 text-xs opacity-50" v-else-if="!useItemIdForShortcut && itemNo < 9">
                {{ itemNo + 1 }}
              </span>
            </a>
          </div>
        </template>
      </div>
    </template>
    <template v-else-if="props.noOptionsText">
      <div class="px-4">{{ props.noOptionsText }}</div>
    </template>
  </div>
</template>
