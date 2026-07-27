import { useCallback, useEffect, useRef, useState } from 'react'

type CameraPhase = 'preview' | 'countdown' | 'captured'

const COUNTDOWN_SECONDS = 3

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const countdownTimerRef = useRef<number | null>(null)

  const [phase, setPhase] = useState<CameraPhase>('preview')
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(true)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const attachStream = useCallback(async (stream: MediaStream) => {
    streamRef.current = stream

    const video = videoRef.current
    if (video) {
      video.srcObject = stream
      await video.play()
    }
  }, [])

  const startCamera = useCallback(async () => {
    setIsStarting(true)
    setError(null)

    try {
      stopStream()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })

      await attachStream(stream)
    } catch {
      setError('Camera access was denied or is unavailable.')
    } finally {
      setIsStarting(false)
    }
  }, [attachStream, stopStream])

  useEffect(() => {
    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(async (stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        await attachStream(stream)
      })
      .catch(() => {
        if (!cancelled) {
          setError('Camera access was denied or is unavailable.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsStarting(false)
        }
      })

    return () => {
      cancelled = true
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current)
      }
      stopStream()
    }
  }, [attachStream, stopStream])

  useEffect(() => {
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl)
      }
    }
  }, [photoUrl])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext('2d')
    if (!context) return

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (!blob) return

      setPhotoUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return URL.createObjectURL(blob)
      })
      setPhase('captured')
      stopStream()
    }, 'image/jpeg', 0.92)
  }, [stopStream])

  const clearCountdownTimer = () => {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
  }

  const handleTakePhoto = () => {
    if (phase !== 'preview' || error || isStarting) return

    setPhase('countdown')
    setCountdown(COUNTDOWN_SECONDS)
    clearCountdownTimer()

    countdownTimerRef.current = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          clearCountdownTimer()
          capturePhoto()
          return COUNTDOWN_SECONDS
        }
        return current - 1
      })
    }, 1000)
  }

  const handleRetake = async () => {
    clearCountdownTimer()
    setCountdown(COUNTDOWN_SECONDS)
    setPhotoUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return null
    })
    setPhase('preview')
    await startCamera()
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="relative aspect-3/4 overflow-hidden rounded-2xl bg-gray-900 shadow-xl ring-1 ring-gray-200">
        {phase === 'captured' && photoUrl ? (
          <img
            src={photoUrl}
            alt="Captured"
            className="h-full w-full object-cover"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full scale-x-[-1] object-cover"
            />

            {phase === 'countdown' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="animate-pulse text-8xl font-bold text-white tabular-nums">
                  {countdown}
                </span>
              </div>
            )}

            {isStarting && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                <p className="text-sm text-white">Starting camera…</p>
              </div>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        {phase === 'captured' ? (
          <>
            <button
              type="button"
              onClick={() => void handleRetake()}
              className="flex-1 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Retake
            </button>
            {photoUrl && (
              <a
                href={photoUrl}
                download="photo.jpg"
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Download
              </a>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={handleTakePhoto}
            disabled={Boolean(error) || isStarting || phase === 'countdown'}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {phase === 'countdown' ? 'Get ready…' : 'Take photo'}
          </button>
        )}
      </div>
    </div>
  )
}
