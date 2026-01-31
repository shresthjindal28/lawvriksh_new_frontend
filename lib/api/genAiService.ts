import { FetchClient } from './fetchClient';
import { API_ENDPOINTS } from '@/lib/constants/routes';
import { APIResponse } from '@/types/auth';
import { DeviceData, LocationData, ProfileDataForScore, RiskEvaluateRequest } from '@/types/genai';
import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import { throttle } from 'lodash';

class GenAIService {
  private mouseMovements: { x: number; y: number; timestamp: number }[] = [];
  private readonly MAX_MOUSE_MOVEMENTS = 100;

  private trackMouse = throttle((event: MouseEvent) => {
    this.mouseMovements.push({
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now(),
    });

    if (this.mouseMovements.length > this.MAX_MOUSE_MOVEMENTS) {
      this.mouseMovements.shift();
    }
  }, 100);

  startTrackingMouse() {
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', this.trackMouse);
    }
  }

  stopTrackingMouse() {
    if (typeof window !== 'undefined') {
      this.trackMouse.cancel();
      window.removeEventListener('mousemove', this.trackMouse);
    }
  }

  getMouseTrackingData() {
    const rawData = this.mouseMovements.slice(-this.MAX_MOUSE_MOVEMENTS);
    this.mouseMovements = [];

    return rawData.map((move) => {
      return {
        additionalProp1: move.x,
        additionalProp2: move.y,
        additionalProp3: move.timestamp,
      };
    });
  }

  // Track registration time for analytics
  startRegistrationTimer() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.REGISTRATION_START_TIME, Date.now().toString());
    }
  }

  stopRegistrationTimer() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', this.trackMouse);
    }
  }

  getRegistrationTime(): number {
    if (typeof window !== 'undefined') {
      const startTime = localStorage.getItem(STORAGE_KEYS.REGISTRATION_START_TIME);
      if (startTime) {
        const duration = Date.now() - parseInt(startTime);
        localStorage.removeItem(STORAGE_KEYS.REGISTRATION_START_TIME);
        return Math.round(duration / 1000); // Return in seconds
      }
    }
    return 0;
  }

  // Collects browser and device characteristics for fingerprinting.
  getDeviceInfo(): DeviceData {
    return {
      device_id: this.getDeviceId(),
      device_type: this.getDeviceType(),
      user_agent: navigator.userAgent || '',
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language || '',
      mouse_movements: this.getMouseTrackingData(),
      form_completion_time: this.getRegistrationTime(),
    };
  }

  getDeviceId(): string {
    const deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
      const newDeviceId = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, newDeviceId);
      return newDeviceId;
    }
    return deviceId;
  }

  getDeviceType() {
    const ua = navigator.userAgent;
    const screenWidth = window.innerWidth;

    //Touch/Pointer Detection
    const isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    //User Agent (UA Sniffing)
    const isMobileUA = /Mobi|Android|webOS|iPhone|iPod/i.test(ua);
    const isTabletUA = /iPad|Tablet/i.test(ua);

    // Check for Mobile first (small screen AND touch or mobile UA)
    if (isMobileUA || (screenWidth <= 768 && isTouchDevice)) {
      return 'mobile';
    }

    // Check for Tablet (medium screen AND touch or tablet UA)
    if (isTabletUA || (screenWidth > 768 && screenWidth <= 1024 && isTouchDevice)) {
      return 'tablet';
    }

    return 'desktop';
  }

  async getLocationData(): Promise<LocationData> {
    try {
      // Using a free, simple IP geolocation API
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }
      const data = await response.json();
      return {
        country: data.country_name || '',
        city: data.city || '',
        region: data.region || '',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
      };
    } catch (error) {
      console.error('Could not get location data:', error);
      return {
        country: '',
        city: '',
      };
    }
  }

  // Sends user interaction and device data for risk evaluation.
  // This is a "fire-and-forget" call for better UX, so we don't await it.
  evaluateRisk(data: RiskEvaluateRequest): void {
    FetchClient.makeRequest(API_ENDPOINTS.GENAI_RISK_EVALUATE, {
      method: 'POST',
      body: JSON.stringify(data),
    }).catch((error) => {
      // Log errors silently without blocking the user flow
      console.error('Risk evaluation failed:', error);
    });
  }

  // Sends user profile data to the scoring endpoint.
  async getProfileScore(profileData: ProfileDataForScore): Promise<APIResponse> {
    return FetchClient.makeRequest(API_ENDPOINTS.GENAI_SCORE, {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }
}

export const genAIService = new GenAIService();
