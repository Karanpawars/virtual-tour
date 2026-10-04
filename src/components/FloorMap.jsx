import { Map, X } from 'lucide-react'

export default function FloorMap({
  currentLocation,
  onSelectScene,
  onClose
}) {
  const locations = [
    {
      id: 'lift',
      name: 'Lift',
      x: 50,
      y: 72,
      available: true
    },
    {
      id: 'lobby',
      name: 'Lobby',
      x: 50,
      y: 48,
      available: false
    },
    {
      id: 'reception',
      name: 'Reception',
      x: 30,
      y: 30,
      available: false
    },
    {
      id: 'conference',
      name: 'Conference',
      x: 72,
      y: 30,
      available: false
    }
  ]

  const handleLocationClick = (location) => {
    if (!location.available) return

    onSelectScene(location.id)
  }

  return (
    <div className="floor-map-wrapper">

      <div className="floor-map-header">
        <div className="floor-map-title">
          <Map size={17} />

          <span>Floor Plan</span>
        </div>

        <button
            className="floor-map-close"
            aria-label="Close floor plan"
            onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      <div className="floor-map">

        {/* Floor outline */}

        <div className="floor-wall wall-top" />
        <div className="floor-wall wall-bottom" />
        <div className="floor-wall wall-left" />
        <div className="floor-wall wall-right" />

        {/* Rooms */}

        <div className="floor-room room-lobby">
          <span>Lobby</span>
        </div>

        <div className="floor-room room-reception">
          <span>Reception</span>
        </div>

        <div className="floor-room room-conference">
          <span>Conference</span>
        </div>

        <div className="floor-room room-lift">
          <span>Lift</span>
        </div>

        {/* Connecting corridor */}

        <div className="floor-corridor" />

        {/* Location points */}

        {locations.map((location) => {
          const active =
            location.name.toLowerCase() ===
            currentLocation.toLowerCase()

          return (
            <button
              key={location.id}
              className={`floor-location ${
                active ? 'active' : ''
              } ${
                !location.available
                  ? 'disabled'
                  : ''
              }`}
              style={{
                left: `${location.x}%`,
                top: `${location.y}%`
              }}
              disabled={!location.available}
              onClick={() =>
                handleLocationClick(location)
              }
              aria-label={location.name}
            >
              <span className="floor-location-pulse" />

              <span className="floor-location-dot" />

              <span className="floor-location-label">
                {location.name}
              </span>
            </button>
          )
        })}
      </div>

    </div>
  )
}