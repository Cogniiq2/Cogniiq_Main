# Local SEO Quick Reference

## 🚀 Quick Start (5 Minutes)

### 1. Add Structured Data
```tsx
// In src/App.tsx
import { LocalBusinessSchema } from './components/LocalBusinessSchema';

function App() {
  return (
    <>
      <LocalBusinessSchema />
      {/* Your content */}
    </>
  );
}
```

### 2. Add Location Section
```tsx
// In src/App.tsx
import { LocationContent } from './components/LocationContent';

// Add after ServicesSection or TrustSection
<LocationContent />
```

### 3. NAP Already Integrated ✅
Footer already uses the NAP component for consistent contact display.

---

## 📊 Components Overview

| Component | Purpose | Usage |
|-----------|---------|-------|
| `LocalBusinessSchema` | SEO structured data | Add once in App.tsx |
| `LocationContent` | Location showcase | Add as page section |
| `NAP` | Contact info display | Already in Footer |

---

## 🎯 Priority Action Items

### Today (30 minutes):
1. ✅ Components are created
2. 📍 Add `<LocalBusinessSchema />` to App.tsx
3. 📍 Add `<LocationContent />` to homepage
4. 📍 Test in development

### This Week:
1. 📱 Setup Google Business Profile
   - Visit: https://business.google.com/create
   - Follow 10-step guide in `google-business-integration.ts`

2. 📋 Submit to directories:
   - Bing Places
   - Apple Maps
   - Facebook Business

3. 📸 Gather photos for Google Business:
   - Logo (square)
   - Cover photo (1024x576px)
   - Team photos
   - Office photos

### Ongoing:
- Post to Google Business weekly
- Respond to reviews within 48h
- Update business info if changed
- Monitor Google Search Console

---

## 🔍 Testing Your Implementation

### 1. Structured Data
Test: https://search.google.com/test/rich-results
- Copy your website URL
- Check for LocalBusiness schema
- Verify no errors

### 2. Mobile Friendly
Test: https://search.google.com/test/mobile-friendly
- Should pass all checks
- Fast loading time

### 3. NAP Consistency
Check these locations manually:
- ✅ Website footer
- ✅ Contact section
- ✅ Structured data
- 🔲 Google Business Profile
- 🔲 Other directories

### 4. Local Keywords
Search for:
- "AI Agentur Bayreuth"
- "Webdesign Agentur Bayreuth"
- "KI Automationen Bayern"
- Monitor your rankings weekly

---

## 💡 Common Tasks

### Update Business Information
```typescript
// Edit: src/lib/seo-data.ts
export const BUSINESS_INFO = {
  // Update values here
  // Changes automatically apply everywhere
}
```

### Display Contact Info Anywhere
```tsx
import { NAP } from '@/components/NAP';

// Vertical layout
<NAP />

// Horizontal layout
<NAP variant="horizontal" />

// Compact layout
<NAP variant="compact" showIcons={false} />
```

### Get Business Data
```typescript
import { BUSINESS_INFO } from '@/lib/seo-data';

const name = BUSINESS_INFO.name;
const email = BUSINESS_INFO.contact.email;
const phone = BUSINESS_INFO.contact.phoneDisplay;
```

---

## 📞 NAP Reference

### Current NAP:
```
Name: Cogniiq
Address: Am Main 3, 95444 Bayreuth, Deutschland
Phone: 0160 1832917
Email: info@cogniiq.de
```

### Must Match Everywhere:
- ✅ Website (using NAP component)
- 🔲 Google Business Profile
- 🔲 Bing Places
- 🔲 Apple Maps
- 🔲 Facebook
- 🔲 LinkedIn
- 🔲 Email signature
- 🔲 Business cards

---

## 🎯 Google Business Profile Checklist

### Initial Setup (Once):
- [ ] Claim listing at business.google.com
- [ ] Verify business (postcard/phone)
- [ ] Add all business info (NAP)
- [ ] Add business category
- [ ] Add business hours
- [ ] Upload 10+ photos
- [ ] Add services list
- [ ] Write business description (750 chars)
- [ ] Enable messaging
- [ ] Add booking/appointment URL

### Weekly Tasks:
- [ ] Post 1-2 updates
- [ ] Check and respond to reviews
- [ ] Add new photos if available
- [ ] Check insights/analytics

### Monthly Tasks:
- [ ] Review and update services
- [ ] Update photos
- [ ] Check competitors
- [ ] Analyze performance

---

## 📈 Success Metrics

Track these weekly:
1. **Google Business Profile:**
   - Total views
   - Search vs Direct views
   - Customer actions (calls, clicks, directions)
   - Review count and average rating

2. **Google Search Console:**
   - Impressions for local keywords
   - Click-through rate (CTR)
   - Average position
   - Top queries

3. **Website Analytics:**
   - Organic traffic from Bayreuth/Bayern
   - Conversion rate for local traffic
   - Time on site
   - Bounce rate

---

## 🆘 Troubleshooting

### Structured Data Not Showing:
1. Test at: https://search.google.com/test/rich-results
2. Ensure `<LocalBusinessSchema />` is in App.tsx
3. Check browser console for errors
4. Verify build succeeded

### Google Business Not Verified:
1. Check mail for verification postcard (5-14 days)
2. Or request phone verification
3. Contact Google Business support if delayed

### Rankings Not Improving:
- Give it 2-4 weeks minimum
- Ensure NAP is consistent everywhere
- Post regularly to Google Business
- Get more reviews
- Check for technical SEO issues
- Monitor Google Search Console

---

## 📚 Documentation Files

- `LOCAL_SEO_GUIDE.md` - Complete implementation guide
- `LOCAL_SEO_IMPLEMENTATION_EXAMPLE.tsx` - Code examples
- `LOCAL_SEO_QUICK_REFERENCE.md` - This file (quick access)

---

## 🔗 Essential Links

- [Google Business Profile](https://business.google.com)
- [Google Search Console](https://search.google.com/search-console)
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [PageSpeed Insights](https://pagespeed.web.dev)
- [Schema Validator](https://validator.schema.org)

---

**Last Updated:** 2024-12-04
