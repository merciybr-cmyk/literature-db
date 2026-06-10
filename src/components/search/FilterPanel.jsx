import { useMemo } from 'react'
import { getUniqueValues } from '../../utils/filterWorks'
import MultiSelectDropdown from './MultiSelectDropdown'

const CURRICULA = ['1차', '2차', '3차', '4차', '5차', '6차', '7차']
const GENRES = ['시', '소설', '수필', '시조', '고전산문', '고전운문', '극본']
const DIVISIONS = ['중등', '고등']

export default function FilterPanel({ works, filters, onChange }) {
  const grades = useMemo(
    () => getUniqueValues(works, '학년').filter(g => g !== 'X'),
    [works]
  )
  const systems = useMemo(() => getUniqueValues(works, '체제'), [works])
  const publishers = useMemo(() => getUniqueValues(works, '출판사'), [works])

  function update(key, value) {
    onChange({ ...filters, [key]: value })
  }

  const FILTER_CONFIGS = [
    { key: 'curriculum', label: '교육과정', options: CURRICULA },
    { key: 'system', label: '체제', options: systems },
    { key: 'division', label: '구분', options: DIVISIONS },
    { key: 'genre', label: '장르', options: GENRES },
    { key: 'grade', label: '학년', options: grades },
    { key: 'publisher', label: '출판사', options: publishers, panelClassName: 'w-52' },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap gap-4">
      {FILTER_CONFIGS.map(({ key, label, options, panelClassName }) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">{label}</label>
          <MultiSelectDropdown
            options={options}
            value={filters[key] || []}
            onChange={v => update(key, v)}
            panelClassName={panelClassName}
          />
        </div>
      ))}
    </div>
  )
}
