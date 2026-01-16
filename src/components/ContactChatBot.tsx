"use client";

import { useEffect, useRef } from "react";
import "@n8n/chat/style.css";
import { createChat } from "@n8n/chat";

export const ContactChatBot = ({ contactId, userId, userName, userEmail }: { contactId: string; userId: string; userName: string; userEmail: string }) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chatContainerRef.current) return;

        // CRITICAL: Set the sessionId in localStorage BEFORE initializing the chat
        // This ensures the chat library uses our contactId instead of generating a new one
        const sessionStorageKey = `n8n-chat-sessionId`;
        localStorage.setItem(sessionStorageKey, contactId);

        console.log('🔧 Setting sessionId in localStorage:', contactId);

        // Store the original fetch function
        const originalFetch = window.fetch;

        // Intercept fetch requests to modify sessionId in the payload
        window.fetch = async (...args) => {
            const [url, options] = args;

            // Check if this is a request to our n8n webhook
            if (typeof url === 'string' && url.includes('n8n.metizsoft.in/webhook')) {
                console.log('🌐 Intercepting n8n webhook request');

                try {
                    // Parse the request body if it exists
                    if (options?.body) {
                        const bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
                        let bodyData = JSON.parse(bodyStr);

                        // Handle both array and object formats
                        if (Array.isArray(bodyData)) {
                            bodyData = bodyData.map((item: any) => ({
                                ...item,
                                sessionId: contactId
                            }));
                        } else if (typeof bodyData === 'object' && bodyData !== null) {
                            bodyData.sessionId = contactId;
                        }

                        console.log('✅ Modified request body with contactId:', contactId);
                        console.log('📦 Request payload:', bodyData);

                        // Update the request with modified body
                        const modifiedOptions = {
                            ...options,
                            body: JSON.stringify(bodyData)
                        };

                        return originalFetch(url, modifiedOptions);
                    }
                } catch (e) {
                    console.error('❌ Error intercepting fetch:', e);
                }
            }

            // For all other requests or if modification fails, use original fetch
            return originalFetch(...args);
        };

        const chat = createChat({
            target: chatContainerRef.current,
            webhookUrl: `https://n8n.metizsoft.in/webhook/07d68884-6852-41e2-898c-7b6b1873eb21/chat`,
            mode: 'window',
            enableStreaming: true,
            chatSessionKey: 'sessionId',
            loadPreviousSession: false, // Disable to prevent session conflicts
            i18n: {
                en: {
                    title: 'MetizIQ Assistant',
                    subtitle: 'How can I help you with this contact?',
                    getStarted: 'Start Chat',
                    inputPlaceholder: 'Type your message...',
                    footer: '',
                    closeButtonTooltip: 'Close Chat',
                },
            },
            metadata: {
                userId,
                userName,
                userEmail,
                contactId
            }
        });

        // Add custom styles matching MetizIQ theme (Orange/Blue) with !important to ensure override
        const style = document.createElement('style');
        style.innerHTML = `
            :root {
                --chat--font-family: 'Poppins', sans-serif !important;
                --chat--color-primary: #f97316 !important; /* Orange-500 */
                --chat--color-primary-shade-50: #ea580c !important; /* Orange-600 */
                --chat--color-primary-shade-100: #c2410c !important; /* Orange-700 */
                --chat--color-secondary: #2563eb !important; /* Blue-600 */
                --chat--color-secondary-shade-50: #1d4ed8 !important; /* Blue-700 */
                --chat--color-dark: #0f172a !important; /* Slate-900 */
                --chat--color-light: #f8fafc !important; /* Slate-50 */
                --chat--toggle-background: #f97316 !important; /* Orange-500 */
                --chat--toggle-hover-background: #ea580c !important; /* Orange-600 */
                --chat--message--font-size: 14px !important;
                --chat--header--padding: 16px !important;
            }
            .n8n-chat-widget {
                font-family: 'Poppins', sans-serif !important;
            }
        `;
        document.head.appendChild(style);

        // MutationObserver to clean up "UserMessage: ... contactID: ..." text artifacts from history
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    // Check text content of element nodes
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as HTMLElement;
                        // Recursive walk to find text nodes might be expensive, simpler to check innerText or specific classes if known.
                        // Since structure is unknown, we'll try a walker on specific updates.
                        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
                        let textNode;
                        while (textNode = walker.nextNode()) {
                            const text = textNode.nodeValue;
                            if (text && text.includes('UserMessage:') && text.includes('contactID:')) {
                                // Regex to match "UserMessage: <content> contactID: <id>"
                                // Case insensitive just in case, greedy matching for content.
                                const cleanText = text.replace(/UserMessage:\s*(.*?)\s*contactID:[a-zA-Z0-9-]+/i, '$1');
                                if (cleanText !== text) {
                                    textNode.nodeValue = cleanText.trim();
                                }
                            }
                        }
                    }
                });

                // Also check characterData changes for existing nodes
                if (mutation.type === 'characterData') {
                    const textNode = mutation.target as CharacterData;
                    const text = textNode.nodeValue;
                    if (text && text.includes('UserMessage:') && text.includes('contactID:')) {
                        const cleanText = text.replace(/UserMessage:\s*(.*?)\s*contactID:[a-zA-Z0-9-]+/i, '$1');
                        if (cleanText !== text) {
                            textNode.nodeValue = cleanText.trim();
                        }
                    }
                }
            });
        });

        if (chatContainerRef.current) {
            observer.observe(chatContainerRef.current, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }

        // Cleanup function
        return () => {
            // Restore original fetch
            window.fetch = originalFetch;

            if (chat) {
                chat.unmount();
            }
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
            observer.disconnect();
        };
    }, [contactId, userId, userName, userEmail]);

    return <div ref={chatContainerRef} className="n8n-chat-container" />;
};

export default ContactChatBot;
