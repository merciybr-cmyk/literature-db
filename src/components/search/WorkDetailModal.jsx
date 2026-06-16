import { useEffect, useState } from 'react'

const CURRICULUM_ORDER = ['1차', '2차', '3차', '4차', '5차', '6차', '7차', '2007개정', '2009개정', '2015개정', '2022개정']

export default function WorkDetailModal({ work, allWorks, onClose, focusCurriculum = '' }) {
  const [activeCurriculum, setActiveCurriculum] = useState(focusCurriculum)

  // 같은 작품명 + 같은 작가(괄호 앞 기준)의 전체 수록 목록
  const occurrences = allWorks
    .filter(w => w['작품명'] === work['작품명'] && w._authorBase === work._authorBase)
    .sort((a, b) => {
      const ai = CURRICULUM_ORDER.indexOf(a['교육과정'])
      const bi = CURRICULUM_ORDER.indexOf(b['교육과정'])
      return ai - bi
    })

  const curricula = [...new Set(occurrences.map(w => w['교육과정']))]
  const rows = activeCurriculum
    ? occurrences.filter(w => w['교육과정'] === activeCurriculum)
    : occurrences

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{work['작품명']}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {work['지은이'] || '작가 미상'} · {work['장르']}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none mt-0.5">✕</button>
        </div>

        {/* 수록 현황 요약 */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          {curricula.length > 1 ? (
            <p className="text-sm text-blue-700">
              <strong>{curricula.length}개 교육과정</strong>에 걸쳐 총 <strong>{occurrences.length}회</strong> 수록
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              <strong>{curricula[0]}</strong>에 1회 수록
            </p>
          )}
          {curricula.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button
                onClick={() => setActiveCurriculum('')}
                className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                  activeCurriculum === ''
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-100'
                }`}
              >
                전체
              </button>
              {curricula.map(c => (
                <button
                  key={c}
                  onClick={() => setActiveCurriculum(c)}
                  className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                    activeCurriculum === c
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 수록 목록 테이블 */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {['교육과정', '체제', '구분', '학년', '학기', '교과서명', '출판사'].map(col => (
                  <th key={col} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((w, i) => (
                <tr key={i} className={w === work ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-2.5 font-medium text-blue-700">{w['교육과정']}</td>
                  <td className="px-4 py-2.5 text-gray-600">{w['체제']}</td>
                  <td className="px-4 py-2.5 text-gray-600">{w['구분']}</td>
                  <td className="px-4 py-2.5 text-gray-600">{w['학년']}</td>
                  <td className="px-4 py-2.5 text-gray-600">{w['학기']}</td>
                  <td className="px-4 py-2.5 text-gray-600">{w['교과서명']}</td>
                  <td className="px-4 py-2.5 text-gray-600">{w['출판사']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-gray-200 text-right">
          <button onClick={onClose} className="px-4 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
