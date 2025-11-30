import { db } from "@/integrations/firebase/config";
import { collection, doc, setDoc, getDocs, writeBatch } from "firebase/firestore";
import { toast } from "sonner";

export const seedDatabase = async () => {
    try {
        const batch = writeBatch(db);

        // 1. Seed Categories
        const categories = [
            { name: "Baby Products", description: "Essentials for your little ones" },
            { name: "Allergy", description: "Relief from seasonal and chronic allergies" },
            { name: "Cold & Flu", description: "Remedies for cough, cold, and flu" },
            { name: "Antibiotics", description: "Prescription antibiotics" },
            { name: "Pain Relief", description: "Medications for pain management" },
            { name: "Vitamins", description: "Supplements for health and wellness" },
        ];

        const categoriesRef = collection(db, "categories");
        const categoriesSnapshot = await getDocs(categoriesRef);

        if (categoriesSnapshot.empty) {
            categories.forEach((cat) => {
                const newCatRef = doc(categoriesRef);
                batch.set(newCatRef, {
                    ...cat,
                    created_at: new Date().toISOString()
                });
            });
            console.log("Seeding categories...");
        } else {
            console.log("Categories already exist, skipping.");
        }

        // 2. Seed Store Settings
        const settingsRef = doc(db, "settings", "store");
        batch.set(settingsRef, {
            discount_percentage: 0,
            updated_at: new Date().toISOString()
        }, { merge: true });

        // 3. Seed WhatsApp Settings
        const whatsappRef = doc(db, "settings", "whatsapp");
        batch.set(whatsappRef, {
            phone_number: "",
            api_key: "",
            is_active: false,
            created_at: new Date().toISOString()
        }, { merge: true });

        await batch.commit();
        toast.success("Database seeded successfully! Refresh the page.");
    } catch (error) {
        console.error("Error seeding database:", error);
        toast.error("Failed to seed database. Check console for details.");
    }
};
