import axios from 'axios'
import { EventEmitter } from 'events'
import WebSocket from 'ws'
import type { ChatMessage, MsgzzkClientEvents } from './types.js'
import * as fs from 'fs'
import * as path from 'path'
import DEFAULT_CONFIG from './config.default.js'

type Config = typeof DEFAULT_CONFIG

const deepMerge = (target: any, source: any) => {
    for (const key in source) {
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (typeof target[key] !== 'object' || target[key] === null) target[key] = {}
            deepMerge(target[key], source[key])
        } else target[key] = source[key]
    }
    return target
}

export declare interface MsgzzkClient {
    on<U extends keyof MsgzzkClientEvents>(event: U, listener: MsgzzkClientEvents[U]): this
    emit<U extends keyof MsgzzkClientEvents>(event: U, ...args: Parameters<MsgzzkClientEvents[U]>): boolean
    chat(listener: MsgzzkClientEvents['chat']): this
    donation(listener: MsgzzkClientEvents['donation']): this
    log(listener: MsgzzkClientEvents['log']): this
    onError(listener: MsgzzkClientEvents['error']): this
    onConnect(listener: MsgzzkClientEvents['connect']): this
    subscribe(listener: MsgzzkClientEvents['subscribe']): this
}

export class MsgzzkClient extends EventEmitter {
    private channelId: string
    private ws?: WebSocket
    private cid: string = ''
    private sid: string = ''
    private tid: number = 1
    private heartbeatTimer?: NodeJS.Timeout
    private config: Config
    private readonly servers = [
        "kr-ss1.chat.naver.com",
        "kr-ss2.chat.naver.com",
        "kr-ss3.chat.naver.com",
        "kr-ss4.chat.naver.com",
        "kr-ss5.chat.naver.com"
    ]

    constructor(channelId: string, configPath?: string) {
        super()
        this.channelId = channelId
        this.config = this.loadConfig(configPath)
    }

    public chat(listener: MsgzzkClientEvents['chat']): this { return this.on('chat', listener) }
    public donation(listener: MsgzzkClientEvents['donation']): this { return this.on('donation', listener) }
    public log(listener: MsgzzkClientEvents['log']): this { return this.on('log', listener) }
    public onError(listener: MsgzzkClientEvents['error']): this { return this.on('error', listener) }
    public onConnect(listener: MsgzzkClientEvents['connect']): this { return this.on('connect', listener) }
    public subscribe(listener: MsgzzkClientEvents['subscribe']): this { return this.on('subscribe', listener) }

