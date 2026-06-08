import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { countByGenre } from '../../utils/computeStats'

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6']

export default function GenrePieChart({ works, onSliceClick }) {
  const data = useMemo(() => countByGenre(works), [works])
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">장르별 분포</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={85}
            cursor="pointer"
            onClick={entry => onSliceClick({ genre: entry.name })}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={v => [v + '편', '작품 수']} />
          <Legend iconType="circle" iconSize={10} />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 mt-1 text-right">클릭 시 해당 장르 검색</p>
    </div>
  )
}
