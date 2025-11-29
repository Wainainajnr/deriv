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

    const connect = useCallback(() => {
        if (!isLoggedIn || (ws.current && ws.current.readyState === WebSocket.OPEN)) {
            return;
        }

        ws.current = new WebSocket(DERIV_WEBSOCKET_URL);

        ws.current.onopen = () => {
            console.log("WebSocket connected");
            setIsConnected(true);
            if (token) {
                ws.current?.send(JSON.stringify({ authorize: token }));
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
            // Optional: implement auto-reconnect logic
            setTimeout(() => {
                if (isLoggedIn) {
                    console.log("Reconnecting WebSocket...");
                    connect();
                }
            }, 5000);
        };

        ws.current.onerror = (error) => {
            console.error("WebSocket error:", error);
            toast({
                variant: 'destructive',
                title: 'Connection Error',
                description: 'Unable to connect to Deriv services. Please check your internet connection and try again.'
            });
            ws.current?.close();
        };

    }, [token, toast, isLoggedIn]);

    useEffect(() => {
        if(isLoggedIn) {
            connect();
        }
        
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
    }, [connect, isLoggedIn]);


    const sendMessage = useCallback((message: object) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        } else {
            console.error("WebSocket is not connected.");
        }
    }, []);

    const subscribe = useCallback((type: string, callback: (msg: DerivMessage) => void) => {
        messageCallbacks.current.set(type, callback);
    }, []);

    return { isConnected, lastMessage, sendMessage, subscribe };
};
