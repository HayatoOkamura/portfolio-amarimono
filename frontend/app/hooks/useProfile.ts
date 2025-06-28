import { useState } from 'react'

interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url: string
  gender: string
  created_at: string
  updated_at: string
}

export function useProfile() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async (): Promise<Profile | null> => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (profileData: Partial<Profile>): Promise<Profile | null> => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })
      if (!response.ok) {
        throw new Error('Failed to update profile')
      }
      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    fetchProfile,
    updateProfile,
    isLoading,
    error,
  }
} 