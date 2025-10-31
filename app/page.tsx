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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 dark:bg-indigo-900 rounded-full mb-4">
              <svg
                className="w-10 h-10 text-indigo-600 dark:text-indigo-400"
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
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Voice Agent Demo
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Powered by VAPI
            </p>
          </div>

          {/* Status Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </span>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isCallActive
                      ? "bg-green-500 animate-pulse"
                      : isConnecting
                      ? "bg-yellow-500 animate-pulse"
                      : "bg-gray-400"
                  }`}
                />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {callStatus}
                </span>
              </div>
            </div>

            {/* Speaking Indicator */}
            {isSpeaking && (
              <div className="flex items-center space-x-2 text-sm text-indigo-600 dark:text-indigo-400">
                <div className="flex space-x-1">
                  <div className="w-1 h-4 bg-indigo-600 dark:bg-indigo-400 rounded animate-pulse" />
                  <div
                    className="w-1 h-4 bg-indigo-600 dark:bg-indigo-400 rounded animate-pulse"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-1 h-4 bg-indigo-600 dark:bg-indigo-400 rounded animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                <span>Agent is speaking...</span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Controls */}
          <div className="space-y-4">
            {!isCallActive ? (
              <button
                onClick={startCall}
                disabled={isConnecting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  "Start Call"
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={toggleMute}
                  className={`w-full py-4 ${
                    isMuted
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : "bg-gray-600 hover:bg-gray-700"
                  } text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg`}
                >
                  {isMuted ? "Unmute" : "Mute"}
                </button>

                <button
                  onClick={endCall}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  End Call
                </button>
              </>
            )}
          </div>

          {/* Info */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Click &quot;Start Call&quot; to begin your conversation with the AI assistant
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
