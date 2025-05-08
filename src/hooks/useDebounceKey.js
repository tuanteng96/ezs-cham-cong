import { useCallback, useRef } from 'react'

const useDebounceKey = (func, delay) => {
  const debounceRef = useRef()

  const debounce = useCallback(
    function () {
      const context = this
      const args = arguments
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => func.apply(context, args), delay)
    },
    [func, delay]
  )

  return debounce
}

export default useDebounceKey
