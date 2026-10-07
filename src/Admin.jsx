import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Clapperboard,
  Eye,
  FileImage,
  FolderOpen,
  Headphones,
  ImagePlus,
  LayoutDashboard,
  MapPinned,
  Music,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Trash2,
  Upload,
  X
} from 'lucide-react'

import {
  deleteTour,
  listTours,
  saveTour
} from './tourStorage'

function makeId() {
  return `tour-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

function makeSceneId() {
  return `scene-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown date'

  return new Date(timestamp).toLocaleDateString(
    undefined,
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  )
}

function formatSize(bytes) {
  if (!bytes) return '0 MB'

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`
}

export default function Admin() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [musicFile, setMusicFile] = useState(null)
  const [musicPreviewUrl, setMusicPreviewUrl] =
    useState('')
  const [rooms, setRooms] = useState([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] =
    useState('success')
  const [tours, setTours] = useState([])
  const [activeSection, setActiveSection] =
    useState('create')
  const [isDraggingMusic, setIsDraggingMusic] =
    useState(false)

  const musicInputRef = useRef(null)

  const loadTours = async () => {
    try {
      const result = await listTours()

      setTours(
        result.sort(
          (a, b) =>
            Number(b.createdAt || 0) -
            Number(a.createdAt || 0)
        )
      )
    } catch (error) {
      console.error(error)

      showMessage(
        'Unable to read saved tours.',
        'error'
      )
    }
  }

  useEffect(() => {
    loadTours()
  }, [])

  useEffect(() => {
    return () => {
      rooms.forEach((room) => {
        if (room.previewUrl) {
          URL.revokeObjectURL(
            room.previewUrl
          )
        }
      })

      if (musicPreviewUrl) {
        URL.revokeObjectURL(
          musicPreviewUrl
        )
      }
    }
  }, [])

  const showMessage = (
    text,
    type = 'success'
  ) => {
    setMessage(text)
    setMessageType(type)
  }

  const validatePanorama = (file) => {
    if (!file) {
      return 'Please select a panorama image.'
    }

    if (!file.type.startsWith('image/')) {
      return 'Panorama must be a JPG, PNG or WebP image.'
    }

    if (file.size > 30 * 1024 * 1024) {
      return 'Panorama should be under 30 MB.'
    }

    return ''
  }

  const validateMusic = (file) => {
    if (!file) {
      return 'Please select an MP3 file.'
    }

    const valid =
      file.type === 'audio/mpeg' ||
      file.type === 'audio/mp3' ||
      file.name
        .toLowerCase()
        .endsWith('.mp3')

    if (!valid) {
      return 'Music must be an MP3 file.'
    }

    if (file.size > 20 * 1024 * 1024) {
      return 'MP3 should be under 20 MB.'
    }

    return ''
  }

  const addRoom = () => {
    setMessage('')

    setRooms((current) => [
      ...current,
      {
        id: makeSceneId(),
        name: `Room ${current.length + 1}`,
        file: null,
        previewUrl: ''
      }
    ])
  }

  const updateRoomName = (
    id,
    name
  ) => {
    setRooms((current) =>
      current.map((room) =>
        room.id === id
          ? {
              ...room,
              name
            }
          : room
      )
    )
  }

  const handleRoomFile = (
    id,
    event
  ) => {
    const file =
      event.target.files?.[0] ||
      null

    handleRoomFileValue(id, file)
  }

  const handleRoomFileValue = (
    id,
    file
  ) => {
    setMessage('')

    const error =
      validatePanorama(file)

    if (error) {
      showMessage(error, 'error')

      setRooms((current) =>
        current.map((room) => {
          if (room.id !== id) {
            return room
          }

          if (room.previewUrl) {
            URL.revokeObjectURL(
              room.previewUrl
            )
          }

          return {
            ...room,
            file: null,
            previewUrl: ''
          }
        })
      )

      return
    }

    const previewUrl =
      URL.createObjectURL(file)

    setRooms((current) =>
      current.map((room) => {
        if (room.id !== id) {
          return room
        }

        if (room.previewUrl) {
          URL.revokeObjectURL(
            room.previewUrl
          )
        }

        return {
          ...room,
          file,
          previewUrl
        }
      })
    )
  }

  const removeRoom = (id) => {
    setRooms((current) => {
      const room = current.find(
        (item) => item.id === id
      )

      if (room?.previewUrl) {
        URL.revokeObjectURL(
          room.previewUrl
        )
      }

      return current.filter(
        (item) => item.id !== id
      )
    })
  }

  const handleMusicValue = (
    file
  ) => {
    setMessage('')

    if (!file) {
      setMusicFile(null)

      if (musicPreviewUrl) {
        URL.revokeObjectURL(
          musicPreviewUrl
        )
      }

      setMusicPreviewUrl('')
      return
    }

    const error =
      validateMusic(file)

    if (error) {
      showMessage(error, 'error')
      return
    }

    if (musicPreviewUrl) {
      URL.revokeObjectURL(
        musicPreviewUrl
      )
    }

    const previewUrl =
      URL.createObjectURL(file)

    setMusicFile(file)
    setMusicPreviewUrl(
      previewUrl
    )
  }

  const handleMusicChange = (
    event
  ) => {
    const file =
      event.target.files?.[0] ||
      null

    handleMusicValue(file)
  }

  const validRoomCount = useMemo(
    () =>
      rooms.filter(
        (room) => room.file
      ).length,
    [rooms]
  )

  const totalUploadSize = useMemo(
    () =>
      rooms.reduce(
        (total, room) =>
          total +
          (room.file?.size || 0),
        0
      ) +
      (musicFile?.size || 0),
    [rooms, musicFile]
  )

  const resetForm = () => {
    rooms.forEach((room) => {
      if (room.previewUrl) {
        URL.revokeObjectURL(
          room.previewUrl
        )
      }
    })

    if (musicPreviewUrl) {
      URL.revokeObjectURL(
        musicPreviewUrl
      )
    }

    setTitle('')
    setDescription('')
    setMusicFile(null)
    setMusicPreviewUrl('')
    setRooms([])
    setMessage('')

    if (musicInputRef.current) {
      musicInputRef.current.value =
        ''
    }
  }

  const publishTour = async (
    event
  ) => {
    event.preventDefault()
    setMessage('')

    if (!title.trim()) {
      showMessage(
        'Please enter a tour title.',
        'error'
      )
      return
    }

    if (rooms.length === 0) {
      showMessage(
        'Please add at least one room.',
        'error'
      )
      return
    }

    const incompleteRoom =
      rooms.find(
        (room) =>
          !room.name.trim() ||
          !room.file
      )

    if (incompleteRoom) {
      showMessage(
        'Please provide a room name and panorama for every room.',
        'error'
      )
      return
    }

    const musicError =
      validateMusic(musicFile)

    if (musicError) {
      showMessage(
        musicError,
        'error'
      )
      return
    }

    setSaving(true)

    try {
      const id = makeId()

      const sceneData =
        rooms.map(
          (room, index) => ({
            id: room.id,
            name:
              room.name.trim(),
            order: index,
            panoramaName:
              room.file.name,
            panoramaBlob:
              room.file
          })
        )

      await saveTour({
        id,
        title:
          title.trim(),
        description:
          description.trim(),
        createdAt:
          Date.now(),

        panoramaName:
          rooms[0].file.name,
        panoramaBlob:
          rooms[0].file,

        musicName:
          musicFile.name,
        musicBlob:
          musicFile,

        scenes:
          sceneData
      })

      showMessage(
        `Tour published successfully with ${sceneData.length} room${
          sceneData.length > 1
            ? 's'
            : ''
        }.`,
        'success'
      )

      resetForm()

      await loadTours()

      setActiveSection(
        'tours'
      )
    } catch (error) {
      console.error(error)

      showMessage(
        'Could not save the tour. Your browser storage may be full.',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  const openTour = (id) => {
    window.location.href =
      `/virtual-tour/?tour=${encodeURIComponent(
        id
      )}`
  }

  const removeTour = async (
    id
  ) => {
    const confirmed =
      window.confirm(
        'Delete this tour from this browser?'
      )

    if (!confirmed) {
      return
    }

    try {
      await deleteTour(id)
      await loadTours()

      showMessage(
        'Tour deleted successfully.',
        'success'
      )
    } catch (error) {
      console.error(error)

      showMessage(
        'Unable to delete the tour.',
        'error'
      )
    }
  }

  const totalRooms = tours.reduce(
    (total, tour) =>
      total +
      (tour.scenes?.length || 1),
    0
  )

  const totalViews = tours.reduce(
    (total, tour) =>
      total +
      Number(
        tour.viewCount || 0
      ),
    0
  )

  return (
    <div className="admin-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .admin-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 15% 5%,
              rgba(255,255,255,.075),
              transparent 28%
            ),
            radial-gradient(
              circle at 90% 20%,
              rgba(255,255,255,.045),
              transparent 25%
            ),
            #090909;
          color: #fff;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .admin-layout {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 245px minmax(0, 1fr);
        }

        /* SIDEBAR */

        .admin-sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          padding: 25px 16px;
          border-right: 1px solid rgba(255,255,255,.08);
          background: rgba(10,10,10,.82);
          backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
          z-index: 20;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 4px 10px 30px;
        }

        .brand-mark {
          width: 39px;
          height: 39px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: #fff;
          color: #090909;
          box-shadow: 0 10px 30px rgba(255,255,255,.08);
        }

        .brand-text {
          min-width: 0;
        }

        .brand-title {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -.2px;
        }

        .brand-subtitle {
          margin-top: 2px;
          font-size: 10px;
          color: rgba(255,255,255,.42);
          letter-spacing: .7px;
          text-transform: uppercase;
        }

        .sidebar-label {
          padding: 0 10px;
          margin: 0 0 9px;
          color: rgba(255,255,255,.3);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .sidebar-nav {
          display: grid;
          gap: 5px;
        }

        .sidebar-button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 11px;
          border: 1px solid transparent;
          border-radius: 11px;
          padding: 11px 12px;
          background: transparent;
          color: rgba(255,255,255,.55);
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          text-align: left;
          transition:
            background .2s ease,
            color .2s ease,
            border-color .2s ease;
        }

        .sidebar-button:hover {
          background: rgba(255,255,255,.05);
          color: #fff;
        }

        .sidebar-button.active {
          background: rgba(255,255,255,.09);
          border-color: rgba(255,255,255,.09);
          color: #fff;
        }

        .sidebar-button svg {
          flex-shrink: 0;
        }

        .sidebar-bottom {
          margin-top: auto;
        }

        .help-card {
          padding: 15px;
          border-radius: 14px;
          background: rgba(255,255,255,.045);
          border: 1px solid rgba(255,255,255,.07);
        }

        .help-card-icon {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: rgba(255,255,255,.08);
          margin-bottom: 10px;
        }

        .help-card strong {
          display: block;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .help-card span {
          display: block;
          color: rgba(255,255,255,.42);
          font-size: 10px;
          line-height: 1.5;
        }

        /* MAIN */

        .admin-main {
          min-width: 0;
          padding: 30px clamp(20px, 4vw, 48px) 70px;
        }

        .main-inner {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: rgba(255,255,255,.4);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fff;
        }

        .page-title {
          margin: 0;
          font-size: clamp(28px, 4vw, 42px);
          line-height: 1;
          letter-spacing: -1.5px;
        }

        .page-description {
          margin: 9px 0 0;
          color: rgba(255,255,255,.46);
          font-size: 13px;
        }

        .viewer-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.06);
          color: #fff;
          border-radius: 11px;
          padding: 11px 15px;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
        }

        .viewer-button:hover {
          background: rgba(255,255,255,.1);
        }

        /* STATS */

        .stats-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 25px;
        }

        .stat-card {
          position: relative;
          overflow: hidden;
          padding: 17px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 15px;
          background: rgba(255,255,255,.045);
        }

        .stat-card::after {
          content: "";
          position: absolute;
          width: 80px;
          height: 80px;
          right: -25px;
          bottom: -30px;
          border-radius: 50%;
          background: rgba(255,255,255,.035);
        }

        .stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .stat-label {
          color: rgba(255,255,255,.4);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .7px;
          text-transform: uppercase;
        }

        .stat-icon {
          width: 29px;
          height: 29px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: rgba(255,255,255,.07);
          color: rgba(255,255,255,.7);
        }

        .stat-number {
          margin-top: 13px;
          font-size: 25px;
          font-weight: 800;
          letter-spacing: -.8px;
        }

        /* CONTENT */

        .content-card {
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 18px;
          background: rgba(255,255,255,.045);
          box-shadow:
            0 25px 80px rgba(0,0,0,.22);
          backdrop-filter: blur(18px);
          overflow: hidden;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 21px 22px;
          border-bottom: 1px solid rgba(255,255,255,.07);
        }

        .card-title {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -.2px;
        }

        .card-subtitle {
          margin: 4px 0 0;
          color: rgba(255,255,255,.38);
          font-size: 11px;
        }

        .card-body {
          padding: 22px;
        }

        /* FORM */

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .field {
          min-width: 0;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        .field-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          color: rgba(255,255,255,.72);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .4px;
          text-transform: uppercase;
        }

        .field-hint {
          color: rgba(255,255,255,.27);
          font-size: 9px;
          font-weight: 500;
          text-transform: none;
          letter-spacing: 0;
        }

        .text-input,
        .text-area {
          width: 100%;
          border: 1px solid rgba(255,255,255,.1);
          outline: none;
          border-radius: 11px;
          padding: 13px 14px;
          background: rgba(0,0,0,.24);
          color: #fff;
          font: inherit;
          font-size: 13px;
          transition:
            border-color .2s ease,
            background .2s ease;
        }

        .text-input::placeholder,
        .text-area::placeholder {
          color: rgba(255,255,255,.23);
        }

        .text-input:focus,
        .text-area:focus {
          border-color: rgba(255,255,255,.28);
          background: rgba(0,0,0,.34);
        }

        .text-area {
          min-height: 100px;
          resize: vertical;
          line-height: 1.6;
        }

        /* ROOMS */

        .rooms-section {
          margin-top: 28px;
        }

        .rooms-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 13px;
        }

        .rooms-heading {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .section-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: rgba(255,255,255,.07);
        }

        .section-title {
          margin: 0;
          font-size: 14px;
          font-weight: 800;
        }

        .section-meta {
          margin-top: 3px;
          color: rgba(255,255,255,.35);
          font-size: 10px;
        }

        .add-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 9px;
          padding: 9px 12px;
          background: rgba(255,255,255,.07);
          color: #fff;
          cursor: pointer;
          font: inherit;
          font-size: 11px;
          font-weight: 800;
        }

        .add-button:hover {
          background: rgba(255,255,255,.11);
        }

        .empty-state {
          display: grid;
          place-items: center;
          min-height: 185px;
          padding: 30px;
          border: 1px dashed rgba(255,255,255,.12);
          border-radius: 14px;
          text-align: center;
          background: rgba(0,0,0,.13);
        }

        .empty-icon {
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: rgba(255,255,255,.06);
          color: rgba(255,255,255,.65);
          margin-bottom: 12px;
        }

        .empty-title {
          margin: 0 0 5px;
          font-size: 13px;
          font-weight: 800;
        }

        .empty-text {
          max-width: 390px;
          margin: 0;
          color: rgba(255,255,255,.35);
          font-size: 10px;
          line-height: 1.6;
        }

        .rooms-list {
          display: grid;
          gap: 12px;
        }

        .room-card {
          display: grid;
          grid-template-columns: 170px minmax(0,1fr);
          gap: 17px;
          padding: 13px;
          border: 1px solid rgba(255,255,255,.075);
          border-radius: 14px;
          background: rgba(0,0,0,.17);
        }

        .room-preview {
          position: relative;
          overflow: hidden;
          min-height: 125px;
          border-radius: 10px;
          background: #050505;
          border: 1px solid rgba(255,255,255,.07);
        }

        .room-preview img {
          width: 100%;
          height: 100%;
          min-height: 125px;
          display: block;
          object-fit: cover;
        }

        .room-preview-empty {
          min-height: 125px;
          display: grid;
          place-items: center;
          color: rgba(255,255,255,.22);
        }

        .room-preview-badge {
          position: absolute;
          left: 8px;
          bottom: 8px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 7px;
          border-radius: 6px;
          background: rgba(0,0,0,.72);
          backdrop-filter: blur(8px);
          color: rgba(255,255,255,.75);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .5px;
          text-transform: uppercase;
        }

        .room-content {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .room-topline {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 9px;
        }

        .room-number {
          color: rgba(255,255,255,.31);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .remove-button {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,80,80,.12);
          border-radius: 8px;
          background: rgba(255,70,70,.07);
          color: rgba(255,140,140,.75);
          cursor: pointer;
        }

        .remove-button:hover {
          background: rgba(255,70,70,.14);
          color: #ffaaaa;
        }

        .room-name {
          width: 100%;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 9px;
          padding: 10px 11px;
          outline: none;
          background: rgba(0,0,0,.24);
          color: #fff;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
        }

        .room-name:focus {
          border-color: rgba(255,255,255,.25);
        }

        .room-upload {
          margin-top: 9px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border: 1px dashed rgba(255,255,255,.11);
          border-radius: 9px;
          padding: 9px 10px;
          background: rgba(0,0,0,.15);
        }

        .room-file-label {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,.42);
          font-size: 9px;
        }

        .room-file-label svg {
          flex-shrink: 0;
        }

        .room-file-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .choose-button {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 7px;
          padding: 7px 9px;
          background: rgba(255,255,255,.06);
          color: #fff;
          cursor: pointer;
          font-size: 9px;
          font-weight: 800;
        }

        .choose-button:hover {
          background: rgba(255,255,255,.1);
        }

        .room-file-input {
          display: none;
        }

        .room-info {
          margin-top: auto;
          padding-top: 8px;
          display: flex;
          align-items: center;
          gap: 7px;
          color: rgba(255,255,255,.25);
          font-size: 9px;
        }

        .room-ready {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: rgba(210,255,220,.75);
        }

        .room-ready-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(170,255,190,.85);
        }

        /* MUSIC */

        .music-section {
          margin-top: 28px;
        }

        .music-drop {
          position: relative;
          border: 1px dashed rgba(255,255,255,.13);
          border-radius: 14px;
          padding: 17px;
          background: rgba(0,0,0,.15);
          transition:
            border-color .2s ease,
            background .2s ease;
        }

        .music-drop.dragging {
          border-color: rgba(255,255,255,.4);
          background: rgba(255,255,255,.06);
        }

        .music-empty {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .music-icon {
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 12px;
          background: rgba(255,255,255,.07);
        }

        .music-copy {
          min-width: 0;
          flex: 1;
        }

        .music-copy strong {
          display: block;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .music-copy span {
          display: block;
          color: rgba(255,255,255,.33);
          font-size: 9px;
          line-height: 1.5;
        }

        .music-upload-button {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 9px;
          padding: 9px 12px;
          background: #fff;
          color: #090909;
          cursor: pointer;
          font: inherit;
          font-size: 10px;
          font-weight: 800;
        }

        .music-file-input {
          display: none;
        }

        .music-selected {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .music-selected-icon {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 11px;
          background: rgba(255,255,255,.08);
        }

        .music-selected-copy {
          min-width: 0;
          flex: 1;
        }

        .music-selected-copy strong {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
        }

        .music-selected-copy span {
          display: block;
          margin-top: 4px;
          color: rgba(255,255,255,.32);
          font-size: 9px;
        }

        .music-remove {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 8px;
          background: rgba(255,255,255,.04);
          color: rgba(255,255,255,.5);
          cursor: pointer;
        }

        .music-player {
          width: 100%;
          height: 34px;
          margin-top: 12px;
        }

        /* FOOTER ACTIONS */

        .form-footer {
          margin-top: 28px;
          padding-top: 18px;
          border-top: 1px solid rgba(255,255,255,.07);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .upload-summary {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255,255,255,.3);
          font-size: 9px;
        }

        .summary-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .summary-divider {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(255,255,255,.2);
        }

        .form-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border-radius: 10px;
          padding: 11px 15px;
          cursor: pointer;
          font: inherit;
          font-size: 10px;
          font-weight: 800;
          transition:
            transform .15s ease,
            background .2s ease;
        }

        .button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .button:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .button-secondary {
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.05);
          color: #fff;
        }

        .button-primary {
          border: 1px solid #fff;
          background: #fff;
          color: #090909;
          min-width: 145px;
        }

        /* MESSAGE */

        .message {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 15px;
          padding: 11px 13px;
          border-radius: 9px;
          font-size: 10px;
          line-height: 1.5;
        }

        .message.success {
          border: 1px solid rgba(130,255,160,.1);
          background: rgba(100,255,140,.05);
          color: rgba(205,255,215,.8);
        }

        .message.error {
          border: 1px solid rgba(255,100,100,.12);
          background: rgba(255,70,70,.06);
          color: rgba(255,190,190,.85);
        }

        /* SAVED TOURS */

        .saved-section {
          margin-top: 25px;
        }

        .tour-list {
          display: grid;
          gap: 9px;
        }

        .tour-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 12px;
          background: rgba(0,0,0,.15);
        }

        .tour-thumb {
          width: 74px;
          height: 55px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 9px;
          background: rgba(255,255,255,.05);
        }

        .tour-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .tour-thumb-placeholder {
          color: rgba(255,255,255,.22);
        }

        .tour-info {
          min-width: 0;
          flex: 1;
        }

        .tour-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          font-weight: 800;
        }

        .tour-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 5px;
          color: rgba(255,255,255,.3);
          font-size: 9px;
        }

        .meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .tour-actions {
          display: flex;
          gap: 6px;
        }

        .tour-action {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 8px;
          padding: 8px 10px;
          background: rgba(255,255,255,.045);
          color: rgba(255,255,255,.72);
          cursor: pointer;
          font-size: 9px;
          font-weight: 800;
        }

        .tour-action:hover {
          background: rgba(255,255,255,.09);
          color: #fff;
        }

        .tour-action.delete {
          color: rgba(255,150,150,.7);
          border-color: rgba(255,70,70,.09);
        }

        .empty-tours {
          padding: 35px 20px;
          text-align: center;
          color: rgba(255,255,255,.3);
          font-size: 11px;
        }

        /* MOBILE NAV */

        .mobile-nav {
          display: none;
        }

        @media (max-width: 900px) {
          .admin-layout {
            grid-template-columns: 72px minmax(0,1fr);
          }

          .admin-sidebar {
            padding: 18px 10px;
          }

          .brand {
            justify-content: center;
            padding: 4px 0 25px;
          }

          .brand-text,
          .sidebar-label,
          .sidebar-button span,
          .help-card {
            display: none;
          }

          .sidebar-button {
            justify-content: center;
            padding: 12px;
          }

          .stats-grid {
            grid-template-columns:
              repeat(2, minmax(0,1fr));
          }
        }

        @media (max-width: 680px) {
          .admin-layout {
            display: block;
            padding-bottom: 70px;
          }

          .admin-sidebar {
            display: none;
          }

          .admin-main {
            padding: 20px 13px 35px;
          }

          .topbar {
            align-items: flex-start;
            flex-direction: column;
            margin-bottom: 22px;
          }

          .viewer-button {
            width: 100%;
          }

          .stats-grid {
            grid-template-columns:
              repeat(2, minmax(0,1fr));
            gap: 8px;
          }

          .stat-card {
            padding: 13px;
          }

          .stat-number {
            font-size: 21px;
          }

          .content-card {
            border-radius: 15px;
          }

          .card-header,
          .card-body {
            padding: 16px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .field.full {
            grid-column: auto;
          }

          .room-card {
            grid-template-columns: 1fr;
          }

          .room-preview,
          .room-preview img,
          .room-preview-empty {
            min-height: 170px;
          }

          .music-empty {
            align-items: flex-start;
            flex-direction: column;
          }

          .music-upload-button {
            width: 100%;
          }

          .music-selected {
            flex-wrap: wrap;
          }

          .form-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .upload-summary {
            justify-content: center;
          }

          .form-buttons {
            width: 100%;
          }

          .form-buttons .button {
            flex: 1;
          }

          .tour-item {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .tour-info {
            width: calc(100% - 90px);
          }

          .tour-actions {
            width: 100%;
          }

          .tour-action {
            flex: 1;
            justify-content: center;
          }

          .mobile-nav {
            position: fixed;
            left: 10px;
            right: 10px;
            bottom: 10px;
            height: 57px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            padding: 6px;
            border: 1px solid rgba(255,255,255,.1);
            border-radius: 15px;
            background: rgba(12,12,12,.88);
            backdrop-filter: blur(20px);
            box-shadow: 0 15px 50px rgba(0,0,0,.4);
            z-index: 100;
          }

          .mobile-nav button {
            border: 0;
            border-radius: 10px;
            background: transparent;
            color: rgba(255,255,255,.45);
            font: inherit;
            font-size: 9px;
            font-weight: 800;
            cursor: pointer;
          }

          .mobile-nav button.active {
            background: rgba(255,255,255,.09);
            color: #fff;
          }
        }
      `}</style>

      <div className="admin-layout">

        {/* SIDEBAR */}

        <aside className="admin-sidebar">

          <div className="brand">
            <div className="brand-mark">
              <Clapperboard
                size={19}
              />
            </div>

            <div className="brand-text">
              <div className="brand-title">
                Virtual Studio
              </div>

              <div className="brand-subtitle">
                Tour Manager
              </div>
            </div>
          </div>

          <div className="sidebar-label">
            Workspace
          </div>

          <nav className="sidebar-nav">

            <button
              className={`sidebar-button ${
                activeSection ===
                'create'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveSection(
                  'create'
                )
              }
            >
              <LayoutDashboard
                size={17}
              />
              <span>
                Create Tour
              </span>
            </button>

            <button
              className={`sidebar-button ${
                activeSection ===
                'tours'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveSection(
                  'tours'
                )
              }
            >
              <FolderOpen
                size={17}
              />
              <span>
                My Tours
              </span>
            </button>

            <button
              className="sidebar-button"
              onClick={() =>
                setActiveSection(
                  'create'
                )
              }
            >
              <MapPinned
                size={17}
              />
              <span>
                Rooms
              </span>
            </button>

            <button
              className="sidebar-button"
              onClick={() =>
                setActiveSection(
                  'create'
                )
              }
            >
              <Music
                size={17}
              />
              <span>
                Music
              </span>
            </button>

            <button
              className="sidebar-button"
              onClick={() =>
                showMessage(
                  'Settings are not required for the current browser-only version.',
                  'success'
                )
              }
            >
              <Settings
                size={17}
              />
              <span>
                Settings
              </span>
            </button>

          </nav>

          <div className="sidebar-bottom">

            <div className="help-card">
              <div className="help-card-icon">
                <Sparkles
                  size={15}
                />
              </div>

              <strong>
                Immersive tours
              </strong>

              <span>
                Upload 360° panoramas and
                create your interactive
                experience.
              </span>
            </div>

          </div>
        </aside>

        {/* MAIN */}

        <main className="admin-main">

          <div className="main-inner">

            <header className="topbar">

              <div>
                <div className="eyebrow">
                  <span className="eyebrow-dot" />
                  Virtual Tour Studio
                </div>

                <h1 className="page-title">
                  {activeSection ===
                  'tours'
                    ? 'My Tours'
                    : 'Create Experience'}
                </h1>

                <p className="page-description">
                  {activeSection ===
                  'tours'
                    ? 'Manage your saved virtual tour experiences.'
                    : 'Build an immersive 360° experience from your own media.'}
                </p>
              </div>

              <button
                className="viewer-button"
                onClick={() => {
                  window.location.href =
                    '/virtual-tour/'
                }}
              >
                <Eye size={15} />
                Open Viewer
                <ArrowRight
                  size={13}
                />
              </button>

            </header>

            {/* STATS */}

            <section className="stats-grid">

              <div className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">
                    Tours
                  </span>

                  <div className="stat-icon">
                    <Clapperboard
                      size={14}
                    />
                  </div>
                </div>

                <div className="stat-number">
                  {tours.length}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">
                    Rooms
                  </span>

                  <div className="stat-icon">
                    <MapPinned
                      size={14}
                    />
                  </div>
                </div>

                <div className="stat-number">
                  {totalRooms}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">
                    Views
                  </span>

                  <div className="stat-icon">
                    <Eye size={14} />
                  </div>
                </div>

                <div className="stat-number">
                  {totalViews}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">
                    Ready
                  </span>

                  <div className="stat-icon">
                    <Check
                      size={14}
                    />
                  </div>
                </div>

                <div className="stat-number">
                  {validRoomCount}
                </div>
              </div>

            </section>

            {/* CREATE */}

            {activeSection ===
              'create' && (
              <form
                className="content-card"
                onSubmit={
                  publishTour
                }
              >

                <div className="card-header">

                  <div>
                    <h2 className="card-title">
                      New Virtual Tour
                    </h2>

                    <p className="card-subtitle">
                      Add your project details,
                      panoramic rooms and
                      background audio.
                    </p>
                  </div>

                  <Sparkles
                    size={18}
                    color="rgba(255,255,255,.35)"
                  />

                </div>

                <div className="card-body">

                  {/* DETAILS */}

                  <div className="form-grid">

                    <div className="field full">

                      <label className="field-label">
                        Tour title

                        <span className="field-hint">
                          Required
                        </span>
                      </label>

                      <input
                        className="text-input"
                        value={title}
                        onChange={(
                          event
                        ) =>
                          setTitle(
                            event.target
                              .value
                          )
                        }
                        placeholder="Luxury Hotel Virtual Tour"
                      />

                    </div>

                    <div className="field full">

                      <label className="field-label">
                        Description

                        <span className="field-hint">
                          Optional
                        </span>
                      </label>

                      <textarea
                        className="text-area"
                        value={
                          description
                        }
                        onChange={(
                          event
                        ) =>
                          setDescription(
                            event.target
                              .value
                          )
                        }
                        placeholder="Describe the property, showroom, office, hotel or space..."
                      />

                    </div>

                  </div>

                  {/* ROOMS */}

                  <section className="rooms-section">

                    <div className="rooms-toolbar">

                      <div className="rooms-heading">

                        <div className="section-icon">
                          <MapPinned
                            size={16}
                          />
                        </div>

                        <div>
                          <h3 className="section-title">
                            360° Rooms
                          </h3>

                          <div className="section-meta">
                            {validRoomCount}{' '}
                            of{' '}
                            {rooms.length}{' '}
                            ready
                          </div>
                        </div>

                      </div>

                      <button
                        type="button"
                        className="add-button"
                        onClick={
                          addRoom
                        }
                      >
                        <Plus
                          size={13}
                        />
                        Add Room
                      </button>

                    </div>

                    {rooms.length ===
                    0 ? (
                      <div className="empty-state">

                        <div>

                          <div className="empty-icon">
                            <ImagePlus
                              size={21}
                            />
                          </div>

                          <h3 className="empty-title">
                            Start with your
                            first panorama
                          </h3>

                          <p className="empty-text">
                            Add a room and
                            upload a
                            360° equirectangular
                            image. You can
                            add as many rooms
                            as your tour needs.
                          </p>

                        </div>

                      </div>
                    ) : (
                      <div className="rooms-list">

                        {rooms.map(
                          (
                            room,
                            index
                          ) => (
                            <div
                              className="room-card"
                              key={
                                room.id
                              }
                            >

                              <div className="room-preview">

                                {room.previewUrl ? (
                                  <>
                                    <img
                                      src={
                                        room.previewUrl
                                      }
                                      alt={`${room.name} panorama preview`}
                                    />

                                    <div className="room-preview-badge">
                                      <Check
                                        size={9}
                                      />
                                      Preview
                                    </div>
                                  </>
                                ) : (
                                  <div className="room-preview-empty">
                                    <FileImage
                                      size={22}
                                    />
                                  </div>
                                )}

                              </div>

                              <div className="room-content">

                                <div className="room-topline">

                                  <div className="room-number">
                                    ROOM{' '}
                                    {String(
                                      index +
                                        1
                                    ).padStart(
                                      2,
                                      '0'
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    className="remove-button"
                                    title="Remove room"
                                    onClick={() =>
                                      removeRoom(
                                        room.id
                                      )
                                    }
                                  >
                                    <Trash2
                                      size={13}
                                    />
                                  </button>

                                </div>

                                <input
                                  className="room-name"
                                  value={
                                    room.name
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateRoomName(
                                      room.id,
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  placeholder="Enter room name"
                                />

                                <div className="room-upload">

                                  <div className="room-file-label">

                                    <FileImage
                                      size={14}
                                    />

                                    <span className="room-file-name">
                                      {room.file
                                        ? `${room.file.name} · ${formatSize(
                                            room
                                              .file
                                              .size
                                          )}`
                                        : 'No panorama selected'}
                                    </span>

                                  </div>

                                  <label className="choose-button">
                                    <Upload
                                      size={11}
                                    />
                                    {room.file
                                      ? 'Replace'
                                      : 'Choose'}

                                    <input
                                      className="room-file-input"
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp"
                                      onChange={(
                                        event
                                      ) =>
                                        handleRoomFile(
                                          room.id,
                                          event
                                        )
                                      }
                                    />
                                  </label>

                                </div>

                                <div className="room-info">

                                  {room.file ? (
                                    <span className="room-ready">
                                      <span className="room-ready-dot" />
                                      Ready
                                    </span>
                                  ) : (
                                    <span>
                                      JPG / PNG /
                                      WebP · Max
                                      30 MB
                                    </span>
                                  )}

                                  <span>
                                    •
                                  </span>

                                  <span>
                                    Recommended
                                    ratio 2:1
                                  </span>

                                </div>

                              </div>

                            </div>
                          )
                        )}

                      </div>
                    )}

                    {rooms.length >
                      0 && (
                      <button
                        type="button"
                        className="add-button"
                        style={{
                          width: '100%',
                          justifyContent:
                            'center',
                          marginTop: 10
                        }}
                        onClick={
                          addRoom
                        }
                      >
                        <Plus
                          size={13}
                        />
                        Add Another Room
                      </button>
                    )}

                  </section>

                  {/* MUSIC */}

                  <section className="music-section">

                    <div className="rooms-toolbar">

                      <div className="rooms-heading">

                        <div className="section-icon">
                          <Headphones
                            size={16}
                          />
                        </div>

                        <div>
                          <h3 className="section-title">
                            Background Music
                          </h3>

                          <div className="section-meta">
                            One track for the
                            complete experience
                          </div>
                        </div>

                      </div>

                    </div>

                    <div
                      className={`music-drop ${
                        isDraggingMusic
                          ? 'dragging'
                          : ''
                      }`}
                      onDragOver={(
                        event
                      ) => {
                        event.preventDefault()
                        setIsDraggingMusic(
                          true
                        )
                      }}
                      onDragLeave={() =>
                        setIsDraggingMusic(
                          false
                        )
                      }
                      onDrop={(
                        event
                      ) => {
                        event.preventDefault()
                        setIsDraggingMusic(
                          false
                        )

                        const file =
                          event.dataTransfer
                            .files?.[0]

                        handleMusicValue(
                          file
                        )
                      }}
                    >

                      {!musicFile ? (
                        <div className="music-empty">

                          <div className="music-icon">
                            <Music
                              size={19}
                            />
                          </div>

                          <div className="music-copy">
                            <strong>
                              Add background
                              music
                            </strong>

                            <span>
                              Drag & drop an MP3
                              here or choose a
                              file. Maximum
                              size 20 MB.
                            </span>
                          </div>

                          <label className="music-upload-button">
                            <Upload
                              size={12}
                            />
                            Upload MP3

                            <input
                              ref={
                                musicInputRef
                              }
                              className="music-file-input"
                              type="file"
                              accept="audio/mpeg,.mp3"
                              onChange={
                                handleMusicChange
                              }
                            />
                          </label>

                        </div>
                      ) : (
                        <div>

                          <div className="music-selected">

                            <div className="music-selected-icon">
                              <Music
                                size={18}
                              />
                            </div>

                            <div className="music-selected-copy">
                              <strong>
                                {
                                  musicFile.name
                                }
                              </strong>

                              <span>
                                MP3 ·{' '}
                                {formatSize(
                                  musicFile.size
                                )}
                              </span>
                            </div>

                            <button
                              type="button"
                              className="music-remove"
                              onClick={() =>
                                handleMusicValue(
                                  null
                                )
                              }
                            >
                              <X
                                size={14}
                              />
                            </button>

                          </div>

                          {musicPreviewUrl && (
                            <audio
                              className="music-player"
                              src={
                                musicPreviewUrl
                              }
                              controls
                            />
                          )}

                        </div>
                      )}

                    </div>

                  </section>

                  {/* ACTIONS */}

                  <div className="form-footer">

                    <div className="upload-summary">

                      <span className="summary-item">
                        <MapPinned
                          size={11}
                        />
                        {validRoomCount}{' '}
                        rooms
                      </span>

                      <span className="summary-divider" />

                      <span className="summary-item">
                        <Music
                          size={11}
                        />
                        {musicFile
                          ? 'Music added'
                          : 'No music'}
                      </span>

                      <span className="summary-divider" />

                      <span className="summary-item">
                        {formatSize(
                          totalUploadSize
                        )}
                      </span>

                    </div>

                    <div className="form-buttons">

                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={
                          resetForm
                        }
                        disabled={
                          saving
                        }
                      >
                        <RefreshCw
                          size={12}
                        />
                        Reset
                      </button>

                      <button
                        type="submit"
                        className="button button-primary"
                        disabled={
                          saving
                        }
                      >
                        {saving ? (
                          <>
                            <RefreshCw
                              size={12}
                              style={{
                                animation:
                                  'spin 1s linear infinite'
                              }}
                            />
                            Publishing...
                          </>
                        ) : (
                          <>
                            Publish Tour
                            <ChevronRight
                              size={13}
                            />
                          </>
                        )}
                      </button>

                    </div>

                  </div>

                  {message && (
                    <div
                      className={`message ${messageType}`}
                    >
                      {messageType ===
                      'success' ? (
                        <Check
                          size={13}
                        />
                      ) : (
                        <CircleHelp
                          size={13}
                        />
                      )}

                      {message}
                    </div>
                  )}

                </div>

              </form>
            )}

            {/* SAVED TOURS */}

            {activeSection ===
              'tours' && (
              <section className="content-card">

                <div className="card-header">

                  <div>
                    <h2 className="card-title">
                      Saved Tours
                    </h2>

                    <p className="card-subtitle">
                      Tours stored locally in
                      this browser.
                    </p>
                  </div>

                  <button
                    className="add-button"
                    onClick={() =>
                      setActiveSection(
                        'create'
                      )
                    }
                  >
                    <Plus
                      size={13}
                    />
                    New Tour
                  </button>

                </div>

                <div className="card-body">

                  {tours.length ===
                  0 ? (
                    <div className="empty-tours">
                      <FolderOpen
                        size={28}
                        style={{
                          opacity: .35,
                          marginBottom: 10
                        }}
                      />

                      <div>
                        No tours created
                        yet.
                      </div>

                      <button
                        className="add-button"
                        style={{
                          marginTop: 13
                        }}
                        onClick={() =>
                          setActiveSection(
                            'create'
                          )
                        }
                      >
                        <Plus
                          size={12}
                        />
                        Create your first
                        tour
                      </button>
                    </div>
                  ) : (
                    <div className="tour-list">

                      {tours.map(
                        (tour) => {

                          const firstScene =
                            tour
                              .scenes?.[0]

                          const imageUrl =
                            firstScene?.panoramaBlob
                              ? URL.createObjectURL(
                                  firstScene.panoramaBlob
                                )
                              : tour.panoramaBlob
                                ? URL.createObjectURL(
                                    tour.panoramaBlob
                                  )
                                : ''

                          return (
                            <TourListItem
                              key={
                                tour.id
                              }
                              tour={
                                tour
                              }
                              imageUrl={
                                imageUrl
                              }
                              onOpen={
                                openTour
                              }
                              onDelete={
                                removeTour
                              }
                            />
                          )
                        }
                      )}

                    </div>
                  )}

                </div>

              </section>
            )}

          </div>
        </main>

      </div>

      {/* MOBILE NAV */}

      <nav className="mobile-nav">

        <button
          className={
            activeSection ===
            'create'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveSection(
              'create'
            )
          }
        >
          <LayoutDashboard
            size={15}
            style={{
              display:
                'block',
              margin:
                '0 auto 3px'
            }}
          />
          Create
        </button>

        <button
          className={
            activeSection ===
            'tours'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveSection(
              'tours'
            )
          }
        >
          <FolderOpen
            size={15}
            style={{
              display:
                'block',
              margin:
                '0 auto 3px'
            }}
          />
          My Tours
        </button>

      </nav>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

function TourListItem({
  tour,
  imageUrl,
  onOpen,
  onDelete
}) {
  const [imageError, setImageError] =
    useState(false)

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(
          imageUrl
        )
      }
    }
  }, [imageUrl])

  const roomCount =
    tour.scenes?.length || 1

  return (
    <div className="tour-item">

      <div className="tour-thumb">

        {imageUrl &&
        !imageError ? (
          <img
            src={imageUrl}
            alt=""
            onError={() =>
              setImageError(
                true
              )
            }
          />
        ) : (
          <div className="tour-thumb-placeholder">
            <Clapperboard
              size={18}
            />
          </div>
        )}

      </div>

      <div className="tour-info">

        <div className="tour-name">
          {tour.title}
        </div>

        <div className="tour-meta">

          <span className="meta-pill">
            <MapPinned
              size={10}
            />
            {roomCount}{' '}
            {roomCount === 1
              ? 'room'
              : 'rooms'}
          </span>

          <span>•</span>

          <span className="meta-pill">
            <Music
              size={10}
            />
            {tour.musicName
              ? 'Music'
              : 'No music'}
          </span>

          <span>•</span>

          <span>
            {formatDate(
              tour.createdAt
            )}
          </span>

        </div>

      </div>

      <div className="tour-actions">

        <button
          className="tour-action"
          onClick={() =>
            onOpen(
              tour.id
            )
          }
        >
          <Eye
            size={12}
          />
          Open
        </button>

        <button
          className="tour-action delete"
          onClick={() =>
            onDelete(
              tour.id
            )
          }
        >
          <Trash2
            size={12}
          />
          Delete
        </button>

      </div>

    </div>
  )
}