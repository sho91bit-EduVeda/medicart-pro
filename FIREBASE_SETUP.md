# Firebase Setup Guide

This guide explains how to set up Firebase for the Kalyanam Pharmaceuticals application.

## Firestore Security Rules

The security rules are defined in `firestore.rules`. To deploy them:

1. Install the Firebase CLI:
   ```
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```
   firebase login
   ```

3. Deploy the rules:
   ```
   firebase deploy --only firestore:rules
   ```

## Required Firestore Indexes

Firestore requires composite indexes for complex queries. The required indexes are documented in `FIRESTORE_INDEXES.json`.

### Automatic Index Creation

When you run queries that require indexes, Firebase will provide links to create them automatically in the console error messages.

### Manual Index Creation

To manually create indexes:

1. Go to the Firebase Console
2. Navigate to Firestore Database
3. Click on the "Indexes" tab
4. Click "Create Index"
5. Follow the configuration in `FIRESTORE_INDEXES.json`

### Specific Indexes Needed

1. **Products Collection**:
   - Index for `category_id ASC` and `__name__ ASC`
   - Index for `in_stock ASC` and `average_rating DESC`

2. **Announcements Collection**:
   - Index for `created_at DESC`

3. **Offers Collection**:
   - Index for `enabled ASC` and `created_at DESC`

4. **Medicine Requests Collection**:
   - Index for `created_at DESC`

5. **Orders Collection**:
   - Index for `created_at DESC`

## Authentication Setup

The application uses Firebase Authentication with Email/Password provider.

1. Enable Email/Password sign-in method in Firebase Console
2. No additional configuration is needed

## Storage Setup

The application uses Firebase Storage for file uploads.

1. Enable Firebase Storage in Firebase Console
2. Default rules should work for the application

## Deployment

To deploy the entire Firebase configuration:

```
firebase deploy
```

This will deploy:
- Firestore security rules
- Firestore indexes
- Storage rules