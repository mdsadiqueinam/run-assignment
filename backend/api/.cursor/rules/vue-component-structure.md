# Vue Component Structure

## Consistent organization of Vue components

Vue components should follow a consistent structure to improve readability, maintainability, and developer experience.

### Script Structure:

1. Imports (grouped by type)
2. Constants
3. Composables and utility functions (prefixed with "use")
4. Props & models
5. Emits
6. Ref/Reactive variables
7. Methods/Handlers
8. Watchers & computed properties
9. Lifecycle hooks

### Example:

```vue
<script setup>
// --- Imports ---
import { useCurrentUser } from "@utils/useCurrentUser";
import { ArrowPathIcon } from "@heroicons/vue/24/outline";

// --- Constants ---
const PAGE_SIZE = 200;

// --- Use (Composables) ---
const { t } = useI18n();
const router = useRouter();

// --- Props & models ---
const props = defineProps({
  initialValue: String,
});

// --- Emits ---
const emit = defineEmits(["update", "cancel"]);

// --- Vars ---
const isLoading = ref(false);
const items = ref([]);

// --- Handlers ---
const loadItems = async () => {
  // Implementation
};

// --- Watchers & computed ---
watch(selectedValue, (newValue) => {
  // Implementation
});

// --- Lifecycle hooks ---
onMounted(() => {
  loadItems();
});
</script>
```

### Template Structure:

- Keep templates clean and focused
- Use proper indentation (2 spaces)
- Extract complex UI sections into separate components
- Use comments to denote major sections
- Group related elements with semantic HTML

### Implementation:

- All components should follow this structure
- Use section comments to clearly separate different parts of the component
- Keep methods focused on a single responsibility
- Extract reusable logic into composables (functions that start with "use")
