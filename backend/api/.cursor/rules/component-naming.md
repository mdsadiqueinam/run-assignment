# Component Naming Conventions

## Consistent component naming patterns

Components should follow consistent naming patterns to make the codebase easier to navigate and understand.

### Base Rules:

- Vue components use PascalCase for component names (e.g., `BaseButton`, `TeamIcon`)
- Component files should match their component names (e.g., `BaseButton.vue`)
- Prefix common UI components with "Base" (e.g., `BaseButton`, `BaseDialog`)
- Feature-specific components should be grouped in appropriate directories
- Use descriptive, functional names that indicate what the component does

### Examples:

✓ Good:

- `BaseButton.vue` - A base button component
- `ConfirmDialog.vue` - A dialog for confirmations
- `TeamConfigDialog.vue` - A dialog specific to team configuration

✗ Avoid:

- Generic names (`Component.vue`, `Item.vue`)
- Inconsistent casing (`baseButton.vue`, `Base-button.vue`)
- Non-descriptive names (`Popup.vue` instead of `ConfirmDialog.vue`)

### Implementation:

- When importing components, use consistent import naming that matches the component
- Group related components in feature-specific directories
- For specialized versions of base components, use appropriate prefixes or suffixes that describe their purpose
