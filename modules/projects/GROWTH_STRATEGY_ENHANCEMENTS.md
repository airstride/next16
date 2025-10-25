# Projects Module - Growth Strategy Enhancements

## 🎯 Overview

**Date:** 2025-10-25  
**Status:** ✅ Complete  
**Impact:** CRITICAL for growth strategy generation

We've enhanced the Projects module to capture **ALL** the data a growth hacker needs to build a data-driven 30-day marketing strategy, WITHOUT requiring additional manual research.

---

## 🚀 What Changed

### Before: Basic Company Context
The original schema captured:
- Company name, industry, stage, website
- Product description and features
- Basic ICP (target customer)
- Generic business goals
- Brand voice and social links

**Problem:** Not enough data to build a competitive, data-driven growth strategy.

### After: Comprehensive Growth Intelligence
The enhanced schema now captures:

#### 1. **Competitor Intelligence** 🔍
- 3-5 main competitors with:
  - Name, website, positioning
  - Strengths (what they do better)
  - Weaknesses (gaps to exploit)
  - Estimated monthly traffic
- **Why:** Understand competitive landscape for differentiation

#### 2. **Current Performance Metrics** 📊
- Monthly traffic estimate
- Traffic sources breakdown (Organic, Direct, Referral, Social, Paid)
- Top performing pages and SEO keywords
- Conversion rates, CAC, LTV
- Bounce rate, session duration
- **Why:** Baseline metrics for goal setting and channel prioritization

#### 3. **Content Inventory** 📝
- Total blog posts, case studies, whitepapers, videos, podcasts
- Publishing frequency
- Top performing content URLs
- Content themes
- **Why:** Identify content gaps and repurposing opportunities

#### 4. **Marketing Tech Stack** 🛠️
- CMS (Webflow, WordPress, etc.)
- Analytics (GA4, Plausible, etc.)
- Email platform (Mailchimp, SendGrid, etc.)
- CRM (HubSpot, Salesforce, etc.)
- Social scheduling tools
- Marketing automation
- SEO tools
- **Why:** Understand integration capabilities and automation potential

#### 5. **Team & Resources** 👥
- Total team size
- Marketing team size
- Content writers count
- In-house design/dev capabilities
- Marketing budgets (if public)
- **Why:** Realistic execution constraints and resource allocation

#### 6. **Conversion Funnel** 🎯
- Awareness channels (where traffic comes from)
- Consideration assets (what moves prospects)
- Decision triggers (what closes deals)
- Primary CTA
- Conversion bottleneck
- Average sales cycle
- **Why:** Optimize conversion at every stage

---

## 📋 Technical Changes

### 1. Domain Types (`modules/projects/domain/types.ts`)
Added new interfaces:
```typescript
ICompetitor
ITrafficSource
ICurrentMetrics
IContentInventory
ITechStack
IResources
IConversionFunnel
```

Updated `IProject` to include:
```typescript
competitors?: ICompetitor[];
current_metrics?: ICurrentMetrics;
content_inventory?: IContentInventory;
tech_stack?: ITechStack;
resources?: IResources;
conversion_funnel?: IConversionFunnel;
```

### 2. Mongoose Schema (`modules/projects/infrastructure/schema.ts`)
Added 6 new nested schema sections with full validation:
- `competitors[]` - Array of competitor objects
- `current_metrics` - Performance metrics object
- `content_inventory` - Content audit object
- `tech_stack` - Marketing tools object
- `resources` - Team capacity object
- `conversion_funnel` - Funnel stages object

### 3. AI Extraction Schema (`modules/projects/api/validation.ts`)
Enhanced `AIExtractedContextSchema` with Zod validation for all new fields:
- Proper type validation (strings, numbers, arrays, nested objects)
- Default values for arrays
- Min/max constraints for numbers (e.g., conversion_rate 0-1)
- Optional fields with smart defaults

