'use client'
import React, { useState, useRef, useEffect } from "react";
import DropdownList, { dropdownOptionClass } from "../DropdownList/DropdownList";
import IconButton from "../IconButton/IconButton";
import { TextField } from "../TextField/TextField";


export interface Option {
  id: string | number;
  label: string;
}

interface AutoCompleteProps<T = Option> {
  options: T[];
  label?: string;
  labelAlwaysVisible?: boolean;
  placeholder?: string;
  value?: T | null;
  onChange?: (option: T | null) => void;
  onInputChange?: (value: string) => void;
  name?: string;
  required?: boolean;
  compact?: boolean;
  getOptionLabel?: (option: T) => string;
  getOptionValue?: (option: T) => any;
  filterOption?: (option: T, inputValue: string) => boolean;
  ["data-test-id"]?: string;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

// Ref map para tracking de items renderizados
const itemRefs = new Map<string | number, HTMLLIElement | null>();

const AutoComplete = <T = Option,>({
  options,
  label,
  labelAlwaysVisible = false,
  placeholder,
  value = null,
  onChange,
  onInputChange,
  name,
  required,
  compact = false,
  getOptionLabel,
  getOptionValue,
  filterOption,
  inputRef: externalInputRef,
  ...props
}: AutoCompleteProps<T>) => {
  // Helper functions with defaults for backward compatibility
  const defaultGetOptionLabel = (option: T): string => {
    if (typeof option === 'string') return option;
    if (option && typeof option === 'object' && 'label' in option) {
      return (option as any).label;
    }
    return String(option);
  };

  const defaultGetOptionValue = (option: T): any => {
    if (typeof option === 'string') return option;
    if (option && typeof option === 'object' && 'id' in option) {
      return (option as any).id;
    }
    return option;
  };

  const getLabel = getOptionLabel || defaultGetOptionLabel;
  const getValue = getOptionValue || defaultGetOptionValue;
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [inputValue, setInputValue] = useState(value ? getLabel(value) : "");
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [validationTriggered, setValidationTriggered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const disabled = (props as any).disabled;

  // Vincular el ref externo al ref interno
  useEffect(() => {
    if (externalInputRef && inputRef.current) {
      if (externalInputRef.current !== inputRef.current) {
        (externalInputRef as any).current = inputRef.current;
      }
    }
  }, [externalInputRef]);

  // Sync inputValue with value prop
  useEffect(() => {
    setInputValue(value ? getLabel(value) : "");
  }, [value]);

  const shrink = focused || inputValue.length > 0;
  const filteredOptions = options.filter(opt => {
    if (typeof filterOption === 'function') {
      return filterOption(opt, inputValue);
    }
    return getLabel(opt).toLowerCase().includes(inputValue.toLowerCase());
  });

  // Mantener el índice destacado sincronizado con la lista filtrada.
  useEffect(() => {
    if (!open) return;

    if (filteredOptions.length === 0) {
      if (highlightedIndex !== -1) {
        setHighlightedIndex(-1);
      }
      return;
    }

    if (highlightedIndex >= filteredOptions.length) {
      setHighlightedIndex(filteredOptions.length - 1);
    }
  }, [open, filteredOptions.length, highlightedIndex]);

  // Scroll automático al item destacado
  useEffect(() => {
    if (highlightedIndex < 0 || !open) {
      return;
    }

    const highlightedOption = filteredOptions[highlightedIndex];
    if (!highlightedOption) {
      return;
    }

    const highlightedKey = getValue(highlightedOption);
    const element = itemRefs.get(highlightedKey);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [highlightedIndex, open, filteredOptions]);

  // Handle keyboard navigation on TextField input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!focused || disabled) return;

    if (!open && ["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
      setHighlightedIndex(e.key === "ArrowUp" ? filteredOptions.length - 1 : 0);
      return;
    }

    if (!open || filteredOptions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsNavigating(true);
      setHighlightedIndex(i => (i < filteredOptions.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsNavigating(true);
      setHighlightedIndex(i => (i > 0 ? i - 1 : filteredOptions.length - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      const highlightedOption = filteredOptions[highlightedIndex];
      if (highlightedOption) {
        handleSelect(highlightedOption);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setIsNavigating(false);
      setHighlightedIndex(-1);
    }
  };

  const handleSelect = (option: T) => {
    setInputValue(getLabel(option));
    setOpen(false);
    setIsNavigating(false);
    onChange?.(option);
  };

  const handleClear = () => {
    setInputValue(""); // Clear the input text
    setOpen(false); // Close the dropdown
    setHighlightedIndex(-1); // Reset the highlighted index
    onInputChange?.("");
    onChange?.(null); // Clear the selected option
  };

  const handleValidation = () => {
    if (required && (!value || (inputValue && !value))) {
      setValidationTriggered(true);
      setOpen(false); // Prevent dropdown from opening when validation fails
    } else {
      setValidationTriggered(false);
    }
  };

  return (
    <div className="autocomplete-container" ref={containerRef} data-test-id={props["data-test-id"] || "auto-complete-root"} data-has-options={options.length > 0 ? "true" : "false"}>
      <div
        className="relative w-full border border-border rounded-md focus-within:border-primary"
        onFocus={() => { setFocused(true); setOpen(true); setIsNavigating(false); }}
        onBlur={() => {
          setFocused(false);
          handleValidation();
          if (!isNavigating) {
            setTimeout(() => setOpen(false), 150);
          }
          setHighlightedIndex(-1);
        }}
        tabIndex={-1}
      >
        <TextField
          label={label || ""}
          labelAlwaysVisible={labelAlwaysVisible}
          value={inputValue}
          onChange={e => {
            const newValue = e.target.value;
            setInputValue(newValue);
            onInputChange?.(newValue);
            setOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          name={name}
          required={required}
          data-test-id="auto-complete-input"
          className={compact ? 'pr-14' : 'pr-20'}
          compact={compact}
          variante="autocomplete"
          disabled={disabled}
        />

        {value && !disabled && (
          <IconButton
            icon="close_small"
            variant="text"
            size={compact ? 'xs' : 'md'}
            className={`absolute right-10 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center z-20 ${focused ? 'text-primary' : 'text-secondary'}`}
            onClick={handleClear}
            aria-label="Limpiar selección"
            data-test-id="auto-complete-clear-icon"
            tabIndex={-1}
          />
        )}

        {!disabled && (
          <IconButton
            icon="arrow_drop_down"
            variant="text"
            size={compact ? 'xs' : 'md'}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center z-20 ${focused ? 'text-primary' : 'text-secondary'}`}
            tabIndex={-1}
            aria-label="Desplegar opciones"
            onClick={() => {
              if (!open) setOpen(true);
              // Focus will be handled by the wrapper div
            }}
            data-test-id="auto-complete-dropdown-icon"
          />
        )}
      </div>
      <DropdownList 
        open={open && filteredOptions.length > 0} 
        testId="auto-complete-list"
        highlightedIndex={highlightedIndex}
        onHoverChange={(idx) => {
          // DropdownList now handles hover, we just track it if needed
        }}
        usePortal={true}
        anchorRef={containerRef}
      >
        {filteredOptions.map((opt, idx) => {
          const optValue = getValue(opt);
          const isHighlighted = highlightedIndex === idx;
          return (
            <li
              key={optValue}
              ref={(el) => {
                if (el) itemRefs.set(optValue, el);
                else itemRefs.delete(optValue);
              }}
              className={dropdownOptionClass}
              onMouseDown={() => handleSelect(opt)}
              onMouseEnter={() => {
                setHighlightedIndex(idx);
              }}
              onClick={() => handleSelect(opt)}
              role="option"
              aria-selected={isHighlighted}
              data-test-id={`auto-complete-option-${optValue}`}
            >
              {getLabel(opt)}
            </li>
          );
        })}
      </DropdownList>
    </div>
  );
};

export default AutoComplete;
