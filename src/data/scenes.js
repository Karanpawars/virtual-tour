export const scenes = {
  lift: {
    id: 'lift',
    name: 'Lift',

    faces: [
      '/panoramas/lift/1.jpg',
      '/panoramas/lift/2.jpg',
      '/panoramas/lift/3.jpg',
      '/panoramas/lift/4.jpg',
      '/panoramas/lift/5.jpg',
      '/panoramas/lift/6.jpg'
    ],

    hotspots: [
      {
        id: 'lobby',
        label: 'Lobby',
        target: 'lobby',

        position: {
          x: 0,
          y: -0.15,
          z: -1
        }
      }
    ]
  },

  lobby: {
    id: 'lobby',
    name: 'Lobby',

    faces: [
      '/panoramas/lobby/1.jpg',
      '/panoramas/lobby/2.jpg',
      '/panoramas/lobby/3.jpg',
      '/panoramas/lobby/4.jpg',
      '/panoramas/lobby/5.jpg',
      '/panoramas/lobby/6.jpg'
    ],

    hotspots: [
      {
        id: 'lift',
        label: 'Lift',
        target: 'lift',

        position: {
          x: 0,
          y: -0.15,
          z: 1
        }
      },

      {
        id: 'reception',
        label: 'Reception',
        target: 'reception',

        position: {
          x: 1,
          y: -0.15,
          z: -1
        }
      }
    ]
  },

  reception: {
    id: 'reception',
    name: 'Reception',

    faces: [],

    hotspots: [
      {
        id: 'lobby',
        label: 'Lobby',
        target: 'lobby',

        position: {
          x: -1,
          y: -0.15,
          z: 1
        }
      },

      {
        id: 'conference',
        label: 'Conference',
        target: 'conference',

        position: {
          x: 1,
          y: -0.15,
          z: -1
        }
      }
    ]
  },

  conference: {
    id: 'conference',
    name: 'Conference',

    faces: [],

    hotspots: [
      {
        id: 'reception',
        label: 'Reception',
        target: 'reception',

        position: {
          x: -1,
          y: -0.15,
          z: 1
        }
      }
    ]
  }
}