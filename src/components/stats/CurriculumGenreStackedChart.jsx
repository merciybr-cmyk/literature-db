import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts'
import { countByCurriculumAndGenre } from '../../utils/computeStats'

const GENRE_COLORS = {
  '시': '#3b82f6',
  '소설': '#ef4444',
  '수필': '#10b981',
  '시조': '#f59e0b',
  '고전산문': '#8b5cf6',
  '고전운문': '#ec4899',
  '극본': '#14b8a6',
}
const GENRES = Object.keys(GENRE_COLORS)

export default function CurriculumGenreStackedChart({ works }) {
  const data = useMemo(() => countByCurriculumAndGenre(works), [works])
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">교육과정 × 장르 교차 분석</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend iconType="circle" iconSize={10} />
          {GENRES.map(g => (
            <Bar key={g} dataKey={g} stackId="a" fill={GENRE_COLORS[g]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