### 4. Factory (`modules/projects/application/factory.ts`)
Updated `createFromAIResearch()` to map all new AI-extracted fields to domain entity:
```typescript
competitors: extractedContext.competitors,
current_metrics: extractedContext.current_metrics,
content_inventory: extractedContext.content_inventory,
tech_stack: extractedContext.tech_stack,
resources: extractedContext.resources,
conversion_funnel: extractedContext.conversion_funnel,
```

Updated `mergeRefinements()` to support updating growth intelligence fields.

### 5. AI Research Prompt (`modules/projects/application/service.ts`)
**MASSIVE ENHANCEMENT** - Rewrote `buildResearchPrompt()` from ~80 lines to ~200 lines of comprehensive instructions.

#### New Search Strategy Sections:
1. **Company Basics** - Standard company info
2. **Competitive Intelligence** - Find and analyze 3-5 competitors
3. **Performance & Traffic** - Extract traffic data from SimilarWeb/Ahrefs mentions
4. **Content Inventory** - Count and categorize all content types
5. **Tech Stack & Tools** - Detect tools via BuiltWith, blog mentions, integrations
6. **Team & Resources** - LinkedIn company page data extraction
7. **Conversion Funnel** - Map CTAs, lead magnets, sales triggers

#### Extraction Instructions:
- 12 detailed extraction sections (vs 4 in original)
- Specific search queries for each data type
- Confidence scoring guidelines
- Instructions for handling missing data
- Special case handling (early-stage, stealth, no website)

#### Key Improvements:
- **"Leave NO stone unturned"** philosophy
- Emphasis on competitive intelligence ("This data is GOLD")
- Specific data sources (SimilarWeb, BuiltWith, LinkedIn)
- Realistic expectations (e.g., budgets rarely public)
- Quality over quantity (honest about gaps, use confidence scores)

---

## 🧪 Validation Schema Completeness

### Schema Alignment: ✅ PERFECT
The AI extraction prompt now maps 1:1 with the Mongoose schema:

| Mongoose Field | Prompt Section | Status |
|----------------|----------------|--------|
| `company` | Company Fundamentals | ✅ |
| `product` | Company Fundamentals | ✅ |
| `icp` | ICP - Strategic Inference | ✅ |
| `business_goals` | Business Goals | ✅ |
| `brand_voice` | Brand Voice & Style | ✅ |
| `marketing_assets` | Company Fundamentals (social) | ✅ |
| `clients` | Not in AI extraction (manual entry) | ⚠️ |
| `current_mrr/arr` | Not in AI extraction (manual entry) | ⚠️ |
| `competitors` | **Competitor Intelligence** | ✅ NEW |
| `current_metrics` | **Performance Metrics** | ✅ NEW |
| `content_inventory` | **Content Inventory** | ✅ NEW |
| `tech_stack` | **Tech Stack** | ✅ NEW |
| `resources` | **Team & Resources** | ✅ NEW |
| `conversion_funnel` | **Conversion Funnel** | ✅ NEW |

**Note:** Clients and revenue (MRR/ARR) remain manual entry fields as they're typically not public information.

---

## 🎯 Growth Hacker Use Cases - NOW POSSIBLE

### Before Enhancement:
❌ Who are our competitors?  
❌ What's their traffic vs ours?  
❌ What content should we create?  
❌ What tools can we integrate with?  
❌ Do they have resources to execute?  
❌ Where are people dropping off in the funnel?  

### After Enhancement:
✅ **Competitor Analysis:** See top 3-5 competitors with strengths/weaknesses  
✅ **Traffic Benchmarking:** Compare traffic levels and sources  
✅ **Content Strategy:** Identify content gaps and repurposing opportunities  
✅ **Integration Planning:** Know what tools they already use  
✅ **Resource Planning:** Understand team capacity constraints  
✅ **Funnel Optimization:** Identify conversion bottlenecks  

---

## 📈 Expected AI Extraction Quality

### High Confidence Data (0.7-0.9):
- Company name, website, industry
- Product description and features
- Competitors (via search: "domain competitors")
- Social media links
- Content inventory (via site: searches)
- CMS platform (via BuiltWith data)

