# UI Component Standards

## Consistent use of UI components

To maintain a consistent look and feel across the application, use standardized base components rather than native HTML elements when available.

### Key Guidelines:

- Use base components from the design system rather than styling native HTML elements
- Maintain consistent spacing, sizing, and interaction behavior across the application
- Follow established patterns for similar UI interactions

### Component Preferences:

| Use this             | Instead of                                   | Reason                                               |
| -------------------- | -------------------------------------------- | ---------------------------------------------------- |
| `<BaseButton>`       | `<button>`                                   | Consistent styling, hover states, and focus handling |
| `<BaseToggleSwitch>` | `<input type="checkbox">`                    | Consistent toggle appearance and behavior            |
| `<BaseDialog>`       | Native dialogs or custom div implementations | Consistent modal behavior and styling                |
| `<BaseInput>`        | `<input type="text">`                        | Consistent form field appearance                     |
| `<BaseSelect>`       | `<select>`                                   | Consistent dropdown styling and behavior             |

### Examples:

✓ Good:

```html
<!-- Toggle switch using base component -->
<div class="flex items-center gap-3">
  <BaseToggleSwitch v-model="isEnabled" />
  <span>{{ t('Enable feature') }}</span>
</div>

<!-- Button using base component -->
<BaseButton variant="secondary" @click="openSettings">
  {{ t('Configure') }}
</BaseButton>
```

✗ Avoid:

```html
<!-- Raw checkbox instead of toggle component -->
<div class="flex items-center gap-3">
  <input type="checkbox" v-model="isEnabled" class="h-5 w-5" />
  <span>{{ t('Enable feature') }}</span>
</div>

<!-- Native button instead of base component -->
<button class="px-3 py-2 rounded bg-blue-500 text-white" @click="openSettings">
  {{ t('Configure') }}
</button>
```

### Implementation:

- Import and use base components consistently throughout the application
- Check the component library before creating new UI elements
- Follow the props and events pattern established by existing base components
- For new components, extend the design system approach rather than creating one-off solutions
