import { Transition } from '@headlessui/react';
import { createPortal } from 'react-dom';

interface BaseTooltipProps {
  showOnHover?: boolean;
  showOnClick?: boolean;
  content?: string;
  disabled?: boolean;
  delay?: number;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  defaultClass?: string;
  /**
   * Configure a target element to trigger component toggle; 'true' means it will use the parent DOM element,
   * 'false' means it will use the default slot as a target element;
   * By using a String (CSS selector) or a DOM element it attaches the events to the specified DOM element (if it exists)
   */
  target?: boolean | string | HTMLElement;
  show?: boolean;
  onShowChange?: (show: boolean) => void;
  children?: React.ReactNode;
  customContent?: React.ReactNode;
  contentSlot?: React.ReactNode;
}

export default function BaseTooltip({
  showOnHover = true,
  showOnClick = false,
  content = '',
  disabled = false,
  delay = 600,
  placement = 'top',
  defaultClass = '',
  target = false,
  show,
  onShowChange,
  children,
  customContent,
  contentSlot,
}: BaseTooltipProps) {
  // --- State ---
  const [internalShow, setInternalShow] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({
    left: 0,
    top: 0,
    arrowLeft: 0,
    arrowTop: 0,
    arrowPlacement: '',
    arrowStyle: {},
    transform: 'translateY(0%)',
  });

  // --- Refs ---
  const targetRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const mouseOverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mouseOutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Computed values ---
  const isControlled = show !== undefined;
  const currentShow = isControlled ? show : internalShow;

  const triggerElement = useMemo(() => {
    if (!target) {
      // for backward compatibility when target is false it will accept a slot
      return targetRef.current;
    }

    if (target === true) {
      // return parent HTML element
      return targetRef.current?.parentElement;
    }

    if (typeof target === 'string') {
      // return HTML element by selector
      return document.querySelector(target);
    }

    if (typeof target === 'object') {
      // return HTML element by reference
      return target;
    }

    return null;
  }, [target]);

  // --- Handlers ---
  const updateTooltipPosition = useCallback(() => {
    if (!triggerElement || !tooltipRef.current || !shouldShow) return;

    const triggerRect = triggerElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const offset = 10;
    const arrowSize = 5;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate available space in each direction
    const spaceAbove = triggerRect.top;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceLeft = triggerRect.left;
    const spaceRight = viewportWidth - triggerRect.right;

    // Determine the best placement based on available space
    let finalPlacement: 'top' | 'bottom' | 'left' | 'right' = placement;

    // Auto-flip logic: if there's not enough space, try alternative placements
    const needsFlip = {
      top: spaceAbove < tooltipRect.height + offset,
      bottom: spaceBelow < tooltipRect.height + offset,
      left: spaceLeft < tooltipRect.width + offset,
      right: spaceRight < tooltipRect.width + offset,
    };

    if (needsFlip[finalPlacement]) {
      // Try opposite placement first
      const oppositePlacements: Record<string, 'top' | 'bottom' | 'left' | 'right'> = {
        top: 'bottom',
        bottom: 'top',
        left: 'right',
        right: 'left',
      };

      const oppositePlacement = oppositePlacements[finalPlacement];
      if (!needsFlip[oppositePlacement]) {
        finalPlacement = oppositePlacement;
      } else {
        // If opposite also doesn't fit, choose the side with more space
        if (finalPlacement === 'top' || finalPlacement === 'bottom') {
          finalPlacement = spaceAbove > spaceBelow ? 'top' : 'bottom';
        } else {
          finalPlacement = spaceLeft > spaceRight ? 'left' : 'right';
        }
      }
    }

    function horizontalPlacementStrategy() {
      let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;

      // Clamp horizontal position to viewport
      const clampedLeft = Math.max(offset, Math.min(left, viewportWidth - tooltipRect.width - offset));

      // Calculate arrow position relative to tooltip
      const arrowLeft =
        Math.max(
          arrowSize * 2,
          Math.min(triggerRect.left + triggerRect.width / 2 - clampedLeft, tooltipRect.width - arrowSize * 2),
        ) - arrowSize;

      return {
        left: clampedLeft,
        arrowLeft,
      };
    }

    function verticalPlacementStrategy() {
      // For left/right placement with CSS transforms, we just need the center point
      const top = triggerRect.top + triggerRect.height / 2;
      const arrowTop = -arrowSize; // Arrow will be positioned at 50% via CSS

      return {
        top,
        arrowTop,
      };
    }

    // Calculate position based on final placement
    const placementStrategy = {
      top: () => {
        const horizontalStrategy = horizontalPlacementStrategy();
        // Position tooltip above target - use CSS transform for better multi-line positioning
        const top = triggerRect.top - offset;

        return {
          left: horizontalStrategy.left,
          top,
          arrowLeft: horizontalStrategy.arrowLeft,
          arrowTop: tooltipRect.height - arrowSize,
          arrowPlacement: 'bottom',
          transform: 'translateY(-100%)',
        };
      },
      bottom: () => {
        const horizontalStrategy = horizontalPlacementStrategy();
        const top = triggerRect.bottom + offset;

        return {
          left: horizontalStrategy.left,
          top,
          arrowLeft: horizontalStrategy.arrowLeft,
          arrowTop: -arrowSize,
          arrowPlacement: 'top',
          transform: 'translateY(0%)',
        };
      },
      left: () => {
        const verticalStrategy = verticalPlacementStrategy();
        const left = triggerRect.left - offset;

        return {
          left,
          top: verticalStrategy.top,
          arrowLeft: -arrowSize, // Arrow positioned via CSS at 50%
          arrowTop: verticalStrategy.arrowTop,
          arrowPlacement: 'right',
          transform: 'translateX(-100%) translateY(-50%)',
        };
      },
      right: () => {
        const verticalStrategy = verticalPlacementStrategy();
        const left = triggerRect.right + offset;

        return {
          left,
          top: verticalStrategy.top,
          arrowLeft: -arrowSize,
          arrowTop: verticalStrategy.arrowTop,
          arrowPlacement: 'left',
          transform: 'translateX(0%) translateY(-50%)',
        };
      },
    };

    // Apply positioning
    const result = (placementStrategy[finalPlacement] || placementStrategy.top)();

    // Apply the calculated position
    setTooltipPosition({
      left: result.left,
      top: result.top,
      arrowLeft: result.arrowLeft,
      arrowTop: result.arrowTop,
      arrowPlacement: result.arrowPlacement,
      transform: result.transform,
      arrowStyle: ['bottom', 'top'].includes(result.arrowPlacement)
        ? { left: `${result.arrowLeft}px` }
        : {}, // Left/right arrows use CSS positioning
    });
  }, [triggerElement, placement]);

  const debouncedUpdatePosition = useDebounceFn(updateTooltipPosition, { wait: 10 });

  const mouseOver = useCallback(() => {
    if (mouseOutTimerRef.current) {
      clearTimeout(mouseOutTimerRef.current);
    }
    
    mouseOverTimerRef.current = setTimeout(() => {
      setHovered(true);
      setTimeout(debouncedUpdatePosition.run, 0);
    }, delay);
  }, [delay, debouncedUpdatePosition]);

  const mouseOut = useCallback(() => {
    if (mouseOverTimerRef.current) {
      clearTimeout(mouseOverTimerRef.current);
    }
    
    mouseOutTimerRef.current = setTimeout(() => {
      setHovered(false);
    }, 200);
  }, []);

  const onClicked = useCallback(() => {
    setClicked(true);
    setTimeout(updateTooltipPosition, 0);
  }, [updateTooltipPosition]);

  const onClickOutside = useCallback(() => {
    setClicked(false);
  }, []);

  // --- Computed values ---
  const shouldShow = useMemo(() => {
    if (disabled) {
      return false;
    }

    if (currentShow !== false) {
      return currentShow;
    }
    if (showOnClick) {
      return clicked;
    }

    return showOnHover && hovered;
  }, [disabled, currentShow, showOnClick, clicked, showOnHover, hovered]);

  // --- Effects ---
  useEffect(() => {
    const handleResize = () => debouncedUpdatePosition.run();
    const handleScroll = () => debouncedUpdatePosition.run();
    const handleClickOutside = () => onClickOutside();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    document.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [debouncedUpdatePosition, onClickOutside]);

  useEffect(() => {
    if (!triggerElement) return;

    const handleMouseEnter = () => mouseOver();
    const handleMouseLeave = () => mouseOut();
    const handleClick = () => onClicked();

    triggerElement.addEventListener('mouseenter', handleMouseEnter);
    triggerElement.addEventListener('mouseleave', handleMouseLeave);
    triggerElement.addEventListener('click', handleClick);

    return () => {
      triggerElement.removeEventListener('mouseenter', handleMouseEnter);
      triggerElement.removeEventListener('mouseleave', handleMouseLeave);
      triggerElement.removeEventListener('click', handleClick);
    };
  }, [triggerElement, mouseOver, mouseOut, onClicked]);

  useEffect(() => {
    if (shouldShow) {
      setTimeout(updateTooltipPosition, 0);
    }
  }, [shouldShow, updateTooltipPosition]);

  useEffect(() => {
    if (isControlled && onShowChange) {
      onShowChange(shouldShow);
    } else if (!isControlled) {
      setInternalShow(shouldShow);
    }
  }, [shouldShow, isControlled, onShowChange]);

  // --- Cleanup ---
  useEffect(() => {
    return () => {
      if (mouseOverTimerRef.current) {
        clearTimeout(mouseOverTimerRef.current);
      }
      if (mouseOutTimerRef.current) {
        clearTimeout(mouseOutTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {!target && (
        <span ref={targetRef} className={`max-w-fit ${defaultClass}`}>
          {children}
        </span>
      )}

      {shouldShow && createPortal(
        <Transition
          show={true}
          enter="transition-opacity duration-75"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            ref={tooltipRef}
            className="fixed z-[9999] flex min-h-8 min-w-[124px] max-w-[400px] items-center rounded-lg border border-divider-hover bg-main-unselected text-sm text-sidebar-text shadow-lg focus:outline-none"
            style={{
              left: `${tooltipPosition.left}px`,
              top: `${tooltipPosition.top}px`,
              transform: tooltipPosition.transform,
            }}
            onMouseEnter={mouseOver}
            onMouseLeave={mouseOut}
          >
            <div
              className={`absolute h-[10px] w-[10px] rotate-45 border-inherit bg-main-unselected ${
                tooltipPosition.arrowPlacement === 'bottom' ? 'bottom-[-5px] border-b border-r' :
                tooltipPosition.arrowPlacement === 'right' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-r border-t' :
                tooltipPosition.arrowPlacement === 'left' ? 'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l' :
                tooltipPosition.arrowPlacement === 'top' ? 'top-[-5px] border-l border-t' : ''
              }`}
              style={tooltipPosition.arrowStyle}
            />
            {customContent || (
              <div className="flex max-h-[33vh] flex-col items-start justify-start overflow-auto px-2 py-1 text-nav leading-relaxed">
                {contentSlot || content}
              </div>
            )}
          </div>
        </Transition>,
        document.body
      )}
    </>
  );
}
