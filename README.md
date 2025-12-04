# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/e8739f61-78ee-4786-8800-94d091bdde8b

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e8739f61-78ee-4786-8800-94d091bdde8b) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## New Features

### Sales Reporting System
Owners can now track daily sales and generate monthly reports:
- Record daily earnings and products sold
- View daily sales summaries
- Generate monthly sales reports
- Export reports to Excel/CSV format
- Automatically update product stock when sales are recorded
- Easily select products from a searchable dropdown
- Automatically calculate total earnings based on products sold
- Automatically populate unit prices from inventory

**Important**: After implementing this feature, you must deploy the updated Firestore rules. See [DEPLOY_FIRESTORE_RULES.md](DEPLOY_FIRESTORE_RULES.md) for instructions.

See [SALES_REPORTING.md](SALES_REPORTING.md) for usage instructions.

### Google Ads Integration
Strategic Google Ad placements have been added throughout the website to monetize traffic:
- Homepage banner ads
- Product page ads
- Category page ads
See [GOOGLE_ADS_SETUP.md](GOOGLE_ADS_SETUP.md) for configuration instructions.

### Offers Management
Owners can now manage special offers and discounts through the dashboard:
- Create, edit, and delete offers
- Enable/disable offers with a toggle switch
- Set discount percentages, validity dates, and terms
- Customers see only enabled offers on the public offers page

## Firebase Setup

This application uses Firebase for backend services. See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed setup instructions.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e8739f61-78ee-4786-8800-94d091bdde8b) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)