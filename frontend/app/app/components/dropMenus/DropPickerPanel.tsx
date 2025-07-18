import { CheckIcon } from "@heroicons/react/24/solid";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { MenuItem, MenuItems } from "@headlessui/react";
import type { ReactNode } from "react";

interface DropPickerPanelItem {
  id: string | number;
  name: string;
  firstName?: string;
  lastName?: string;
  icon?: React.ComponentType<any>;
  [key: string]: any;
}

interface DropPickerPanelProps {
  items: DropPickerPanelItem[];
  selectedItemId: string | number | (string | number)[] | null;
  onSelectedItemIdChange: (
    value: string | number | (string | number)[] | null
  ) => void;
  required?: boolean;
  closeOnSelect?: boolean;
  filterPlaceholder?: string;
  widthClass?: string;
  iconWidthClass?: string;
  noOptionsText?: string;
  extraSearchFields?: string;
  showIconSlot?: boolean;
  showInfo?: boolean;
  showSearch?: boolean;
  multiple?: boolean;
  isFilter?: boolean;
  useItemIdForShortcut?: boolean;
  maxHeight?: number;
  iconSlot?: (item: DropPickerPanelItem) => ReactNode;
  textSlot?: (item: DropPickerPanelItem) => ReactNode;
  tooltipTextSlot?: (item: DropPickerPanelItem) => ReactNode;
}

