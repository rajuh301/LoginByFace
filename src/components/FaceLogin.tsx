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
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            ]);
        };

        const startVideo = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        };

        const startFaceDetection = async () => {
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

                    const descriptor = Array.from(detection.descriptor);

                    try {
                        const res = await fetch('/api/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ embedding: descriptor }),
                        });

                        const data = await res.json();
                        setResult(data.message || data.error);

                        if (data.user) {
                            setUser(data.user); // 👈 Set the user data
                        }
                    } catch {
                        
                        setResult('Error submitting data');
                        loginAttemptedRef.current = false;
                    } finally {
                        setIsLoading(false);
                    }
                }
            }, 1000);
        };

        loadModels().then(() => {
            startVideo().then(startFaceDetection);
        });
    }, []);

    return (
        <div className="flex flex-col items-center">
            <video ref={videoRef} autoPlay muted width="480" height="360" className="rounded shadow-md" />
            {isLoading && <p className="mt-2 text-sm text-blue-600">Checking face...</p>}
            {result && <p className="mt-2 text-sm text-gray-700">{result}</p>}
            {user && (
                <div className="mt-2 text-center">
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                </div>
            )}
        </div>
    );
}