    private loadConfig(configPath?: string): Config {
        const baseConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG))
        let userConfig: any = {}
        const targetPath = configPath || path.resolve(process.cwd(), 'msgzzk.config.json')
        if (fs.existsSync(targetPath)) {
            try {
                userConfig = JSON.parse(fs.readFileSync(targetPath, 'utf-8'))
                this.emit('log', `loaded user configuration from: ${targetPath}`)
            } catch (e) {
                this.emit('log', `error parsing user config: ${e}. using default settings.`)
            }
        } else if (configPath) {
            this.emit('log', `configuration file not found at: ${configPath}. using default settings.`)
        }
        return deepMerge(baseConfig, userConfig) as Config
    }

    private createBaseBody(cmd: number, extraBody: any = {}) {
        return {
            ver: "3", cmd: cmd, svcid: "game", cid: this.cid,
            tid: String(this.tid++), bdy: extraBody
        }
    }

    private startHeartbeat() {
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
        const interval = this.config.websocket.heartbeatIntervalMs
        const clientPingCmd = this.config.websocket.simplePingCmd
        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const payload = { cmd: clientPingCmd, ver: "3" }
                this.ws.send(JSON.stringify(payload))
                this.emit('log', 'client sent heartbeat (cmd 10000).')
            }
        }, interval)
    }

    private stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer)
            this.heartbeatTimer = undefined
        }
    }

    public async connect(): Promise<void> {
        this.emit('log', 'connecting...')
        try {
            const { chatChannelId, accessToken } = await this.getChatInfo()
            this.cid = chatChannelId
            const shuffled = [...this.servers].sort(() => Math.random() - 0.5)
            let connected = false
            for (const server of shuffled) {
                const wsUrl = `wss://${server}/chat`
                this.emit('log', `trying server: ${wsUrl}`)
                try {
                    await this.connectToServer(wsUrl, accessToken)
                    connected = true
                    break
                } catch (err) {
                    this.emit('log', `failed to connect ${server}: ${(err as Error).message}`)
                }
            }
            if (!connected) throw new Error('all websocket connection attempts failed')
        } catch (error) {
            this.emit('error', new Error(`connection failed: ${error instanceof Error ? error.message : 'unknown error'}`))
        }
    }

    private async connectToServer(wsUrl: string, accessToken: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(wsUrl, { headers: this.config.api.headers })
            const timeout = setTimeout(() => {
                this.ws?.close()
                reject(new Error('connection timeout'))
            }, 5000)
            this.ws.on('open', () => {
                clearTimeout(timeout)
                this.emit('log', `connected to ${wsUrl}`)
                this.sendAuth(accessToken)
                resolve()
            })
            this.ws.on('message', (data) => this.handleMessage(data.toString()))
            this.ws.on('error', (err) => this.emit('error', err))
            this.ws.on('close', () => {
                this.stopHeartbeat()
                this.emit('disconnect')
            })
        })
    }

    private async getChatInfo(): Promise<{ chatChannelId: string, accessToken: string }> {
        const urlTemplate = this.config.api.liveDetailUrl
        const apiUrl = urlTemplate.replace('{channelId}', this.channelId)
        const headers = {
            ...this.config.api.headers,
            'Referer': `https://chzzk.naver.com/live/${this.channelId}`,
        }
        const response = await axios.get(apiUrl, { headers })
        const content = response.data.content
        if (!content || !content.chatChannelId) {
            throw new Error("chat information not found in api response. (is the channel currently live?)")
        }
        const accessToken = content.chatActive ? content.chatSessionId : ''
        this.emit('log', `cid acquired: ${content.chatChannelId}`)
        return { chatChannelId: content.chatChannelId, accessToken }
    }

    private sendAuth(accTkn: string) {
        if (!this.ws) return
        const cmd = this.config.websocket.commands.auth
        const defaults = this.config.defaults
        const authPayload = this.createBaseBody(cmd, {
            uid: null,
            devType: defaults.devType,
            accTkn: accTkn,
            auth: defaults.auth,
            devName: "NodeJS",
            libVer: "1.0.0",
            osVer: "Node",
            locale: "ko-KR",
            timezone: "Asia/Seoul"
        })
        this.ws.send(JSON.stringify(authPayload))
    }

    private handleMessage(rawMessage: string) {
        try {
            const message = JSON.parse(rawMessage)
            const cmd = message.cmd
            switch (cmd) {
                case this.config.websocket.commands.authResponse:
                    this.sid = message.bdy.sid
                    this.emit('log', `auth success, sid acquired. starting heartbeat.`)
                    this.startHeartbeat()
                    this.emit('connect')
                    break
                case this.config.websocket.commands.serverPing:
                    this.sendPong()
                    break
                case this.config.websocket.commands.realtimeChat:
                    this.handleMessageList(message.bdy, 'realtime')
                    break
                case this.config.websocket.commands.donation:
                    this.handleMessageList(message.bdy, 'donation')
                    break
                case this.config.websocket.commands.historyResponse:
                    this.emit('log', 'received historical messages, ignoring them.')
                    break
                default:
                    this.emit('raw', message)
            }
        } catch (e) {
            this.emit('error', new Error(`message handling error: ${e}`))
        }
    }

    private sendPong() {
        if (!this.ws) return
        const cmd = this.config.websocket.commands.pong
        this.ws.send(JSON.stringify({ ver: "3", cmd }))
        this.emit('log', 'server ping received, pong sent.')
    }

    private handleMessageList(messages: any[] | any, type: 'history' | 'realtime' | 'donation') {
        if (type === 'history') return
        const list = Array.isArray(messages) ? messages : messages.messageList || messages
        if (!Array.isArray(list)) return
        list.forEach((rawMsg: any) => {
            let profile: any = {}
            let extras: any = {}
            try { profile = rawMsg.profile ? JSON.parse(rawMsg.profile) : {} } catch { }
            try { extras = rawMsg.extras ? JSON.parse(rawMsg.extras) : {} } catch { }
            let finalMessageType: ChatMessage['type'] = 'chat'
            const msgTypeCode = rawMsg.messageTypeCode
            const SUBSCRIBE_CODE = this.config.websocket.commands.subscribeTypeCode
            if (msgTypeCode === SUBSCRIBE_CODE) finalMessageType = 'subscribe'
            else if (type === 'donation' || (msgTypeCode && msgTypeCode !== 1)) finalMessageType = 'donation'
            else finalMessageType = 'chat'
            const chatMessage: ChatMessage = {
                type: finalMessageType,
                content: rawMsg.content || rawMsg.msg || '',
                nickname: profile.nickname || 'Unknown',
                userIdHash: rawMsg.userId || rawMsg.uid || '',
                timestamp: rawMsg.messageTime || rawMsg.ctime,
                profile, extras, raw: rawMsg
            }
            this.emit(finalMessageType, chatMessage)
        })
    }

    public disconnect() {
        this.stopHeartbeat()
        if (this.ws) {
            this.ws.close()
            this.emit('log', 'client manually disconnected.')
        }
    }
}
