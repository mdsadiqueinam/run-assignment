# UI Messaging Rules

## Consistent terminology and message format

UI messages should use consistent terminology and follow a clear, concise format to ensure users understand what's happening in the application.

### Toast notifications:

- We don't show success messages when the UI clearly reflects the change (so most of the time)
- Success messages should be brief and confirm what happened
- Error messages should explain what went wrong and suggest next steps when possible
- Use consistent phrasing across similar operations (e.g., "Configuration saved" vs "Configuration updated")

### Examples:

✓ Good:

- "Integration with Teamwork.com is ready to sync to-dos"
- "Team-specific destination updated"
- "Configuration saved"

✗ Avoid:

- "Success!"
- "Error occurred"
- Using different terms for the same concept ("task" vs "to-do")

### Implementation:

- Use template variables for dynamic content: "Integration with {app} is ready to sync to-dos"
- Always use the t() translation function for all UI text to support localization
- For error messages, include specific details when possible rather than generic error messages
