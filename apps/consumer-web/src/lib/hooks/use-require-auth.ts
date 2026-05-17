"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function useRequireAuth() {
  const router = useRouter()
  // Start false on both server and client to avoid hydration mismatch.
  // Set to real value after mount (client-only).
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    setIsAuthenticated(Boolean(token))
    setMounted(true)
    if (!token) {
      router.push("/login")
    }
  }, [router])

  const logout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    router.push("/login")
  }

  return { isAuthenticated, mounted, logout }
}
