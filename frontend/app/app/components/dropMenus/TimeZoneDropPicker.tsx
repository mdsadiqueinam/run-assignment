import { Menu, MenuButton, MenuItems } from "@headlessui/react";
import TimeZoneDropPickerPanel from "./TimeZoneDropPickerPanel";

interface TimeZoneDropPickerProps {
  timeZoneId: string | null;
  onTimeZoneIdChange: (value: string) => void;
  canEdit?: boolean;
  widthClass?: string;
  customPlaceholder?: string;
  children?: (props: { open: boolean }) => React.ReactNode;
}

export default function TimeZoneDropPicker({
  timeZoneId,
  onTimeZoneIdChange,
  canEdit = true,
  widthClass = "w-48",
  customPlaceholder = "",
  children,
}: TimeZoneDropPickerProps) {
  const memoizedOnTimeZoneIdChange = useCallback(
    (value: string | number | (string | number)[] | null) => {
      onTimeZoneIdChange(value as string);
    },
    [onTimeZoneIdChange]
  );

  if (canEdit) {
    return (
      <Menu as="div">
        {({ open, close }) => (
          <>
            <MenuButton as="div">{children?.({ open })}</MenuButton>
            <MenuItems
              as="div"
              transition
              className="relative rounded-xl border border-white/5 bg-white/5 p-1 text-sm/6 text-white transition duration-100 ease-out [--anchor-gap:--spacing(1)] focus:outline-none data-closed:scale-95 data-closed:opacity-0"
            >
              <TimeZoneDropPickerPanel
                timeZone={timeZoneId}
                onTimeZoneChange={memoizedOnTimeZoneIdChange}
                onClose={close}
                widthClass={widthClass}
                customPlaceholder={customPlaceholder}
              />
            </MenuItems>
          </>
        )}
      </Menu>
    );
  }

  // If not editable, just render the slot with open: false
  return <>{children?.({ open: false })}</>;
}
