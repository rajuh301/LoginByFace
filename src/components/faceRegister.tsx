'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

export default function FaceRegisterPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
      if (videoRef.current) videoRef.current.srcObject = stream;
    };

    loadModels();
  }, []);

  const handleRegister = async () => {
    setLoading(true);
    setMessage('');

    if (!name || !email) {
      setMessage('Name and email are required.');
      setLoading(false);
      return;
    }

    const detection = await faceapi
      .detectSingleFace(videoRef.current!, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setMessage('Face not detected.');
      setLoading(false);
      return;
    }

    const embedding = Array.from(detection.descriptor); // face vector

    // Send to backend
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, embedding }),
    });

    const data = await res.json();
    setMessage(data.message || data.error);
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-semibold mb-4 text-center">Face Registration</h2>

      <video
        ref={videoRef}
        autoPlay
        muted
        width={480}
        height={360}
        className="mx-auto rounded border shadow"
      />

      <div className="mt-6 space-y-3">
        <input
          type="text"
          placeholder="Name"
          className="w-full p-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Registering...' : 'Register Face'}
        </button>
      </div>

      {message && <p className="mt-4 text-center text-sm text-gray-700">{message}</p>}
    </div>
  );
}


