import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { isEventOnTextInput } from '../utils/isEventOnTextInput';
import { useDevtools } from './useDevtools';
import {useEventListener} from 'ahooks'

// Types
type ShortcutListener = () => void;

interface ShortcutItem {
  listener: ShortcutListener;
  activeOnInput: boolean;
  activeOnHoverElement?: HTMLElement | null;
}

interface KeyboardShortcutContextValue {
  shortcutsMap: Map<string, ShortcutItem[]>;
  shortcutsMaps: Map<string, ShortcutItem[]>[];
}

interface KeyboardShortcutProviderProps {
  children: ReactNode;
}

interface KeyboardShortcutContextProviderProps {
  contextActive: boolean;
  children: ReactNode;
}

// Utility functions
function addItem<T>(list: T[], item: T): void {
  const index = list.indexOf(item);
  if (index < 0) {
    list.push(item);
  }
}

function removeItem<T>(list: T[], item: T): void {
  const index = list.indexOf(item);
  if (index >= 0) {
    list.splice(index, 1);
  }
}

/**
 * Orders shortcuts, so that those which are activated on hover are first.
 */
function orderOnHoverFirst(item1: ShortcutItem, item2: ShortcutItem): number {
  const priority1 = item1.activeOnHoverElement !== undefined;
  const priority2 = item2.activeOnHoverElement !== undefined;

  if (priority1 === priority2) {
    return 0;
  }
  if (priority1) {
    return -1;
  }
  return 1;
}

/**
 * Indicates if the given shortcut can be activated.
 */
function canActivate(
  this: KeyboardEvent,
  { activeOnInput, activeOnHoverElement }: ShortcutItem
): boolean {
  if (!activeOnInput && isEventOnTextInput(this)) {
    return false;
  }

  if (
    activeOnHoverElement !== undefined &&
    !activeOnHoverElement?.matches(':hover')
  ) {
    return false;
  }

  return true;
}

// Context
const KeyboardShortcutContext = createContext<KeyboardShortcutContextValue | null>(null);

// Root Provider Component
export function KeyboardShortcutProvider({ children }: KeyboardShortcutProviderProps) {
  const shortcutsMap = useRef(new Map<string, ShortcutItem[]>()).current;
  const shortcutsMaps = useRef([shortcutsMap]).current;
  const devtools = useDevtools();

  const timelineLayerId = 'keyboard-shortcuts';

  useEventListener('keydown', (event: KeyboardEvent) => {
    // Fix for when event.key is sometimes undefined
    if (typeof event.key !== 'string') {
      return;
    }

    const keyParts: string[] = [];

    if (event.altKey) {
      keyParts.push('ALT');
    }

    if (event.ctrlKey || event.metaKey) {
      keyParts.push('COMMAND');
    }

    if (event.shiftKey && event.key.toUpperCase() !== event.key.toLowerCase()) {
      keyParts.push('SHIFT');
    }

    keyParts.push(event.key.toUpperCase());

    const key = keyParts.join(' ');

    const listener = shortcutsMaps
      .at(-1)
      ?.get(key)
      ?.filter(canActivate, event)
      ?.sort(orderOnHoverFirst)?.[0]?.listener;

    if (listener) {
      event.preventDefault();
      event.stopPropagation();
      listener();

      if (process.env.NODE_ENV === 'development') {
        devtools?.addTimelineEvent?.({
          layerId: timelineLayerId,
          event: {
            time: devtools.now(),
            title: keyParts.join(' + '),
            data: {
              rawEvent: event,
              keyParts,
              listener: listener.toString(),
            },
          },
        });
      }
    }
  });

  const contextValue: KeyboardShortcutContextValue = {
    shortcutsMap,
    shortcutsMaps,
  };

  return (
    <KeyboardShortcutContext.Provider value={contextValue}>
      {children}
    </KeyboardShortcutContext.Provider>
  );
}

// Context Provider for hierarchical shortcuts
export function KeyboardShortcutContextProvider({ 
  contextActive, 
  children 
}: KeyboardShortcutContextProviderProps) {
  const parentContext = useContext(KeyboardShortcutContext);
  const shortcutsMap = useRef(new Map<string, ShortcutItem[]>()).current;

  if (!parentContext) {
    throw new Error('KeyboardShortcutContextProvider must be used within KeyboardShortcutProvider');
  }

  const { shortcutsMaps } = parentContext;

  useEffect(() => {
    if (contextActive) {
      addItem(shortcutsMaps, shortcutsMap);
    } else {
      removeItem(shortcutsMaps, shortcutsMap);
    }

    return () => {
      removeItem(shortcutsMaps, shortcutsMap);
    };
  }, [contextActive, shortcutsMaps, shortcutsMap]);

  const contextValue: KeyboardShortcutContextValue = {
    shortcutsMap,
    shortcutsMaps,
  };

  return (
    <KeyboardShortcutContext.Provider value={contextValue}>
      {children}
    </KeyboardShortcutContext.Provider>
  );
}

// Hook for using keyboard shortcuts
export function useKeyboardShortcut(
  shortcutKey: string,
  listener: ShortcutListener,
  options: {
    activeOnInput?: boolean;
    activeOnHoverElement?: HTMLElement | null;
  } = {}
) {
  const context = useContext(KeyboardShortcutContext);
  
  if (!context) {
    throw new Error('useKeyboardShortcut must be used within KeyboardShortcutProvider');
  }

  const { shortcutsMap } = context;
  const { activeOnInput = false, activeOnHoverElement } = options;

  useEffect(() => {
    // Normalize the shortcut key:
    // - modifiers in alphabetical order followed by the main key
    // - one space between modifiers and the main key
    // - all uppercase
    const keyParts = shortcutKey.toUpperCase().split(' ').filter(Boolean);
    const lastKeyPart = keyParts.pop();

    if (!lastKeyPart) return;

    if (lastKeyPart === lastKeyPart.toLowerCase() && keyParts.includes('SHIFT')) {
      console.warn(
        `useKeyboardShortcut: Please remove the SHIFT modifier to make "${shortcutKey}" work regardless of different keyboard layouts.`
      );
    }

    keyParts.sort();
    keyParts.push(lastKeyPart);
    const key = keyParts.join(' ');

    if (!shortcutsMap.has(key)) {
      shortcutsMap.set(key, []);
    }

    const shortcuts = shortcutsMap.get(key)!;
    const newItem: ShortcutItem = { listener, activeOnInput, activeOnHoverElement };

    shortcuts.unshift(newItem);

    return () => {
      const index = shortcuts.indexOf(newItem);
      if (index >= 0) {
        shortcuts.splice(index, 1);
      }
    };
  }, [shortcutKey, listener, activeOnInput, activeOnHoverElement, shortcutsMap]);
}

// Component wrapper for keyboard shortcuts
interface UseKeyboardShortcutProps {
  shortcut: string;
  onActivate: () => void;
  activeOnInput?: boolean;
  activeOnHoverElement?: HTMLElement | null;
}

export function UseKeyboardShortcut({ 
  shortcut, 
  onActivate, 
  activeOnInput = false, 
  activeOnHoverElement 
}: UseKeyboardShortcutProps) {
  useKeyboardShortcut(shortcut, onActivate, { activeOnInput, activeOnHoverElement });
  return null;
}
