/**
 * Watermark Service
 * Generates dynamic watermark configurations for video players
 */

import { WatermarkConfig } from '@medical-portal/shared';
import crypto from 'crypto';

export interface WatermarkUser {
  id: string;
  email: string;
  fullName: string;
  studentId?: string;
}

export class WatermarkService {
  /**
   * Generate watermark configuration for a user
   */
  static generateConfig(
    user: WatermarkUser,
    options: {
      opacity?: number;
      fontSize?: number;
      position?: WatermarkConfig['position'];
      rotation?: number;
    } = {}
  ): WatermarkConfig {
    const {
      opacity = 0.3,
      fontSize = 14,
      position = 'random',
      rotation = -15,
    } = options;

    // Generate unique text with timestamp for traceability
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const text = this.formatWatermarkText(user, timestamp);

    return {
      text,
      userId: user.id,
      email: user.email,
      opacity,
      fontSize,
      color: 'rgba(255, 255, 255, 0.5)',
      position,
      rotation,
    };
  }

  /**
   * Format watermark text
   */
  private static formatWatermarkText(user: WatermarkUser, timestamp: string): string {
    const identifier = user.studentId || this.obscureEmail(user.email);
    return `${user.fullName} | ${identifier} | ${timestamp}`;
  }

  /**
   * Obscure email for watermark (show first 3 chars and domain)
   */
  private static obscureEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 3) {
      return `${local}***@${domain}`;
    }
    return `${local.slice(0, 3)}***@${domain}`;
  }

  /**
   * Generate CSS for watermark overlay
   */
  static generateCSS(config: WatermarkConfig): string {
    const positionStyles = this.getPositionStyles(config.position || 'random');
    
    return `
      .watermark-overlay {
        position: absolute;
        ${positionStyles}
        font-size: ${config.fontSize}px;
        color: ${config.color};
        opacity: ${config.opacity};
        transform: rotate(${config.rotation}deg);
        pointer-events: none;
        user-select: none;
        z-index: 9999;
        font-family: 'Prompt', sans-serif;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        white-space: nowrap;
      }
    `;
  }

  /**
   * Get position CSS based on position type
   */
  private static getPositionStyles(position: WatermarkConfig['position']): string {
    const positions: Record<string, string> = {
      'top-left': 'top: 10%; left: 10%;',
      'top-right': 'top: 10%; right: 10%;',
      'bottom-left': 'bottom: 10%; left: 10%;',
      'bottom-right': 'bottom: 10%; right: 10%;',
      'center': 'top: 50%; left: 50%; transform: translate(-50%, -50%);',
      'random': `top: ${this.getRandomPosition()}%; left: ${this.getRandomPosition()}%;`,
    };
    return positions[position || 'random'] || positions.random;
  }

  /**
   * Get random position percentage (20-80%)
   */
  private static getRandomPosition(): number {
    return Math.floor(Math.random() * 60) + 20;
  }

  /**
   * Generate floating watermark animation keyframes
   */
  static generateAnimationCSS(): string {
    return `
      @keyframes watermark-float {
        0%, 100% {
          transform: translate(0, 0) rotate(-15deg);
        }
        25% {
          transform: translate(5%, 3%) rotate(-12deg);
        }
        50% {
          transform: translate(10%, 0) rotate(-18deg);
        }
        75% {
          transform: translate(5%, -3%) rotate(-12deg);
        }
      }
      
      .watermark-overlay-animated {
        animation: watermark-float 30s ease-in-out infinite;
      }
    `;
  }

  /**
   * Generate unique session hash for watermark verification
   */
  static generateSessionHash(userId: string, timestamp: number): string {
    const data = `${userId}-${timestamp}-${process.env.WATERMARK_SECRET || 'medical-portal'}`;
    return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
  }

  /**
   * Generate complete watermark payload for client
   */
  static generatePayload(user: WatermarkUser): {
    config: WatermarkConfig;
    css: string;
    animationCSS: string;
    sessionHash: string;
  } {
    const config = this.generateConfig(user);
    return {
      config,
      css: this.generateCSS(config),
      animationCSS: this.generateAnimationCSS(),
      sessionHash: this.generateSessionHash(user.id, Date.now()),
    };
  }
}
