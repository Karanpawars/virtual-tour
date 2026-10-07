import { useEffect, useState } from 'react'
import VirtualTour from './VirtualTour'
import Admin from './Admin'
import {
  createTourUrls,
  getTour,
  revokeTourUrls
} from './tourStorage'

const APP_BASE_PATH = '/virtual-tour'

function getRoute() {
  const pathname = window.location.pathname

  // Remove /virtual-tour from URL
  if (
    pathname === APP_BASE_PATH ||
    pathname === `${APP_BASE_PATH}/`
  ) {
    return '/'
  }

  if (pathname.startsWith(`${APP_BASE_PATH}/`)) {
    return pathname.slice(APP_BASE_PATH.length)
  }

  // Also support direct root during development
  if (pathname === '/' || pathname === '') {
    return '/'
  }

  return pathname
}

export default function App() {
  const route = getRoute()

  // ============================================
  // ADMIN
  // /virtual-tour/admin
  // ============================================

  if (
    route === '/admin' ||
    route.startsWith('/admin/')
  ) {
    return <Admin />
  }

  // ============================================
  // VIEWER
  // /virtual-tour/
  // /virtual-tour/?tour=xxxxx
  // ============================================

  return <TourRoute />
}

function TourRoute() {
  const [tour, setTour] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activeTour = null
    let cancelled = false

    async function loadTour() {
      const params = new URLSearchParams(
        window.location.search
      )

      const tourId = params.get('tour')

      // ============================================
      // DEFAULT TOUR
      // ============================================

      if (!tourId) {
        setLoading(false)
        return
      }

      // ============================================
      // SAVED TOUR
      // ============================================

      try {
        const savedTour = await getTour(tourId)

        if (!savedTour) {
          if (!cancelled) {
            setError(
              'Tour not found on this browser.'
            )

            setLoading(false)
          }

          return
        }

        activeTour = createTourUrls(savedTour)

        if (!cancelled) {
          setTour(activeTour)
          setLoading(false)
        }
      } catch (error) {
        console.error(
          'Failed to load tour:',
          error
        )

        if (!cancelled) {
          setError(
            'Unable to load this tour.'
          )

          setLoading(false)
        }
      }
    }

    loadTour()

    return () => {
      cancelled = true

      if (activeTour) {
        revokeTourUrls(activeTour)
      }
    }
  }, [])

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#111',
          color: '#fff',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        Loading tour...
      </div>
    )
  }

  // ============================================
  // ERROR
  // ============================================

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#111',
          color: '#fff',
          padding: 24,
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        <div>
          <h2>{error}</h2>

          <button
            onClick={() => {
              window.location.href =
                '/virtual-tour/admin'
            }}
            style={{
              marginTop: 16,
              padding: '10px 18px',
              border: 0,
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Open Admin
          </button>
        </div>
      </div>
    )
  }

  return (
    <VirtualTour
      tour={tour}
    />
  )
}