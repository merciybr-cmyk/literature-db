import { exportToExcel } from '../../utils/exportExcel'

export default function ExportButton({ works }) {
  return (
    <button
      onClick={() => exportToExcel(works)}
      className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1.5 whitespace-nowrap"
    >
      ⬇ Excel 내보내기
    </button>
  )
}
