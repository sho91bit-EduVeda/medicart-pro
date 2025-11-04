import { supabase } from '@/integrations/supabase/client';

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
      const { data, error } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Failed to load WhatsApp settings:', error);
        return false;
      }

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
        console.log('📱 WhatsApp Test Notification:');
        console.log('To:', this.settings.phone_number);
        console.log('Message:', message);
        console.log('---');
        
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
      console.log('WhatsApp message sent successfully:', result);
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
      const { error } = await supabase
        .from('search_logs')
        .insert({
          search_query: searchQuery,
          results_count: resultsCount,
          user_ip: await this.getUserIP(),
          user_agent: navigator.userAgent
        });

      if (error) {
        console.error('Failed to log search:', error);
      }
    } catch (error) {
      console.error('Error logging search:', error);
    }
  }

  async trackUnavailableMedicine(medicineName: string): Promise<void> {
    try {
      // Check if medicine already exists
      const { data: existing, error: fetchError } = await supabase
        .from('unavailable_medicines')
        .select('*')
        .eq('medicine_name', medicineName.toLowerCase())
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Failed to check existing medicine:', fetchError);
        return;
      }

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('unavailable_medicines')
          .update({
            search_count: existing.search_count + 1,
            last_searched_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Failed to update medicine count:', updateError);
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('unavailable_medicines')
          .insert({
            medicine_name: medicineName.toLowerCase(),
            search_count: 1,
            first_searched_at: new Date().toISOString(),
            last_searched_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Failed to insert new medicine:', insertError);
        }
      }

      // Send WhatsApp notification for new unavailable medicine
      if (!existing) {
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
      const { data, error } = await supabase
        .from('unavailable_medicines')
        .select('*')
        .order('search_count', { ascending: false });

      if (error) {
        console.error('Failed to fetch unavailable medicines:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching unavailable medicines:', error);
      return [];
    }
  }

  async updateMedicineStatus(id: string, status: 'pending' | 'in_progress' | 'resolved', notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('unavailable_medicines')
        .update({
          status,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Failed to update medicine status:', error);
        return false;
      }

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

  async getSearchLogs(limit: number = 50): Promise<SearchLog[]> {
    try {
      const { data, error } = await supabase
        .from('search_logs')
        .select('*')
        .order('search_timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch search logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching search logs:', error);
      return [];
    }
  }
}

export const whatsappService = new WhatsAppService();
