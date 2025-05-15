"use client";

import { useEffect } from "react";
import { useSocket } from "@/components/providers/socket-provider";

export default function ChatPage() {
  const { socket, isConnected, initializeSocket } = useSocket();

  useEffect(() => {
    // Initialize socket when chat page is loaded
    initializeSocket();
  }, [initializeSocket]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Chat Service Unavailable</h2>
          <p className="text-gray-600">Please try again later or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Your chat UI components */}
    </div>
  );
} 
