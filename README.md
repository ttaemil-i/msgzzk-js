```text
  __  __  _____  _____ _____________  __
 |  \/  |/ ____|/ ____|___  /___  / |/ /
 | \  / | (___ | |  __   / /   / /| ' / 
 | |\/| |\___ \| | |_ | / /   / / |  <  
 | |  | |____) | |__| |/ /__ / /__| . \ 
 |_|  |_|_____/ \_____/_____/_____|_|\_\
                                        
```

# 메세직(MSGZZK)

네이버 치지직(CHZZK) 방송의 실시간 채팅을 수신하기 위한 **비공식** NPM 패키지입니다.  
채팅 송신이나 인증 등 고급 기능이 필요하다면, 공식 네이버 치지직 API 사용을 권장드립니다.

**주의!** NODE.JS 런타임 위에서만 동작합니다. 웹은 지원하지 않고, 지원할 예정도 없습니다.

<br> 

This is an **unofficial** NPM package for receiving real-time chat from Naver's CHZZK broadcast.  
For advanced features like chat transmission or authentication, we recommend using the official Naver CHZZK API.

**Warning!** This only works on the Node.JS runtime. Web support is not supported, and will not be supported in the future.

## 특징(FEATURES)

- 실시간 채팅 수신(WSS)
- 일반 채팅, 도네이션, 구독, 알림 등 이벤트 스트림 지원
- CommonJS / ESM / Typescript 지원
- 최소 의존성(axios, ws)

<br>  

- Real-time chat reception (WSS)
- Support for event streams, including general chat, donations, subscriptions, and notifications
- Support for CommonJS, ESM, and Typescript
- Minimal dependencies (axios, ws)

## 지원 환경(ENVIRONMENT SUPPORT)

Node.js(v18) 이상

<br> 

Node.js (v18) or higher

## 설치(INSTALLATION)

```bash
npm i msgzzk
```

## 빠른 시작(QUICK START)

### CJS
```javascript
const { MsgzzkClient } = require('msgzzk');

// https://chzzk.naver.com/live/${CHANNEL_ID}
// USE CHANNEL ID FROM CHZZK CHANNEL URL
const LIVE_CHANNEL_ID = `${CHANNEL_ID}`;
const client = new MsgzzkClient(LIVE_CHANNEL_ID);

client
  .log((message) => {
    console.log('[LOG]', message);
  })
  .onConnect(() => {
    console.log('Connected successfully.');
  })
  .onError((err) => {
    console.error('[ERROR]', err.message);
  })
  .chat((msg) => {
    console.log(`[CHAT] ${msg.nickname}: ${msg.content}`);
  })
  .donation((msg) => {
    const amount = msg.extras?.payAmount || 'N/A';
    console.log(`[DONATION] ${msg.nickname} (${amount}원): ${msg.content}`);
  })
  .subscribe((msg) => {
    const extras = msg.extras;
    console.log(`[SUBSCRIBE] ${msg.nickname} (${extras.tierName || 'unknown'}) 구독`);
  });

client.connect();
// client.disconnect();

```

### ESM
```javascript
import { MsgzzkClient } from 'msgzzk';

// https://chzzk.naver.com/live/${CHANNEL_ID}
// USE CHANNEL ID FROM CHZZK CHANNEL URL
const LIVE_CHANNEL_ID = `${CHANNEL_ID}`;
const client = new MsgzzkClient(LIVE_CHANNEL_ID);

client
  .log((message) => {
    console.log('[LOG]', message);
  })
  .onConnect(() => {
    console.log('Connected successfully.');
  })
  .onError((err) => {
    console.error('[ERROR]', err.message);
  })
  .chat((msg) => {
    console.log(`[CHAT] ${msg.nickname}: ${msg.content}`);
  })
  .donation((msg) => {
    const amount = msg.extras?.payAmount || 'N/A';
    console.log(`[DONATION] ${msg.nickname} (${amount}원): ${msg.content}`);
  })
  .subscribe((msg) => {
    const extras = msg.extras;
    console.log(`[SUBSCRIBE] ${msg.nickname} (${extras.tierName || 'unknown'}) 구독`);
  });

client.connect();
// client.disconnect();

```

### TYPESCRIPT
```typescript
import { MsgzzkClient } from 'msgzzk';
import type { ChatMessage, SubscriptionExtras } from 'msgzzk';

// https://chzzk.naver.com/live/${CHANNEL_ID}
// USE CHANNEL ID FROM CHZZK CHANNEL URL
const LIVE_CHANNEL_ID = `${CHANNEL_ID}`;
const client = new MsgzzkClient(LIVE_CHANNEL_ID);

client
  .log((message: string) => {
    console.log('[LOG]', message);
  })
  .onConnect(() => {
    console.log('Connected successfully.');
  })
  .onError((err: Error) => {
    console.error('[ERROR]', err.message);
  })
  .chat((msg: ChatMessage) => {
    console.log(`[CHAT] ${msg.nickname}: ${msg.content}`);
  })
  .donation((msg: ChatMessage) => {
    const amount = msg.extras?.payAmount || 'N/A';
    console.log(`[DONATION] ${msg.nickname} (${amount}원): ${msg.content}`);
  })
  .subscribe((msg: ChatMessage) => {
    const extras = msg.extras as SubscriptionExtras;
    console.log(`[SUBSCRIBE] ${msg.nickname} (${extras.tierName || 'unknown'}) 구독`);
  });

client.connect();
// client.disconnect();

```

## 설정(CONFIGURATION)
msgzzk 은 기본 설정(config.default.ts)을 내장하고 있으며, 동일한 구조의 JSON 파일(msgzzk.config.json)을 프로젝트 루트에 두면 자동으로 불러옵니다.  

지정 경로의 설정 파일이 없을 경우 기본값이 사용됩니다.

<br> 

Msgzzk has a built-in default configuration (config.default.ts). A JSON file with the same structure (msgzzk.config.json) placed in the project root will automatically load it.

If the configuration file at the specified path doesn’t exist, default values are used.

### 기본 설정(DEFAULT CONFIGURATION)
```json
{
  "api": {
    "liveDetailUrl": "https://api.chzzk.naver.com/service/v3.2/channels/{channelId}/live-detail",
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
      "Origin": "https://chzzk.naver.com",
      "front-client-platform-type": "PC",
      "front-client-product-type": "web",
      "cache-control": "no-cache",
      "pragma": "no-cache"
    }
  },
  "websocket": {
    "commands": {
      "auth": 100,
      "authResponse": 10100,
      "serverPing": 10000,
      "pong": 10001,
      "realtimeChat": 93101,
      "donation": 93102,
      "historyResponse": 15101,
      "subscribeTypeCode": 11
    },
    "heartbeatIntervalMs": 20000,
    "simplePingCmd": 10000
  },
  "defaults": {
    "devType": 2001,
    "auth": "READ"
  }
}
```

### 설정 사용 예시(USAGE)
```typescript
// AUTO LOAD
const client = new MsgzzkClient(CHANNEL_ID);

// USER SPECIFIC PATH
const client = new MsgzzkClient(CHANNEL_ID, './custom/msgzzk.config.json');
```

## 의존성(DEPENDENCIES)

이 패키지는 다음 오픈소스 라이브러리를 사용합니다.

<br> 

This package uses the following open source libraries:

- [axios](https://www.npmjs.com/package/axios) (MIT License)
- [ws](https://www.npmjs.com/package/ws) (MIT License)