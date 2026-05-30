"use client";

import { motion } from "framer-motion";
import {
  KCButton,
  KCBadge,
  KCCard,
  KCFooter,
  KCNavbar,
  KCSearchBar,
  KCSectionHeader,
  KCStatCard,
  MotionInView,
  fadeInUp,
  scaleIn,
  staggerChildren
} from "@kashmir/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { TestimonialsCarousel } from "./_components/testimonials-carousel";

const navItems = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#join", label: "Join" }
];

const featureCards = [
  {
    title: "Tourism",
    description: "Showcase houseboats on Dal Lake, Gulmarg stays, and local experiences with verified trust badges.",
    badge: "Featured",
    variant: "featured" as const
  },
  {
    title: "Emergency",
    description: "Rapid local updates for weather, roads, and community response across key Kashmir destinations.",
    badge: "Verified",
    variant: "verified" as const
  },
  {
    title: "Marketplace",
    description: "Sell saffron, walnuts, pashmina, and handcrafted goods through elegant storefronts that convert.",
    badge: "Sector",
    variant: "sector" as const
  },
  {
    title: "Community",
    description: "Neighborhood bulletin boards for events, artisans, and volunteers from Srinagar to Kupwara.",
    badge: "Pending",
    variant: "pending" as const
  },
  {
    title: "Students",
    description: "Campus societies and tutors list opportunities and connect with learners in a trusted local network.",
    badge: "Sector",
    variant: "sector" as const
  },
  {
    title: "Government",
    description: "District-level service discovery and citizen communication channels with modern UX and accessibility.",
    badge: "Verified",
    variant: "verified" as const
  }
];

const steps = [
  {
    title: "Create your digital identity",
    description: "Set up your storefront in minutes with sector templates tailored for crafts, food, tourism, and services."
  },
  {
    title: "Publish and build trust",
    description: "Share your verified profile, collect reviews, and spread your page across WhatsApp and social channels."
  },
  {
    title: "Operate with intelligence",
    description: "Track leads, orders, and analytics while AI guidance helps you grow sustainably across all 32 districts."
  }
];

export default function MarketingPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <KCNavbar
        brand="Kashmir Connect"
        items={navItems}
        rightSlot={
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <KCButton size="sm">Get Started</KCButton>
          </div>
        }
      />

      <main>
        <section className="relative flex min-h-[92vh] items-center overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            poster="https://images.unsplash.com/photo-1582807168392-6f8a13e6f1de?auto=format&fit=crop&w=1800&q=80"
          >
            <source src="https://cdn.coverr.co/videos/coverr-sunrise-over-the-lake-1579/1080p.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/30 to-black/45" />

          <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 lg:grid-cols-[1.2fr_0.8fr]">
            <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="space-y-6">
              <motion.div variants={fadeInUp}>
                <KCBadge variant="featured">Apple clarity. Airbnb warmth. Kashmir soul.</KCBadge>
              </motion.div>
              <motion.h1
                variants={fadeInUp}
                className="max-w-3xl text-balance text-4xl font-semibold leading-tight text-[#FAF6EF] md:text-6xl"
              >
                Kashmir&apos;s Digital Operating System
              </motion.h1>
              <motion.p variants={fadeInUp} className="max-w-2xl text-base text-[#f7ede0] md:text-lg">
                From Dal Lake shikaras to Pahalgam homestays and heritage handicrafts, Kashmir Connect powers commerce,
                trust, and community at scale.
              </motion.p>
              <motion.p variants={fadeInUp} className="ur-text text-right text-lg text-[#f7ede0]">
                کشمیر کا ڈیجیٹل نظام — کاروبار، کمیونٹی اور اعتماد
              </motion.p>
              <motion.div variants={fadeInUp} className="max-w-xl">
                <KCSearchBar placeholder="Search Dal Lake tours, Pashmina stores, district services..." />
              </motion.div>
              <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3">
                <KCButton size="lg">Launch Your Storefront</KCButton>
                <KCButton variant="ghost" size="lg" className="bg-white/15 text-white hover:bg-white/25 dark:bg-[#15243a]/60">
                  Explore Marketplace
                </KCButton>
              </motion.div>
            </motion.div>

            <motion.div variants={scaleIn} initial="hidden" animate="visible">
              <KCCard variant="glass" className="grid gap-4">
                <KCStatCard label="Registered merchants across Kashmir" value={10000} suffix="+" />
                <KCStatCard label="Monthly visitor discovery events" value={500000} suffix="+" />
                <KCStatCard label="Districts connected through one platform" value={32} />
              </KCCard>
            </motion.div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-20">
          <KCSectionHeader
            eyebrow="Platform Modules"
            title="One connected platform for every local use case"
            description="Purpose-built modules that blend tourism, business operations, and public service into one elegant digital experience."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature) => (
              <MotionInView key={feature.title} variants={fadeInUp}>
                <KCCard variant="elevated" className="h-full space-y-3">
                  <KCBadge variant={feature.variant}>{feature.badge}</KCBadge>
                  <h3 className="text-xl font-semibold text-[#3D1F0D] dark:text-[#f6e2c0]">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-[#5b4739] dark:text-[#c7d5e8]">{feature.description}</p>
                </KCCard>
              </MotionInView>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="bg-gradient-to-b from-[#f6ecdd] to-[#faf6ef] px-4 py-20 dark:from-[#0d1728] dark:to-[#0b1220]">
          <div className="mx-auto max-w-7xl">
            <KCSectionHeader
              eyebrow="How It Works"
              title="A simple 3-step journey to digital growth"
              description="Designed for local business owners with minimal setup and maximum operational impact."
            />
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {steps.map((step, idx) => (
                <MotionInView key={step.title} variants={fadeInUp}>
                  <KCCard className="h-full space-y-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#3D1F0D] text-sm font-semibold text-[#FAF6EF] dark:bg-[#C8972A] dark:text-[#1b1208]">
                      {idx + 1}
                    </div>
                    <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f6e2c0]">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-[#5b4739] dark:text-[#c7d5e8]">{step.description}</p>
                  </KCCard>
                </MotionInView>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="mx-auto max-w-7xl px-4 py-20">
          <KCSectionHeader
            eyebrow="Voices from Kashmir"
            title="Loved by artisans, hosts, and local founders"
            description="Real stories from businesses using Kashmir Connect in Srinagar, Pahalgam, and beyond."
          />
          <div className="mx-auto mt-12 max-w-3xl">
            <TestimonialsCarousel />
          </div>
        </section>

        <section id="join" className="px-4 pb-24">
          <div className="mx-auto max-w-7xl">
            <KCCard
              variant="elevated"
              className="overflow-hidden bg-gradient-to-r from-[#3D1F0D] via-[#1B6CA8] to-[#C0392B] text-[#FAF6EF]"
            >
              <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
                <div className="space-y-3">
                  <h3 className="text-3xl font-semibold">Bring your district online with confidence</h3>
                  <p className="text-sm text-[#f4e7d1] md:text-base">
                    Whether you are in Gulmarg, Anantnag, Baramulla, or Kulgam, Kashmir Connect gives your business a
                    premium digital presence with zero platform fees.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 md:justify-end">
                  <KCButton variant="secondary" size="lg">
                    Start Free Today
                  </KCButton>
                  <KCButton
                    variant="ghost"
                    size="lg"
                    className="border-white/40 text-white hover:bg-white/20 dark:border-white/40 dark:text-white dark:hover:bg-white/20"
                  >
                    Request Demo
                  </KCButton>
                </div>
              </div>
            </KCCard>
          </div>
        </section>
      </main>

      <KCFooter />
    </div>
  );
}
