"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function useRequireAuth() {
  const router = useRouter()
  const [isAuthenticated] = useState(
    () => typeof window !== "undefined" && Boolean(localStorage.getItem("accessToken"))
  )

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  const logout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    router.push("/login")
  }

  return {
    isAuthenticated,
    logout,
  }
}
