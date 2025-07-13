import { Menu, MenuButton } from "@headlessui/react";
import PermissionDropPickerPanel from "./PermissionDropPickerPanel";

interface PermissionDropPickerProps {
  permissionId: string | null;
  onPermissionIdChange: (value: string) => void;
  canEdit?: boolean;
  widthClass?: string;
  customPlaceholder?: string;
  children?: (props: { open: boolean }) => React.ReactNode;
}

export default function PermissionDropPicker({
  permissionId,
  onPermissionIdChange,
  canEdit = true,
  widthClass = "w-48",
  customPlaceholder = "",
  children,
}: PermissionDropPickerProps) {
  if (canEdit) {
    return (
      <Menu as="div">
        {({ open }) => (
          <>
            <MenuButton as="div">{children?.({ open })}</MenuButton>
            <PermissionDropPickerPanel
              permission={permissionId}
              onPermissionChange={onPermissionIdChange}
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
