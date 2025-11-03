import React from 'react';
import Select, { StylesConfig, MultiValue, ActionMeta } from 'react-select';

type Option = {
  value: string;
  text: string;
  selected: boolean;
};

type MultiSelectProps = {
  label: string;
  options: Option[];
  defaultSelected?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
};

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  defaultSelected = [],
  onChange,
  disabled = false,
  placeholder = 'Tìm kiếm và chọn...',
}) => {
  // Convert options to react-select format
  const selectOptions = options.map(option => ({
    value: option.value,
    label: option.text,
  }));

  // Convert default selected to react-select format
  const defaultValue = selectOptions.filter(option =>
    defaultSelected.includes(option.value)
  );

  const handleChange = (
    selectedOptions: MultiValue<{ value: string; label: string }>,
    _actionMeta: ActionMeta<{ value: string; label: string }>
  ) => {
    const selectedValues = selectedOptions.map(option => option.value);
    if (onChange) {
      onChange(selectedValues);
    }
  };

  // Custom styles to match the design
  const customStyles: StylesConfig<{ value: string; label: string }, true> = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '44px',
      border: '1px solid #d1d5db',
      borderRadius: '0.5rem',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#9ca3af',
      },
      backgroundColor: 'transparent',
      cursor: 'text',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0.25rem 0.75rem',
      gap: '0.5rem',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#f3f4f6',
      borderRadius: '0.375rem',
      padding: '0.125rem 0.5rem',
      fontSize: '0.875rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#374151',
      fontWeight: '500',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#6b7280',
      cursor: 'pointer',
      '&:hover': {
        color: '#374151',
        backgroundColor: 'transparent',
      },
    }),
    input: (provided) => ({
      ...provided,
      color: '#374151',
      fontSize: '0.875rem',
      margin: 0,
      padding: 0,
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '0.875rem',
    }),
    menu: (provided) => ({
      ...provided,
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      zIndex: 50,
    }),
    menuList: (provided) => ({
      ...provided,
      padding: '0.25rem',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#eff6ff'
        : state.isFocused
        ? '#f3f4f6'
        : 'white',
      color: state.isSelected ? '#2563eb' : '#374151',
      cursor: 'pointer',
      padding: '0.75rem 1rem',
      fontSize: '0.875rem',
      '&:active': {
        backgroundColor: '#eff6ff',
      },
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '0.875rem',
    }),
    loadingMessage: (provided) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '0.875rem',
    }),
  };

  return (
    <div className='w-full'>
      <label className='mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400'>
        {label}
      </label>

      <Select
        isMulti
        options={selectOptions}
        value={defaultValue}
        onChange={handleChange}
        placeholder={placeholder}
        isDisabled={disabled}
        styles={customStyles}
        className='react-select-container'
        classNamePrefix='react-select'
        menuPortalTarget={document.body}
        closeMenuOnSelect={false}
        blurInputOnSelect={false}
        components={{
          IndicatorSeparator: () => null,
        }}
      />
    </div>
  );
};

export default MultiSelect;
