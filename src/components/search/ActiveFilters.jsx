const FILTER_LABELS = {
  curriculum: '교육과정',
  system: '체제',
  division: '구분',
  genre: '장르',
  grade: '학년',
  publisher: '출판사',
}

// 현재 적용된 필터를 삭제 가능한 칩으로 보여준다. 걸린 필터가 없으면 렌더하지 않음.
export default function ActiveFilters({ filters, onChange }) {
  const chips = []
  for (const key of Object.keys(FILTER_LABELS)) {
    for (const value of filters[key] || []) {
      chips.push({ key, value, label: `${FILTER_LABELS[key]}: ${value}` })
    }
  }
  if (filters.query?.trim()) {
    chips.push({ key: 'query', value: filters.query, label: `검색: ${filters.query}` })
  }

  if (chips.length === 0) return null

  function removeChip(chip) {
    if (chip.key === 'query') {
      onChange({ ...filters, query: '' })
    } else {
      onChange({ ...filters, [chip.key]: filters[chip.key].filter(v => v !== chip.value) })
    }
  }

  function clearAll() {
    const cleared = { query: '' }
    for (const key of Object.keys(FILTER_LABELS)) cleared[key] = []
    onChange({ ...filters, ...cleared })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map(chip => (
        <button
          key={`${chip.key}:${chip.value}`}
          onClick={() => removeChip(chip)}
          className="inline-flex items-center gap-1 px-2 py-1 bg-sky-50 text-sky-700 text-xs rounded-full border border-sky-200 hover:bg-sky-100"
        >
          {chip.label}
          <span className="text-sky-400">✕</span>
        </button>
      ))}
      <button
        onClick={clearAll}
        className="text-xs text-gray-500 hover:text-gray-700 underline ml-1"
      >
        전체 초기화
      </button>
    </div>
  )
}
