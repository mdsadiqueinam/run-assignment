import { XMarkIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import {
  CheckBadgeIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";
import { micromark } from "micromark";
import { useTimeoutFn } from "app/hooks/useTimeoutFn";

interface Toast {
  id: string;
  text: string;
  type: "success" | "info" | "error";
  onClick?: () => void;
  objectName?: string;
  objectPath?: string;
}

interface ToastPopupProps {
  toast: Toast;
  onDelete: (toastId: string) => void;
}

export const ToastPopup = ({ toast, onDelete }: ToastPopupProps) => {
  // --- Handlers ---
  const deleteToast = useCallback(() => {
    onDelete(toast.id);
  }, [onDelete, toast.id]);

  const deleteTimer = useTimeoutFn(deleteToast, 6000);

  const handleClick = useCallback(() => {
    if (toast.onClick) {
      toast.onClick();
      deleteToast();
    }
  }, [toast.onClick, deleteToast]);

  // --- Computed values ---
  const Component = toast.onClick ? "button" : "div";
  const renderedText = useMemo(() => micromark(toast.text), [toast.text]);

  // --- Render icon based on type ---
  const renderIcon = () => {
    switch (toast.type) {
      case "error":
        return <ExclamationCircleIcon className="size-5 text-bad" />;
      case "success":
        return <CheckBadgeIcon className="size-5 text-good" />;
      default:
        return <InformationCircleIcon className="size-5" />;
    }
  };

  return (
    <Component
      className="items-top z-10 flex w-full transform gap-2 overflow-hidden rounded-lg border border-divider bg-main-unselected px-3 py-2 text-[13px] shadow-2xl transition-all hover:border-divider-hover"
      onMouseOver={deleteTimer.stop}
      onMouseOut={deleteTimer.start}
      onClick={handleClick}
    >
      <div className="size-5">{renderIcon()}</div>

      <div className="flex w-full grow-0 flex-col gap-2 overflow-hidden">
        <div
          className="font-semibold"
          dangerouslySetInnerHTML={{ __html: renderedText }}
        />

        {toast.objectName && (
          <>
            <div className="w-full overflow-hidden">{toast.objectName}</div>
            {toast.objectPath && (
              <div>
                <a href={toast.objectPath} onClick={deleteToast}>
                  <BaseButton variant="text-link" className="-my-2">
                    View
                  </BaseButton>
                </a>
              </div>
            )}
          </>
        )}
      </div>

      {/* Close */}
      <div className="w-5">
        <button
          className="rounded-lg px-1.5 py-1 transition-[border,background-color,color,opacity] duration-300 hover:bg-main-unselected-hover hover:text-main-text-hover"
          onClick={deleteToast}
        >
          <XMarkIcon className="size-4" />
        </button>
      </div>
    </Component>
  );
};
