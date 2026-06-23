import { useState, useEffect } from 'react'

// public/copyright.json을 로드한다. 파일이 없거나 실패해도 빈 맵을 반환해
// 앱이 깨지지 않게 한다(전 작가 '미확인'으로 표시됨).
export function useCopyright() {
  const [copyrightMap, setCopyrightMap] = useState({})

  useEffect(() => {
    fetch('./copyright.json')
      .then(res => (res.ok ? res.json() : {}))
      .then(setCopyrightMap)
      .catch(() => setCopyrightMap({}))
  }, [])

  return copyrightMap
}
