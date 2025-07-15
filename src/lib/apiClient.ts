import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ENV } from './env';

// API Client configuration
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ENV.API_URL,
      timeout: 10000, // 10 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (ENV.IS_DEVELOPMENT) {
          console.log(`🔗 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        console.error('🚨 API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        if (ENV.IS_DEVELOPMENT) {
          console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error) => {
        console.error('🚨 API Response Error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  // Standard HTTP methods
  get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.put<T>(url, data, config);
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }

  // Specialized methods for our chat app
  async healthCheck() {
    try {
      const response = await this.get('/health');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Health check failed' 
      };
    }
  }

  // Message API methods
  messages = {
    getByConversation: (conversationId: string) => 
      this.get(`/messages/${conversationId}`),
    
    send: (data: {
      senderId: string;
      conversationId: string;
      content: string;
      messageType?: 'text' | 'image' | 'file';
      fileUrl?: string | null;
    }) => this.post('/messages/send', data),
    
    delete: (messageId: string) => 
      this.delete(`/messages/delete/${messageId}`)
  };

  // User API methods
  users = {
    getMongoId: (firebaseUid: string) => 
      this.get(`/users/getMongoId/${firebaseUid}`),
    
    getAll: (firebaseUid: string) => 
      this.get(`/users/getAllUsers/${firebaseUid}`)
  };

  // Conversation API methods
  conversations = {
    getById: (conversationId: string) => 
      this.get(`/conversations/getConversationById/${conversationId}`),
    
    getList: (firebaseUid: string) => 
      this.get(`/conversations/getConvList/${firebaseUid}`),
    
    create: (data: {
      participants: string[];
      type: 'direct' | 'group';
      groupName?: string;
      groupAvatar?: string;
    }) => this.post('/conversations/createConv', data),
    
    delete: (firebaseUid: string, chatId: string) => 
      this.delete(`/conversations/deleteConv/${firebaseUid}/${chatId}`)
  };
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing purposes
export { ApiClient };

// Export types
export type { AxiosRequestConfig };
