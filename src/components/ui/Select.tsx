import {
  forwardRef,
  useMemo,
  useRef,
  useState,
  useEffect,
  type SelectHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * 选项类型
 */
export interface SelectOption {
  /** 选项值 */
  value: string | number;
  /** 显示标签 */
  label: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 分组名称（用于分组显示） */
  group?: string;
}

/**
 * 选择器变体类型
 */
export type SelectVariant = 'default' | 'filled';

/**
 * 选择器尺寸类型
 */
export type SelectSize = 'sm' | 'md' | 'lg';

/**
 * 选择器组件属性接口
 */
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'value' | 'onChange' | 'multiple'> {
  /** 选项列表 */
  options: SelectOption[];
  /** 当前选中值 */
  value?: string | number | (string | number)[];
  /** 选中值变化回调 */
  onChange?: (value: string | number | (string | number)[]) => void;
  /** 变体样式 */
  variant?: SelectVariant;
  /** 尺寸 */
  size?: SelectSize;
  /** 占位文字 */
  placeholder?: string;
  /** 是否可搜索 */
  searchable?: boolean;
  /** 是否多选 */
  multiple?: boolean;
  /** 是否可清空 */
  clearable?: boolean;
  /** 错误状态 */
  error?: boolean;
  /** 错误提示 */
  errorMessage?: string;
  /** 标签 */
  label?: string;
  /** 是否必填 */
  required?: boolean;
  /** 容器类名 */
  wrapperClassName?: string;
  /** 搜索框占位文字 */
  searchPlaceholder?: string;
}

/**
 * 变体样式
 */
const variantClasses = {
  default: {
    base: 'border border-gray-200 bg-white',
    focused: 'focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100',
    error: 'border-danger-300 focus-within:border-danger-400 focus-within:ring-2 focus-within:ring-danger-100',
  },
  filled: {
    base: 'border border-transparent bg-gray-50',
    focused: 'focus-within:border-primary-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-100',
    error: 'border-danger-200 bg-danger-50 focus-within:border-danger-400 focus-within:ring-2 focus-within:ring-danger-100',
  },
};

/**
 * 尺寸样式
 */
const sizeClasses: Record<SelectSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg',
  md: 'h-10 px-3.5 text-sm rounded-xl',
  lg: 'h-12 px-4 text-base rounded-xl',
};

/**
 * 选择器组件
 * 支持分组、搜索、多选、清空等特性
 */
