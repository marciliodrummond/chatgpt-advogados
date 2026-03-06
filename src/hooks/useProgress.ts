import { useState, useCallback } from 'react'
import { sections } from '../data/sections'

const STORAGE_KEY = 'chatgpt-adv-progress'

type ProgressData = Record<string, number[]>

function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveProgress(data: ProgressData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage unavailable
  }
}

export function useProgress() {
  const [data, setData] = useState<ProgressData>(loadProgress)

  const markCardViewed = useCallback((sectionId: string, cardIndex: number) => {
    setData(prev => {
      const arr = prev[sectionId] || []
      if (arr.includes(cardIndex)) return prev
      const next = { ...prev, [sectionId]: [...arr, cardIndex] }
      saveProgress(next)
      return next
    })
  }, [])

  const isCardViewed = useCallback((sectionId: string, cardIndex: number): boolean => {
    return (data[sectionId] || []).includes(cardIndex)
  }, [data])

  const getSectionProgress = useCallback((sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    const total = section ? section.cards.length : 0
    const viewed = (data[sectionId] || []).length
    return { viewed, total, percent: total > 0 ? Math.round((viewed / total) * 100) : 0 }
  }, [data])

  const getGlobalProgress = useCallback(() => {
    let viewed = 0
    let total = 0
    for (const section of sections) {
      total += section.cards.length
      viewed += (data[section.id] || []).length
    }
    return { viewed, total, percent: total > 0 ? Math.round((viewed / total) * 100) : 0 }
  }, [data])

  return { markCardViewed, isCardViewed, getSectionProgress, getGlobalProgress }
}
