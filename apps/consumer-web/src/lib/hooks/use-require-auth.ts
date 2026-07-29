import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { clearProfile, setFaceEnrolled } from "@/lib/redux/userSlice"
import { faceApi } from "@/lib/api/face"
import type { RootState } from "@/lib/redux/store"

export function useRequireAuth() {
  const router = useRouter()
  const dispatch = useDispatch()
  const faceEnrolled = useSelector((state: RootState) => state.user.faceEnrolled)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    setIsAuthenticated(Boolean(token))
    setMounted(true)
    if (!token) {
      router.push("/consumer/login")
      return
    }

    // Chỉ fetch 1 lần — nếu Redux đã có giá trị thì bỏ qua
    if (faceEnrolled !== null) return

    faceApi.enrollmentStatus()
      .then(({ enrolled }) => { dispatch(setFaceEnrolled(enrolled)) })
      .catch(() => {})
  }, [router, dispatch, faceEnrolled])

  const logout = () => {
    dispatch(clearProfile())
    router.push("/consumer/login")
  }

  return { isAuthenticated, mounted, logout }
}
