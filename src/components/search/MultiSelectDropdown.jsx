import { useState, useRef, useEffect } from 'react'

export default function MultiSelectDropdown({ options, value, onChange, panelClassName = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle(option) {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option))
    } else {
      onChange([...value, option])
    }
  }

  const buttonLabel =
    value.length === 0 ? '전체' :
    value.length === 1 ? value[0] :
    `${value.length}개 선택`

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`border rounded px-2 py-1.5 text-sm min-w-[90px] bg-white text-left flex items-center justify-between gap-2 ${
          value.length > 0 ? 'border-blue-500 text-blue-700' : 'border-gray-300 text-gray-700'
        }`}
      >
        <span>{buttonLabel}</span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className={`absolute z-20 mt-1 bg-white border border-gray-200 rounded shadow-md min-w-[110px] ${panelClassName}`}>
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 border-b border-gray-100"
            >
              전체 해제
            </button>
          )}
          {options.map(option => (
            <label
              key={option}
              className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-blue-50"
              title={option}
            >
              <input
                type="checkbox"
                checked={value.includes(option)}
                onChange={() => toggle(option)}
                className="accent-blue-600 shrink-0"
              />
              <span className="whitespace-nowrap">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
