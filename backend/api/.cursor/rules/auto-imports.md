# Auto-Imports for Vue Components

## Rule

Vue components are automatically imported in this project. Do not manually import Vue components in the script section of Vue files.

## Correct Example

```vue
<script setup>
// Other imports like utilities, icons, etc. are fine
import { useToast } from "@shared/use/useToast";
import { ArrowPathIcon } from "@heroicons/vue/24/outline";
</script>

<template>
  <!-- Components like BaseButton, TeamworkPicker are auto-imported -->
  <BaseButton @click="handleClick">Click me</BaseButton>
  <TeamworkPicker v-model:selectedProjectId="projectId" />
</template>
```

## Incorrect Example

```vue
<script setup>
// DO NOT manually import Vue components
import BaseButton from "@components/general/BaseButton.vue"; // ❌ Not needed
import TeamworkPicker from "@components/settings/integrations/teamwork/TeamworkPicker.vue"; // ❌ Not needed

// These imports are still fine
import { useToast } from "@shared/use/useToast";
</script>
```

## Explanation

The project uses a Vite plugin for auto-imports which automatically registers and imports all Vue components. Manually importing components creates unnecessary code and may lead to conflicts or unexpected behavior.

Only import non-component dependencies like utilities, composables, icons, or third-party libraries.
