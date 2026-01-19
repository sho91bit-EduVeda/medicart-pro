# Animation Setup Guide

Your website is now fully configured to use Lottie animations! 
Currently, you see **Blue Circles** because I created "placeholder" animation files. Since high-quality Lottie animations are creative assets, you need to download the ones you like best.

## 🚀 One-Minute Setup Steps

1. **Go to LottieFiles** (no account needed for free ones, but free account helps):
   [https://lottiefiles.com/search?q=pharmacy&category=animations](https://lottiefiles.com/search?q=pharmacy&category=animations)

2. **Download Animations**:
   Find an animation you like, click it, and look for the **"Download"** button. Choose **"Lottie JSON"** format.

3. **Rename & Replace**:
   Move the downloaded file to your project folder: `src/assets/animations/`
   Rename it to match the filenames below to instantly see it on your site.

### 📂 File Mapping Checklist

| Section | Animation Needed | Filename to Replace (in `src/assets/animations/`) |
|---------|------------------|---------------------------------------------------|
| **Hero Section** | Customer in Pharmacy / Medicine | `hero-pharmacy.json` |
| **Trust - Support** | 24/7 Support / Phone | `trust-support.json` |
| **Trust - Products** | Medicines / Pills | `trust-products.json` |
| **Trust - Satisfaction** | Thumbs up / Star / Happy | `trust-satisfied.json` |
| **Category - Allergy** | Sneezing / Allergy | `category-allergy.json` |
| **Category - Antibiotics**| Pills / Capsules | `category-antibiotics.json` |
| **Category - Baby** | Baby / Infant Care | `category-baby.json` |
| **Category - Cold** | Cough / Flu / Thermometer | `category-cold-flu.json` |
| **Category - Pain** | Pain Relief / Joint | `category-pain.json` |
| **Category - Vitamins** | Energy / Sun / Vitamin | `category-vitamins.json` |

### 💡 Tips
- **Dimensions**: The code automatically scales them. You don't need to resize.
- **Colors**: If you have a LottieFiles account, you can "Edit Layer Colors" before downloading to match your brand Blue (#0EA5E9) and Teal (#14B8A6).
- **Fallback**: If you delete a JSON file, the website will try to show the static image instead.
