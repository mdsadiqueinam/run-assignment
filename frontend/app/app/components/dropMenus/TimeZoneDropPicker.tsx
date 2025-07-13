import BasePopover from '../common/BasePopover';
import TimeZoneDropPickerPanel from './TimeZoneDropPickerPanel';

interface TimeZoneDropPickerProps {
  timeZoneId: string | null;
  onTimeZoneIdChange: (value: string | number | (string | number)[] | null) => void;
  canEdit?: boolean;
  widthClass?: string;
  customPlaceholder?: string;
  children?: (props: { open: boolean }) => React.ReactNode;
}

export default function TimeZoneDropPicker({
  timeZoneId,
  onTimeZoneIdChange,
  canEdit = true,
  widthClass = 'w-48',
  customPlaceholder = '',
  children,
}: TimeZoneDropPickerProps) {
  if (canEdit) {
    return (
      <BasePopover
        buttonSlot={({ open }) => children?.({ open }) || null}
        contentSlot={({ open, close }) => 
          open ? (
            <TimeZoneDropPickerPanel
              timeZone={timeZoneId}
              onTimeZoneChange={onTimeZoneIdChange}
              onClose={close}
              widthClass={widthClass}
              customPlaceholder={customPlaceholder}
            />
          ) : null
        }
      />
    );
  }

  // If not editable, just render the slot with open: false
  return <>{children?.({ open: false })}</>;
}
