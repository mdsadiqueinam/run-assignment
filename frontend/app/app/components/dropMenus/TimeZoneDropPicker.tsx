import { Menu, MenuButton, MenuItems, Popover } from "@headlessui/react";
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
  if (canEdit) {
    return (
      <Menu as="div">
        {({ open }) => (
          <>
            <MenuButton as="div">{children?.({ open })}</MenuButton>
            <TimeZoneDropPickerPanel
              timeZone={timeZoneId}
              onTimeZoneChange={onTimeZoneIdChange}
              widthClass={widthClass}
              customPlaceholder={customPlaceholder}
            />
          </>
        )}
      </Menu>
    );
  }

  // If not editable, just render the slot with open: false
  return <>{children?.({ open: false })}</>;
}
