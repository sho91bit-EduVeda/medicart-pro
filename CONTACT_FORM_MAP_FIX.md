# Contact Form & Map Fix Guide

## Issue 1: Contact Form Not Sending Emails

### Problem:
The contact form uses FormSubmit.co but emails aren't being sent.

### Root Cause:
FormSubmit requires:
1. Email verification on first use
2. Proper form submission (not fetch API)
3. Correct field names

### Solution:

Replace the `handleSubmit` function in `src/pages/Contact.tsx` (lines 37-87) with:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    // Create form element
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Submit to FormSubmit
    const response = await fetch('https://formsubmit.co/shbhtshukla930@gmail.com', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
    } else {
      throw new Error('Form submission failed');
    }
  } catch (error) {
    console.error("Form submission error:", error);
    toast.error("Failed to send message. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};
```

### Update Form JSX (around line 339):

Add hidden fields to the form:
```typescript
<form onSubmit={handleSubmit} className="space-y-6">
  {/* Hidden FormSubmit fields */}
  <input type="hidden" name="_subject" value="New Contact Message from Kalyanam Pharmaceuticals" />
  <input type="hidden" name="_template" value="table" />
  <input type="hidden" name="_captcha" value="false" />
  
  {/* Existing form fields... */}
</form>
```

---

## Issue 2: Google Maps Not Showing Correct Location

### Problem:
Map shows placeholder/incorrect coordinates

### Current Coordinates:
- Latitude: 26.79818112299614
- Longitude: 80.92020126708928

### Correct Coordinates for Mansarovar Yojna, Lucknow:
- Latitude: 26.7745 (26°46'27"N)
- Longitude: 80.8919 (80°53'31"E)

### Solution:

Replace the iframe src in `src/pages/Contact.tsx` (line 222) with:

```html
<iframe 
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3560.5!2d80.8919!3d26.7745!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjbCsDQ2JzI3LjAiTiA4MMKwNTMnMzEuMCJF!5e0!3m2!1sen!2sin!4v1733485766000!5m2!1sen!2sin"
  width="100%" 
  height="300" 
  style={{ border: 0 }} 
  allowFullScreen 
  loading="lazy" 
  referrerPolicy="no-referrer-when-downgrade"
  title="Kalyanam Pharmaceuticals Location"
></iframe>
```

### Alternative: Use Place ID (More Accurate):

If you have a Google Maps Place ID for the exact location:
```html
<iframe 
  src="https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=Mansarovar+Yojna+Sector+O+Transport+Nagar+Lucknow"
  width="100%" 
  height="300" 
  style={{ border: 0 }} 
  allowFullScreen 
  loading="lazy"
  title="Kalyanam Pharmaceuticals Location"
></iframe>
```

---

## Quick Fix Steps:

1. **For Email Form:**
   - Verify email at https://formsubmit.co/shbhtshukla930@gmail.com
   - Update handleSubmit function
   - Add hidden form fields

2. **For Map:**
   - Update iframe src with correct coordinates
   - Test map loads correctly

---

## Testing:

### Test Email Form:
1. Fill out contact form
2. Submit
3. Check email inbox for confirmation
4. Check spam folder if not received

### Test Map:
1. Navigate to /contact page
2. Verify map shows Mansarovar Yojna area
3. Click on map to open in Google Maps
4. Verify location is correct

---

## Notes:

- FormSubmit.co requires email verification on first use
- First submission will send a verification email
- Subsequent submissions will work normally
- Map coordinates are approximate for the area
- For exact location, consider adding a custom marker

