import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Camera, Sparkles, Calendar, ShieldCheck, Clock, Wand2 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(80%_60%_at_50%_-10%,#dbeafe_0%,transparent_60%)]" />
        <div className="container relative pt-16 pb-12 lg:pt-24 lg:pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1 text-sm text-blue-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" /> AI visual trip planning
            </div>
            <h1 className="mt-5 text-4xl sm:text-6xl font-bold tracking-tight text-gray-900">
              Plan Your Dream Trip in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Seconds</span>
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-gray-600">
              What used to take days now takes a tap
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signin">
                <Button size="lg" className="text-base px-6 py-3">
                  Start Planning — It’s Free
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="text-base px-6 py-3">
                  See How It Works
                </Button>
              </Link>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-600" /> No spam, no ads</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-blue-600" /> Plans in seconds</div>
            </div>
          </div>
          {/* Image mosaic */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative h-56 sm:h-64 rounded-xl overflow-hidden shadow-sm">
              <Image src="/hero/dolomites.jpg" alt="Dolomites, Italy" fill priority className="object-cover" />
            </div>
            <div className="relative h-56 sm:h-64 rounded-xl overflow-hidden shadow-sm">
              <Image src="/hero/switzerland-2.jpg" alt="Switzerland" fill className="object-cover" />
            </div>
            <div className="relative h-56 sm:h-64 rounded-xl overflow-hidden shadow-sm">
              <Image src="/hero/patagonia.jpg" alt="Patagonia, Argentina" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>
      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How Desti Works</h2>
            <p className="text-lg text-gray-600">Four simple steps to your perfect itinerary</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <Card className="text-center p-6 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4"><MapPin className="h-6 w-6 text-blue-600" /></div>
                <h3 className="font-semibold mb-2">1. Choose Destination</h3>
                <p className="text-sm text-gray-600">Enter your dream destination and travel dates</p>
              </CardContent>
            </Card>
            <Card className="text-center p-6 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4"><Camera className="h-6 w-6 text-blue-600" /></div>
                <h3 className="font-semibold mb-2">2. Select Scenic Photos</h3>
                <p className="text-sm text-gray-600">Pick from beautiful photos that inspire you</p>
              </CardContent>
            </Card>
            <Card className="text-center p-6 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4"><Sparkles className="h-6 w-6 text-blue-600" /></div>
                <h3 className="font-semibold mb-2">3. AI Creates Itinerary</h3>
                <p className="text-sm text-gray-600">Our AI builds your perfect plan in seconds</p>
              </CardContent>
            </Card>
            <Card className="text-center p-6 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4"><Calendar className="h-6 w-6 text-blue-600" /></div>
                <h3 className="font-semibold mb-2">4. Book & Enjoy</h3>
                <p className="text-sm text-gray-600">Get your detailed itinerary and start booking</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Feature highlights */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <Card className="p-6 hover:shadow-md transition-shadow">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-3 text-gray-900"><Wand2 className="h-5 w-5 text-purple-600" /> Personalized by AI</CardTitle>
              </CardHeader>
              <CardContent className="pt-2 text-sm text-gray-600">We learn your visual taste and build tailored routes and timings.</CardContent>
            </Card>
            <Card className="p-6 hover:shadow-md transition-shadow">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-3 text-gray-900"><Clock className="h-5 w-5 text-blue-600" /> Plan in minutes</CardTitle>
              </CardHeader>
              <CardContent className="pt-2 text-sm text-gray-600">Skip hours of research—generate a complete itinerary in seconds.</CardContent>
            </Card>
            <Card className="p-6 hover:shadow-md transition-shadow">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-3 text-gray-900"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Private & secure</CardTitle>
              </CardHeader>
              <CardContent className="pt-2 text-sm text-gray-600">Your preferences and trips stay private—no ads, ever.</CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Gallery */}
      <section className="py-10">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative h-56 rounded-xl overflow-hidden"><Image src="/hero/dolomites.jpg" alt="Dolomites" fill className="object-cover" /></div>
            <div className="relative h-56 rounded-xl overflow-hidden"><Image src="/hero/switzerland-2.jpg" alt="Switzerland" fill className="object-cover" /></div>
            <div className="relative h-56 rounded-xl overflow-hidden"><Image src="/hero/patagonia.jpg" alt="Patagonia" fill className="object-cover" /></div>
          </div>
        </div>
      </section>
      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <CardContent className="pt-2">
                <Badge variant="outline" className="mb-3">Pro traveler</Badge>
                <p className="text-gray-800">“Planning used to take me days. With Desti, I had a perfect 7‑day route in minutes.”</p>
                <p className="text-sm text-gray-500 mt-2">— Alex R.</p>
              </CardContent>
            </Card>
            <Card className="p-6">
              <CardContent className="pt-2">
                <Badge variant="outline" className="mb-3">Weekend escape</Badge>
                <p className="text-gray-800">“The photo-first flow is genius. Itineraries match exactly what I want to see.”</p>
                <p className="text-sm text-gray-500 mt-2">— Priya S.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Final CTA */}
      <div className="bg-blue-600 py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Plan Your Next Adventure?</h2>
          <p className="text-xl text-blue-100 mb-8">Join thousands of travelers who plan visually with Desti</p>
          <Link href="/auth/signin">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">Get Started Now</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
