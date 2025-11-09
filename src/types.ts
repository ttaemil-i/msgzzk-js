export interface ChatExtras {
    chatType: 'STREAMING';
    osType: string;
    extraToken?: string;
    streamingChannelId: string;
    emojis: any;
    [key: string]: any;
}

export interface DonationExtras {
    payAmount: number;
    payType: string;
    isAnonymous: boolean;
    donationId: string;
    nickname: string;
    chatType: 'STREAMING';
    osType: string;
    weeklyRankList: any[];
    donationUserWeeklyRank: any;
    [key: string]: any;
}

export interface SubscriptionExtras {
    month: number;
    tierName: string;
    tierNo: number;
    nickname: string;
    [key: string]: any;
}

export interface UserProfile {
    userIdHash: string;
    nickname: string;
    profileImageUrl: string;
    userRoleCode: string;
    verifiedMark: boolean;
    [key: string]: any;
}

export interface ChatMessage {
    type: 'chat' | 'donation' | 'subscribe' | 'system';
    content: string;
    nickname: string;
    userIdHash: string;
    timestamp: number;
    profile: UserProfile;
    extras: ChatExtras | DonationExtras | SubscriptionExtras | any;
    raw: any;
}

export interface MsgzzkClientEvents {
    'connect': () => void;
    'disconnect': () => void;
    'chat': (msg: ChatMessage) => void;
    'donation': (msg: ChatMessage) => void;
    'subscribe': (msg: ChatMessage) => void;
    'error': (err: Error) => void;
    'log': (message: string) => void;
    'raw': (data: any) => void;
}