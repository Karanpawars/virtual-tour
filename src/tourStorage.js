const DB_NAME = 'virtual-tour-upload-db'
const STORE_NAME = 'tours'
const DB_VERSION = 2

// ==================================================
// INDEXEDDB
// ==================================================

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    )

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(
          STORE_NAME,
          {
            keyPath: 'id'
          }
        )
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

// ==================================================
// SAVE TOUR
// ==================================================

export async function saveTour(tour) {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      STORE_NAME,
      'readwrite'
    )

    tx.objectStore(STORE_NAME).put(tour)

    tx.oncomplete = () => {
      db.close()
      resolve(tour)
    }

    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

// ==================================================
// GET TOUR
// ==================================================

export async function getTour(id) {
  if (!id) {
    return null
  }

  const db = await openDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      STORE_NAME,
      'readonly'
    )

    const request = tx
      .objectStore(STORE_NAME)
      .get(id)

    request.onsuccess = () => {
      db.close()

      resolve(
        request.result || null
      )
    }

    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

// ==================================================
// LIST TOURS
// ==================================================

export async function listTours() {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      STORE_NAME,
      'readonly'
    )

    const request = tx
      .objectStore(STORE_NAME)
      .getAll()

    request.onsuccess = () => {
      db.close()

      resolve(
        request.result || []
      )
    }

    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

// ==================================================
// DELETE TOUR
// ==================================================

export async function deleteTour(id) {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      STORE_NAME,
      'readwrite'
    )

    tx.objectStore(STORE_NAME).delete(id)

    tx.oncomplete = () => {
      db.close()
      resolve()
    }

    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

// ==================================================
// CREATE OBJECT URLS
// ==================================================

export function createTourUrls(tour) {
  if (!tour) {
    return null
  }

  const panoramaUrl =
    tour.panoramaBlob
      ? URL.createObjectURL(
          tour.panoramaBlob
        )
      : ''

  const musicUrl =
    tour.musicBlob
      ? URL.createObjectURL(
          tour.musicBlob
        )
      : ''

  const scenes =
    Array.isArray(tour.scenes)
      ? tour.scenes.map((scene) => ({
          ...scene,

          panoramaUrl:
            scene.panoramaBlob
              ? URL.createObjectURL(
                  scene.panoramaBlob
                )
              : ''
        }))
      : []

  return {
    ...tour,
    panoramaUrl,
    musicUrl,
    scenes
  }
}

// ==================================================
// REVOKE OBJECT URLS
// ==================================================

export function revokeTourUrls(tour) {
  if (!tour) {
    return
  }

  if (tour.panoramaUrl) {
    URL.revokeObjectURL(
      tour.panoramaUrl
    )
  }

  if (tour.musicUrl) {
    URL.revokeObjectURL(
      tour.musicUrl
    )
  }

  if (Array.isArray(tour.scenes)) {
    tour.scenes.forEach((scene) => {
      if (scene.panoramaUrl) {
        URL.revokeObjectURL(
          scene.panoramaUrl
        )
      }
    })
  }
}

// ==================================================
// REAL TOUR STATS
// ==================================================

function getStatsKey(tourId) {
  return `virtual-tour-stats-${tourId}`
}

// ==================================================
// LIKED KEY
// ==================================================

function getLikedKey(tourId) {
  return `virtual-tour-liked-${tourId}`
}

// ==================================================
// GET TOUR STATS
// ==================================================

export function getTourStats(tourId) {
  if (!tourId) {
    return {
      views: 0,
      likes: 0
    }
  }

  try {
    const saved =
      localStorage.getItem(
        getStatsKey(tourId)
      )

    if (!saved) {
      return {
        views: 0,
        likes: 0
      }
    }

    const parsed =
      JSON.parse(saved)

    return {
      views: Number(
        parsed.views || 0
      ),

      likes: Number(
        parsed.likes || 0
      )
    }
  } catch (error) {
    console.error(
      'Unable to read tour stats:',
      error
    )

    return {
      views: 0,
      likes: 0
    }
  }
}

// ==================================================
// SAVE TOUR STATS
// ==================================================

function saveTourStats(
  tourId,
  stats
) {
  if (!tourId) {
    return
  }

  try {
    localStorage.setItem(
      getStatsKey(tourId),
      JSON.stringify({
        views: Number(
          stats.views || 0
        ),

        likes: Number(
          stats.likes || 0
        )
      })
    )
  } catch (error) {
    console.error(
      'Unable to save tour stats:',
      error
    )
  }
}

// ==================================================
// INCREMENT TOUR VIEW
// ==================================================

export function incrementTourView(
  tourId
) {
  if (!tourId) {
    return {
      views: 0,
      likes: 0
    }
  }

  const stats =
    getTourStats(tourId)

  stats.views += 1

  saveTourStats(
    tourId,
    stats
  )

  return stats
}
// ==================================================
// LIKE / UNLIKE TOUR
// ==================================================

export function likeTour(
  tourId,
  shouldLike = true
) {
  if (!tourId) {
    return {
      views: 0,
      likes: 0
    }
  }

  const stats =
    getTourStats(tourId)

  const likedKey =
    getLikedKey(tourId)

  if (shouldLike) {
    // Already liked
    if (
      localStorage.getItem(
        likedKey
      ) === 'true'
    ) {
      return stats
    }

    stats.likes += 1

    saveTourStats(
      tourId,
      stats
    )

    localStorage.setItem(
      likedKey,
      'true'
    )

    return stats
  }

  // ==================================================
  // UNLIKE
  // ==================================================

  if (
    localStorage.getItem(
      likedKey
    ) !== 'true'
  ) {
    return stats
  }

  stats.likes = Math.max(
    0,
    stats.likes - 1
  )

  saveTourStats(
    tourId,
    stats
  )

  localStorage.setItem(
    likedKey,
    'false'
  )

  return stats
}

