import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'danger' | 'secondary' | 'outline' | 'text' | 'text-link' | 'transparent' | 'filter';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
type ButtonElement = 'button' | 'a';

interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  disabled?: boolean;
  iconOnly?: boolean;
  as?: ButtonElement;
  size?: ButtonSize;
  isOpen?: boolean;
  isLoading?: boolean;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  append?: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
}

const BaseButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, BaseButtonProps>(({
  variant = 'primary',
  type = 'button',
  disabled = false,
  iconOnly = false,
  as = 'button',
  size = 'md',
  isOpen = false,
  isLoading = false,
  children,
  icon,
  append,
  className = '',
  href,
  target,
  rel,
  ...props
}, ref) => {
  // --- Variant specific classes ---
  const variantClassMap: Record<ButtonVariant, string> = {
    primary:
      'gap-1 bg-primary text-primary-text border border-[#EEE] dark:border-[#000] hover:enabled:bg-primary-hover hover:enabled:text-primary-text-hover transition-[border,background-color,color,opacity] duration-300',
    danger: 'bg-bad text-white hover:enabled:brightness-90 dark:hover:enabled:brightness-125',
    secondary:
      'gap-1 bg-sidebar text-sidebar-text border border-divider hover:enabled:bg-sidebar-hover hover:enabled:text-sidebar-text-hover hover:enabled:border-divider-hover transition-[border,background-color,color,opacity] duration-300',
    outline:
      'gap-1 border border-divider-outline disabled:opacity-60 text-black dark:text-white dark:text-white hover:enabled:bg-main-selected hover:enabled:text-sidebar-text-hover transition-[border,background-color,color,opacity] duration-300',
    text: 'gap-1 border-0 !px-0 bg-transparent text-sidebar-text hover:enabled:text-sidebar-text-hover transition-[border,background-color,color,opacity] duration-300',
    'text-link':
      'gap-1 border-0 !px-0 bg-transparent text-link-text font-semibold hover:enabled:brightness-90 dark:hover:enabled:brightness-125',
    transparent: 'hover:enabled:brightness-90 dark:hover:enabled:brightness-125',
    filter:
      'h-8 items-center gap-1.5 rounded-lg border border-divider bg-main text-sm text-main-text transition-[border,background-color,color,opacity] duration-300 hover:enabled:border-divider-hover hover:enabled:bg-main-unselected-hover hover:enabled:text-main-text-hover hover:enabled:brightness-90 dark:hover:enabled:brightness-125',
  };

  // These are usually the same as hover effect but with !
  const variantIsOpenClassMap: Record<ButtonVariant, string> = {
    primary: '!bg-primary-hover !text-primary-text-hover',
    danger: '!brightness-90 !dark:brightness-125',
    secondary: '!bg-sidebar-hover !text-sidebar-text-hover !border-divider-hover',
    outline: '!border-black !dark:border-white',
    text: '!text-sidebar-text-hover',
    'text-link': '!brightness-90 dark:!brightness-125',
    transparent: '',
    filter: '!border-divider-hover !bg-main-unselected-hover !text-main-text-hover',
  };

  // --- Computed classes ---
  const heightClass = useMemo(() => {
    switch (size) {
      case 'xs':
        return 'h-4';
      case 'sm':
        return 'h-6';
      case 'lg':
        return 'h-10';
      case 'md':
      default:
        return 'h-8';
    }
  }, [size]);

  const widthClass = useMemo(() => {
    if (!iconOnly) return '';
    switch (size) {
      case 'xs':
        return 'w-4';
      case 'sm':
        return 'w-6';
      case 'md':
        return 'w-8';
      case 'lg':
      default:
        return 'w-10';
    }
  }, [iconOnly, size]);

  const fontClass = useMemo(() => {
    switch (size) {
      case 'xs':
        return 'text-10';
      case 'sm':
        return 'text-12';
      case 'lg':
        return 'text-16';
      case 'md':
      default:
        return 'text-baseline';
    }
  }, [size]);

  const paddingClass = useMemo(() => {
    if (iconOnly) return '';
    switch (size) {
      case 'xs':
        return 'px-1';
      case 'sm':
        return 'px-2';
      case 'lg':
        return 'px-4';
      case 'md':
      default:
        return 'px-3';
    }
  }, [iconOnly, size]);

  const baseClasses = useMemo(() => {
    return [
      'inline-flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-80 whitespace-nowrap select-none',
      !iconOnly ? 'rounded-md' : '',
      fontClass,
      heightClass,
      widthClass,
      paddingClass,
    ].filter(Boolean).join(' ');
  }, [iconOnly, fontClass, heightClass, widthClass, paddingClass]);

  const classes = useMemo(() => {
    const classArray = [baseClasses, variantClassMap[variant]];

    if (iconOnly) {
      const textSizeClass = size === 'xs' ? 'text-10' : size === 'sm' ? 'text-12' : 'text-20';
      classArray.push(`!rounded-lg ${widthClass} ${heightClass} ${textSizeClass}`);
    }

    if (isOpen) {
      classArray.push(variantIsOpenClassMap[variant]);
    }

    if (className) {
      classArray.push(className);
    }

    return classArray.filter(Boolean).join(' ');
  }, [baseClasses, variant, iconOnly, size, widthClass, heightClass, isOpen, className]);

  // --- Render ---
  const commonProps = {
    ref,
    disabled: disabled || isLoading,
    className: classes,
    ...props,
  };

  const content = (
    <>
      {!isLoading && icon}
      {isLoading && <ArrowPathIcon className="size-4 animate-spin" />}
      {children}
      {append}
    </>
  );

  if (as === 'a') {
    return (
      <a
        {...(commonProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        href={href}
        target={target}
        rel={rel}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      {...(commonProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      type={type as 'button' | 'submit' | 'reset'}
    >
      {content}
    </button>
  );
});

BaseButton.displayName = 'BaseButton';

export default BaseButton;
