# Local SEO Implementation Guide

This guide explains how to use the local SEO components and utilities implemented in this project.

## Overview

This implementation includes:
- ✅ Centralized business data management
- ✅ Reusable NAP (Name, Address, Phone) component
- ✅ Enhanced structured data (Schema.org)
- ✅ Location-specific content components
- ✅ Google Business Profile integration helpers
- ✅ SEO metadata generators

## Components & Files

### 1. Business Data (`src/lib/seo-data.ts`)

**Purpose:** Single source of truth for all business information.

**Key Features:**
- Business name, address, phone, email
- Founders information
- Service areas
- Business hours
- Social media links
- Helper functions for formatting

**Usage:**
```typescript
import { BUSINESS_INFO, formatAddress, getGoogleMapsUrl } from '@/lib/seo-data';

// Display business name
<h1>{BUSINESS_INFO.name}</h1>

// Display formatted address
<p>{formatAddress(true)}</p>

// Link to Google Maps
<a href={getGoogleMapsUrl()}>View on Map</a>
```

### 2. NAP Component (`src/components/NAP.tsx`)

**Purpose:** Display Name, Address, Phone consistently across all pages.

**Usage:**
```tsx
import { NAP } from '@/components/NAP';

// Vertical layout (default)
<NAP />

// Horizontal layout
<NAP variant="horizontal" />

// Compact layout without icons
<NAP variant="compact" showIcons={false} />
```

**Variants:**
- `vertical`: Stacked layout (footer, sidebar)
- `horizontal`: Side-by-side layout (header)
- `compact`: Minimal inline layout

**Already Used In:**
- Footer component

### 3. LocalBusinessSchema Component (`src/components/LocalBusinessSchema.tsx`)

**Purpose:** Inject comprehensive structured data for local SEO.

**Features:**
- Organization schema
- LocalBusiness schema
- Service schemas (auto-generated from services array)
- FAQ schema
- Website schema
- Breadcrumb schema

**Usage:**
```tsx
import { LocalBusinessSchema } from '@/components/LocalBusinessSchema';

// Add to your main App component
function App() {
  return (
    <>
      <LocalBusinessSchema />
      {/* Your app content */}
    </>
  );
}
```

### 4. LocationContent Component (`src/components/LocationContent.tsx`)

**Purpose:** Display location-specific content with embedded map.

**Features:**
- Service area cards (Bayreuth, Bayern, Deutschland)
- Embedded Google Maps
- Location-focused content
- City mentions for SEO

**Usage:**
```tsx
import { LocationContent } from '@/components/LocationContent';

// Add as a section in your page
<LocationContent />
```

**Recommended Placement:**
- After services section
- Before testimonials/cases
- As separate "Standort" page

### 5. Google Business Integration (`src/lib/google-business-integration.ts`)

**Purpose:** Helper functions and setup guide for Google Business Profile.

**Key Exports:**

#### Setup Guide
```typescript
import { GOOGLE_BUSINESS_SETUP_GUIDE } from '@/lib/google-business-integration';

// Access the complete setup guide
console.log(GOOGLE_BUSINESS_SETUP_GUIDE.steps);
console.log(GOOGLE_BUSINESS_SETUP_GUIDE.bestPractices);
```

#### Post Content Generator
```typescript
import { generateGooglePostsContent } from '@/lib/google-business-integration';

const posts = generateGooglePostsContent();
// Use for weekly Google Business posts
```

#### Citations List
```typescript
import { getLocalBusinessCitations } from '@/lib/google-business-integration';

const citations = getLocalBusinessCitations();
// List of directories to submit business to
```

### 6. SEO Metadata Helpers (`src/lib/seo-metadata.ts`)

**Purpose:** Generate location-specific meta tags and SEO data.

**Usage:**

#### Generate Page Metadata
```typescript
import { generateLocationMetadata } from '@/lib/seo-metadata';

const metadata = generateLocationMetadata('Services');
// Returns: title, description, keywords, canonical, ogImage
```

#### Service-Specific Metadata
```typescript
import { generateServiceMetadata } from '@/lib/seo-metadata';

const metadata = generateServiceMetadata(
  'AI Automationen',
  'Automatisieren Sie wiederkehrende Aufgaben'
);
```

#### Geo Meta Tags
```typescript
import { generateGeoMetaTags } from '@/lib/seo-metadata';

const geoTags = generateGeoMetaTags();
// Returns: geo.region, geo.placename, geo.position, ICBM
```

## Implementation Checklist

### ✅ Completed

- [x] Centralized business data in `seo-data.ts`
- [x] NAP component created and integrated in Footer
- [x] Enhanced structured data component
- [x] Location-specific content component
- [x] Google Business Profile setup guide
- [x] SEO metadata generators

### 🔲 Recommended Next Steps

1. **Add LocationContent to Homepage**
   ```tsx
   // In src/App.tsx
   import { LocationContent } from '@/components/LocationContent';

   // Add after TrustSection or before FAQSection
   <LocationContent />
   ```

