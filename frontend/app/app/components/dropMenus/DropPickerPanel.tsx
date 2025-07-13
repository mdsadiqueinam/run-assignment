import { CheckIcon } from '@heroicons/react/24/solid';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { KeyboardShortcutContextProvider, useKeyboardShortcut } from '../common/KeyboardShortcut';
import { createSearchRegex } from 'app/utils/search';
import type { ReactNode } from 'react';

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
  onSelectedItemIdChange: (value: string | number | (string | number)[] | null) => void;
  onClose: () => void;
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
  onClose,
  closeOnSelect = true,
  filterPlaceholder = 'Search',
  widthClass = 'w-48',
  iconWidthClass = 'w-5',
  noOptionsText,
  extraSearchFields = '',
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
  const scrollElRef = useRef<HTMLDivElement>(null);
  const searchFieldRef = useRef<HTMLInputElement>(null);
  
  const [focusItemId, setFocusItemId] = useState<string | number | null>(() => {
    if (multiple && Array.isArray(selectedItemId) && selectedItemId.length > 0) {
      return selectedItemId[0];
    }
    return selectedItemId as string | number | null;
  });
  
  const [searchVal, setSearchVal] = useState('');

  // Check if mouse is available (equivalent to useMediaQuery('(pointer: fine)'))
  const [isMouseAvailable, setIsMouseAvailable] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: fine)');
    setIsMouseAvailable(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMouseAvailable(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // --- Handlers ---
  const selectItem = useCallback((itemId: string | number, isFromCheckbox = false) => {
    if (multiple) {
      if (isFilter && !isFromCheckbox) {
        onSelectedItemIdChange([itemId]);
        onClose();
        return;
      }
      
      const currentSelected = Array.isArray(selectedItemId) 
        ? selectedItemId 
        : selectedItemId ? [selectedItemId] : [];

      const index = currentSelected.indexOf(itemId);
      if (index === -1) {
        onSelectedItemIdChange([...currentSelected, itemId]);
      } else {
        onSelectedItemIdChange(currentSelected.filter((id) => id !== itemId));
      }
    } else {
      onSelectedItemIdChange(itemId);
    }

    if (closeOnSelect && !multiple) onClose();
  }, [multiple, isFilter, selectedItemId, onSelectedItemIdChange, onClose, closeOnSelect]);

  // --- Computed values ---
  const filteredItems = useMemo(() => {
    if (searchVal === '') return items;

    let fieldsToSearch = ['name'];
    if (items[0]?.firstName && items[0]?.lastName) {
      fieldsToSearch.push('firstName', 'lastName');
    }
    if (extraSearchFields) {
      fieldsToSearch = fieldsToSearch.concat(
        extraSearchFields.split(',').map((field) => field.trim())
      );
    }

    const searchRegex = createSearchRegex(searchVal);
    return items.filter((item) => {
      return fieldsToSearch.some((field) => searchRegex.test(item[field]));
    });
  }, [items, searchVal, extraSearchFields]);

  // Select a new item to focus on, if the current item is no longer on the list
  useEffect(() => {
    if (filteredItems.length === 0) return;
    const pos = filteredItems.findIndex((o) => o.id === focusItemId);
    if (pos === -1) {
      setFocusItemId(filteredItems[0].id);
    }
  }, [filteredItems, focusItemId]);

  // --- Navigation ---
  const navigationUpDown = useCallback((direction: 'ArrowUp' | 'ArrowDown') => {
    if (filteredItems.length <= 1) return;
    const currentlySelectedIndex = filteredItems.findIndex((item) => item.id === focusItemId);
    let nextIndex = currentlySelectedIndex;
    
    if (direction === 'ArrowDown') {
      nextIndex++;
      if (nextIndex >= filteredItems.length) nextIndex = 0;
    } else if (direction === 'ArrowUp') {
      nextIndex--;
      if (nextIndex <= -1) nextIndex = filteredItems.length - 1;
    }
    
    setFocusItemId(filteredItems[nextIndex].id);
    
    // Scroll to item
    if (scrollElRef.current) {
      scrollElRef.current.scrollTop = (nextIndex - 3) * 32;
    }
  }, [filteredItems, focusItemId]);

  // --- Keyboard shortcuts ---
  useKeyboardShortcut('ArrowUp', () => {
    navigationUpDown('ArrowUp');
  }, { activeOnInput: true });

  useKeyboardShortcut('ArrowDown', () => {
    navigationUpDown('ArrowDown');
  }, { activeOnInput: true });

  useKeyboardShortcut('Enter', () => {
    if (focusItemId !== null) selectItem(focusItemId);
  }, { activeOnInput: true });

  useKeyboardShortcut('Escape', () => {
    onClose();
  }, { activeOnInput: true });

  // Number shortcuts
  for (const number of '123456789') {
    useKeyboardShortcut(number, () => {
      if (!searchVal) {
        const elms = elRef.current?.querySelectorAll(`[data-shortcutKey='${number}']`);
        if (!elms?.length) return;
        (elms[0] as HTMLElement).click();
        return;
      }
      setSearchVal(prev => `${prev}${number}`);
    }, { activeOnInput: true });
  }

  // Focus search field on mount
  useEffect(() => {
    if (isMouseAvailable && searchFieldRef.current) {
      searchFieldRef.current.focus();
    }
  }, [isMouseAvailable]);

  return (
    <KeyboardShortcutContextProvider contextActive={true}>
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
            {showSearch && <div className="my-1 block border-t border-divider-hover" />}
            <div
              ref={scrollElRef}
              className="flex flex-col gap-px overflow-y-auto text-nav"
              style={{ maxHeight: `${maxHeight}px` }}
            >
              {filteredItems.map((item, itemNo) => (
                <div key={item.id} className="h-8 shrink-0 px-1">
                  <a
                    href="#"
                    data-shortcutKey={useItemIdForShortcut ? item.id : itemNo + 1}
                    className={`option sidebar-text group/status flex h-full cursor-pointer items-center gap-3 text-nowrap rounded-md pl-2 pr-3 ${
                      focusItemId === item.id
                        ? 'bg-main-selected text-main-selected-text'
                        : 'text-main-unselected-text hover:bg-main-unselected-hover hover:text-main-text-hover'
                    }`}
                    onFocus={() => setFocusItemId(item.id)}
                    onMouseOver={() => setFocusItemId(item.id)}
                    onClick={(e) => {
                      e.preventDefault();
                      selectItem(item.id);
                    }}
                  >
                    {isFilter && (
                      <input
                        checked={Array.isArray(selectedItemId) && selectedItemId.includes(item.id)}
                        type="checkbox"
                        className="h-4 w-4 rounded bg-gray-100 cursor-pointer text-black focus:ring-black dark:bg-gray-700 dark:focus:ring-black"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectItem(item.id, true);
                        }}
                      />
                    )}
                    
                    {showIconSlot && (
                      <span
                        className={`opacity-80 group-hover/status:opacity-100 ${
                          iconWidthClass === 'w-5' ? 'w-5' : 'w-10'
                        } ${
                          item.id === focusItemId
                            ? 'brightness-90 dark:brightness-125'
                            : 'hover:brightness-90 dark:hover:brightness-125'
                        }`}
                      >
                        {iconSlot ? iconSlot(item) : (
                          item.icon && <item.icon className="size-4" />
                        )}
                      </span>
                    )}
                    
                    <span className="grow overflow-hidden text-ellipsis" title={item.name}>
                      {textSlot ? textSlot(item) : item.name}
                    </span>
                    
                    {(multiple 
                      ? Array.isArray(selectedItemId) && selectedItemId.includes(item.id)
                      : item.id === selectedItemId
                    ) && !isFilter && (
                      <CheckIcon className="size-3 shrink-0" />
                    )}
                    
                    {showInfo && (
                      <BaseTooltip contentSlot={tooltipTextSlot ? tooltipTextSlot(item) : undefined}>
                        <InformationCircleIcon className="ml-2 size-4" />
                      </BaseTooltip>
                    )}

                    {useItemIdForShortcut && typeof item.id === 'number' && item.id < 10 && (
                      <span className="shrink-0 text-xs opacity-50">{item.id}</span>
                    )}
                    {!useItemIdForShortcut && itemNo < 9 && (
                      <span className="shrink-0 text-xs opacity-50">{itemNo + 1}</span>
                    )}
                  </a>
                </div>
              ))}
            </div>
          </>
        ) : (
          noOptionsText && (
            <div className="px-4">{noOptionsText}</div>
          )
        )}
      </div>
    </KeyboardShortcutContextProvider>
  );
}


