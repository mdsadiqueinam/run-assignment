interface TimelineLayer {
  id: string;
  label: string;
  color: string;
}

interface TimelineEvent {
  layerId: string;
  event: any;
}

interface TimelineEventData {
  layerId: string;
  event: any;
}

/**
 * Mock implementation of a devtools helper for demonstration.
 * In real-world usage, this might interact with React DevTools or other debugging utilities.
 */
export function useDevtools() {
  const timelineEventsRef = useRef<TimelineEventData[]>([]);

  const addTimelineLayer = useCallback(
    ({ id, label, color }: TimelineLayer) => {
      console.info(`Timeline layer added:`, { id, label, color });
    },
    []
  );

  const addTimelineEvent = useCallback(({ layerId, event }: TimelineEvent) => {
    timelineEventsRef.current.push({ layerId, event });
    console.info(`Timeline event added to layer "${layerId}":`, event);
  }, []);

  const now = useCallback(() => {
    return Date.now();
  }, []);

  /**
   * Mock access to collected events for testing purposes.
   * @returns The timeline events that have been added.
   */
  const getTimelineEvents = useCallback(() => {
    return timelineEventsRef.current;
  }, []);

  /**
   * Utility to handle unwrapping for reactive data in timeline events.
   * In React, this just returns the value as-is since we don't have Vue refs.
   * @param value - The value to unwrap.
   * @returns The value itself (no unwrapping needed in React).
   */
  const unwrap = useCallback((value: any) => {
    return value;
  }, []);

  return {
    addTimelineLayer,
    addTimelineEvent,
    now,
    getTimelineEvents,
    unwrap,
  };
}
