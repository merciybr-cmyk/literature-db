import { useMemo, useState } from 'react'
import { buildAuthorList, STATUS } from '../utils/copyright'
import { toChosung, isChosungQuery } from '../utils/chosung'
import WorkDetailModal from '../components/search/WorkDetailModal'

const BADGE_CLASS = {
  green:  'bg-green-100 text-green-700 border-green-200',
  red:    'bg-red-100 text-red-700 border-red-200',
  blue:   'bg-blue-100 text-blue-700 border-blue-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  amber:  'bg-amber-100 text-amber-700 border-amber-200',
  gray:   'bg-gray-100 text-gray-500 border-gray-200',
}

function Badge({ status }) {
  return (
    <span className={`px-1.5 py-0.5 text-[11px] rounded border ${BADGE_CLASS[status.color]}`}>
      {status.label}
    </span>
  )
}

const STATUS_FILTERS = [
  STATUS.expired, STATUS.이용불가, STATUS.KOLAA, STATUS.사이에이전시,
  STATUS.남북저작권센터, STATUS.별도요청, STATUS.미확인,
]

export default function AuthorsPage({ works, copyrightMap }) {
  const authors = useMemo(() => buildAuthorList(works, copyrightMap), [works, copyrightMap])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedName, setSelectedName] = useState(null)
  const [selectedWork, setSelectedWork] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim()
    const cho = isChosungQuery(q)
    return authors.filter(a => {
      if (statusFilter && !a.statuses.some(s => s.key === statusFilter)) return false
      if (!q) return true
      return cho ? toChosung(a.name).includes(q) : a.name.includes(q)
    })
  }, [authors, query, statusFilter])

  const selected = useMemo(
    () => authors.find(a => a.name === selectedName) || null,
    [authors, selectedName],
  )

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-800">작가별 작품 · 저작권</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            작가별 수록 작품과 저작권 관리 상태를 봅니다. 저작권 상태는 작가명 기준의 참고 정보입니다(동명이인 주의).
          </p>
        </div>

        {/* 검색 + 상태 필터 */}
        <div className="flex flex-col gap-3 mb-4">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="작가 이름 검색 (초성 가능: ㄱㅅㅇ)"
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-2.5 py-1 text-xs rounded-full border ${statusFilter === '' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              전체 ({authors.length})
            </button>
            {STATUS_FILTERS.map(s => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key === statusFilter ? '' : s.key)}
                className={`px-2.5 py-1 text-xs rounded-full border ${statusFilter === s.key ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* 디렉터리 */}
          <ul className="rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-gray-400">해당하는 작가가 없습니다.</li>
            )}
            {filtered.map(a => (
              <li key={a.name}>
                <button
                  onClick={() => setSelectedName(a.name)}
                  className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-sky-50 ${selectedName === a.name ? 'bg-sky-50' : ''}`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-gray-800 truncate">{a.name}</span>
                    <span className="flex gap-1 shrink-0">
                      {a.statuses.map(s => <Badge key={s.key} status={s} />)}
                    </span>
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">{a.count}편</span>
                </button>
              </li>
            ))}
          </ul>

          {/* 상세 */}
          <AuthorDetail author={selected} onSelectWork={setSelectedWork} />
        </div>
      </main>

      {selectedWork && (
        <WorkDetailModal work={selectedWork} allWorks={works} onClose={() => setSelectedWork(null)} />
      )}
    </>
  )
}

function AuthorDetail({ author, onSelectWork }) {
  if (!author) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-400 min-h-[200px]">
        작가를 선택하세요.
      </div>
    )
  }
  const rec = author.record
  return (
    <div className="rounded-lg border border-gray-200 flex flex-col max-h-[70vh]">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg font-bold text-gray-900">{author.name}</h3>
          {author.statuses.map(s => <Badge key={s.key} status={s} />)}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{author.count}편 수록</p>
      </div>

      {/* 저작권 상세 */}
      <div className="px-4 py-3 border-b border-gray-100 text-sm text-gray-700 space-y-1.5">
        {rec?.expired && (
          <p>🟢 <strong>저작권 만료</strong> — 생몰 {rec.expired.생몰연도 || '-'}, 만료시점 {rec.expired.만료시점 || '-'} (자유 이용 가능)</p>
        )}
        {rec?.이용불가 && (
          <p>⛔ <strong>전편 이용불가</strong>{rec.이용불가.출처 ? ` (${rec.이용불가.출처})` : ''} — 해당 발행처 저작물 전편 이용 불가. KOLAA 사용료 기준 PDF 참조.</p>
        )}
        {rec?.별도요청 && (
          <p>🟡 <strong>별도 사용료 요청</strong>{rec.별도요청.갈래 ? ` (${rec.별도요청.갈래})` : ''}{rec.별도요청.적용시점 ? ` · 적용 ${rec.별도요청.적용시점}` : ''} — 요율은 KOLAA 사용료 기준 PDF 별지 참조.</p>
        )}
        {rec?.registries?.map((g, i) => (
          <p key={i}>
            • {g.source}
            {g.저작권자명 ? ` — 저작권자 ${g.저작권자명}` : ''}
            {g.계약종료일 ? ` · 계약종료 ${g.계약종료일}` : ''}
            {g.저작물구분 ? ` · ${g.저작물구분}` : ''}
            {g.가입시기 ? ` · 가입 ${g.가입시기}` : ''}
            {g.비고 ? ` · ${g.비고}` : ''}
          </p>
        ))}
        {!rec && <p className="text-gray-400">저작권 자료에서 확인되지 않음(미확인). 동명이인·외국 작가일 수 있습니다.</p>}
      </div>

      {/* 수록 작품 */}
      <ul className="overflow-y-auto divide-y divide-gray-100">
        {author.works.map((w, i) => (
          <li key={i} className="px-4 py-2 hover:bg-blue-50">
            <button onClick={() => onSelectWork(w)} className="text-blue-600 hover:underline font-medium text-left">
              {w['작품명']}
            </button>
            <span className="text-gray-500 text-xs ml-2">
              {w['장르']} · {w['교육과정']} · {w['교과서명']}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
