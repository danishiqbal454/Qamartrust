
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DocumentIcon, PhotoVideoIcon, ExcelFileIcon, WordFileIcon, PdfFileIcon, CheckIcon, DoubleCheckIcon, AttachmentIcon, MicrophoneIcon, EmojiIcon } from '../components/Icons';
// FIX: The Admin type is defined in `../types`, not `./AdminsPage`.
import type { Admin, Message } from '../types';

type Employee = {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
};

// --- Sound Effects ---
// Base64 encoded audio for minimal, dependency-free sound notifications.
const sentSound = new Audio('data:audio/mpeg;base64,SUQzBAAAAAAAI... (base64 audio data)'); // A short swoosh sound
const receivedSound = new Audio('data:audio/mpeg;base64,SUQzBAAAAAAAI... (base64 audio data)'); // A soft pop sound

// Utility to play sounds, handling potential browser restrictions.
const playSound = (sound: HTMLAudioElement) => {
    sound.currentTime = 0; // Rewind to start in case it's played again quickly
    sound.play().catch(error => {
        console.error("Audio playback failed:", error);
    });
};


// --- Helper Functions ---

const formatDateSeparator = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatRecordingTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getFileTypeDescription = (mimeType: string): string => {
    if (mimeType.includes('excel') || mimeType.includes('spreadsheetml')) return 'Microsoft Excel Worksheet';
    if (mimeType.includes('word') || mimeType.includes('wordprocessingml')) return 'Microsoft Word Document';
    if (mimeType.includes('pdf')) return 'PDF Document';
    return 'Document';
};

// --- Child Components ---

const MessageStatus: React.FC<{ status?: 'sent' | 'delivered' | 'read' }> = ({ status }) => {
    if (!status) return null;
    switch (status) {
        case 'sent': return <CheckIcon className="w-4 h-4 text-gray-400" />;
        case 'delivered': return <DoubleCheckIcon className="w-4 h-4 text-gray-400" />;
        case 'read': return <DoubleCheckIcon className="w-4 h-4 text-blue-400" />;
        default: return null;
    }
};

const AttachmentBubble: React.FC<{ attachment: Message['attachment'] }> = ({ attachment }) => {
    if (!attachment) return null;

    const getFileIcon = (fileType: string) => {
        if (fileType.includes('excel') || fileType.includes('spreadsheetml')) return <ExcelFileIcon className="w-10 h-10 text-green-600 dark:text-green-500" />;
        if (fileType.includes('word') || fileType.includes('wordprocessingml')) return <WordFileIcon className="w-10 h-10 text-blue-600 dark:text-blue-500" />;
        if (fileType.includes('pdf')) return <PdfFileIcon className="w-10 h-10 text-red-600 dark:text-red-500" />;
        return <DocumentIcon className="w-10 h-10 text-gray-500 dark:text-gray-400" />;
    };

    const handleSaveAs = (e: React.MouseEvent) => {
        e.preventDefault();
        const link = document.createElement('a');
        link.href = attachment.url;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800/50 m-1.5">
            <div className="flex items-center gap-3">
                {getFileIcon(attachment.fileType)}
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{attachment.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(attachment.size)}, {getFileTypeDescription(attachment.fileType)}
                    </p>
                </div>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-sm py-1.5 px-3 rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-gray-200 dark:hover:bg-gray-700/60 font-medium">Open</a>
                <button onClick={handleSaveAs} className="flex-1 text-center text-sm py-1.5 px-3 rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-gray-200 dark:hover:bg-gray-700/60 font-medium">Save as...</button>
            </div>
        </div>
    );
};

const AudioBubble: React.FC<{ attachment: Message['attachment'] }> = ({ attachment }) => {
    if (!attachment) return null;
    return (
        <div className="p-2 w-64">
            <audio src={attachment.url} controls className="w-full h-10" />
        </div>
    );
};


interface EmployeeChatPageProps {
    admins: Admin[];
    currentUser: Admin;
    conversations: Record<string, Message[]>;
    setConversations: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
}

