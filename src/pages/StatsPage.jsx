import CurriculumBarChart from '../components/stats/CurriculumBarChart'
import GenrePieChart from '../components/stats/GenrePieChart'
import CurriculumGenreStackedChart from '../components/stats/CurriculumGenreStackedChart'
import TopAuthorsChart from '../components/stats/TopAuthorsChart'
import TopWorksChart from '../components/stats/TopWorksChart'

export default function StatsPage({ works, onNavigateToSearch }) {
  return (
    <main className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4">
      <CurriculumBarChart works={works} onBarClick={onNavigateToSearch} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GenrePieChart works={works} onSliceClick={onNavigateToSearch} />
        <CurriculumGenreStackedChart works={works} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TopAuthorsChart works={works} onBarClick={onNavigateToSearch} />
        <TopWorksChart works={works} onBarClick={onNavigateToSearch} />
      </div>
    </main>
  )
}
