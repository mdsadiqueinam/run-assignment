import DropPickerPanel from "./DropPickerPanel";

interface PermissionDropPickerPanelProps {
  permission: string | null;
  onPermissionChange: (value: string) => void;
  widthClass?: string;
  customPlaceholder?: string;
}

export default function PermissionDropPickerPanel({
  permission,
  onPermissionChange,
  widthClass = "w-48",
  customPlaceholder = "",
}: PermissionDropPickerPanelProps) {
  const permissionOptions = [
    { id: "CLIENT", name: "Client" },
    { id: "DOCTOR", name: "Doctor" },
  ];

  const memoizedOnPermissionIdChange = useCallback(
    (value: string | number | (string | number)[] | null) => {
      onPermissionChange(value as string);
    },
    [onPermissionChange]
  );

  return (
    <DropPickerPanel
      items={permissionOptions}
      selectedItemId={permission}
      onSelectedItemIdChange={memoizedOnPermissionIdChange}
      filterPlaceholder={customPlaceholder || "Permission"}
      widthClass={widthClass}
      iconWidthClass="w-10"
      showIconSlot={false}
      textSlot={(item) => item.name}
      showSearch={false}
    />
  );
}
