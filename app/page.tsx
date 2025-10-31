"use client";

import { useState, useEffect, useRef } from "react";
import Vapi from "@vapi-ai/web";

export default function Home() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState<string>("Disconnected");
  const [error, setError] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);

  // Initialize VAPI client
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

    if (!publicKey) {
      setError("VAPI public key not configured");
      return;
    }

    try {
      vapiRef.current = new Vapi(publicKey);
      setupEventListeners();
    } catch (err) {
      setError("Failed to initialize VAPI client");
      console.error(err);
    }

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, []);

  const setupEventListeners = () => {
    if (!vapiRef.current) return;

    vapiRef.current.on("call-start", () => {
      setIsCallActive(true);
      setCallStatus("Connected");
      setIsConnecting(false);
      setError("");
    });

    vapiRef.current.on("call-end", () => {
      setIsCallActive(false);
      setCallStatus("Disconnected");
      setIsSpeaking(false);
      setIsMuted(false);
      setIsConnecting(false);
    });

    vapiRef.current.on("speech-start", () => {
      setIsSpeaking(true);
    });

    vapiRef.current.on("speech-end", () => {
      setIsSpeaking(false);
    });

    vapiRef.current.on("error", (error) => {
      console.error("VAPI Error:", error);
      setError(error.message || "An error occurred");
      setIsConnecting(false);
      setIsCallActive(false);
      setCallStatus("Error");
    });

    vapiRef.current.on("message", (message) => {
      console.log("Message:", message);
    });
  };

  const startCall = async () => {
    if (!vapiRef.current) {
      setError("VAPI client not initialized");
      return;
    }

    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (!assistantId) {
      setError("Assistant ID not configured");
      return;
    }

    try {
      setIsConnecting(true);
      setCallStatus("Connecting...");
      setError("");
      await vapiRef.current.start(assistantId);
    } catch (err: any) {
      setError(err.message || "Failed to start call");
      setIsConnecting(false);
      setCallStatus("Disconnected");
      console.error(err);
    }
  };

  const endCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
      setCallStatus("Disconnected");
    }
  };

  const toggleMute = () => {
    if (vapiRef.current) {
      const newMutedState = !isMuted;
      vapiRef.current.setMuted(newMutedState);
      setIsMuted(newMutedState);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-8 left-0 right-0 text-center z-10">
        <h1 className="text-4xl font-semibold text-gray-800 tracking-tight" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
          Say Hello to Courtney!
        </h1>
        <p className="text-sm text-gray-500 mt-2">Powered by VAPI</p>
      </div>

      {/* Error Message - Floating */}
      {error && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-20 animate-fade-in">
          <div className="bg-red-50 border border-red-200 rounded-full px-6 py-3 shadow-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Main Circle Button */}
      <div className="relative flex items-center justify-center">
        {/* Animated circular waves when active */}
        {isCallActive && (
          <>
            <div className="absolute w-72 h-72 rounded-full border-2 border-green-400 opacity-60 animate-wave-1" />
            <div className="absolute w-80 h-80 rounded-full border-2 border-green-400 opacity-40 animate-wave-2" />
            <div className="absolute w-88 h-88 rounded-full border-2 border-green-400 opacity-20 animate-wave-3" />
          </>
        )}

        {/* Intense ripple effect when speaking */}
        {isSpeaking && (
          <>
            <div className="absolute w-96 h-96 rounded-full bg-green-400 opacity-10 animate-ping" />
            <div className="absolute w-80 h-80 rounded-full bg-green-500 opacity-20 animate-pulse" />
          </>
        )}

        {/* Main Circle */}
        <button
          onClick={!isCallActive ? startCall : undefined}
          disabled={isConnecting}
          className={`relative w-64 h-64 rounded-full transition-all duration-500 transform hover:scale-105 active:scale-95 flex items-center justify-center ${
            isCallActive
              ? "bg-white border-4 border-green-500 shadow-green-glow cursor-default"
              : isConnecting
              ? "bg-white border-4 border-green-400 shadow-green-glow-soft animate-pulse cursor-wait"
              : "bg-white border-4 border-green-500 hover:border-green-600 shadow-xl hover:shadow-green-glow-soft"
          }`}
        >
          {/* Microphone Icon */}
          <svg
            className={`w-24 h-24 transition-all duration-300 ${
              isCallActive || isConnecting
                ? "text-green-500"
                : "text-green-600"
            } ${isSpeaking ? "scale-110" : "scale-100"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>

          {/* Status text inside circle */}
          <div className={`absolute bottom-12 text-sm font-light tracking-wider ${
            isCallActive || isConnecting ? "text-green-600" : "text-green-700"
          }`}>
            {isConnecting ? "Connecting..." : isCallActive ? "Listening" : "Start"}
          </div>
        </button>

        {/* Speaking indicator dots */}
        {isSpeaking && (
          <div className="absolute bottom-8 flex space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />
            <div
              className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            />
            <div
              className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-48 mt-16">
        <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full shadow-md">
          <div
            className={`w-2 h-2 rounded-full ${
              isCallActive
                ? "bg-green-500 animate-pulse"
                : isConnecting
                ? "bg-yellow-400 animate-pulse"
                : "bg-gray-400"
            }`}
          />
          <span className="text-xs font-medium text-gray-700">{callStatus}</span>
        </div>
      </div>

      {/* Floating Control Buttons - Only visible when call is active */}
      {isCallActive && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-4 animate-fade-in">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg flex items-center justify-center ${
              isMuted
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-gray-700 hover:bg-gray-800"
            }`}
          >
            {isMuted ? (
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </button>

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg flex items-center justify-center"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Instruction text - Only when not in call */}
      {!isCallActive && !isConnecting && (
        <div className="absolute bottom-16 text-center text-gray-400 text-sm animate-fade-in">
          <p>Click the circle to start your conversation</p>
        </div>
      )}
    </main>
  );
}
