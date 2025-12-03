# FormSubmit Email Setup Guide

This guide explains how to set up email functionality for the contact form using FormSubmit, a free service that handles form submissions and email forwarding without requiring any backend code or registration.

## What is FormSubmit?

FormSubmit is a free service that allows you to collect form submissions and forward them to your email address without any backend code. It's completely free, requires no registration, and works with any static site or web application.

## How It Works

1. Create a form that posts to `https://formsubmit.co/YOUR_EMAIL_HERE`
2. Add form fields with appropriate names
3. Submit the form - FormSubmit will send the data to your email

## Implementation Details

The contact form has been updated to use FormSubmit with the following features:

### Form Fields
- `_replyto`: Sets the reply-to address to the user's email
- `_subject`: Sets the email subject line
- `_template`: Uses the "table" template for better email formatting
- Standard fields: Name, Email, Subject, Message

### Example Form Data
```html
<form action="https://formsubmit.co/shbhtshukla930@gmail.com" method="POST">
  <input type="hidden" name="_replyto" value="user@example.com">
  <input type="hidden" name="_subject" value="New Contact Message: Question">
  <input type="hidden" name="_template" value="table">
  <input type="text" name="Name" value="John Doe">
  <input type="email" name="Email" value="user@example.com">
  <input type="text" name="Subject" value="Question">
  <textarea name="Message">I have a question...</textarea>
</form>
```

## Benefits

1. **Completely Free**: No registration or payment required
2. **No Backend Needed**: Works with static sites
3. **No Server Management**: FormSubmit handles all the infrastructure
4. **Spam Protection**: Built-in spam filtering
5. **Redirect Support**: Can redirect users after submission
6. **Email Templates**: Supports different email formatting options
7. **File Attachments**: Supports file uploads (up to 10MB)
8. **Customization**: Supports custom subjects, reply-to addresses, and more

## Setup Requirements

No setup is required! FormSubmit works out of the box. Simply:

1. Update your contact form to post to `https://formsubmit.co/shbhtshukla930@gmail.com`
2. Include the required hidden fields in your form
3. Test the form by submitting a message

## Customization Options

FormSubmit supports several customization options through hidden fields:

| Field | Description |
|-------|-------------|
| `_replyto` | Sets the reply-to address |
| `_subject` | Sets the email subject |
| `_template` | Sets the email template (options: `table`, `box`, `plain`) |
| `_cc` | CC email address(es) |
| `_bcc` | BCC email address(es) |
| `_honey pot` | Spam prevention field |
| `_redirect` | URL to redirect to after submission |

## Example Implementation

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const formBody = new FormData();
  formBody.append("_replyto", formData.email);
  formBody.append("_subject", `New Contact Message: ${formData.subject}`);
  formBody.append("Name", formData.name);
  formBody.append("Email", formData.email);
  formBody.append("Subject", formData.subject);
  formBody.append("Message", formData.message);
  formBody.append("_template", "table");
  
  const response = await fetch("https://formsubmit.co/shbhtshukla930@gmail.com", {
    method: "POST",
    body: formBody,
    headers: {
      "Accept": "application/json"
    }
  });
  
  if (response.ok) {
    // Success handling
  }
};
```

## Troubleshooting

### Common Issues

1. **Emails not received**:
   - Check spam/junk folder
   - Verify the email address is correct
   - Wait a few minutes for delivery (usually instant)

2. **Form not submitting**:
   - Check browser console for JavaScript errors
   - Verify network connectivity
   - Ensure all required fields are filled

3. **Spam filtering**:
   - FormSubmit has built-in spam protection
   - If legitimate messages are being filtered, consider adding a honey pot field

### Honey Pot Field (Spam Prevention)

Add this hidden field to your form to prevent spam:

```html
<input type="text" name="_honey pot" style="display: none;">
```

## Privacy and Security

FormSubmit takes privacy seriously:
- Data is only used to forward emails to your address
- No data is sold or shared with third parties
- Forms are protected against spam and abuse
- SSL encryption is used for all communications

## Limitations

1. **Rate Limiting**: Heavy usage may be rate-limited
2. **No Custom Domains**: Uses formsubmit.co domain
3. **Limited File Size**: Maximum 10MB for attachments
4. **No Advanced Features**: No database storage or advanced analytics

## Alternatives

If FormSubmit doesn't meet your needs, consider these alternatives:
1. **Formspree** - Similar service with more features (free tier available)
2. **Getform** - Form backend with file upload support
3. **FormKeep** - Simple form backend with integrations
4. **Self-hosted solutions** - Using Express.js, PHP, etc.

## Support

For issues with FormSubmit:
- Check the FormSubmit website for documentation
- Review the browser console for error messages
- Test with a simple HTML form to isolate issues