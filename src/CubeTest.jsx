import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function CubeTest() {
  const mountRef = useRef(null)

  useEffect(() => {
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )

    camera.position.set(0, 0, 0.01)

    const renderer = new THREE.WebGLRenderer({
      antialias: true
    })

    renderer.setSize(window.innerWidth, window.innerHeight)
    mountRef.current.appendChild(renderer.domElement)

    const loader = new THREE.CubeTextureLoader()

    const texture = loader.load([
      '/panoramas/2.jpg',
      '/panoramas/3.jpg',
      '/panoramas/4.jpg',
      '/panoramas/5.jpg',
      '/panoramas/6.jpg',
      '/panoramas/7.jpg'
    ])

    scene.background = texture

    let isDragging = false
    let previousX = 0
    let previousY = 0

    let rotationX = 0
    let rotationY = 0

    const onMouseDown = (event) => {
      isDragging = true
      previousX = event.clientX
      previousY = event.clientY
    }

    const onMouseMove = (event) => {
      if (!isDragging) return

      const deltaX = event.clientX - previousX
      const deltaY = event.clientY - previousY

      previousX = event.clientX
      previousY = event.clientY

      rotationY -= deltaX * 0.003
      rotationX -= deltaY * 0.003

      rotationX = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, rotationX)
      )
    }

    const onMouseUp = () => {
      isDragging = false
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    const animate = () => {
      requestAnimationFrame(animate)

      camera.rotation.order = 'YXZ'
      camera.rotation.y = rotationY
      camera.rotation.x = rotationX

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)

      renderer.dispose()

      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden'
      }}
    />
  )
}