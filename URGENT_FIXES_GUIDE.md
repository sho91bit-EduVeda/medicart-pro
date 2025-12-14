# URGENT FIXES - Contact Form & Dashboard

## Issue 1: Contact Form "Server Error" - IMMEDIATE FIX

### Problem:
FormSubmit.co is returning `{"message": "Server Error"}` when submitting the contact form.

### Root Cause:
- FormSubmit requires email verification
- CORS issues
- External service dependency

### SOLUTION: Use Firestore (Recommended)

#### Step 1: Add Firebase imports to Contact.tsx

Add these imports at the top of `src/pages/Contact.tsx` (after line 16):

```typescript
import { db } from "@/integrations/firebase/config";
import { collection, addDoc } from "firebase/firestore";
```

#### Step 2: Replace handleSubmit function

Replace the entire `handleSubmit` function (lines 37-86) with:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    // Store contact message in Firestore
    await addDoc(collection(db, 'contact_messages'), {
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
      message: formData.message,
      created_at: new Date().toISOString(),
      status: 'unread'
    });
    
    toast.success("Message received! We'll get back to you soon.");
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: ""
    });
  } catch (error) {
    console.error("Form submission error:", error);
    toast.error("Failed to send message. Please call us at 079053 82771");
  } finally {
    setIsSubmitting(false);
  }
};
```

#### Step 3: Remove FormSubmit hidden fields

Remove these lines from the form (around line 339-344):

```typescript
{/* FormSubmit Hidden Fields */}
<input type="hidden" name="_subject" value="New Contact Message from Kalyanam Pharmaceuticals Website" />
<input type="hidden" name="_template" value="table" />
<input type="hidden" name="_captcha" value="false" />
<input type="hidden" name="_replyto" value={formData.email} />
```

#### Step 4: Add "Contact Messages" section to Owner Dashboard

Add a new section in Owner.tsx to view contact messages:

```typescript
// In Owner.tsx, add this state
const [contactMessages, setContactMessages] = useState([]);

