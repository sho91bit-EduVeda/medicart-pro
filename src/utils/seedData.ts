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
        let categoryIds: Record<string, string> = {};

        if (categoriesSnapshot.empty) {
            const categoryRefs: Record<string, string> = {};
            categories.forEach((cat, index) => {
                const newCatRef = doc(categoriesRef);
                batch.set(newCatRef, {
                    ...cat,
                    created_at: new Date().toISOString()
                });
                // Store the reference for later use
                categoryRefs[cat.name] = newCatRef.id;
            });
            categoryIds = categoryRefs;
        } else {
            // Get existing category IDs
            categoriesSnapshot.forEach(doc => {
                const data = doc.data();
                categoryIds[data.name] = doc.id;
            });
        }

        // 2. Seed Sample Medicines (only if no products exist)
        const productsRef = collection(db, "products");
        const productsSnapshot = await getDocs(productsRef);

        if (productsSnapshot.empty) {
            const sampleMedicines = [
                {
                    name: "Paracetamol 500mg",
                    category_id: categoryIds["Pain Relief"] || "",
                    description: "Effective pain reliever and fever reducer",
                    uses: "Headache, fever, muscle pain, toothache",
                    composition: "Paracetamol 500mg",
                    side_effects: "May cause liver damage in high doses",
                    original_price: 15.50,
                    in_stock: true,
                    stock_quantity: 100
                },
                {
                    name: "Amoxicillin 250mg",
                    category_id: categoryIds["Antibiotics"] || "",
                    description: "Antibiotic for bacterial infections",
                    uses: "Respiratory tract infections, urinary tract infections, skin infections",
                    composition: "Amoxicillin 250mg",
                    side_effects: "Diarrhea, nausea, rash",
                    original_price: 85.00,
                    in_stock: true,
                    stock_quantity: 50
                },
                {
                    name: "Cetirizine 10mg",
                    category_id: categoryIds["Allergy"] || "",
                    description: "Antihistamine for allergy relief",
                    uses: "Seasonal allergies, hay fever, hives",
                    composition: "Cetirizine Hydrochloride 10mg",
                    side_effects: "Drowsiness, dry mouth, fatigue",
                    original_price: 45.75,
                    in_stock: true,
                    stock_quantity: 75
                },
                {
                    name: "Vitamin C 500mg",
                    category_id: categoryIds["Vitamins"] || "",
                    description: "Immunity booster and antioxidant",
                    uses: "Boosts immunity, prevents cold, acts as antioxidant",
                    composition: "Ascorbic Acid 500mg",
                    side_effects: "Diarrhea in high doses",
                    original_price: 65.00,
                    in_stock: true,
                    stock_quantity: 120
                },
                {
                    name: "Baby Diaper Rash Cream",
                    category_id: categoryIds["Baby Products"] || "",
                    description: "Soothing cream for diaper rash",
                    uses: "Prevents and treats diaper rash in babies",
                    composition: "Zinc Oxide 15%, Calamine",
                    side_effects: "Skin irritation (rare)",
                    original_price: 120.00,
                    in_stock: true,
                    stock_quantity: 30
                }
            ];

            sampleMedicines.forEach(medicine => {
                const newProductRef = doc(productsRef);
                batch.set(newProductRef, {
                    ...medicine,
                    created_at: new Date().toISOString()
                });
            });

        } else {
        }

        // 3. Seed Store Settings
        const settingsRef = doc(db, "settings", "store");
        batch.set(settingsRef, {
            discount_percentage: 0,
            updated_at: new Date().toISOString()
        }, { merge: true });

        // 4. Seed WhatsApp Settings
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