const EmployeeChatPage: React.FC<EmployeeChatPageProps> = ({ admins, currentUser, conversations, setConversations }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimerRef = useRef<number | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    const employees = useMemo((): Employee[] => {
        return admins
            .filter(admin => admin.email !== currentUser.email)
            .map((admin) => ({
                id: admin.email,
                name: admin.username,
                avatar: `https://ui-avatars.com/api/?name=${admin.username.replace(/\s/g, '+')}&background=random`,
                isOnline: admin.status === 'Active',
            }));
    }, [admins, currentUser.email]);

    const filteredEmployees = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return employees;
        return employees.filter(emp => emp.name.toLowerCase().includes(term));
    }, [searchTerm, employees]);
    
    useEffect(() => {
        if (!selectedEmployeeId && filteredEmployees.length > 0) {
            setSelectedEmployeeId(filteredEmployees[0].id);
        } else if (selectedEmployeeId && !filteredEmployees.some(emp => emp.id === selectedEmployeeId)) {
            setSelectedEmployeeId(filteredEmployees.length > 0 ? filteredEmployees[0].id : null);
        } else if (filteredEmployees.length === 0) {
            setSelectedEmployeeId(null);
        }
    }, [filteredEmployees, selectedEmployeeId]);


    const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
    
    const conversationKey = selectedEmployeeId ? [currentUser.email, selectedEmployeeId].sort().join('::') : null;
    const activeConversation = conversationKey ? conversations[conversationKey] || [] : [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView();
    }, [selectedEmployeeId]);

    useEffect(scrollToBottom, [activeConversation]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        return () => {
            if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
            streamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, [attachmentPreview]);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            const otherEmployees = employees.filter(emp => emp.id !== selectedEmployeeId);
            if (otherEmployees.length > 0 && selectedEmployeeId !== otherEmployees[0].id) {
                const randomEmployee = otherEmployees[0];
                const key = [currentUser.email, randomEmployee.id].sort().join('::');
                const incomingMessage: Message = {
                    id: Date.now(),
                    text: 'Can we discuss the monthly report?',
                    timestamp: Date.now(),
                    senderId: randomEmployee.id,
                    status: 'delivered',
                };
                setConversations(prev => ({ ...prev, [key]: [...(prev[key] || []), incomingMessage] }));
                setUnreadCounts(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
                playSound(receivedSound);
            }
        }, 8000);
        return () => clearTimeout(timer);
    }, [employees, selectedEmployeeId, currentUser.email, setConversations]);

    const updateMessageStatus = (key: string, messageId: number, status: Message['status']) => {
        setConversations(prev => {
            const conv = prev[key] || [];
            const newConv = conv.map(msg => msg.id === messageId ? { ...msg, status } : msg);
            return { ...prev, [key]: newConv };
        });
    };
    
    const markReceivedMessagesAsRead = (key: string) => {
        setConversations(prev => {
            const conv = prev[key] || [];
            let changed = false;
            const newConv = conv.map(msg => {
                if (msg.senderId !== currentUser.email && msg.status !== 'read') {
                    changed = true;
                    return { ...msg, status: 'read' as const };
                }
                return msg;
            });
            return changed ? { ...prev, [key]: newConv } : prev;
        });
    };
    
    useEffect(() => {
        if (conversationKey) {
            markReceivedMessagesAsRead(conversationKey);
        }
    }, [selectedEmployeeId, activeConversation.length, conversationKey]);

    const handleRemoveAttachment = () => {
        setAttachment(null);
        setAttachmentPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setAttachment(file);
            if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
            setAttachmentPreview(URL.createObjectURL(file));
        }
    };

    const handleTyping = () => {
        if (!isTyping) setIsTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = window.setTimeout(() => {
            setIsTyping(false);
        }, 1500);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        handleTyping();
    };

    const handleEmojiSelect = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !selectedEmployeeId || !conversationKey) return;
        
        if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
            typingTimerRef.current = null;
        }

        let newAttachment;
        if (attachment) {
            const type = attachment.type.startsWith('image') || attachment.type.startsWith('video') ? 'image' : 'document';
            const messageAttachmentUrl = URL.createObjectURL(attachment);
            newAttachment = { type, name: attachment.name, url: messageAttachmentUrl, size: attachment.size, fileType: attachment.type };
        }

        const messageId = Date.now();
        const userMessage: Message = {
            id: messageId,
            text: newMessage,
            timestamp: Date.now(),
            senderId: currentUser.email,
            attachment: newAttachment,
            status: 'sent',
        };

        setConversations(prev => ({ ...prev, [conversationKey]: [...(prev[conversationKey] || []), userMessage] }));
        setNewMessage('');
        handleRemoveAttachment();
        setShowEmojiPicker(false);
        
        setTimeout(() => updateMessageStatus(conversationKey, messageId, 'delivered'), 1000);
        setTimeout(() => updateMessageStatus(conversationKey, messageId, 'read'), 2500);
        
        setIsTyping(true);
        setTimeout(() => {
            const replyMessage: Message = {
                id: Date.now() + 1,
                text: userMessage.text ? `Thanks for your message about "${userMessage.text.substring(0, 20)}...". I'll look into it.` : `Got your attachment. I'll take a look.`,
                timestamp: Date.now(),
                senderId: selectedEmployeeId,
                status: 'delivered'
            };
            setConversations(prev => ({ ...prev, [conversationKey]: [...(prev[conversationKey] || []), replyMessage] }));
            playSound(receivedSound);
            setIsTyping(false);
        }, 3500 + Math.random() * 1000);
    };

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            recorder.onstop = () => {
                streamRef.current?.getTracks().forEach(track => track.stop());
                streamRef.current = null;

                if (audioChunksRef.current.length === 0) return;

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });

                const messageAttachment = {
                    type: 'audio' as const,
                    name: audioFile.name,
                    url: audioUrl,
                    size: audioFile.size,
                    fileType: audioFile.type,
                };

                const messageId = Date.now();
                const voiceMessage: Message = {
                    id: messageId,
                    text: '',
                    timestamp: Date.now(),
                    senderId: currentUser.email,
                    attachment: messageAttachment,
                    status: 'sent',
                };

                if (conversationKey) {
                    setConversations(prev => ({ ...prev, [conversationKey]: [...(prev[conversationKey] || []), voiceMessage] }));
                    playSound(sentSound);
                    setTimeout(() => updateMessageStatus(conversationKey, messageId, 'delivered'), 1000);
                    setTimeout(() => updateMessageStatus(conversationKey, messageId, 'read'), 2500);
                }
                audioChunksRef.current = [];
            };

            recorder.start();
            setIsRecording(true);
            setRecordingSeconds(0);
            recordingIntervalRef.current = window.setInterval(() => {
                setRecordingSeconds(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please check permissions.");
        }
    };
    
    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
        }
        setIsRecording(false);
    };
    
    const handleCancelRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            audioChunksRef.current = [];
            mediaRecorderRef.current.stop();
        }
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
        }
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setIsRecording(false);
    };

    const renderMessages = () => {
        if (!selectedEmployeeId) return null;
        let lastDate: string | null = null;

        return activeConversation.map(msg => {
            const currentDate = formatDateSeparator(msg.timestamp);
            let dateSeparator = null;
            if (currentDate !== lastDate) {
                dateSeparator = (
                    <div key={`date-${currentDate}`} className="relative text-center my-4">
                        <hr className="absolute top-1/2 left-0 w-full border-t border-gray-300 dark:border-gray-600" />
                        <span className="relative bg-gray-100 dark:bg-gray-800/80 px-2 text-xs text-gray-500 dark:text-gray-400 backdrop-blur-sm">{currentDate}</span>
                    </div>
                );
                lastDate = currentDate;
            }
            
            const isSent = msg.senderId === currentUser.email;

            return (
                <React.Fragment key={msg.id}>
                    {dateSeparator}
                    <div className={`flex items-end gap-2 ${isSent ? 'justify-end' : 'justify-start'}`}>
                        <div className={`relative flex flex-col max-w-xs md:max-w-md lg:max-w-lg rounded-lg shadow-sm ${isSent ? 'bg-green-100 dark:bg-green-800/60 rounded-br-none' : 'bg-white dark:bg-gray-700 rounded-bl-none'}`}>
                           
                            {msg.attachment?.type === 'image' && (
                                <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer">
                                    <img src={msg.attachment.url} alt={msg.attachment.name} className="rounded-t-lg max-w-full h-auto cursor-pointer block" />
                                </a>
                            )}
                            
                            {msg.attachment?.type === 'document' && <AttachmentBubble attachment={msg.attachment} />}
                            {msg.attachment?.type === 'audio' && <AudioBubble attachment={msg.attachment} />}

                            {msg.text && (
                                <div className="px-3 py-2">
                                    <p className={`text-sm whitespace-pre-wrap break-words ${isSent ? 'text-gray-800 dark:text-gray-200' : 'text-gray-800 dark:text-gray-200'}`}>{msg.text}</p>
                                </div>
                            )}

                             <div className="flex items-center justify-end self-end px-2 pb-1">
                                <p className={`text-xs ${isSent ? 'text-green-800/70 dark:text-green-300/70' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {isSent && <div className="ml-1.5"><MessageStatus status={msg.status} /></div>}
                            </div>
                        </div>
                    </div>
                </React.Fragment>
            );
        });
    };
    
    const EmojiPicker: React.FC<{ onSelect: (emoji: string) => void }> = ({ onSelect }) => {
        const emojis = ['😀', '😂', '😍', '🤔', '👍', '❤️', '🙏', '🎉', '🔥', '👋', '😊', '😢', '😎', '😜', '😇', '🥳', '🤯', '💯', '🚀', '💻', '💡', '💰', '✅', '❌'];
        return (
            <div className="absolute bottom-full mb-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg p-2 grid grid-cols-6 gap-1 w-64 border border-gray-200 dark:border-gray-600 z-10">
                {emojis.map(emoji => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={() => onSelect(emoji)}
                        className="text-2xl rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 p-1 transition-colors duration-150"
                        aria-label={`Emoji ${emoji}`}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="flex h-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {/* Employee List Panel */}
            <aside className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <ul className="flex-1 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredEmployees.length > 0 ? (
                        filteredEmployees.map(emp => {
                            const convKey = [currentUser.email, emp.id].sort().join('::');
                            const conversation = conversations[convKey] || [];
                            const lastMessage = conversation[conversation.length - 1];
                            const unreadCount = unreadCounts[convKey] || 0;
                            return (
                                <li key={emp.id} onClick={() => {
                                        setSelectedEmployeeId(emp.id);
                                        if (unreadCount > 0) {
                                            setUnreadCounts(prev => {
                                                const newCounts = { ...prev };
                                                delete newCounts[convKey];
                                                return newCounts;
                                            });
                                        }
                                    }}
                                    className={`flex items-center p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ${selectedEmployeeId === emp.id ? 'bg-indigo-50 dark:bg-gray-900' : ''}`}>
                                    <div className="relative shrink-0">
                                        <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full" />
                                        {emp.isOnline && <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white dark:ring-gray-800"></span>}
                                    </div>
                                    <div className="ml-3 flex-1 overflow-hidden">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{emp.name}</p>
                                            {lastMessage && <p className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                                        </div>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lastMessage?.text || 'No messages yet'}</p>
                                            {unreadCount > 0 && (
                                                <span className="ml-2 bg-indigo-600 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })
                    ) : (
                        <li className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No employees found.</li>
                    )}
                </ul>
            </aside>

            {/* Chat Window Panel */}
            <main className="w-2/3 flex flex-col">
                {selectedEmployee ? (
                    <>
                        <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 shrink-0">
                            <img src={selectedEmployee.avatar} alt={selectedEmployee.name} className="w-10 h-10 rounded-full" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedEmployee.name}</p>
                                <p className={`text-xs transition-colors duration-300 ${isTyping ? 'text-indigo-600 dark:text-indigo-400' : (selectedEmployee.isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400')}`}>
                                    {isTyping ? 'typing...' : (selectedEmployee.isOnline ? 'Online' : 'Offline')}
                                </p>
                            </div>
                        </header>
                        
                        <div className="flex-1 p-6 overflow-y-auto whatsapp-bg bg-gray-100 dark:bg-gray-800">
                            <div className="space-y-4">
                                {activeConversation.length > 0 ? renderMessages() : (
                                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-10">No messages yet. Start the conversation!</div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        <footer className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
                            {isRecording ? (
                                <div className="flex items-center justify-between w-full">
                                    <button type="button" onClick={handleCancelRecording} className="px-4 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/50">
                                        Cancel
                                    </button>
                                    <div className="flex items-center gap-2 text-red-500 font-mono">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </span>
                                        {formatRecordingTime(recordingSeconds)}
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={handleStopRecording} 
                                        className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none"
                                        aria-label="Stop recording and send"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <>
                                {attachment && attachmentPreview && (
                                    <div className="relative p-2 mb-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900/50">
                                        <div className="flex items-center space-x-2">
                                            {attachment.type.startsWith('image/') ? (
                                                <img src={attachmentPreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                                            ) : (
                                                <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded">
                                                <DocumentIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs">{attachment.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(attachment.size)}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleRemoveAttachment}
                                            className="absolute top-1 right-1 p-0.5 rounded-full bg-gray-500 text-white hover:bg-gray-600 focus:outline-none"
                                            aria-label="Remove attachment"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                                <form onSubmit={handleSendMessage} className="flex items-center space-x-1">
                                    <div className="relative" ref={emojiPickerRef}>
                                        <button type="button" onClick={() => setShowEmojiPicker(prev => !prev)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400" aria-label="Add emoji">
                                            <EmojiIcon className="h-6 w-6" />
                                        </button>
                                        {showEmojiPicker && <EmojiPicker onSelect={handleEmojiSelect} />}
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400" aria-label="Attach file">
                                        <AttachmentIcon className="h-6 w-6" />
                                    </button>
                                    
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={handleInputChange}
                                        placeholder="Type a message..."
                                        className="flex-1 ml-2 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {newMessage.trim() || attachment ? (
                                        <button type="submit" className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none" aria-label="Send message">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button type="button" onClick={handleStartRecording} className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400" aria-label="Record voice message">
                                            <MicrophoneIcon className="h-6 w-6" />
                                        </button>
                                    )}
                                </form>
                                </>
                            )}
                        </footer>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center p-8">
                        <svg className="w-16 h-16 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-800 dark:text-gray-200">Welcome to Employee Chat</h3>
                        <p className="mt-1 text-sm">Select an employee from the list to start a conversation.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default EmployeeChatPage;
