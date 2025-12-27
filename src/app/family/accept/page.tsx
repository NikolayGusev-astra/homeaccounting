'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFamilyStore } from '@/store/familyStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function AcceptInvitationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const acceptInvitation = useFamilyStore(state => state.acceptInvitation)
  
  useEffect(() => {
    if (!code) {
      setError('Invalid invitation link')
      return
    }
  }, [code])
  
  const handleAccept = async () => {
    if (!code) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      await acceptInvitation(code)
      setSuccess(true)
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/family')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDecline = () => {
    router.push('/')
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Приглашение в семейный бюджет</CardTitle>
          <CardDescription>
            {success 
              ? 'Вы успешно присоединились к семейному бюджету!'
              : 'Вас пригласили присоединиться к семейному бюджету'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {success ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">
                ✓ Приглашение принято! Перенаправление...
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Приняв приглашение, вы сможете совместно вести семейный бюджет и видеть все доходы и расходы участников семьи.
              </p>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleAccept}
                  disabled={isLoading || !code}
                  className="flex-1"
                >
                  {isLoading ? 'Принятие...' : 'Принять приглашение'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleDecline}
                  disabled={isLoading}
                >
                  Отклонить
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Загрузка...</div>}>
      <AcceptInvitationContent />
    </Suspense>
  )
}