export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      variant = 'default',
      size = 'md',
      placeholder = '请选择',
      searchable = false,
      multiple = false,
      clearable = false,
      error = false,
      errorMessage,
      label,
      required,
      wrapperClassName,
      searchPlaceholder = '搜索...',
      className,
      disabled,
      id,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const selectId = id || `select-${Math.random().toString(36).slice(2, 8)}`;

    const selectedValues = useMemo(() => {
      if (value === undefined || value === null) return [];
      return Array.isArray(value) ? value : [value];
    }, [value]);

    const filteredOptions = useMemo(() => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return options;
      return options.filter(
        (o) =>
          o.label.toLowerCase().includes(term) ||
          String(o.value).toLowerCase().includes(term),
      );
    }, [options, searchTerm]);

    const groupedOptions = useMemo(() => {
      const groups = new Map<string, SelectOption[]>();
      const ungrouped: SelectOption[] = [];
      filteredOptions.forEach((opt) => {
        if (opt.group) {
          if (!groups.has(opt.group)) groups.set(opt.group, []);
          groups.get(opt.group)!.push(opt);
        } else {
          ungrouped.push(opt);
        }
      });
      return { groups, ungrouped };
    }, [filteredOptions]);

    const selectedLabels = useMemo(() => {
      return options
        .filter((o) => selectedValues.includes(o.value))
        .map((o) => o.label);
    }, [options, selectedValues]);

    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
          setSearchTerm('');
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleSelect(opt: SelectOption) {
      if (opt.disabled) return;
      if (multiple) {
        const idx = selectedValues.indexOf(opt.value);
        let newValues: (string | number)[];
        if (idx === -1) {
          newValues = [...selectedValues, opt.value];
        } else {
          newValues = selectedValues.filter((v) => v !== opt.value);
        }
        onChange?.(newValues);
      } else {
        onChange?.(opt.value);
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    function handleClear(e: React.MouseEvent) {
      e.stopPropagation();
      if (multiple) {
        onChange?.([]);
      } else {
        onChange?.('');
      }
    }

    const v = variantClasses[variant];
    const showClear =
      clearable &&
      !disabled &&
      (Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== '');

    return (
      <div className={cn('w-full flex flex-col gap-1.5', wrapperClassName)} ref={containerRef}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-gray-700 select-none">
            {label}
            {required && <span className="text-danger-500 ml-0.5">*</span>}
          </label>
        )}

        <div
          ref={ref}
          id={selectId}
          onClick={() => !disabled && setIsOpen((o) => !o)}
          className={cn(
            'relative w-full cursor-pointer transition-all duration-200 flex items-center',
            sizeClasses[size],
            v.base,
            disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
            error ? v.error : v.focused,
            className,
          )}
        >
          <div className="flex-1 flex items-center gap-1 flex-wrap min-w-0">
            {multiple ? (
              selectedLabels.length > 0 ? (
                selectedLabels.map((lbl, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 h-5 px-1.5 text-[10px] rounded-md bg-primary-50 text-primary-700 border border-primary-200 max-w-full"
                  >
                    <span className="truncate">{lbl}</span>
                    <X
                      size={10}
                      className="shrink-0 cursor-pointer hover:text-primary-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        const target = options.find((o) => o.label === lbl);
                        if (target) {
                          const newValues = selectedValues.filter((v) => v !== target.value);
                          onChange?.(newValues);
                        }
                      }}
                    />
                  </span>
                ))
              ) : (
                <span className="text-gray-400 truncate">{placeholder}</span>
              )
            ) : selectedLabels.length > 0 ? (
              <span className="text-gray-900 truncate">{selectedLabels[0]}</span>
            ) : (
              <span className="text-gray-400 truncate">{placeholder}</span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {showClear && (
              <X
                size={size === 'sm' ? 12 : size === 'md' ? 14 : 16}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={handleClear}
              />
            )}
            <ChevronDown
              size={size === 'sm' ? 14 : size === 'md' ? 16 : 18}
              className={cn(
                'text-gray-400 transition-transform duration-200',
                isOpen && 'rotate-180',
              )}
            />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1.5 w-full min-w-[200px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-fadeInUp">
            {searchable && (
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full h-8 pl-8 pr-3 text-xs rounded-lg bg-gray-50 border border-transparent focus:bg-white focus:border-primary-300 outline-none transition-all"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            <div className="max-h-64 overflow-auto scrollbar-thin py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-gray-400">无匹配选项</div>
              ) : (
                <>
                  {groupedOptions.ungrouped.map((opt) => (
                    <SelectOptionItem
                      key={opt.value}
                      option={opt}
                      selected={selectedValues.includes(opt.value)}
                      size={size}
                      onClick={() => handleSelect(opt)}
                    />
                  ))}
                  {Array.from(groupedOptions.groups.entries()).map(([groupName, groupOpts]) => (
                    <div key={groupName}>
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                        {groupName}
                      </div>
                      {groupOpts.map((opt) => (
                        <SelectOptionItem
                          key={opt.value}
                          option={opt}
                          selected={selectedValues.includes(opt.value)}
                          size={size}
                          onClick={() => handleSelect(opt)}
                        />
                      ))}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {error && errorMessage && (
          <p className="text-xs text-danger-500 flex items-center gap-1">{errorMessage}</p>
        )}
      </div>
    );
  },
);
Select.displayName = 'Select';

/**
 * 选择器选项项
 */
function SelectOptionItem({
  option,
  selected,
  size,
  onClick,
}: {
  option: SelectOption;
  selected: boolean;
  size: SelectSize;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 cursor-pointer transition-colors',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'md' ? 'px-3.5 py-2 text-sm' : 'px-4 py-2.5 text-base',
        option.disabled
          ? 'opacity-50 cursor-not-allowed bg-gray-50'
          : selected
          ? 'bg-primary-50 text-primary-700'
          : 'hover:bg-gray-50 text-gray-700',
      )}
    >
      <Check
        size={size === 'sm' ? 12 : size === 'md' ? 14 : 16}
        className={cn('shrink-0', selected ? 'text-primary-600' : 'opacity-0')}
      />
      <span className="flex-1 truncate">{option.label}</span>
    </div>
  );
}

export default Select;
