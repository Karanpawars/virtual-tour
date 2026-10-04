import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { VRButton } from 'three/addons/webxr/VRButton.js'
import {
  Maximize,
  Minimize,
  Plus,
  Minus,
  Map,
  Volume2,
  VolumeX,
  Eye
} from 'lucide-react'

import { scenes } from './data/scenes'
import TourNavigation from './components/TourNavigation'
import FloorMap from './components/FloorMap'

export default function VirtualTour() {
  const containerRef = useRef(null)
  const rendererRef = useRef(null)

  const currentSceneRef = useRef('lift')
  const cubeTextureRef = useRef(null)

  const placementModeRef = useRef(false)
  const loadSceneRef = useRef(null)

  // ==================================================
  // MUSIC
  // ==================================================

  const audioRef = useRef(null)
  const musicStartedRef = useRef(false)

  const [musicPlaying, setMusicPlaying] = useState(false)

  // ==================================================
  // UI STATE
  // ==================================================

  const [floorMapOpen, setFloorMapOpen] = useState(false)

  const [placementMode, setPlacementMode] = useState(false)

  const [placementCoordinates, setPlacementCoordinates] =
    useState(null)

  const [loading, setLoading] = useState(true)

  const [fullscreen, setFullscreen] = useState(false)

  const [currentLocation, setCurrentLocation] = useState('Lift')

  const [transitioning, setTransitioning] = useState(false)

  // ==================================================
  // PERSPECTIVE
  // ==================================================

  const [perspective, setPerspective] = useState('normal')

  const perspectiveRef = useRef('normal')

  useEffect(() => {
    perspectiveRef.current = perspective
  }, [perspective])

  // ==================================================
  // PLACEMENT MODE REF
  // ==================================================

  useEffect(() => {
    placementModeRef.current = placementMode
  }, [placementMode])

  // ==================================================
  // BACKGROUND MUSIC
  // ==================================================

  useEffect(() => {
    const audio = new Audio(
      '/audio/background-music.mp3'
    )

    audio.loop = true
    audio.volume = 0.45
    audio.preload = 'auto'

    audioRef.current = audio

    const handlePlay = () => {
      setMusicPlaying(true)
      musicStartedRef.current = true
    }

    const handlePause = () => {
      setMusicPlaying(false)
    }

    audio.addEventListener(
      'play',
      handlePlay
    )

    audio.addEventListener(
      'pause',
      handlePause
    )

    // ==================================================
    // AUTOPLAY
    // ==================================================

    const attemptAutoplay = async () => {
      try {
        await audio.play()

        musicStartedRef.current = true
        setMusicPlaying(true)
      } catch {
        console.log(
          'Autoplay blocked. Music will start after user interaction.'
        )
      }
    }

    attemptAutoplay()

    // ==================================================
    // FIRST USER INTERACTION
    // ==================================================

    const startAfterInteraction = () => {
      if (
        musicStartedRef.current ||
        !audioRef.current
      ) {
        return
      }

      audioRef.current
        .play()
        .then(() => {
          musicStartedRef.current = true
          setMusicPlaying(true)
        })
        .catch(() => {})
    }

    const interactionEvents = [
      'click',
      'pointerdown',
      'touchstart',
      'keydown'
    ]

    interactionEvents.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          startAfterInteraction,
          {
            passive: true
          }
        )
      }
    )

    return () => {
      interactionEvents.forEach(
        (eventName) => {
          window.removeEventListener(
            eventName,
            startAfterInteraction
          )
        }
      )

      audio.removeEventListener(
        'play',
        handlePlay
      )

      audio.removeEventListener(
        'pause',
        handlePause
      )

      audio.pause()
      audio.src = ''

      audioRef.current = null
    }
  }, [])

  // ==================================================
  // MUSIC TOGGLE
  // ==================================================

  const toggleMusic = async () => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    if (audio.paused) {
      try {
        await audio.play()

        musicStartedRef.current = true
        setMusicPlaying(true)
      } catch (error) {
        console.error(
          'Unable to start music:',
          error
        )
      }
    } else {
      audio.pause()
      setMusicPlaying(false)
    }
  }

  // ==================================================
  // THREE.JS
  // ==================================================

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    // ==================================================
    // THREE SCENE
    // ==================================================

    const scene = new THREE.Scene()

    // ==================================================
    // CAMERA
    // ==================================================

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth /
        container.clientHeight,
      0.1,
      100
    )

    camera.position.set(
      0,
      0,
      0
    )

    camera.rotation.order = 'YXZ'

    // ==================================================
    // RENDERER
    // ==================================================

    const renderer =
      new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference:
          'high-performance'
      })

    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        2
      )
    )

    renderer.setSize(
      container.clientWidth,
      container.clientHeight
    )

    renderer.outputColorSpace =
      THREE.SRGBColorSpace

    // ==================================================
    // ENABLE WEBXR
    // ==================================================

    renderer.xr.enabled = true

    rendererRef.current =
      renderer

    container.appendChild(
      renderer.domElement
    )

    renderer.domElement.style.touchAction =
      'none'

    // ==================================================
    // VR BUTTON
    // ==================================================

    const vrButton =
      VRButton.createButton(
        renderer
      )

    vrButton.style.position =
      'absolute'

    vrButton.style.bottom =
      '92px'

    vrButton.style.left =
      '50%'

    vrButton.style.transform =
      'translateX(-50%)'

    vrButton.style.zIndex =
      '50'

    vrButton.style.border =
      '1px solid rgba(255,255,255,0.25)'

    vrButton.style.borderRadius =
      '8px'

    vrButton.style.background =
      'rgba(0,0,0,0.65)'

    vrButton.style.backdropFilter =
      'blur(10px)'

    vrButton.style.color =
      '#ffffff'

    vrButton.style.fontFamily =
      'Arial, sans-serif'

    vrButton.style.fontSize =
      '13px'

    vrButton.style.fontWeight =
      '600'

    vrButton.style.padding =
      '10px 18px'

    vrButton.style.cursor =
      'pointer'

    container.appendChild(
      vrButton
    )

    // ==================================================
    // HOTSPOT GROUP
    // ==================================================

    const hotspotGroup =
      new THREE.Group()

    scene.add(
      hotspotGroup
    )

    // ==================================================
    // HOTSPOT CLEANUP
    // ==================================================

    const clearHotspots =
      () => {
        while (
          hotspotGroup.children.length
        ) {
          const child =
            hotspotGroup.children.pop()

          child.traverse(
            (object) => {
              if (object.geometry) {
                object.geometry.dispose()
              }

              if (object.material) {
                if (
                  Array.isArray(
                    object.material
                  )
                ) {
                  object.material.forEach(
                    (material) => {
                      material.dispose()
                    }
                  )
                } else {
                  object.material.dispose()
                }
              }
            }
          )
        }
      }

    // ==================================================
    // CREATE HOTSPOTS
    // ==================================================

    const createHotspots =
      (targetScene) => {
        clearHotspots()

        targetScene.hotspots?.forEach(
          (hotspot) => {
            const group =
              new THREE.Group()

            group.position.set(
              hotspot.position.x,
              hotspot.position.y,
              hotspot.position.z
            )

            // ------------------------------------------
            // OUTER RING
            // ------------------------------------------

            const ringGeometry =
              new THREE.RingGeometry(
                0.11,
                0.15,
                32
              )

            const ringMaterial =
              new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.45,
                side: THREE.DoubleSide
              })

            const ring =
              new THREE.Mesh(
                ringGeometry,
                ringMaterial
              )

            group.add(
              ring
            )

            // ------------------------------------------
            // CENTER
            // ------------------------------------------

            const centerGeometry =
              new THREE.CircleGeometry(
                0.08,
                32
              )

            const centerMaterial =
              new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide
              })

            const center =
              new THREE.Mesh(
                centerGeometry,
                centerMaterial
              )

            group.add(
              center
            )

            // ------------------------------------------
            // NO ARROW
            // ------------------------------------------
            //
            // The old black arrow has been completely
            // removed.
            //
            // ------------------------------------------

            // ------------------------------------------
            // HOTSPOT DATA
            // ------------------------------------------

            group.userData =
              hotspot

            hotspotGroup.add(
              group
            )
          }
        )
      }

    // ==================================================
    // LOAD SCENE
    // ==================================================

    const loadScene =
      (
        sceneId,
        firstLoad = false
      ) => {
        const targetScene =
          scenes[sceneId]

        if (!targetScene) {
          console.error(
            `Scene "${sceneId}" not found`
          )

          return
        }

        if (
          !targetScene.faces?.length
        ) {
          console.warn(
            `Scene "${sceneId}" does not have panorama faces yet.`
          )

          return
        }

        if (firstLoad) {
          setLoading(true)
        } else {
          setTransitioning(true)
        }

        const loader =
          new THREE.CubeTextureLoader()

        loader.load(
          targetScene.faces,

          (cubeTexture) => {
            cubeTexture.colorSpace =
              THREE.SRGBColorSpace

            scene.background =
              cubeTexture

            if (
              cubeTextureRef.current
            ) {
              cubeTextureRef.current.dispose()
            }

            cubeTextureRef.current =
              cubeTexture

            currentSceneRef.current =
              sceneId

            setCurrentLocation(
              targetScene.name
            )

            createHotspots(
              targetScene
            )

            setTimeout(
              () => {
                setTransitioning(false)
                setLoading(false)
              },
              firstLoad
                ? 0
                : 250
            )
          },

          undefined,

          (error) => {
            console.error(
              `Failed to load scene "${sceneId}"`,
              error
            )

            setLoading(false)
            setTransitioning(false)
          }
        )
      }

    loadSceneRef.current =
      loadScene

    loadScene(
      'lift',
      true
    )

    // ==================================================
    // CAMERA / DRAG STATE
    // ==================================================

    let isDragging = false

    let didDrag = false

    let dragDistance = 0

    let previousX = 0
    let previousY = 0

    let targetRotationX = 0
    let targetRotationY = 0

    let currentRotationX = 0
    let currentRotationY = 0

    let targetFov = 75
    let currentFov = 75

    // ==================================================
    // AUTO ROTATION
    // ==================================================

    const AUTO_ROTATE_SPEED =
      0.06

    const AUTO_ROTATE_EASING =
      0.045

    const AUTO_ROTATE_RESUME_DELAY =
      2500

    let autoRotateSpeed =
      AUTO_ROTATE_SPEED

    let autoRotateResumeTime =
      0

    let lastFrameTime =
      performance.now()

    // ==================================================
    // PERSPECTIVE
    // ==================================================

    const getPerspectiveFov =
      () => {
        switch (
          perspectiveRef.current
        ) {
          case 'asteroid':
            return 120

          case 'crystal':
            return 105

          case 'fisheye':
            return 100

          case 'normal':
          default:
            return 75
        }
      }

    // ==================================================
    // START DRAG
    // ==================================================

    const startDrag =
      (x, y) => {
        if (
          placementModeRef.current
        ) {
          return
        }

        isDragging = true

        didDrag = false

        dragDistance = 0

        // Stop auto rotation
        autoRotateSpeed = 0

        autoRotateResumeTime = 0

        previousX = x
        previousY = y

        renderer.domElement.style.cursor =
          'grabbing'
      }

    // ==================================================
    // MOVE DRAG
    // ==================================================

    const moveDrag =
      (x, y) => {
        if (!isDragging) {
          return
        }

        const deltaX =
          x - previousX

        const deltaY =
          y - previousY

        previousX = x
        previousY = y

        dragDistance +=
          Math.abs(deltaX) +
          Math.abs(deltaY)

        if (
          dragDistance > 5
        ) {
          didDrag = true
        }

        targetRotationY -=
          deltaX * 0.0025

        targetRotationX -=
          deltaY * 0.0025

        const limit =
          Math.PI / 2 - 0.05

        targetRotationX =
          Math.max(
            -limit,
            Math.min(
              limit,
              targetRotationX
            )
          )
      }

    // ==================================================
    // STOP DRAG
    // ==================================================

    const stopDrag =
      () => {
        if (!isDragging) {
          return
        }

        isDragging = false

        // Restart the 2.5 second countdown
        // only after interaction.
        autoRotateResumeTime =
          performance.now() +
          AUTO_ROTATE_RESUME_DELAY

        renderer.domElement.style.cursor =
          placementModeRef.current
            ? 'crosshair'
            : 'grab'
      }

    // ==================================================
    // MOUSE
    // ==================================================

    const handleMouseDown =
      (event) => {
        startDrag(
          event.clientX,
          event.clientY
        )
      }

    const handleMouseMove =
      (event) => {
        moveDrag(
          event.clientX,
          event.clientY
        )
      }

    const handleMouseUp =
      () => {
        stopDrag()
      }

    // ==================================================
    // TOUCH
    // ==================================================

    const handleTouchStart =
      (event) => {
        if (
          placementModeRef.current
        ) {
          return
        }

        if (
          event.touches.length !==
          1
        ) {
          return
        }

        const touch =
          event.touches[0]

        startDrag(
          touch.clientX,
          touch.clientY
        )
      }

    const handleTouchMove =
      (event) => {
        if (
          event.touches.length !==
          1
        ) {
          return
        }

        const touch =
          event.touches[0]

        moveDrag(
          touch.clientX,
          touch.clientY
        )
      }

    const handleTouchEnd =
      () => {
        stopDrag()
      }

    // ==================================================
    // ZOOM
    // ==================================================

    const handleWheel =
      (event) => {
        event.preventDefault()

        targetFov +=
          event.deltaY * 0.04

        targetFov =
          Math.max(
            35,
            Math.min(
              90,
              targetFov
            )
          )
      }

    // ==================================================
    // RAYCASTING
    // ==================================================

    const raycaster =
      new THREE.Raycaster()

    const mouse =
      new THREE.Vector2()

    // ==================================================
    // CLICK
    // ==================================================

    const handleClick =
      (event) => {
        if (didDrag) {
          didDrag = false
          return
        }

        const rect =
          renderer.domElement.getBoundingClientRect()

        mouse.x =
          (
            (
              event.clientX -
              rect.left
            ) /
            rect.width
          ) *
            2 -
          1

        mouse.y =
          -(
            (
              (
                event.clientY -
                rect.top
              ) /
              rect.height
            ) *
              2 -
            1
          )

        // ==================================================
        // PLACEMENT MODE
        // ==================================================

        if (
          placementModeRef.current
        ) {
          raycaster.setFromCamera(
            mouse,
            camera
          )

          const direction =
            raycaster.ray.direction
              .clone()
              .normalize()

          const position =
            direction.multiplyScalar(
              1
            )

          const coordinates = {
            x: Number(
              position.x.toFixed(3)
            ),
            y: Number(
              position.y.toFixed(3)
            ),
            z: Number(
              position.z.toFixed(3)
            )
          }

          console.log(
            'HOTSPOT POSITION:',
            coordinates
          )

          setPlacementCoordinates(
            coordinates
          )

          return
        }

        // ==================================================
        // HOTSPOT CLICK
        // ==================================================

        raycaster.setFromCamera(
          mouse,
          camera
        )

        const objects = []

        hotspotGroup.children.forEach(
          (group) => {
            group.children.forEach(
              (child) => {
                objects.push(
                  child
                )
              }
            )
          }
        )

        const intersections =
          raycaster.intersectObjects(
            objects
          )

        if (
          !intersections.length
        ) {
          return
        }

        const object =
          intersections[0].object

        const hotspot =
          object.parent?.userData

        if (!hotspot?.target) {
          return
        }

        const targetScene =
          scenes[
            hotspot.target
          ]

        if (
          !targetScene?.faces?.length
        ) {
          console.warn(
            `Target scene "${hotspot.target}" does not have panorama faces yet.`
          )

          return
        }

        loadScene(
          hotspot.target,
          false
        )
      }

    // ==================================================
    // EVENTS
    // ==================================================

    renderer.domElement.addEventListener(
      'mousedown',
      handleMouseDown
    )

    window.addEventListener(
      'mousemove',
      handleMouseMove
    )

    window.addEventListener(
      'mouseup',
      handleMouseUp
    )

    renderer.domElement.addEventListener(
      'touchstart',
      handleTouchStart,
      {
        passive: true
      }
    )

    renderer.domElement.addEventListener(
      'touchmove',
      handleTouchMove,
      {
        passive: true
      }
    )

    renderer.domElement.addEventListener(
      'touchend',
      handleTouchEnd
    )

    renderer.domElement.addEventListener(
      'wheel',
      handleWheel,
      {
        passive: false
      }
    )

    renderer.domElement.addEventListener(
      'click',
      handleClick
    )

    // ==================================================
    // RESIZE
    // ==================================================

    const handleResize =
      () => {
        const width =
          container.clientWidth

        const height =
          container.clientHeight

        camera.aspect =
          width / height

        camera.updateProjectionMatrix()

        renderer.setSize(
          width,
          height
        )
      }

    window.addEventListener(
      'resize',
      handleResize
    )

    // ==================================================
    // ANIMATION
    // ==================================================

    const animate =
      () => {
        const now =
          performance.now()

        const deltaSeconds =
          Math.min(
            (
              now -
              lastFrameTime
            ) / 1000,
            0.05
          )

        lastFrameTime =
          now

        // ==================================================
        // AUTO ROTATION
        // ==================================================

        let desiredAutoRotateSpeed =
          0

        if (isDragging) {
          desiredAutoRotateSpeed =
            0
        } else if (
          now >=
          autoRotateResumeTime
        ) {
          desiredAutoRotateSpeed =
            AUTO_ROTATE_SPEED
        } else {
          desiredAutoRotateSpeed =
            0
        }

        autoRotateSpeed +=
          (
            desiredAutoRotateSpeed -
            autoRotateSpeed
          ) *
          AUTO_ROTATE_EASING

        targetRotationY -=
          autoRotateSpeed *
          deltaSeconds

        // ==================================================
        // SMOOTH CAMERA ROTATION
        // ==================================================

        currentRotationX +=
          (
            targetRotationX -
            currentRotationX
          ) *
          0.08

        currentRotationY +=
          (
            targetRotationY -
            currentRotationY
          ) *
          0.08

        // ==================================================
        // PERSPECTIVE
        // ==================================================

        const desiredFov =
          getPerspectiveFov()

        const zoomDifference =
          targetFov - 75

        const perspectiveTargetFov =
          desiredFov +
          zoomDifference

        currentFov +=
          (
            perspectiveTargetFov -
            currentFov
          ) *
          0.08

        currentFov =
          Math.max(
            35,
            Math.min(
              150,
              currentFov
            )
          )

        // ==================================================
        // CAMERA
        // ==================================================

        camera.rotation.order =
          'YXZ'

        camera.rotation.x =
          currentRotationX

        camera.rotation.y =
          currentRotationY

        camera.fov =
          currentFov

        camera.updateProjectionMatrix()

        // ==================================================
        // HOTSPOTS
        // ==================================================

        const time =
          now * 0.002

        hotspotGroup.children.forEach(
          (group, index) => {
            group.lookAt(
              camera.position
            )

            const pulse =
              1 +
              Math.sin(
                time + index
              ) *
                0.12

            group.scale.set(
              pulse,
              pulse,
              pulse
            )

            if (
              group.userData?.position
            ) {
              group.position.y =
                group.userData.position.y +
                Math.sin(
                  time + index
                ) *
                  0.025
            }
          }
        )

        // ==================================================
        // RENDER
        // ==================================================

        renderer.render(
          scene,
          camera
        )
      }

    // ==================================================
    // START RENDER LOOP
    // ==================================================

    renderer.setAnimationLoop(
      animate
    )

    renderer.domElement.style.cursor =
      'grab'

    // ==================================================
    // CLEANUP
    // ==================================================

    return () => {
      renderer.setAnimationLoop(
        null
      )

      renderer.domElement.removeEventListener(
        'mousedown',
        handleMouseDown
      )

      window.removeEventListener(
        'mousemove',
        handleMouseMove
      )

      window.removeEventListener(
        'mouseup',
        handleMouseUp
      )

      renderer.domElement.removeEventListener(
        'touchstart',
        handleTouchStart
      )

      renderer.domElement.removeEventListener(
        'touchmove',
        handleTouchMove
      )

      renderer.domElement.removeEventListener(
        'touchend',
        handleTouchEnd
      )

      renderer.domElement.removeEventListener(
        'wheel',
        handleWheel
      )

      renderer.domElement.removeEventListener(
        'click',
        handleClick
      )

      window.removeEventListener(
        'resize',
        handleResize
      )

      clearHotspots()

      if (
        cubeTextureRef.current
      ) {
        cubeTextureRef.current.dispose()

        cubeTextureRef.current =
          null
      }

      // Remove VR button
      if (
        vrButton &&
        container.contains(
          vrButton
        )
      ) {
        container.removeChild(
          vrButton
        )
      }

      renderer.dispose()

      if (
        container.contains(
          renderer.domElement
        )
      ) {
        container.removeChild(
          renderer.domElement
        )
      }

      loadSceneRef.current =
        null

      rendererRef.current =
        null
    }
  }, [])

  // ==================================================
  // ZOOM BUTTON
  // ==================================================

  const changeZoom =
    (amount) => {
      const renderer =
        rendererRef.current

      if (!renderer) {
        return
      }

      renderer.domElement.dispatchEvent(
        new WheelEvent(
          'wheel',
          {
            deltaY: amount
          }
        )
      )
    }

  // ==================================================
  // SCENE SWITCH
  // ==================================================

  const switchScene =
    (sceneId) => {
      if (
        sceneId ===
        currentSceneRef.current
      ) {
        return
      }

      const targetScene =
        scenes[sceneId]

      if (!targetScene) {
        return
      }

      if (
        !targetScene.faces?.length
      ) {
        console.warn(
          `Scene "${sceneId}" does not have panorama faces yet.`
        )

        return
      }

      loadSceneRef.current?.(
        sceneId,
        false
      )
    }

  // ==================================================
  // FULLSCREEN
  // ==================================================

  const toggleFullscreen =
    async () => {
      const element =
        containerRef.current

      if (!element) {
        return
      }

      try {
        if (
          !document.fullscreenElement
        ) {
          await element.requestFullscreen()
        } else {
          await document.exitFullscreen()
        }
      } catch (error) {
        console.error(
          'Fullscreen error:',
          error
        )
      }
    }

  // ==================================================
  // FULLSCREEN STATE
  // ==================================================

  useEffect(() => {
    const handleFullscreenChange =
      () => {
        setFullscreen(
          Boolean(
            document.fullscreenElement
          )
        )
      }

    document.addEventListener(
      'fullscreenchange',
      handleFullscreenChange
    )

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange
      )
    }
  }, [])

  // ==================================================
  // HOTSPOT POSITION MODE
  // ==================================================

  useEffect(() => {
    const handleKeyDown =
      (event) => {
        if (
          event.key.toLowerCase() !==
          'p'
        ) {
          return
        }

        setPlacementMode(
          (previous) =>
            !previous
        )

        setPlacementCoordinates(
          null
        )
      }

    window.addEventListener(
      'keydown',
      handleKeyDown
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [])

  // ==================================================
  // PERSPECTIVE OPTIONS
  // ==================================================

  const perspectiveOptions = [
    {
      id: 'normal',
      label: 'Normal'
    },
    {
      id: 'asteroid',
      label: 'Asteroid'
    },
    {
      id: 'crystal',
      label: 'Crystal Ball'
    },
    {
      id: 'fisheye',
      label: 'Fish Eye'
    }
  ]

  // ==================================================
  // UI
  // ==================================================

  return (
    <div
      ref={containerRef}
      className="virtual-tour"
    >

      {/* ==================================================
          LOADING
          ================================================== */}

      {loading && (
        <div className="tour-loading">
          <div className="loading-spinner" />

          <div className="loading-text">
            Loading virtual tour
          </div>
        </div>
      )}

      {/* ==================================================
          TRANSITION
          ================================================== */}

      {transitioning && (
        <div className="tour-transition">
          <div className="transition-spinner" />
        </div>
      )}

      {/* ==================================================
          HOTSPOT POSITION PANEL
          ================================================== */}

      {placementMode && (
        <div className="hotspot-placement-panel">

          <div className="placement-title">
            HOTSPOT POSITION MODE
          </div>

          <div className="placement-instruction">
            Point at the destination and click
          </div>

          {placementCoordinates && (
            <div className="placement-coordinates">

              <div>
                X:{' '}
                {placementCoordinates.x}
              </div>

              <div>
                Y:{' '}
                {placementCoordinates.y}
              </div>

              <div>
                Z:{' '}
                {placementCoordinates.z}
              </div>

            </div>
          )}

          <div className="placement-hint">
            Press P to exit
          </div>

        </div>
      )}

      {/* ==================================================
          TOP BAR
          ================================================== */}

      <div className="tour-topbar">

        <div className="tour-brand">
          VIRTUAL TOUR
        </div>

        <div className="tour-top-controls">

          {/* ==================================================
              PERSPECTIVE
              ================================================== */}

          <div className="perspective-wrapper">

            <button
              className="tour-icon-button"
              onClick={() => {
                const index =
                  perspectiveOptions.findIndex(
                    (item) =>
                      item.id ===
                      perspective
                  )

                const next =
                  perspectiveOptions[
                    (
                      index + 1
                    ) %
                      perspectiveOptions.length
                  ]

                setPerspective(
                  next.id
                )
              }}
              aria-label="Change perspective"
              title="Change perspective"
            >
              <Eye size={20} />
            </button>

            <div className="perspective-menu">

              {perspectiveOptions.map(
                (option) => (
                  <button
                    key={option.id}
                    className={`perspective-option ${
                      perspective ===
                      option.id
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setPerspective(
                        option.id
                      )
                    }
                  >
                    {option.label}
                  </button>
                )
              )}

            </div>

          </div>

          {/* ==================================================
              MUSIC
              ================================================== */}

          <button
            className="tour-icon-button"
            onClick={
              toggleMusic
            }
            aria-label={
              musicPlaying
                ? 'Mute music'
                : 'Play music'
            }
            title={
              musicPlaying
                ? 'Mute music'
                : 'Play music'
            }
          >
            {musicPlaying ? (
              <Volume2 size={20} />
            ) : (
              <VolumeX size={20} />
            )}
          </button>

          {/* ==================================================
              FULLSCREEN
              ================================================== */}

          <button
            className="tour-icon-button"
            onClick={
              toggleFullscreen
            }
            aria-label="Fullscreen"
            title="Fullscreen"
          >
            {fullscreen ? (
              <Minimize size={20} />
            ) : (
              <Maximize size={20} />
            )}
          </button>

        </div>
      </div>

      {/* ==================================================
          FLOOR MAP
          ================================================== */}

      {floorMapOpen && (
        <FloorMap
          currentLocation={
            currentLocation
          }
          onClose={() =>
            setFloorMapOpen(
              false
            )
          }
          onSelectScene={(
            sceneId
          ) => {
            switchScene(
              sceneId
            )

            setFloorMapOpen(
              false
            )
          }}
        />
      )}

      {/* ==================================================
          BOTTOM BAR
          ================================================== */}

      <div className="tour-bottombar">

        <TourNavigation
          currentLocation={
            currentLocation
          }
          onSelectScene={
            switchScene
          }
        />

        <div className="tour-right-controls">

          {/* ==================================================
              MAP
              ================================================== */}

          <button
            className="tour-map-button"
            onClick={() =>
              setFloorMapOpen(
                true
              )
            }
            aria-label="Open floor plan"
          >
            <Map size={18} />

            <span>
              MAP
            </span>
          </button>

          {/* ==================================================
              ZOOM
              ================================================== */}

          <div className="tour-controls">

            <button
              className="tour-control-button"
              onClick={() =>
                changeZoom(
                  250
                )
              }
              aria-label="Zoom out"
            >
              <Minus size={18} />
            </button>

            <button
              className="tour-control-button"
              onClick={() =>
                changeZoom(
                  -250
                )
              }
              aria-label="Zoom in"
            >
              <Plus size={18} />
            </button>

          </div>

        </div>
      </div>

    </div>
  )
}