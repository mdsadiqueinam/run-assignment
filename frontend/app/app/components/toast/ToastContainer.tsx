import { ToastProvider, useToast } from "./ToastContext";
import { ToastPopup } from "./ToastPopup";
import { Transition } from "@headlessui/react";

const ToastList = () => {
  const toasts = useToast();

  if (!toasts.list.length) {
    return null;
  }

  return (
    <div className="absolute bottom-0 right-0 z-[51] flex min-h-[40px] w-96 flex-col overflow-hidden p-4">
      <div className="scale relative h-full w-full space-y-2">
        {toasts.list.map((toast) => (
          <Transition
            key={toast.id}
            enter="transform transition duration-300 ease-in-out"
            enterFrom="translate-x-full opacity-0"
            enterTo="translate-x-0 opacity-100"
            leave="transform transition duration-300 ease-in-out"
            leaveFrom="translate-x-0 opacity-100"
            leaveTo="translate-x-full opacity-30"
          >
            <ToastPopup toast={toast} onDelete={toasts.remove} />
          </Transition>
        ))}
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
