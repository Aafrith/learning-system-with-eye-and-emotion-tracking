'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import TeacherDashboard from '@/components/TeacherDashboard'
import Navbar from '@/components/Navbar'

export default function TeacherDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else if (user.role !== 'teacher') {
      router.push(`/${user.role}/dashboard`)
    }
  }, [user, router])

  if (!user || user.role !== 'teacher') {
    return null
  }

  return (
    <>
      <Navbar />
      <TeacherDashboard teacherName={user.name} onBack={() => router.push('/')} />
    </>
  )
}
