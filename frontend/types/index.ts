export interface User {
    _id: string;
    name: string;
    email?: string;
    isGroup?: boolean;
    participants?: any[];
}

export interface Message {
    id: string;
    senderId: string;
    receiverId?: string;
    groupId?: string;
    text: string;
    createdAt?: string;
    timestamp?: string; // Legacy
    clientMsgId?: string;
    status?: 'sent' | 'delivered' | 'read';
}
