import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Float } from '@headlessui-float/react';
import { PopOverPlacement } from '../constant';
import { useEffect, useRef } from 'react';

type PopoverPlacement = typeof PopOverPlacement[number];

interface BasePopoverProps {
  flip?: boolean;
  arrow?: boolean;
  offset?: number;
  shift?: number;
  placement?: PopoverPlacement;
  menuItemsClasses?: string;
  portal?: boolean;
  disabled?: boolean;
  show?: boolean;
  showContent?: boolean;
  buttonParentDivClasses?: string;
  buttonSlot?: (props: { open: boolean }) => React.ReactNode;
  contentSlot?: (props: { open: boolean; close: () => void }) => React.ReactNode;
  children?: React.ReactNode;
}

export default function BasePopover({
  flip = false,
  arrow = true,
  offset = 12,
  shift = 12,
  placement = 'bottom',
  menuItemsClasses = '',
  portal = true,
  disabled = false,
  show,
  showContent = true,
  buttonParentDivClasses = '',
  buttonSlot,
  contentSlot,
  children,
}: BasePopoverProps) {
  const popoverPanelRef = useRef<HTMLDivElement>(null);

  // Focus the panel when it becomes available
  useEffect(() => {
    if (popoverPanelRef.current) {
      popoverPanelRef.current.focus();
    }
  });

  if (disabled) {
    return (
      <div>
        {buttonSlot ? buttonSlot({ open: false }) : children}
      </div>
    );
  }

  return (
    <Popover className="relative w-min">
      {({ open }: { open: boolean }) => (
        <Float
          show={show}
          placement={placement as any}
          flip={flip}
          shift={shift}
          arrow={arrow}
          offset={offset}
          enter="transition duration-100 ease-out"
          enterFrom="scale-95 opacity-0"
          enterTo="scale-100 opacity-100"
          leave="transition duration-75 ease-in"
          leaveFrom="scale-100 opacity-100"
          leaveTo="scale-95 opacity-0"
          portal={portal}
        >
          <PopoverButton
            as="div"
            onClick={(e) => e.stopPropagation()}
            className={buttonParentDivClasses}
          >
            {buttonSlot ? buttonSlot({ open }) : children}
          </PopoverButton>
          
          <PopoverPanel
            ref={popoverPanelRef}
            className={`
              ${showContent 
                ? 'flex min-h-8 min-w-[124px] items-center rounded-lg border border-divider-hover bg-main-unselected text-sm text-sidebar-text shadow-lg focus:outline-none' 
                : 'hidden'
              } 
              ${menuItemsClasses}
            `}
          >
            {({ open, close }) => (
              <>
                {arrow && (
                  <Float.Arrow
                    className={`absolute h-[10px] w-[10px] border-l border-t border-divider-hover bg-main-unselected ${
                      placement.startsWith('bottom') ? 'rotate-45' :
                      placement.startsWith('top') ? 'rotate-[225deg]' :
                      placement.startsWith('left') ? 'rotate-[135deg]' :
                      placement.startsWith('right') ? '-rotate-45' : ''
                    }`}
                  />
                )}
                <div className="relative w-full overflow-hidden">
                  {contentSlot ? contentSlot({ open, close }) : null}
                </div>
              </>
            )}
          </PopoverPanel>
        </Float>
      )}
    </Popover>
  );
}
