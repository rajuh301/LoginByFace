'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

type User = {
  name: string;
  email: string;
};

export default function FaceLogin() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const loginAttemptedRef = useRef(false);
  const successAudioRef = useRef<HTMLAudioElement>(null);
  const failureAudioRef = useRef<HTMLAudioElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load models on mount
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    };

    loadModels();
  }, []);

  // Start webcam when models are ready
  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera error:', err);
      }
    };

    if (modelsLoaded) {
      startVideo();
    }
  }, [modelsLoaded]);

  // Face detection + login
  useEffect(() => {
    if (!modelsLoaded || !videoRef.current) return;

    const interval = setInterval(async () => {
      if (loginAttemptedRef.current || !videoRef.current) return;

      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        loginAttemptedRef.current = true;
        clearInterval(interval);
        setIsLoading(true);

        try {
          const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embedding: Array.from(detection.descriptor) }),
          });

          const data = await res.json();
          setResult(data.message || data.error);

          const audioToPlay = data.user ? successAudioRef.current : failureAudioRef.current;

          if (data.user) setUser(data.user);

          await audioToPlay?.play();
          audioToPlay?.addEventListener('ended', () => {
            window.location.reload();
          });
        } catch (err) {
          console.error('Login error:', err);
          setResult('Error submitting data');
          loginAttemptedRef.current = false;
        } finally {
          setIsLoading(false);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [modelsLoaded]);

  return (
    <div className="flex flex-col items-center gap-3">
      <video
        ref={videoRef}
        autoPlay
        muted
        width="480"
        height="360"
        className="rounded shadow-md"
      />

      <audio ref={successAudioRef} src="/audio/success.mp3" />
      <audio ref={failureAudioRef} src="/audio/failure.mp3" />

      {isLoading && <p className="text-sm text-blue-600">Checking face...</p>}
      {result && <p className="text-sm text-gray-700">{result}</p>}

      {user && (
        <div className="text-center">
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      )}
    </div>
  );
}
