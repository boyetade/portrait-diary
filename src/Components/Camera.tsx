import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDiaryEntry } from "../lib/diaryStorage";

type CameraPhase = "preview" | "countdown" | "captured";

const COUNTDOWN_SECONDS = 3;

export default function Camera() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const hasCapturedRef = useRef(false);

  const [phase, setPhase] = useState<CameraPhase>("preview");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const attachStream = useCallback(async (stream: MediaStream) => {
    streamRef.current = stream;

    const video = videoRef.current;
    if (video) {
      video.srcObject = stream;
      await video.play();
    }
  }, []);

  // const startCamera = useCallback(async () => {
  //   setIsStarting(true);
  //   setError(null);

  //   try {
  //     stopStream();

  //     const stream = await navigator.mediaDevices.getUserMedia({
  //       video: { facingMode: "user" },
  //       audio: false,
  //     });

  //     await attachStream(stream);
  //   } catch {
  //     setError("Camera access was denied or is unavailable.");
  //   } finally {
  //     setIsStarting(false);
  //   }
  // }, [attachStream, stopStream]);

  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then(async (stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        await attachStream(stream);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Camera access was denied or is unavailable.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsStarting(false);
        }
      });

    return () => {
      cancelled = true;
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
      }
      stopStream();
    };
  }, [attachStream, stopStream]);

  const capturePhoto = useCallback(() => {
    if (hasCapturedRef.current) return;
    hasCapturedRef.current = true;

    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    addDiaryEntry(dataUrl);
    setPhotoUrl(dataUrl);
    setPhase("captured");
    stopStream();
  }, [stopStream]);

  const clearCountdownTimer = () => {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  const handleTakePhoto = () => {
    if (phase !== "preview" || error || isStarting) return;

    hasCapturedRef.current = false;
    setPhase("countdown");
    setCountdown(COUNTDOWN_SECONDS);
    clearCountdownTimer();

    let remaining = COUNTDOWN_SECONDS;

    countdownTimerRef.current = window.setInterval(() => {
      remaining -= 1;

      if (remaining <= 0) {
        clearCountdownTimer();
        capturePhoto();
        setCountdown(COUNTDOWN_SECONDS);
        return;
      }

      setCountdown(remaining);
    }, 1000);
  };

  // const handleRetake = async () => {
  //   clearCountdownTimer();
  //   setCountdown(COUNTDOWN_SECONDS);
  //   setPhotoUrl((previous) => {
  //     if (previous) URL.revokeObjectURL(previous);
  //     return null;
  //   });
  //   setPhase("preview");
  //   await startCamera();
  // };

  const handleSeeEarlierEntries = () => {
    navigate("/diary");
  };

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-6">
      <div className="relative aspect-3/4 overflow-hidden bg-gray-90">
        {phase === "captured" && photoUrl ? (
          <img
            src={photoUrl}
            alt="Captured"
            className="h-full w-full object-cover scale-x-[-1]"
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

            {phase === "countdown" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="animate-pulse text-6xl font-bold text-white tabular-nums">
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

      <div className="flex flex-col gap-3">
        {phase === "captured" ? (
          <>
            {/* <button
              type="button"
              onClick={() => void handleRetake()}
              className="flex-1 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Retake
            </button> */}
            {photoUrl && (
              <a
                href={photoUrl}
                download="photo.jpg"
                className="flex-1 px-4 py-3 text-center text-sm font-semibold text-gray-900 "
              >
                Download
              </a>
            )}
            <button
              type="button"
              onClick={handleSeeEarlierEntries}
              className="flex-1 px-4 py-3 text-center text-sm font-semibold text-gray-900 "
            >
              See your earlier entries
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleTakePhoto}
            disabled={Boolean(error) || isStarting || phase === "countdown"}
            className="flex-1 px-4 py-3 text-sm font-semibold text-black transition hover:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {phase === "countdown" ? "Get ready…" : "Take photo"}
          </button>
        )}
      </div>
    </div>
  );
}
