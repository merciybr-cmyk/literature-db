import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { topWorksAcrossCurricula } from '../../utils/computeStats'

export default function TopWorksChart({ works, onBarClick }) {
  const data = useMemo(() => topWorksAcrossCurricula(works, 10), [works])
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">여러 교육과정에 걸쳐 수록된 작품 Top 10</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          onClick={e => e?.activePayload && onBarClick({ query: e.activePayload[0].payload.name })}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={v => [v + '개 교육과정', '수록']}
            labelFormatter={name => {
              const item = data.find(d => d.name === name)
              return `${name}${item ? ` (${item.author})` : ''}`
            }}
          />
          <Bar dataKey="count" fill="#10b981" cursor="pointer" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 mt-1 text-right">클릭 시 해당 작품 검색</p>
    </div>
  )
}
