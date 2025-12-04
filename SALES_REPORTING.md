# Sales Reporting System

This document explains how to use the Sales Reporting feature in your Kalyanam Pharmaceuticals owner dashboard.

## Overview

The Sales Reporting system allows you to:
1. Record daily sales and products sold
2. View daily sales summaries
3. Generate monthly reports
4. Export reports to Excel/CSV format
5. Automatically update product stock when sales are recorded
6. Easily select products from a searchable dropdown
7. Automatically calculate total earnings based on products sold
8. Automatically populate unit prices from inventory

## Accessing Sales Reporting

1. Log in to your owner dashboard
2. In the left sidebar navigation, click on "Sales Reporting"
3. You'll see three main sections:
   - Daily Sales Entry
   - Today's Sales Summary
   - Monthly Reports

## Recording Daily Sales

### Steps:
1. For each product sold:
   - Click the dropdown under "Product Name" to select or search for a product
   - The dropdown shows all products in your inventory with a search feature
   - When you select a product, its details (name, unit price, quantity, total) will appear in a table format below
   - Adjust the quantity and price if needed
   - Use the remove button to delete the product from the sale
2. The total amount earned for the day is automatically calculated based on all products sold
3. Click "Record Daily Sales & Update Stock" to save the entry and automatically update product stock

### Product Selection:
- Initially, only the searchable product dropdown is shown
- After selecting a product, its details appear in a table format with editable fields
- Each product row includes:
  - Product name (non-editable)
  - Unit price (editable, automatically populated from inventory)
  - Quantity (editable, defaults to 1)
  - Total price (automatically calculated)
  - Remove button to delete the product from the sale

### Searchable Product Dropdown:
- Click on the product name dropdown to open the product selection interface
- Type in the search box to filter products by name
- Click on a product to select it
- The dropdown shows both the product name and its current unit price
- The dropdown makes it easy to find products without typing the full name

### Automatic Price Population:
- When you select a product from the dropdown, its unit price is automatically filled in
- The unit price comes from the product's current price in your inventory
- You can still manually adjust the price if needed (e.g., for discounts)
- The total price for each product is automatically calculated (quantity × unit price)

### Automatic Total Calculation:
- As you add products and enter quantities/prices, the system automatically calculates:
  - Total price for each product line (quantity × unit price)
  - Overall total amount earned for the day (sum of all product totals)
- The total amount field is read-only as it's automatically calculated

### Automatic Stock Updates:
- When you record a sale, the system automatically finds each product by name in your inventory
- It decrements the stock quantity by the amount sold
- If a product's stock reaches zero, it will be marked as "Out of Stock"
- If a product name doesn't match any inventory item, you'll receive an error message

### Validation:
- At least one product must be selected before submission
- Quantity must be at least 1 for selected products
- Price must be greater than zero for selected products
- Total amount must be greater than zero (automatically calculated)
- All fields for selected products must have valid values before submission

### Tips:
- Use the searchable dropdown to quickly find products and automatically populate prices
- You can add multiple products by clicking "Add Product" multiple times
- You can remove products using the remove button in each product row
- All entries for the current day will appear in the "Today's Sales Summary" section

## Viewing Daily Sales Summary

The "Today's Sales Summary" section shows:
- Total entries recorded for the day
- Total amount earned
- Total number of products sold
- Detailed breakdown of each sales entry with timestamp

## Generating Monthly Reports

### Steps:
1. Click the "Generate Current Month Report" button
2. The system will:
   - Analyze all daily sales for the current month
   - Calculate total sales
   - Count products sold
   - Identify the most sold product
3. The report will appear in the "Previous Reports" section

## Exporting Reports

### Steps:
1. In the "Monthly Reports" section, find the report you want to export
2. Click the "Export" button next to the report
3. The report will be downloaded as a CSV file that can be opened in Excel

### Report Contents:
- Month and year
- Total sales amount
- Number of products sold
- Most sold product
- Detailed breakdown of all products sold with quantities and prices

## Data Storage

Sales data is stored in two Firestore collections:
1. `daily_sales` - Contains individual daily sales entries
2. `monthly_reports` - Contains generated monthly reports

## Performance Considerations

To avoid Firestore composite index requirements, the system uses client-side sorting and filtering:
- Daily sales are filtered by date and sorted by creation time on the client
- Monthly reports are generated by filtering daily sales client-side
- This approach eliminates the need for complex Firestore queries that require composite indexes

## Best Practices

1. **Record sales daily**: For accurate reporting, record sales at the end of each business day
2. **Use the searchable dropdown**: Quickly find products and automatically populate prices
3. **Verify automatic calculations**: Check that the total amount looks correct before submitting
4. **Generate monthly reports**: At the end of each month, generate a report for your records
5. **Export important reports**: Export monthly reports for your financial records

## Troubleshooting

### Issue: "Please select at least one product"
- Make sure you've selected at least one product from the dropdown
- This error only appears when you try to submit the form without any products selected

### Issue: "Quantity must be at least 1"
- Ensure the quantity field is set to at least 1 for each product

### Issue: "Price must be greater than zero"
- Ensure the price field is greater than zero for each product
- If a product's inventory price is 0, you'll need to manually enter a valid price

### Issue: "Total amount must be greater than zero"
- This error appears when the calculated total amount is zero or negative
- Ensure you have selected at least one product with a valid price and quantity

### Issue: "Product 'X' not found in inventory"
- Ensure the product name matches exactly with an item in your inventory
- Check for typos, extra spaces, or different capitalization
- Verify the product exists in the "Manage Products" section

### Issue: "Failed to record daily sales"
- Ensure all fields are filled in correctly
- Check that all product entries have valid quantities and prices
- Verify that the total amount is greater than zero

### Issue: "No sales data available for this month"
- This occurs when trying to generate a monthly report but no daily sales have been recorded for the current month
- Record at least one daily sale before generating a report

### Issue: Export not working
- Ensure your browser allows downloads
- Check that pop-ups are not blocked for your site

## Support

For issues with the Sales Reporting system, please contact:
- Email: shbhtshukla930@gmail.com
- Phone: +91-9643000619