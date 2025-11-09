const DEFAULT_CONFIG = {
    api: {
        liveDetailUrl: "https://api.chzzk.naver.com/service/v3.2/channels/{channelId}/live-detail",
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
            'Origin': 'https://chzzk.naver.com',
            'front-client-platform-type': 'PC',
            'front-client-product-type': 'web',
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
        }
    },
    websocket: {
        url: 'wss://kr-ss4.chat.naver.com/chat',
        commands: {
            auth: 100,
            authResponse: 10100,
            serverPing: 10000,
            pong: 10001,
            realtimeChat: 93101,
            donation: 93102,
            historyResponse: 15101,
            subscribeTypeCode: 11,
        },
        heartbeatIntervalMs: 20000,
        simplePingCmd: 10000
    },
    defaults: {
        devType: 2001,
        auth: "READ"
    }
};

export default DEFAULT_CONFIG;
