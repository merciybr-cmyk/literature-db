import { useState } from 'react'
import NavBar from './components/NavBar'
import SearchPage from './pages/SearchPage'
import StatsPage from './pages/StatsPage'
import DuplicatesPage from './pages/DuplicatesPage'
import ComparePage from './pages/ComparePage'
import { useWorks } from './hooks/useWorks'

export default function App() {
  const [activePage, setActivePage] = useState('search')
  const [pendingFilters, setPendingFilters] = useState(null)
  const { works, loading, error } = useWorks()

  function navigateToSearch(filters) {
    setPendingFilters(filters)
    setActivePage('search')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 text-sm">
        데이터를 불러오는 중...
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500 text-sm">
        오류: {error}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar activePage={activePage} onNavigate={setActivePage} />
      {activePage === 'search' && <SearchPage works={works} initialFilters={pendingFilters} onFiltersApplied={() => setPendingFilters(null)} />}
      {activePage === 'stats' && <StatsPage works={works} onNavigateToSearch={navigateToSearch} />}
      {activePage === 'duplicates' && <DuplicatesPage works={works} />}
      {activePage === 'compare' && <ComparePage works={works} />}
    </div>
  )
}
