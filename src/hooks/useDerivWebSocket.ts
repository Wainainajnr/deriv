
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import type { DerivMessage } from '@/types/deriv';

const DERIV_WEBSOCKET_URL = "wss://ws.derivws.com/websockets/v3?app_id=16929";

export const useDerivWebSocket = () => {
    const ws = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<DerivMessage | null>(null);
    const { token, isLoggedIn } = useAuth();
    const { toast } = useToast();
    const messageCallbacks = useRef<Map<string, (msg: DerivMessage) => void>>(new Map());
    const messageQueue = useRef<object[]>([]);

    const connect = useCallback(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            return;
        }

        ws.current = new WebSocket(DERIV_WEBSOCKET_URL);

        ws.current.onopen = () => {
            console.log("WebSocket connected");
            setIsConnected(true);
            
            // Authorize if logged in
            if (token && isLoggedIn) {
                ws.current?.send(JSON.stringify({ authorize: token }));
            }
            
            // Send any queued messages
            while(messageQueue.current.length > 0) {
                const message = messageQueue.current.shift();
                if (message) {
                    ws.current?.send(JSON.stringify(message));
                }
            }
        };

        ws.current.onmessage = (event) => {
            const message: DerivMessage = JSON.parse(event.data);
            setLastMessage(message);

            if ('error' in message && message.error) {
                console.error("WebSocket Error:", message.error);
                toast({
                    variant: "destructive",
                    title: "Deriv API Error",
                    description: (message.error as any).message || "An unknown error occurred.",
                });
            }

            // General callbacks for message types
            const callback = messageCallbacks.current.get(message.msg_type);
            if (callback) {
                callback(message);
            }
        };

        ws.current.onclose = () => {
            console.log("WebSocket disconnected");
            setIsConnected(false);
            // Auto-reconnect logic
            setTimeout(() => {
                console.log("Reconnecting WebSocket...");
                connect();
            }, 5000);
        };

        ws.current.onerror = (event) => {
            console.error("WebSocket error:", event);
            toast({
                variant: 'destructive',
                title: 'Connection Error',
                description: 'Unable to connect to Deriv services. Retrying...'
            });
            ws.current?.close();
        };

    }, [token, toast, isLoggedIn]);

    useEffect(() => {
        connect();
        
        const interval = setInterval(() => {
            if (ws.current?.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ ping: 1 }));
            }
        }, 30000);

        return () => {
            clearInterval(interval);
            if (ws.current?.readyState === WebSocket.OPEN) {
                ws.current?.close();
            }
        };
    }, [connect]);


    const sendMessage = useCallback((message: object) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        } else {
            console.log("WebSocket is not connected. Message queued.");
            messageQueue.current.push(message);
        }
    }, []);

    const subscribe = useCallback((type: string, callback: (msg: DerivMessage) => void) => {
        messageCallbacks.current.set(type, callback);
    }, []);

    return { isConnected, lastMessage, sendMessage, subscribe };
};