// Add fetch function
const fetchContactMessages = async () => {
  try {
    const q = query(
      collection(db, 'contact_messages'),
      orderBy('created_at', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setContactMessages(messages);
  } catch (error) {
    console.error("Failed to fetch contact messages:", error);
    toast.error("Failed to load contact messages");
  }
};

// Add to navigation
{
  id: 'contact-messages',
  label: 'Contact Messages',
  icon: Mail,
  category: 'Communication'
}
```

---

## Issue 2: Dashboard UI Simplification

### Current Problems:
1. Too many scattered sections
2. Inventory management not prominent
3. Sales reporting buried
4. Poor navigation

### SOLUTION: Simplified Dashboard Layout

#### New Structure:

```
┌─────────────────────────────────────────┐
│  DASHBOARD HOME                         │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ Total  │ │ Low    │ │ Sales  │      │
│  │ Items  │ │ Stock  │ │ Today  │      │
│  └────────┘ └────────┘ └────────┘      │
│                                         │
│  ┌──────────────────┐ ┌──────────────┐ │
│  │  📦 INVENTORY    │ │  📊 SALES    │ │
│  │  MANAGEMENT      │ │  REPORTS     │ │
│  │  (LARGE BUTTON)  │ │  (LARGE BTN) │ │
│  └──────────────────┘ └──────────────┘ │
│                                         │
│  Other Features (smaller cards):       │
│  [Add Product] [Categories] [Offers]   │
│  [Requests] [Messages] [Settings]      │
└─────────────────────────────────────────┘
```

#### Implementation:

Create `src/components/dashboard/DashboardHome.tsx`:

```typescript
import { Card, CardContent } from "@/components/ui/card";
import { Package, AlertTriangle, TrendingUp, Plus, Database, Percent, MessageSquare, Mail, Settings } from "lucide-react";
import { motion } from "framer-motion";

export const DashboardHome = ({ onNavigate, stats }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <h3 className="text-3xl font-bold">{stats.totalProducts}</h3>
              </div>
              <Package className="w-12 h-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <h3 className="text-3xl font-bold text-yellow-600">{stats.lowStock}</h3>
              </div>
              <AlertTriangle className="w-12 h-12 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Sales</p>
                <h3 className="text-3xl font-bold text-green-600">₹{stats.todaySales}</h3>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Primary Actions - LARGE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card 
            className="h-48 cursor-pointer bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-2 border-blue-500/20 hover:border-blue-500/40 transition-all"
            onClick={() => onNavigate('inventory')}
          >
            <CardContent className="flex flex-col items-center justify-center h-full">
              <Package className="w-16 h-16 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Inventory Management</h3>
              <p className="text-muted-foreground text-center">
                Manage products, stock levels, and categories
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card 
            className="h-48 cursor-pointer bg-gradient-to-br from-green-500/10 to-green-500/5 border-2 border-green-500/20 hover:border-green-500/40 transition-all"
            onClick={() => onNavigate('sales-reporting')}
          >
            <CardContent className="flex flex-col items-center justify-center h-full">
              <TrendingUp className="w-16 h-16 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Sales Reporting</h3>
              <p className="text-muted-foreground text-center">
                View sales analytics, reports, and trends
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Secondary Actions - Smaller */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ActionCard icon={Plus} label="Add Product" onClick={() => onNavigate('add-product')} />
        <ActionCard icon={Database} label="Categories" onClick={() => onNavigate('categories')} />
        <ActionCard icon={Percent} label="Offers" onClick={() => onNavigate('offers')} />
        <ActionCard icon={MessageSquare} label="Requests" onClick={() => onNavigate('requests')} />
        <ActionCard icon={Mail} label="Messages" onClick={() => onNavigate('contact-messages')} />
        <ActionCard icon={Settings} label="Settings" onClick={() => onNavigate('settings')} />
      </div>
    </div>
  );
};

const ActionCard = ({ icon: Icon, label, onClick }) => (
  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
    <Card className="cursor-pointer hover:shadow-md transition-all" onClick={onClick}>
      <CardContent className="flex flex-col items-center justify-center p-6">
        <Icon className="w-8 h-8 mb-2 text-primary" />
        <p className="text-sm font-medium text-center">{label}</p>
      </CardContent>
    </Card>
  </motion.div>
);
```

#### Update Owner.tsx:

1. Import the new component
2. Add a "dashboard-home" section
3. Set it as the default active section
4. Calculate stats for the dashboard

```typescript
// In Owner.tsx
import { DashboardHome } from "@/components/dashboard/DashboardHome";

// Calculate stats
const stats = {
  totalProducts: products.length,
  lowStock: products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 10).length,
  outOfStock: products.filter(p => p.stock_quantity === 0).length,
  todaySales: 0 // Calculate from orders
};

// In the render section
{activeSection === 'dashboard-home' && (
  <DashboardHome onNavigate={setActiveSection} stats={stats} />
)}
```

---

## TESTING CHECKLIST

### Contact Form:
- [ ] Submit a message
- [ ] Check Firestore for `contact_messages` collection
- [ ] Verify message appears in Owner dashboard
- [ ] Test error handling (disconnect internet)

### Dashboard:
- [ ] Stats cards show correct numbers
- [ ] Large buttons for Inventory & Sales work
- [ ] Smaller action cards navigate correctly
- [ ] Mobile responsive layout works

---

## PRIORITY ORDER:

1. **URGENT:** Fix contact form (use Firestore method)
2. **HIGH:** Add contact messages viewer to dashboard
3. **MEDIUM:** Redesign dashboard home page
4. **LOW:** Polish and animations

---

## FILES TO MODIFY:

1. `src/pages/Contact.tsx` - Fix form submission
2. `src/pages/Owner.tsx` - Add contact messages section
3. `src/components/dashboard/DashboardHome.tsx` - NEW FILE
4. `src/components/dashboard/InventoryManagement.tsx` - NEW FILE (optional)
5. `src/components/dashboard/SalesReporting.tsx` - Enhance existing

---

Would you like me to create these files and make the changes?
