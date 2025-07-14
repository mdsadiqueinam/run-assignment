import { ToastProvider, useToast } from "./ToastContext";
import { ToastPopup } from "./ToastPopup";
import { Transition, TransitionChild } from "@headlessui/react";

const ToastList = () => {
  const toasts = useToast();

  if (!toasts.list.length) {
    return null;
  }

  return (
    <div className="absolute bottom-0 right-0 z-[51] flex min-h-[40px] w-96 flex-col overflow-hidden p-4">
      <div className="scale relative h-full w-full space-y-2">
        <Transition show={true}>
          {toasts.list.map((toast) => (
            <TransitionChild key={toast.id}>
              <div className="transform transition duration-300 ease-in-out data-closed:translate-x-full data-closed:opacity-0 data-enter:translate-x-0 data-enter:opacity-100">
                <ToastPopup toast={toast} onDelete={toasts.remove} />
              </div>
            </TransitionChild>
          ))}
        </Transition>
      </div>
    </div>
  );
};

export const ToastContainer = () => {
  return (
    <ToastProvider>
      <ToastList />
    </ToastProvider>
  );
};
