import DropPickerPanel from './DropPickerPanel';

interface TimeZoneDropPickerPanelProps {
  timeZone: string | null;
  onTimeZoneChange: (value: string | number | (string | number)[] | null) => void;
  onClose: () => void;
  widthClass?: string;
  customPlaceholder?: string;
}

// Temporary placeholder for i18n - replace with actual i18n implementation
const t = (key: string) => key;

export default function TimeZoneDropPickerPanel({
  timeZone,
  onTimeZoneChange,
  onClose,
  widthClass = 'w-48',
  customPlaceholder = '',
}: TimeZoneDropPickerPanelProps) {
  const timeZoneOptions = useMemo(() => {
    const timeZones = Intl.supportedValuesOf('timeZone');
    return timeZones.map((zone) => {
      const offset = new Date().toLocaleTimeString('en-us', { 
        timeZone: zone, 
        timeZoneName: 'short' 
      }).split(' ')[2];
      const text = `${zone}`;
      return {
        id: text,
        name: text.replace(/_/g, ' '),
        offset,
      };
    });
  }, []);

  return (
    <DropPickerPanel
      items={timeZoneOptions}
      selectedItemId={timeZone}
      onSelectedItemIdChange={onTimeZoneChange}
      filterPlaceholder={customPlaceholder || t('Time zone')}
      widthClass={widthClass}
      iconWidthClass="w-10"
      extraSearchFields="offset"
      onClose={onClose}
      iconSlot={(item) => item.offset}
      textSlot={(item) => item.name}
    />
  );
}
