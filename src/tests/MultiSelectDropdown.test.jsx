import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MultiSelectDropdown from '../components/search/MultiSelectDropdown'

const OPTIONS = ['1차', '2차', '3차']

describe('MultiSelectDropdown', () => {
  it('선택 없으면 "전체" 표시', () => {
    render(<MultiSelectDropdown options={OPTIONS} value={[]} onChange={() => {}} />)
    expect(screen.getByRole('button')).toHaveTextContent('전체')
  })

  it('1개 선택 시 항목명 표시', () => {
    render(<MultiSelectDropdown options={OPTIONS} value={['2차']} onChange={() => {}} />)
    expect(screen.getByRole('button')).toHaveTextContent('2차')
  })

  it('2개 이상 선택 시 "N개 선택" 표시', () => {
    render(<MultiSelectDropdown options={OPTIONS} value={['1차', '3차']} onChange={() => {}} />)
    expect(screen.getByRole('button')).toHaveTextContent('2개 선택')
  })

  it('버튼 클릭 시 드롭다운 열림', () => {
    render(<MultiSelectDropdown options={OPTIONS} value={[]} onChange={() => {}} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('1차')).toBeInTheDocument()
    expect(screen.getByText('2차')).toBeInTheDocument()
  })

  it('체크박스 클릭 시 onChange 호출', () => {
    const onChange = vi.fn()
    render(<MultiSelectDropdown options={OPTIONS} value={[]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByLabelText('1차'))
    expect(onChange).toHaveBeenCalledWith(['1차'])
  })

  it('선택된 항목 체크박스 해제 시 제거', () => {
    const onChange = vi.fn()
    render(<MultiSelectDropdown options={OPTIONS} value={['1차', '2차']} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByLabelText('1차'))
    expect(onChange).toHaveBeenCalledWith(['2차'])
  })

  it('전체 해제 버튼 클릭 시 빈 배열 전달', () => {
    const onChange = vi.fn()
    render(<MultiSelectDropdown options={OPTIONS} value={['1차']} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('전체 해제'))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('선택 없으면 전체 해제 버튼 없음', () => {
    render(<MultiSelectDropdown options={OPTIONS} value={[]} onChange={() => {}} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('전체 해제')).not.toBeInTheDocument()
  })
})
