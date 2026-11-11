import Peer, { DataConnection } from 'peerjs';
import { CardDefinition, DuelState, GameAction } from '../types/game';

const PEER_PREFIX = 'yugioh-h5-vn-room-';

export type PeerPacket =
  | {
      type: 'GUEST_HELLO';
      guestName: string;
      guestAvatar: string;
      mainDeck: string[];
      extraDeck: string[];
      customCards: CardDefinition[];
    }
  | {
      type: 'HOST_WELCOME';
      hostName: string;
      customCards: CardDefinition[];
      initialState: DuelState;
    }
  | {
      type: 'STATE_SYNC';
      state: DuelState;
    }
  | {
      type: 'CLIENT_ACTION';
      action: GameAction;
    }
  | {
      type: 'REMATCH_REQUEST';
    };

export class PeerRoomManager {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  public roomCode = '';
  public role: 'host' | 'guest' = 'host';

  public onConnected?: () => void;
  public onPacket?: (packet: PeerPacket) => void;
  public onDisconnected?: (reason: string) => void;
  public onError?: (errMessage: string) => void;

  /**
   * Tạo phòng mới với Mã Phòng 4 chữ số
   */
  public hostRoom(customCode?: string): Promise<string> {
    this.cleanup();
    this.role = 'host';
    const code = customCode || String(Math.floor(1000 + Math.random() * 9000));
    this.roomCode = code;

    return new Promise((resolve, reject) => {
      const peerId = `${PEER_PREFIX}${code}`;
      const peer = new Peer(peerId);
      this.peer = peer;

      peer.on('open', () => {
        resolve(code);
      });

      peer.on('connection', (connection) => {
        this.conn = connection;
        this.setupConnectionListeners(connection);
      });

      peer.on('error', (err) => {
        const msg = err.message || 'Lỗi kết nối P2P';
        this.onError?.(msg);
        reject(new Error(msg));
      });
    });
  }

  /**
   * Tham gia phòng của bạn bè bằng Mã Phòng 4 chữ số
   */
  public joinRoom(code: string): Promise<void> {
    this.cleanup();
    this.role = 'guest';
    this.roomCode = code.trim();

    return new Promise((resolve, reject) => {
      const peer = new Peer();
      this.peer = peer;

      peer.on('open', () => {
        const targetPeerId = `${PEER_PREFIX}${this.roomCode}`;
        const connection = peer.connect(targetPeerId, { reliable: true });
        this.conn = connection;

        connection.on('open', () => {
          this.setupConnectionListeners(connection);
          resolve();
        });

        connection.on('error', (err) => {
          const msg = err.message || 'Không thể kết nối vào phòng';
          this.onError?.(msg);
          reject(new Error(msg));
        });
      });

      peer.on('error', (err) => {
        const msg =
          err.type === 'peer-unavailable'
            ? `Không tìm thấy Mã Phòng "${this.roomCode}". Hãy kiểm tra lại mã phòng của bạn bè!`
            : err.message || 'Lỗi kết nối mạng P2P';
        this.onError?.(msg);
        reject(new Error(msg));
      });
    });
  }

  private setupConnectionListeners(connection: DataConnection): void {
    if (this.role === 'host') {
      connection.on('open', () => {
        this.onConnected?.();
      });
    } else {
      this.onConnected?.();
    }

    connection.on('data', (raw) => {
      this.onPacket?.(raw as PeerPacket);
    });

    connection.on('close', () => {
      this.onDisconnected?.('Đối phương đã ngắt kết nối khỏi phòng.');
    });

    connection.on('error', (err) => {
      this.onError?.(err.message || 'Lỗi truyền dữ liệu P2P.');
    });
  }

  public send(packet: PeerPacket): void {
    if (this.conn && this.conn.open) {
      this.conn.send(packet);
    }
  }

  public cleanup(): void {
    try {
      this.conn?.close();
      this.peer?.destroy();
    } catch {
      // ignore
    }
    this.conn = null;
    this.peer = null;
  }
}
