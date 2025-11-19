import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import TripForm from '@/components/TripForm'

export default async function PlanPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Plan Your Perfect Trip
        </h1>
        <p className="text-gray-600">
          Start by telling us where you want to go and when
        </p>
      </div>
      
      <TripForm />
    </div>
  )
}
