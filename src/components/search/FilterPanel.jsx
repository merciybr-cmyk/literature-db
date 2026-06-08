import { useMemo } from 'react'
import { getUniqueValues } from '../../utils/filterWorks'

const CURRICULA = ['1차', '2차', '3차', '4차', '5차', '6차', '7차']
const GENRES = ['시', '소설', '수필', '시조', '고전산문', '고전운문', '극본']
const DIVISIONS = ['중등', '고등']

export default function FilterPanel({ works, filters, onChange }) {
  const grades = useMemo(
    () => getUniqueValues(works, '학년').filter(g => g !== 'X'),
    [works]
  )

  function update(key, value) {
    onChange({ ...filters, [key]: value })
  }

  const FILTER_CONFIGS = [
    { key: 'curriculum', label: '교육과정', options: CURRICULA },
    { key: 'division', label: '구분', options: DIVISIONS },
    { key: 'genre', label: '장르', options: GENRES },
    { key: 'grade', label: '학년', options: grades },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap gap-4">
      {FILTER_CONFIGS.map(({ key, label, options }) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">{label}</label>
          <select
            value={filters[key] || ''}
            onChange={e => update(key, e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm min-w-[90px] bg-white"
          >
            <option value="">전체</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      ))}
    </div>
  )
}