### Medium Confidence Data (0.4-0.6):
- Traffic estimates (inferred from SimilarWeb mentions)
- Traffic sources (inferred from content strategy)
- Team size (from LinkedIn company page)
- Publishing frequency (from blog post dates)
- Conversion funnel (inferred from website structure)

### Low Confidence Data (0.1-0.3):
- Budgets (rarely public)
- Exact conversion rates (proprietary data)
- Precise CAC/LTV (internal metrics)

**Strategy:** Use confidence scores to flag what needs manual review/refinement.

---

## 🧪 Testing Recommendations

### Test Cases to Run:
1. **Established SaaS Company** (e.g., Shopify, HubSpot)
   - Expect: High confidence, rich competitor data, public traffic stats
   
2. **Early-Stage Startup** (e.g., YC company with minimal web presence)
   - Expect: Medium confidence, limited metrics, heavy inference
   
3. **E-commerce Brand** (e.g., DTC brand)
   - Expect: Good content inventory, social presence, limited tech stack visibility
   
4. **Service Business** (e.g., Agency, consultancy)
   - Expect: Good ICP data from case studies, team size from LinkedIn
   
5. **Non-Existent Website**
   - Expect: Low confidence (0.1), minimal data, clear research notes

### What to Validate:
- ✅ Competitor list is relevant (not random companies)
- ✅ Traffic estimates are reasonable (not wildly inflated)
- ✅ Content inventory counts match reality (spot check)
- ✅ Tech stack is accurate (verify CMS, analytics)
- ✅ Conversion funnel reflects actual customer journey
- ✅ Confidence scores match data quality

---

## 🚀 Next Steps

### Immediate:
- [ ] **Run integration test** with real company (Airstride recommended)
- [ ] **Validate extraction quality** across different company types
- [ ] **Tune prompt** based on test results (if needed)

### Short-Term:
- [ ] **Build Strategy Module** - Use this rich context for 30-day plan generation
- [ ] **Add response DTOs** - Update ProjectResponse to include new fields
- [ ] **Update query config** - Make new fields searchable/filterable

### Future Enhancements:
- [ ] **Periodic re-research** - Refresh competitor/traffic data monthly
- [ ] **Competitive monitoring** - Track competitor changes over time
- [ ] **Benchmark database** - Build industry benchmarks from aggregated data

---

## 📚 Resources

### Prompt Engineering Philosophy:
- **Specificity:** Detailed extraction instructions for each field
- **Searchability:** Explicit search queries to guide AI web search
- **Confidence:** Honest scoring to flag uncertain data
- **Context:** Explain WHY each data point matters for strategy

### Data Sources AI Will Use:
- Company website (primary source)
- SimilarWeb (traffic estimates)
- BuiltWith (tech stack detection)
- LinkedIn (company page, team size)
- Crunchbase (funding, stage)
- Ahrefs/SEMrush mentions (SEO data)
- Google search results (general intelligence)

---

## ✅ Completion Checklist

- [x] Domain types updated with 6 new interfaces
- [x] Mongoose schema updated with full validation
- [x] AI extraction Zod schema updated
- [x] Factory updated to handle new fields
- [x] Research prompt completely rewritten (80 → 200+ lines)
- [x] TODO.md updated with enhancements
- [x] No linting errors
- [x] All changes aligned across layers (domain → infrastructure → api → application)
- [ ] Integration test created and passing
- [ ] Real-world validation with test company

---

## 🎉 Impact Summary

**What we built:** A comprehensive company research engine that extracts competitive intelligence, performance metrics, content strategy, tech stack, team capacity, and conversion funnel data automatically from a website URL.

**What this enables:** Growth hackers can now generate data-driven 30-day marketing strategies WITHOUT doing hours of manual research. The AI does the heavy lifting, extracting everything from competitor positioning to tech stack to conversion bottlenecks.

**What's next:** Test with real companies, tune the prompt based on results, then use this rich context to power the Strategy Module's plan generation.

---

**The prompt now asks the AI to "Leave NO stone unturned" - and it has the schema to back it up.** 🚀

