import DropPickerPanel from "./DropPickerPanel";

interface TimeZoneDropPickerPanelProps {
  timeZone: string | null;
  onTimeZoneChange: (value: string) => void;
  widthClass?: string;
  customPlaceholder?: string;
}

export default function TimeZoneDropPickerPanel({
  timeZone,
  onTimeZoneChange,
  widthClass = "w-48",
  customPlaceholder = "",
}: TimeZoneDropPickerPanelProps) {
  const timeZoneOptions = useMemo(() => {
    const timeZones = Intl.supportedValuesOf("timeZone");
    return timeZones.map((zone) => {
      const offset = new Date()
        .toLocaleTimeString("en-us", {
          timeZone: zone,
          timeZoneName: "short",
        })
        .split(" ")[2];
      const text = `${zone}`;
      return {
        id: text,
        name: text.replace(/_/g, " "),
        offset,
      };
    });
  }, []);

  const memoizedOnTimeZoneIdChange = useCallback(
    (value: string | number | (string | number)[] | null) => {
      onTimeZoneChange(value as string);
    },
    [onTimeZoneChange]
  );

  return (
    <DropPickerPanel
      items={timeZoneOptions}
      selectedItemId={timeZone}
      onSelectedItemIdChange={memoizedOnTimeZoneIdChange}
      filterPlaceholder={customPlaceholder || "Time zone"}
      widthClass={widthClass}
      iconWidthClass="w-10"
      extraSearchFields="offset"
      iconSlot={(item) => item.offset}
      textSlot={(item) => item.name}
    />
  );
}
