import { db } from '@/integrations/firebase/config';
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, setDoc, orderBy, limit } from 'firebase/firestore';

export interface WhatsAppSettings {
  id: string;
  phone_number: string;
  api_key: string;
  webhook_url?: string;
  is_active: boolean;
}

export interface SearchLog {
  id: string;
  search_query: string;
  search_timestamp: string;
  results_count: number;
  user_ip?: string;
  user_agent?: string;
}

export interface UnavailableMedicine {
  id: string;
  medicine_name: string;
  search_count: number;
  first_searched_at: string;
  last_searched_at: string;
  status: 'pending' | 'in_progress' | 'resolved';
  notes?: string;
}

class WhatsAppService {
  private settings: WhatsAppSettings | null = null;

  async initialize() {
    try {
      const docRef = doc(db, 'settings', 'whatsapp');
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.error('WhatsApp settings not found');
        return false;
      }

      const data = docSnap.data() as WhatsAppSettings;
      if (!data.is_active) return false;

      this.settings = data;
      return true;
    } catch (error) {
      console.error('Error initializing WhatsApp service:', error);
      return false;
    }
  }

  async sendNotification(message: string): Promise<boolean> {
    if (!this.settings) {
      await this.initialize();
      if (!this.settings) {
        console.error('WhatsApp settings not initialized');
        return false;
      }
    }

    try {
      // Check if this is a test/development environment
      const isTestMode = this.settings.api_key.includes('test') ||
        this.settings.api_key.includes('mock') ||
        this.settings.api_key.length < 20;

      if (isTestMode) {
        // Mock response for testing

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In test mode, always return success
        return true;
      }

      // Real WhatsApp Business API call
      const phoneNumberId = this.extractPhoneNumberId();
      const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.settings.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: this.settings.phone_number,
          type: 'text',
          text: {
            body: message
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`WhatsApp API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      return true;
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
      return false;
    }
  }

  private extractPhoneNumberId(): string {
    // Extract phone number ID from API key or use a default
    // In real implementation, this should be stored separately
    if (this.settings?.api_key.includes('phone_number_id:')) {
      const match = this.settings.api_key.match(/phone_number_id:([^,]+)/);
      return match ? match[1] : 'YOUR_PHONE_NUMBER_ID';
    }
    return 'YOUR_PHONE_NUMBER_ID';
  }

  async logSearch(searchQuery: string, resultsCount: number): Promise<void> {
    try {
      await addDoc(collection(db, 'search_logs'), {
        search_query: searchQuery,
        results_count: resultsCount,
        user_ip: await this.getUserIP(),
        user_agent: navigator.userAgent,
        search_timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging search:', error);
    }
  }

  async trackUnavailableMedicine(medicineName: string): Promise<void> {
    try {
      // Check if medicine already exists
      const q = query(
        collection(db, 'unavailable_medicines'),
        where('medicine_name', '==', medicineName.toLowerCase())
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Update existing record
        const docRef = querySnapshot.docs[0].ref;
        const existing = querySnapshot.docs[0].data();

        await updateDoc(docRef, {
          search_count: (existing.search_count || 0) + 1,
          last_searched_at: new Date().toISOString()
        });
      } else {
        // Insert new record
        await addDoc(collection(db, 'unavailable_medicines'), {
          medicine_name: medicineName.toLowerCase(),
          search_count: 1,
          first_searched_at: new Date().toISOString(),
          last_searched_at: new Date().toISOString(),
          status: 'pending'
        });

        // Send WhatsApp notification for new unavailable medicine
        await this.sendNotification(
          `🔍 New Medicine Search Alert!\n\n` +
          `Medicine: ${medicineName}\n` +
          `Status: Not Available\n` +
          `Time: ${new Date().toLocaleString()}\n\n` +
          `This medicine was searched but not found in our inventory.`
        );
      }
    } catch (error) {
      console.error('Error tracking unavailable medicine:', error);
    }
  }

  async getUnavailableMedicines(): Promise<UnavailableMedicine[]> {
    try {
      const q = query(collection(db, 'unavailable_medicines'), orderBy('search_count', 'desc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UnavailableMedicine));
    } catch (error) {
      console.error('Error fetching unavailable medicines:', error);
      return [];
    }
  }

  async updateMedicineStatus(id: string, status: 'pending' | 'in_progress' | 'resolved', notes?: string): Promise<boolean> {
    try {
      const docRef = doc(db, 'unavailable_medicines', id);
      await updateDoc(docRef, {
        status,
        notes,
        updated_at: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error updating medicine status:', error);
      return false;
    }
  }

  private async getUserIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  async getSearchLogs(limitCount: number = 50): Promise<SearchLog[]> {
    try {
      const q = query(
        collection(db, 'search_logs'),
        orderBy('search_timestamp', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SearchLog));
    } catch (error) {
      console.error('Error fetching search logs:', error);
      return [];
    }
  }
}

export const whatsappService = new WhatsAppService();
