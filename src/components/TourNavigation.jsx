import { MapPin, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export default function TourNavigation({
  currentLocation,
  onSelectScene
}) {
  const [open, setOpen] = useState(false)

  const locations = [
    {
      id: 'lift',
      name: 'Lift',
      available: true
    },
    {
      id: 'lobby',
      name: 'Lobby',
      available: true
    },
    {
      id: 'reception',
      name: 'Reception',
      available: false
    },
    {
      id: 'conference',
      name: 'Conference',
      available: false
    }
  ]

  return (
    <div className="tour-navigation">
      <button
        className={`tour-nav-toggle ${
          open ? 'is-open' : ''
        }`}
        onClick={() => setOpen(!open)}
      >
        <span className="tour-nav-location">
          <MapPin size={16} />

          <span>{currentLocation}</span>
        </span>

        <ChevronUp
          size={17}
          className="tour-nav-chevron"
        />
      </button>

      {open && (
        <div className="tour-nav-menu">
          {locations.map((location) => {
            const active =
              location.name === currentLocation

            return (
              <button
                key={location.id}
                className={`tour-nav-item ${
                  active ? 'active' : ''
                } ${
                  !location.available
                    ? 'disabled'
                    : ''
                }`}
                disabled={!location.available}
                onClick={() => {
                  if (!location.available) return

                  onSelectScene(location.id)

                  setOpen(false)
                }}
              >
                <span className="tour-nav-item-dot" />

                <span className="tour-nav-item-name">
                  {location.name}
                </span>

                {active && (
                  <span className="tour-nav-current">
                    CURRENT
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}