const NAV_ITEMS = [
  ['search', '검색·탐색'],
  ['duplicates', '중복 수록'],
  ['compare', '교육과정 비교'],
  ['authors', '작가별'],
  ['stats', '통계'],
]

export default function NavBar({ activePage, onNavigate }) {
  return (
    <nav className="bg-[#16345f] text-white sticky top-0 z-10 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        {/* 상단: 메인 제목 + 로고 */}
        <div className="flex items-center justify-between gap-4 pt-4 pb-3">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            📚 교과서 문학 작품 DB
          </h1>
          <img
            src={`${import.meta.env.BASE_URL}mirae-n_logo.png`}
            alt="미래엔"
            className="h-6 w-auto shrink-0"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>

        {/* 하단: 네비게이션 */}
        <div className="flex items-center gap-1 pb-2 overflow-x-auto">
          {NAV_ITEMS.map(([page, label]) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                activePage === page
                  ? 'bg-white text-[#16345f]'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
