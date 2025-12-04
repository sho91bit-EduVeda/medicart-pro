# Deploying Updated Firestore Rules

The Sales Reporting feature requires new Firestore rules to be deployed to resolve the "Missing or insufficient permissions" error.

## Updated Rules

The following collections have been added to the Firestore rules:

1. `daily_sales` - For storing daily sales records
2. `monthly_reports` - For storing generated monthly reports

Both collections are restricted to authenticated users only (owners).

## Deployment Instructions

To deploy the updated Firestore rules:

1. Make sure you have Firebase CLI installed:
   ```
   npm install -g firebase-tools
   ```

2. Login to your Firebase account:
   ```
   firebase login
   ```

3. Deploy the updated rules:
   ```
   firebase deploy --only firestore:rules
   ```

## Verification

After deploying the rules, the Sales Reporting feature should work without permissions errors:
- Daily sales should load correctly
- Monthly reports should load correctly
- You should be able to record new sales
- You should be able to generate monthly reports

## Troubleshooting

If you still encounter permissions errors:

1. Verify that you're logged in as an authenticated user (owner)
2. Check that the rules were deployed successfully
3. Make sure your Firebase project is correctly configured

For further assistance, contact:
- Email: shbhtshukla930@gmail.com
- Phone: +91-9643000619