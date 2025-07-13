import { createContext } from "react";
import { getUUID } from "app/utils/helpers";
import type { ReactNode } from "react";

interface Toast {
  id: string;
  text: string;
  type: "success" | "info" | "error";
}

interface ToastContextType {
  list: Toast[];
  add: (toast: Omit<Toast, "id">) => void;
  remove: (toastID: string) => void;
  success: (text: string) => void;
  info: (text: string) => void;
  error: (text: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [list, setList] = useState<Toast[]>([]);

  const add = useCallback((toast: Omit<Toast, "id">) => {
    setList((prev) => [
      ...prev,
      {
        id: getUUID(),
        ...toast,
      },
    ]);
  }, []);

  const remove = useCallback((toastID: string) => {
    setList((prev) => prev.filter((toast) => toast.id !== toastID));
  }, []);

  const success = useCallback(
    (text: string) => {
      add({
        text,
        type: "success",
      });
    },
    [add]
  );

  const info = useCallback(
    (text: string) => {
      add({
        text,
        type: "info",
      });
    },
    [add]
  );

  const error = useCallback(
    (text: string) => {
      add({
        text,
        type: "error",
      });
    },
    [add]
  );

  const contextValue = useMemo(
    () => ({
      list,
      add,
      remove,
      success,
      info,
      error,
    }),
    [list, add, remove, success, info, error]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
