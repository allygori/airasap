import { useState } from 'react'
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect'

type UseMediaQueryOptions = {
  defaultValue?: boolean
  initializeWithValue?: boolean
}

// 1. Definisikan mapping default breakpoint Tailwind
const TAILWIND_BREAKPOINTS = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
} as const

type TailwindBreakpoint = keyof typeof TAILWIND_BREAKPOINTS

const IS_SERVER = typeof window === 'undefined'

// 2. Perbarui tipe parameter `query` agar mendukung autocomplete breakpoint Tailwind
export function useMediaQuery(
  query: TailwindBreakpoint | (string & {}),
  {
    defaultValue = false,
    initializeWithValue = true,
  }: UseMediaQueryOptions = {},
): boolean {
  
  // 3. Fungsi pembantu untuk mengubah shorthand Tailwind menjadi full query
  const parseQuery = (input: string): string => {
    if (input in TAILWIND_BREAKPOINTS) {
      return TAILWIND_BREAKPOINTS[input as TailwindBreakpoint]
    }
    return input
  }

  const getMatches = (inputQuery: string): boolean => {
    if (IS_SERVER) {
      return defaultValue
    }
    const targetQuery = parseQuery(inputQuery)
    return window.matchMedia(targetQuery).matches
  }

  const [matches, setMatches] = useState<boolean>(() => {
    if (initializeWithValue) {
      return getMatches(query)
    }
    return defaultValue
  })

  function handleChange() {
    setMatches(getMatches(query))
  }

  useIsomorphicLayoutEffect(() => {
    const targetQuery = parseQuery(query)
    const matchMedia = window.matchMedia(targetQuery)

    handleChange()

    if (matchMedia.addListener) {
      matchMedia.addListener(handleChange)
    } else {
      matchMedia.addEventListener('change', handleChange)
    }

    return () => {
      if (matchMedia.removeListener) {
        matchMedia.removeListener(handleChange)
      } else {
        matchMedia.removeEventListener('change', handleChange)
      }
    }
  }, [query])

  return matches
}
