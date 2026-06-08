import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { countByCurriculum } from '../../utils/computeStats'

export default function CurriculumBarChart({ works, onBarClick }) {
  const data = useMemo(() => countByCurriculum(works), [works])
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">교육과정별 작품 수</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} onClick={e => e?.activePayload && onBarClick({ curriculum: e.activePayload[0].payload.name })}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={v => [v + '편', '작품 수']} />
          <Bar dataKey="count" fill="#3b82f6" cursor="pointer" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 mt-1 text-right">클릭 시 해당 교육과정 검색</p>
    </div>
  )
}
