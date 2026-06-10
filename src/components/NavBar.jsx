export default function NavBar({ activePage, onNavigate }) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 h-14">
        <span className="font-bold text-gray-800 mr-4 text-base">📚 교과서 문학 작품 DB</span>
        {[['search', '검색·탐색'], ['stats', '통계'], ['duplicates', '중복 수록']].map(([page, label]) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              activePage === page
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}
