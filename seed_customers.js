const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
const app = initializeApp();
const db = getFirestore(app);

async function seedCustomers() {
  try {
    console.log('Adding sample customer data...');
    
    const customers = [
      {
        name: "Rajesh Kumar",
        email: "rajesh.kumar@email.com",
        phone: "+91 98765 43210",
        created_at: new Date("2024-01-15"),
        status: "active",
        last_order_date: new Date("2024-03-20"),
        total_orders: 12
      },
      {
        name: "Priya Sharma",
        email: "priya.sharma@email.com",
        phone: "+91 98765 43211",
        created_at: new Date("2024-02-03"),
        status: "active",
        last_order_date: new Date("2024-03-18"),
        total_orders: 8
      },
      {
        name: "Amit Patel",
        email: "amit.patel@email.com",
        phone: "+91 98765 43212",
        created_at: new Date("2024-01-28"),
        status: "inactive",
        last_order_date: new Date("2024-02-15"),
        total_orders: 3
      },
      {
        name: "Sneha Gupta",
        email: "sneha.gupta@email.com",
        phone: "+91 98765 43213",
        created_at: new Date("2024-03-10"),
        status: "active",
        last_order_date: new Date("2024-03-22"),
        total_orders: 5
      },
      {
        name: "Vikram Singh",
        email: "vikram.singh@email.com",
        phone: "+91 98765 43214",
        created_at: new Date("2024-02-22"),
        status: "active",
        last_order_date: new Date("2024-03-19"),
        total_orders: 15
      }
    ];

    // Add each customer to the collection
    for (const customer of customers) {
      const docRef = db.collection('customers').doc();
      await docRef.set(customer);
      console.log(`Added customer: ${customer.name}`);
    }

    console.log('Successfully added all sample customers!');
  } catch (error) {
    console.error('Error seeding customers:', error);
  }
}

// Run the seeding function
seedCustomers();