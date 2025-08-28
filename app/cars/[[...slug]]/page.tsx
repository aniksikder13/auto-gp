// app/cars/[[...slug]]/page.tsx
import Features from "@/components/ui/Features";
import CarsClient from "./CarsClient";

// Car type configurations
const CAR_TYPE_CONFIGS = {
  all: {
    title: "Choose per your preference",
    heading: " Reconditioned Unit",
    linkurl: "/cars/brand-new",
    description:
      "Glance through the widest collection of reconditioned Japanese models & pre-owned European units and choose according to your budget & quality preferences.",
    bannerImage: "/images/banner.png",
    baseApiParams: {},
    seoTitle: "All Cars - Our Complete Inventory",
    seoDescription: "Browse our complete collection of available cars",
  },
  "brand-new": {
    title: "Choose per your preference",
    heading: " Pre-owned Unit",
    linkurl: "/cars/pre-owned",
    description:
      "Glance through the widest collection of reconditioned Japanese models & pre-owned European units and choose according to your budget & quality preferences.",
    bannerImage: "/images/banner.png",
    baseApiParams: { car_type: "BRAND NEW, RECONDITIONED" },
    seoTitle: "Brand New Cars - Latest Models",
    seoDescription:
      "Discover our collection of brand new vehicles with full warranty",
  },
  "pre-owned": {
    title: "Choose per your preference",
    heading: " Reconditioned Unit",
    linkurl: "/cars/brand-new",
    description:
      "Glance through the widest collection of reconditioned Japanese models & pre-owned European units and choose according to your budget & quality preferences.",
    bannerImage: "/images/banner.png",
    baseApiParams: { car_type: "PRE OWNED" },
    seoTitle: "Pre-Owned Cars - Quality Used Vehicles",
    seoDescription: "Browse our collection of quality pre-owned vehicles",
  },
  // "luxury-cars": {
  //   title: "Luxury Cars Collection!",
  //   description:
  //     "Experience the finest in automotive luxury with our premium collection of luxury vehicles. Sophisticated design meets exceptional performance.",
  //   bannerImage: "/images/banner.png",
  //   baseApiParams: { inventory_type: "LUXURY" },
  //   seoTitle: "Luxury Cars - Premium Vehicles",
  //   seoDescription: "Explore our premium collection of luxury vehicles",
  // },
  // "budget-cars": {
  //   title: "Budget Friendly Cars!",
  //   description:
  //     "Quality vehicles at affordable prices. Find the perfect car that fits your budget without compromising on reliability and performance.",
  //   bannerImage: "/images/banner.png",
  //   baseApiParams: { inventory_type: "BUDGET FRIENDLY" },
  //   seoTitle: "Budget Cars - Affordable Vehicles",
  //   seoDescription: "Find quality budget-friendly cars at great prices",
  // },
};

interface CarsPageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export default async function ProductListing({ params }: CarsPageProps) {
  // Await the params promise
  const resolvedParams = await params;

  // Get car type from URL
  const carType = resolvedParams.slug?.[0] || "all";
  const config =
    CAR_TYPE_CONFIGS[carType as keyof typeof CAR_TYPE_CONFIGS] ||
    CAR_TYPE_CONFIGS.all;

  return (
    <div className="bg-black text-white min-h-screen container-responsive">
      {/* Header Banner */}
      <div className="container mx-auto px-4 pt-20">
        <h1 className="text-4xl font-bold pt-20 mb-5">{config.title}</h1>
        <p className="text-gray-200 sm:w-40 md:w-3xl lg:w-4xl mb-10 text-justify">
          {config.description}
        </p>

        {/* Pass config to client component */}
        <CarsClient config={config} />
      </div>

      {/* Footer with services */}
      <Features />
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CarsPageProps) {
  // Await the params promise
  const resolvedParams = await params;

  const carType = resolvedParams.slug?.[0] || "all";
  const config =
    CAR_TYPE_CONFIGS[carType as keyof typeof CAR_TYPE_CONFIGS] ||
    CAR_TYPE_CONFIGS.all;

  return {
    title: config.seoTitle,
    description: config.seoDescription,
    openGraph: {
      title: config.seoTitle,
      description: config.seoDescription,
      type: "website",
    },
  };
}
