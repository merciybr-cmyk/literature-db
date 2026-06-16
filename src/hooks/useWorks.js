import { useState, useEffect } from 'react'
import { parseCSV, withDerivedFields } from '../utils/parseCSV'

const SHEETS_URL = import.meta.env.VITE_SHEETS_CSV_URL
const IS_PROD = import.meta.env.PROD

export function useWorks() {
  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // 배포 환경: Google Sheets CSV 실시간 fetch
    // 로컬 개발: works.json (CORS 우회)
    const url = IS_PROD && SHEETS_URL ? SHEETS_URL : './works.json'
    const isCSV = IS_PROD && SHEETS_URL

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`데이터를 불러올 수 없습니다 (HTTP ${res.status})`)
        return res.text()
      })
      .then(text => {
        const data = isCSV
          ? parseCSV(text)
          : JSON.parse(text).map(withDerivedFields)
        setWorks(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return { works, loading, error }
}
