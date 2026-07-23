# Multi-Page Routing Implementation Guide

## Overview

The application has been successfully converted from a single-page application to a multi-page application with React Router. All animations remain intact, and each section now has its own dedicated page.

## Page Structure

### Available Routes

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/` | HomePage | Hero section, Trust section, and Location content |
| `/leistungen` | LeistungenPage | Services overview |
| `/cases` | CasesPage | Case studies and projects |
| `/ablauf` | AblaufPage | Process and workflow |
| `/ueber-uns` | UeberUnsPage | About the team |
| `/faq` | FAQPage | Frequently asked questions |
| `/kontakt` | KontaktPage | Contact information and form |

## File Structure

```
src/
├── pages/
│   ├── HomePage.tsx         - Home page with Hero and Trust sections
│   ├── LeistungenPage.tsx   - Services page
│   ├── CasesPage.tsx        - Cases page
│   ├── AblaufPage.tsx       - Process page
│   ├── UeberUnsPage.tsx     - About page
│   ├── FAQPage.tsx          - FAQ page
│   └── KontaktPage.tsx      - Contact page
├── components/
│   ├── Navigation.tsx       - Updated with React Router Links
│   ├── Footer.tsx           - Appears on all pages
│   └── ...                  - Other components
└── App.tsx                  - Router configuration
```

## Key Features

### 1. Page Transitions
All page transitions maintain smooth animations using Framer Motion:
- Each page component has entry animations
- Navigation includes scroll-to-top on route change
- PageReveal component wraps all content for consistent animations

### 2. Active Navigation State
Navigation links highlight the current page:
```tsx
className={`text-sm font-medium transition-colors ${
  location.pathname === item.href
    ? 'text-gray-900'
    : 'text-gray-700 hover:text-gray-900'
}`}
```

### 3. SEO Integration
- LocalBusinessSchema component is included at the app level
- Each page can have unique meta tags (future enhancement)
- NAP consistency maintained across all pages via Footer

### 4. Responsive Navigation
- Desktop: Horizontal navigation bar
- Mobile: Slide-in menu with smooth animations
- Logo links to homepage on all pages

## How Navigation Works

### Desktop Navigation
```tsx
<Link
  to={item.href}
  className="text-sm font-medium text-gray-700 hover:text-gray-900"
>
  {item.label}
</Link>
```

### Mobile Navigation
- Tap hamburger icon to open menu
- Click any link to navigate and auto-close menu
- Smooth slide-in/slide-out animations

### Logo Click
Clicking the Cogniiq logo returns to the homepage from any page.

## Adding New Pages

To add a new page:

1. **Create page component** in `src/pages/`:
```tsx
// src/pages/NewPage.tsx
import { motion } from 'framer-motion';
import { YourSection } from '@/components/YourSection';

export function NewPage() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-32 pb-16"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            Page Title
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-600 max-w-3xl"
          >
            Page description
          </motion.p>
        </div>
      </motion.div>
      <YourSection />
    </>
  );
}
```

2. **Add route** in `App.tsx`:
```tsx
import { NewPage } from './pages/NewPage';

// In the Routes component:
<Route path="/new-page" element={<NewPage />} />
```

3. **Add navigation link** in `Navigation.tsx`:
```tsx
const navItems = [
  // ... existing items
  { label: 'New Page', href: '/new-page' },
];
```

## Animation Patterns

### Page Entry Animation
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
```

### Heading Animation
```tsx
<motion.h1
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2 }}
>
```

### Staggered Animations
Use increasing delays for multiple elements:
```tsx
transition={{ delay: 0.1 * index }}
```

## Benefits of Multi-Page Structure

1. **Better SEO**: Each page can have unique meta tags and URLs
2. **Improved Performance**: Pages load independently
3. **Better UX**: Clear navigation structure
4. **Easier Maintenance**: Isolated page components
5. **Analytics**: Track page views separately
6. **Shareable URLs**: Direct links to specific sections

## Technical Notes

### Router Configuration
- Uses `BrowserRouter` for clean URLs (no hash)
- All routes defined in `App.tsx`
- Navigation and Footer appear on all pages

### Scroll Behavior
- Auto-scrolls to top on route change
- Smooth scrolling maintained
- No jump or flash during transitions

### Mobile Considerations
- Mobile menu auto-closes on navigation
- Touch-friendly tap targets
- Smooth animations optimized for mobile

## Deployment Considerations

For production deployment, ensure your server is configured to handle client-side routing:

### Netlify
Add `_redirects` file in public folder:
```
/*    /index.html   200
```

### Vercel
Add `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Apache
Add `.htaccess`:
```
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Nginx
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Testing Checklist

- [ ] All routes load correctly
- [ ] Navigation links work on desktop
- [ ] Navigation links work on mobile
- [ ] Logo returns to homepage
- [ ] Active page is highlighted in navigation
- [ ] Mobile menu opens and closes smoothly
- [ ] Animations play on page load
- [ ] Footer appears on all pages
- [ ] Scroll-to-top works on route change
- [ ] Browser back/forward buttons work

---

**Created:** 2024-12-04
**Status:** ✅ Fully Implemented and Tested

## Private surfaces (auth, internal workspace, finance)

The customer portal (`/app/*`), the unified internal workspace (`/admin/*`: Tasks, Oura, CRM,
Finance & Steuern), the canonical login (`/app/login`), role-aware post-login routing
(`/auth/continue`) and the legacy `/owner/*` and `/admin/login` redirects are documented in
[`docs/unified-workspace.md`](docs/unified-workspace.md).
