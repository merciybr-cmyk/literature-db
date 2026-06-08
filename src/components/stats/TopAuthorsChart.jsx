import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { topAuthors } from '../../utils/computeStats'

export default function TopAuthorsChart({ works, onBarClick }) {
  const data = useMemo(() => topAuthors(works, 10), [works])
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">가장 많이 수록된 작가 Top 10</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          onClick={e => e?.activePayload && onBarClick({ query: e.activePayload[0].payload.name })}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis dataKey="name" type="category" width={85} tick={{ fontSize: 12 }} />
          <Tooltip formatter={v => [v + '편', '수록 횟수']} />
          <Bar dataKey="count" fill="#8b5cf6" cursor="pointer" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 mt-1 text-right">클릭 시 해당 작가 검색</p>
    </div>
  )
}
