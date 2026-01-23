# User Account Dropdown Menu Design Specification

## Overview
Redesigned user dropdown menu for the "Kalyanam Pharmaceuticals – Your Trusted Pharmacy" website to match the existing site color palette and design system.

## Color Palette
- **Primary Color**: hsl(210 100% 50%) - Healthcare blue
- **Primary Foreground**: hsl(0 0% 100%) - White
- **Secondary Color**: hsl(170 80% 40%) - Vibrant teal
- **Accent Color**: hsl(25 100% 50%) - Warm orange
- **Background**: hsl(0 0% 100%) - White
- **Popover Background**: hsl(0 0% 100%) - White (same as header)
- **Hover Background**: hsl(210 100% 50%) - Primary blue
- **Hover Text**: hsl(0 0% 100%) - White
- **Border**: hsl(215 20% 90%) - Light gray
- **Destructive**: hsl(0 84% 60%) - Red for logout button
- **Muted**: hsl(210 20% 96%) - Light gray for secondary text

## Typography
- **Font Family**: Inter (consistent with site)
- **Font Size**: Base size matching other header elements
- **Font Weight**: Medium for menu items
- **Text Color**: hsl(220 15% 15%) for default text

## Dimensions & Spacing
- **Border Radius**: var(--radius) which is 0.75rem (12px)
- **Padding Horizontal**: 1rem (16px)
- **Padding Vertical**: 0.375rem (6px) 
- **Gap between items**: Consistent spacing
- **Icon size**: 14px (matching other header icons)
- **Dropdown Width**: 224px (w-56 in Tailwind units)
- **User Avatar Size**: 40px (h-10 w-10)

## Components Structure

### Trigger Button
- Size: 40x40px (h-10 w-10)
- Shape: Rounded-full (circular)
- Background: hsl(0 0% 100% / 10%) - White with 10% opacity
- Hover State: hsl(0 0% 100% / 20%) - White with 20% opacity
- Icon: UserRound (16px)
- Color: White
- Focus Ring: 2px white ring with offset

### Dropdown Panel
- Background: hsl(0 0% 100%) - White (same as header)
- Border: hsl(215 20% 90%) - Light gray border
- Shadow: 0 4px 12px hsl(215 20% 15% / 0.1) - Subtle shadow
- Border Radius: 0.75rem (12px)
- Width: 224px (w-56)

#### Header Section
- Background: Gradient from hsl(210 40% 98%) to hsl(230 40% 98%) - Blue to indigo light gradient
- Border Bottom: hsl(215 20% 90%) - Light gray border
- Padding: 6px (p-1.5)
- Layout: Flex row with avatar, user info

#### Menu Items
- Padding: 12px horizontal, 12px vertical (p-3)
- Height: Consistent for all items
- Hover State: Background changes to primary color
- Text Color: hsl(220 15% 15%) - Dark gray
- Hover Text Color: White
- Icons: 16px (h-4 w-4) with muted foreground color

#### Logout Item (Special Case)
- Text Color: hsl(0 84% 60%) - Destructive red
- Hover Background: hsl(0 84% 60%) - Destructive red
- Hover Text Color: hsl(0 0% 100%) - White

## Interaction States
- **Default**: Background hsl(0 0% 100% / 10%), Text color white
- **Hover**: Background hsl(0 0% 100% / 20%), Slight scale effect
- **Active**: Pressed state with slight scale down
- **Focus**: White ring with 2px width and transparent offset

## Accessibility Features
- Keyboard navigable (Tab to focus, Enter/Space to activate)
- Proper focus rings for accessibility
- Sufficient contrast ratios
- Semantic HTML structure
- Proper ARIA attributes
- Screen reader friendly labels

## Responsive Behavior
- Position: End aligned with trigger button
- Works on both desktop and mobile
- Proper touch targets for mobile devices (minimum 44px touch area)

## Iconography
- Uses Lucide React icons consistently with the rest of the site
- Icons match the same visual weight and style as other header icons
- Proper icon sizes that match the design system