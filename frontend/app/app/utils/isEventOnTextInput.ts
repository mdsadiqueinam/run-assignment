import { isTextInput } from "./isTextInput";

/**
 * Checks if the event was triggered on a text input element.
 *
 * @param event The event to check.
 * @returns True if the event was triggered on a text input element.
 */
export function isEventOnTextInput(event: Event): boolean {
  return event.composedPath().some((target) => isTextInput(target as any));
}
