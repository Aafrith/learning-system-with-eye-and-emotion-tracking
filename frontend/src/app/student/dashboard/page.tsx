'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import StudentDashboard from '@/components/StudentDashboard'
import Navbar from '@/components/Navbar'

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else if (user.role !== 'student') {
      router.push(`/${user.role}/dashboard`)
    }
  }, [user, router])

  if (!user || user.role !== 'student') {
    return null
  }

  return (
    <>
      <Navbar />
      <StudentDashboard studentName={user.name} onBack={() => router.push('/')} />
    </>
  )
}