2. **Add LocalBusinessSchema to App**
   ```tsx
   // In src/App.tsx
   import { LocalBusinessSchema } from '@/components/LocalBusinessSchema';

   function App() {
     return (
       <>
         <LocalBusinessSchema />
         {/* Rest of your app */}
       </>
     );
   }
   ```

3. **Setup Google Business Profile**
   - Follow guide in `google-business-integration.ts`
   - Visit: https://business.google.com/create
   - Complete all 10 steps in `GOOGLE_BUSINESS_SETUP_GUIDE`

4. **Add to Other Directories**
   ```typescript
   // See getLocalBusinessCitations() for full list
   - Google Business Profile (CRITICAL)
   - Bing Places (HIGH)
   - Apple Maps (HIGH)
   - Facebook Business (HIGH)
   - LinkedIn Company Page (HIGH)
   ```

5. **Create Location-Specific Pages** (Optional)
   - `/standorte/bayreuth`
   - `/standorte/bayern`
   - Each with unique, locally-relevant content

## NAP Consistency Requirements

⚠️ **CRITICAL:** NAP must be identical everywhere!

### Current NAP Data:
```
Name: Cogniiq
Address: Am Main Straße 3, 95444 Bayreuth, Deutschland
Phone: +49 160 1832917 (or 0160 1832917)
Email: info@cogniiq.de
```

### Where NAP Must Match:
- ✅ Website footer (using NAP component)
- ✅ Website contact page
- ✅ Structured data (using LocalBusinessSchema)
- 🔲 Google Business Profile
- 🔲 Bing Places
- 🔲 Apple Maps
- 🔲 Facebook Business
- 🔲 LinkedIn Company Page
- 🔲 Email signatures
- 🔲 Business cards
- 🔲 Any other directories

## Google Business Profile Setup

### Quick Start:
1. Go to: https://business.google.com/create
2. Sign in with Google account
3. Enter business name: **Cogniiq**
4. Choose category: **Web Design Agency** or **Marketing Agency**
5. Add location: **Am Main Straße 3, 95444 Bayreuth**
6. Add phone: **0160 1832917**
7. Add website: **https://cogniiq.com**
8. Verify (postcard or phone)

### Complete Guide:
See `GOOGLE_BUSINESS_SETUP_GUIDE` in `google-business-integration.ts` for detailed 10-step setup process.

## Weekly Maintenance Tasks

### Google Business Profile:
- [ ] Post 1-2 updates per week
- [ ] Respond to all reviews within 48 hours
- [ ] Upload new photos monthly
- [ ] Update business hours if changed
- [ ] Add new services when launched

### Website:
- [ ] Monitor Google Search Console
- [ ] Check for broken links
- [ ] Update content with local keywords
- [ ] Add new case studies/testimonials
- [ ] Verify NAP consistency

### Directories:
- [ ] Check listings are accurate
- [ ] Respond to reviews on all platforms
- [ ] Update information if changed

## Measuring Success

### Key Metrics to Track:

1. **Google Business Profile Insights**
   - Search queries
   - Customer actions (calls, directions, website clicks)
   - Photo views
   - Review count and rating

2. **Google Search Console**
   - Local keyword rankings
   - Click-through rate (CTR)
   - Impressions for local terms
   - Average position

3. **Website Analytics**
   - Organic traffic from local searches
   - Time on site from local visitors
   - Conversion rate for local traffic
   - Mobile vs desktop split

4. **Local Rankings**
   - Position for "[service] Bayreuth"
   - Position for "[service] Bayern"
   - Visibility in local pack (map results)

## Local SEO Best Practices

### Content Strategy:
1. Mention location naturally in content
   - ✅ "AI Agentur in Bayreuth"
   - ✅ "Webdesign Agentur für Bayern"
   - ❌ Don't keyword stuff

2. Create location-specific blog posts
   - "Top 5 Unternehmen in Bayreuth"
   - "Webdesign-Trends in Bayern 2024"
   - Case studies from local clients

3. Use local testimonials and case studies

### Technical Optimization:
1. Fast page speed (< 3 seconds)
2. Mobile-responsive design
3. Proper heading hierarchy
4. Alt text for all images
5. Clean URL structure

### Off-Page SEO:
1. Build local backlinks
2. Partner with local businesses
3. Sponsor local events
4. Get featured in local media
5. Join local business associations

## Support & Resources

### Documentation:
- `src/lib/seo-data.ts` - Business data
- `src/lib/google-business-integration.ts` - GBP guide
- `src/lib/seo-metadata.ts` - SEO utilities
- This file - Complete guide

### Useful Links:
- [Google Business Profile](https://business.google.com)
- [Google Search Console](https://search.google.com/search-console)
- [Schema.org LocalBusiness](https://schema.org/LocalBusiness)
- [Google's Local SEO Guide](https://support.google.com/business)

### Testing Tools:
- [Rich Results Test](https://search.google.com/test/rich-results)
- [PageSpeed Insights](https://pagespeed.web.dev)
- [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [Schema Markup Validator](https://validator.schema.org)

## Questions?

For implementation questions or issues, refer to:
1. This guide
2. Component documentation in code
3. Google Business Profile support
4. Local SEO best practices documentation

---

**Last Updated:** 2024-12-04
**Implementation Status:** Components created, integration pending
