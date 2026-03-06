import { useState, useCallback } from 'react'

const STORAGE_KEY = 'chatgpt-adv-checklists'

type ChecklistData = Record<string, boolean[]>

function loadChecklists(): ChecklistData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveChecklists(data: ChecklistData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage unavailable
  }
}

export function useChecklist() {
  const [data, setData] = useState<ChecklistData>(loadChecklists)

  const isChecked = useCallback((checklistId: string, itemIndex: number): boolean => {
    return (data[checklistId] || [])[itemIndex] || false
  }, [data])

  const toggleCheck = useCallback((checklistId: string, itemIndex: number) => {
    setData(prev => {
      const arr = [...(prev[checklistId] || [])]
      arr[itemIndex] = !arr[itemIndex]
      const next = { ...prev, [checklistId]: arr }
      saveChecklists(next)
      return next
    })
  }, [])

  const getChecklistProgress = useCallback((checklistId: string, totalItems: number) => {
    const arr = data[checklistId] || []
    const checked = arr.filter(Boolean).length
    return { checked, total: totalItems }
  }, [data])

  return { isChecked, toggleCheck, getChecklistProgress }
}
