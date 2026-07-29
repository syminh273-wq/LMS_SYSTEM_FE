import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function useRequireAuth() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect --
       The initial-mount effect is the standard "hydrate from
       localStorage" pattern for a useRequireAuth hook. The two setState
       calls only run once on the client, and any consumer that needs
       `mounted === true` is already waiting for hydration. */
    setMounted(true)
    setIsAuthenticated(Boolean(localStorage.getItem("accessToken")))
  }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/space/login")
    }
  }, [isAuthenticated, mounted, router])

  const logout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    router.push("/space/login")
  }

  return {
    isAuthenticated,
    mounted,
    logout,
  }
}
