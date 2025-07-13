type AnyFn = (...args: any[]) => any;

interface UseTimeoutFnOptions {
  immediate?: boolean;
  immediateCallback?: boolean;
}

interface UseTimeoutFnReturn<CallbackFn extends AnyFn> {
  isPending: boolean;
  start: (...args: Parameters<CallbackFn>) => void;
  stop: () => void;
}

/**
 * Wrapper for `setTimeout` with controls.
 *
 * @param cb - The callback function to execute
 * @param interval - The delay in milliseconds
 * @param options - Configuration options
 */
export function useTimeoutFn<CallbackFn extends AnyFn>(
  cb: CallbackFn,
  interval: number,
  options: UseTimeoutFnOptions = {}
): UseTimeoutFnReturn<CallbackFn> {
  const { immediate = true, immediateCallback = false } = options;

  const [isPending, setIsPending] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef<CallbackFn>(cb);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = cb;
  }, [cb]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    setIsPending(false);
    clear();
  }, [clear]);

  const start = useCallback(
    (...args: Parameters<CallbackFn>) => {
      if (immediateCallback) {
        callbackRef.current(...args);
      }
      clear();
      setIsPending(true);
      timerRef.current = setTimeout(() => {
        setIsPending(false);
        timerRef.current = null;
        callbackRef.current(...args);
      }, interval);
    },
    [interval, immediateCallback, clear]
  );

  // Handle immediate execution
  useEffect(() => {
    if (immediate) {
      setIsPending(true);
      (start as any)(); // Type assertion for immediate call without args
    }
  }, [immediate, start]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);

  return {
    isPending,
    start,
    stop,
  };
}