export default function DropPickerPanel({
  items,
  selectedItemId,
  onSelectedItemIdChange,
  closeOnSelect = true,
  filterPlaceholder = "Search",
  widthClass = "w-48",
  iconWidthClass = "w-5",
  noOptionsText,
  extraSearchFields = "",
  showIconSlot = true,
  showInfo = false,
  showSearch = true,
  multiple = false,
  isFilter = false,
  useItemIdForShortcut = false,
  maxHeight = 310,
  iconSlot,
  textSlot,
  tooltipTextSlot,
}: DropPickerPanelProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const searchFieldRef = useRef<HTMLInputElement>(null);

  const [searchVal, setSearchVal] = useState("");

  // Check if mouse is available (equivalent to useMediaQuery('(pointer: fine)'))
  const [isMouseAvailable, setIsMouseAvailable] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: fine)");
    setIsMouseAvailable(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMouseAvailable(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // --- Handlers ---
  const selectItem = useCallback(
    (itemId: string | number, isFromCheckbox = false, close: () => void) => {
      if (multiple) {
        if (isFilter && !isFromCheckbox) {
          onSelectedItemIdChange([itemId]);
          close();
          return;
        }

        const currentSelected = Array.isArray(selectedItemId)
          ? selectedItemId
          : selectedItemId
          ? [selectedItemId]
          : [];

        const index = currentSelected.indexOf(itemId);
        if (index === -1) {
          onSelectedItemIdChange([...currentSelected, itemId]);
        } else {
          onSelectedItemIdChange(currentSelected.filter((id) => id !== itemId));
        }
      } else {
        onSelectedItemIdChange(itemId);
      }

      if (closeOnSelect && !multiple) close();
    },
    [multiple, isFilter, selectedItemId, onSelectedItemIdChange, closeOnSelect]
  );

  // --- Computed values ---
  const filteredItems = useMemo(() => {
    if (searchVal === "") return items;

    let fieldsToSearch = ["name"];
    if (items[0]?.firstName && items[0]?.lastName) {
      fieldsToSearch.push("firstName", "lastName");
    }
    if (extraSearchFields) {
      fieldsToSearch = fieldsToSearch.concat(
        extraSearchFields.split(",").map((field) => field.trim())
      );
    }

    const searchRegex = createSearchRegex(searchVal);
    return items.filter((item) => {
      return fieldsToSearch.some((field) => searchRegex.test(item[field]));
    });
  }, [items, searchVal, extraSearchFields]);

  // Focus search field on mount
  useEffect(() => {
    if (isMouseAvailable && searchFieldRef.current) {
      searchFieldRef.current.focus();
    }
  }, [isMouseAvailable]);

  return (
    <MenuItems
      anchor="bottom start"
      className="relative rounded-xl border bg-main p-1 text-sm/6 transition duration-100 ease-out [--anchor-gap:--spacing(1)] focus:outline-none data-closed:scale-95 data-closed:opacity-0"
    >
      <div ref={elRef} className={`flex flex-col gap-px py-1 ${widthClass}`}>
        {showSearch && (
          <div className="flex h-7 items-center px-1">
            <input
              ref={searchFieldRef}
              name="search"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              type="text"
              className="placeholder:main-unselected-text block h-7 w-full rounded-lg border border-transparent bg-main-unselected ps-2.5 text-sm ring-0 placeholder:text-sm focus:border-transparent focus:ring-0"
              placeholder={filterPlaceholder}
              aria-disabled={true}
              autoComplete="off"
            />
          </div>
        )}

        {filteredItems.length > 0 ? (
          <>
            {showSearch && (
              <div className="my-1 block border-t border-divider-hover" />
            )}
            <div
              className="flex flex-col gap-px overflow-y-auto text-nav"
              style={{ maxHeight: `${maxHeight}px` }}
            >
              {filteredItems.map((item, itemNo) => (
                <MenuItem as="div" key={item.id} className="h-8 shrink-0 px-1">
                  {({ close }) => (
                    <div
                      className="option sidebar-text group/status flex h-full cursor-pointer items-center gap-3 text-nowrap rounded-md pl-2 pr-3 text-main-unselected-text hover:bg-main-unselected-hover hover:text-main-text-hover"
                      onClick={(e) => {
                        e.preventDefault();
                        selectItem(item.id, false, close);
                      }}
                    >
                      {isFilter && (
                        <input
                          checked={
                            Array.isArray(selectedItemId) &&
                            selectedItemId.includes(item.id)
                          }
                          type="checkbox"
                          className="h-4 w-4 rounded bg-gray-100 cursor-pointer text-black focus:ring-black dark:bg-gray-700 dark:focus:ring-black"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectItem(item.id, true, close);
                          }}
                        />
                      )}

                      {showIconSlot && (
                        <span
                          className={`opacity-80 group-hover/status:opacity-100 ${
                            iconWidthClass === "w-5" ? "w-5" : "w-10"
                          } hover:brightness-90 dark:hover:brightness-125`}
                        >
                          {iconSlot
                            ? iconSlot(item)
                            : item.icon && <item.icon className="size-4" />}
                        </span>
                      )}

                      <span
                        className="grow overflow-hidden text-ellipsis"
                        title={item.name}
                      >
                        {textSlot ? textSlot(item) : item.name}
                      </span>

                      {(multiple
                        ? Array.isArray(selectedItemId) &&
                          selectedItemId.includes(item.id)
                        : item.id === selectedItemId) &&
                        !isFilter && <CheckIcon className="size-3 shrink-0" />}

                      {showInfo && (
                        <BaseTooltip
                          contentSlot={
                            tooltipTextSlot ? tooltipTextSlot(item) : undefined
                          }
                        >
                          <InformationCircleIcon className="ml-2 size-4" />
                        </BaseTooltip>
                      )}

                      {useItemIdForShortcut &&
                        typeof item.id === "number" &&
                        item.id < 10 && (
                          <span className="shrink-0 text-xs opacity-50">
                            {item.id}
                          </span>
                        )}
                      {!useItemIdForShortcut && itemNo < 9 && (
                        <span className="shrink-0 text-xs opacity-50">
                          {itemNo + 1}
                        </span>
                      )}
                    </div>
                  )}
                </MenuItem>
              ))}
            </div>
          </>
        ) : (
          noOptionsText && <div className="px-4">{noOptionsText}</div>
        )}
      </div>
    </MenuItems>
  );
}
