# Accessibility Guidelines

## Ensuring the application is accessible to all users

All components and UI elements should follow accessibility best practices to ensure the application is usable by people with disabilities.

### Key Guidelines:

- Maintain sufficient color contrast (minimum 4.5:1 for normal text)
- Provide text alternatives for non-text content (images, icons)
- Ensure keyboard navigability for all interactive elements
- Use semantic HTML elements appropriately
- Support screen readers with proper ARIA attributes when needed

### Examples:

✓ Good:

```html
<!-- Image with alt text -->
<img src="/integrations/teamwork.png" alt="Teamwork.com logo" class="h-6 w-6" />

<!-- Semantic button with clear purpose -->
<button
  type="button"
  aria-label="Reload projects"
  @click="onClickReloadProjects"
>
  <ArrowPathIcon class="h-5 w-5" />
  {{ t('Reload') }}
</button>

<!-- Form controls with proper labels -->
<label for="project-select">{{ t('Select project') }}</label>
<select id="project-select" v-model="selectedProjectId">
  <!-- options -->
</select>
```

✗ Avoid:

```html
<!-- Missing alt text -->
<img src="/integrations/teamwork.png" class="h-6 w-6" />

<!-- Non-semantic clickable div -->
<div @click="onClickReloadProjects">
  <ArrowPathIcon class="h-5 w-5" />
</div>

<!-- Form control without label -->
<select v-model="selectedProjectId">
  <!-- options -->
</select>
```

### Implementation:

- Use semantic HTML elements (<button>, <select>, etc.) for their intended purpose
- Ensure all interactive elements have appropriate focus states
- Test navigation using keyboard only
- Provide skip links for keyboard users to bypass repetitive content
- Test with screen readers to ensure content is properly announced
- Use appropriate heading levels (h1-h6) to create a logical document outline
