import { useState, useEffect, useMemo } from 'react'
import FilterPanel from '../components/search/FilterPanel'
import SearchBar from '../components/search/SearchBar'
import WorksTable from '../components/search/WorksTable'
import ExportButton from '../components/search/ExportButton'
import { filterWorks } from '../utils/filterWorks'

const INITIAL_FILTERS = { curriculum: [], division: [], genre: [], grade: [], query: '' }

export default function SearchPage({ works, initialFilters, onFiltersApplied }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS)

  useEffect(() => {
    if (initialFilters) {
      setFilters({ ...INITIAL_FILTERS, ...initialFilters })
      onFiltersApplied()
    }
  }, [initialFilters])

  function handleReset() {
    setFilters(INITIAL_FILTERS)
  }

  const filtered = useMemo(() => filterWorks(works, filters), [works, filters])

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4">
      <FilterPanel works={works} filters={filters} onChange={setFilters} />
      <SearchBar
        query={filters.query}
        onChange={q => setFilters(f => ({ ...f, query: q }))}
        onReset={handleReset}
      />
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">
          검색 결과 <strong className="text-gray-900">{filtered.length.toLocaleString()}</strong>건
        </span>
        <ExportButton works={filtered} />
      </div>
      <WorksTable works={filtered} allWorks={works} selectedCurricula={filters.curriculum} />
    </main>
  )
}
