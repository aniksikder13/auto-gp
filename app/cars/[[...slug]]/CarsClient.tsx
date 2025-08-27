// app/cars/[[...slug]]/CarsClient.tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PriceRangeFilter from "./PriceRangeFilter";

// Define Car interface
interface Car {
  id: number;
  name: string;
  brand: string;
  model: string;
  year: number;
  engine_capacity: string;
  fuel_type: string;
  mileage: string;
  price: string;
  feature_image: string;
  body_style?: number;
  car_type?: string;
  registered: string;
  availability?: string;
}

// Define API response interface
interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    total_page: number;
    current_page: number;
    pagesize: number;
    total_rows: number;
    next: string | null;
    previous: string | null;
    results: Car[];
  };
}

interface Config {
  title: string;
  heading: string;
  linkurl: string;
  description: string;
  bannerImage: string;
  baseApiParams: Record<string, string>;
  seoTitle: string;
  seoDescription: string;
}

interface CarsClientProps {
  config: Config;
}
function formatBDT(amount: number) {
  const takaSymbol = "BDT";
  const numStr = amount.toString();
  const [integer] = numStr.split(".");

  // Format the integer part using Indian number system
  const lastThree = integer.slice(-3);
  const otherNumbers = integer.slice(0, -3);
  const formattedInteger = otherNumbers
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
    : lastThree;

  return `${takaSymbol} ${formattedInteger}`;
}

export default function CarsClient({ config }: CarsClientProps) {
  // State for cars and loading
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Mobile filter state
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Filter states
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedEngineCapacity, setSelectedEngineCapacity] =
    useState<string>("");
  const [selectedBodyStyle, setSelectedBodyStyle] = useState<string>("");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("");
  const [selectedAvailability, setSelectedAvailability] = useState<string>("");

  // Filter options
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);

  const [bodyStyles, setBodyStyles] = useState<{ id: number; body: string }[]>(
    []
  );

  const [availabilities] = useState<string[]>([
    "Available",
    "Sold",
    "Reserved",
  ]);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(10);
  const carsPerPage = 12;

  // Helper function to build API URL with filters
  const buildApiUrl = useCallback(
    (page: number = 1) => {
      const baseUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/inventory/`;
      const params = new URLSearchParams();

      // Add pagination parameters
      params.append("limit", carsPerPage.toString());
      params.append("offset", ((page - 1) * carsPerPage).toString());

      // Add base parameters for car type
      Object.entries(config.baseApiParams).forEach(([key, value]) => {
        params.append(key, value);
      });

      // Add filter parameters
      if (selectedBrand) params.append("brand", selectedBrand);
      if (selectedModel) params.append("model", selectedModel);
      if (selectedYear) params.append("year", selectedYear);
      if (selectedEngineCapacity)
        params.append("engine_capacity", selectedEngineCapacity);
      if (selectedBodyStyle) params.append("body_style", selectedBodyStyle);

      // Handle price range - UPDATED LOGIC
      if (selectedPriceRange) {
        if (selectedPriceRange === "under-1000000") {
          params.append("price_max", "1000000");
        } else if (selectedPriceRange === "1000000-2000000") {
          params.append("price_min", "1000000");
          params.append("price_max", "2000000");
        } else if (selectedPriceRange === "2000000-3000000") {
          params.append("price_min", "2000000");
          params.append("price_max", "3000000");
        } else if (selectedPriceRange === "3000000-plus") {
          params.append("price_min", "3000000");
        } else if (selectedPriceRange.includes("-")) {
          // Handle custom range format "min-max"
          const [min, max] = selectedPriceRange.split("-");
          if (min && min !== "0") params.append("price_min", min);
          if (max && max !== "5000000") params.append("price_max", max);
        }
      }

      // Handle availability
      if (selectedAvailability) {
        params.append("availability", selectedAvailability);
      }

      return `${baseUrl}?${params.toString()}`;
    },
    [
      carsPerPage,
      config.baseApiParams,
      selectedBrand,
      selectedModel,
      selectedYear,
      selectedEngineCapacity,
      selectedBodyStyle,
      selectedPriceRange,
      selectedAvailability,
    ]
  );

  // Fetch filter options (only once at initial load)
  const fetchFilterOptions = useCallback(async () => {
    try {
      // Build URL with base params for getting filter options
      const baseUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/inventory/`;
      const params = new URLSearchParams();
      params.append("limit", "100");

      // Add base parameters for car type
      Object.entries(config.baseApiParams).forEach(([key, value]) => {
        params.append(key, value);
      });

      const response = await fetch(`${baseUrl}?${params.toString()}`);
      const data: ApiResponse = await response.json();

      if (data.success) {
        const carsData = data.data.results;
        const uniqueBrands = Array.from(
          new Set(carsData.map((car) => car.brand))
        );
        const uniqueModels = Array.from(
          new Set(carsData.map((car) => car.model))
        );

        setBrands(uniqueBrands);
        setModels(uniqueModels);
      }
    } catch (err) {
      console.error("Error fetching filter options:", err);
    }
  }, [config.baseApiParams]);

  // Fetch cars with filters
  const fetchCars = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      try {
        const apiUrl = buildApiUrl(page);
        const response = await fetch(apiUrl);
        const data: ApiResponse = await response.json();

        if (data?.success) {
          setCars(data?.data?.results);
          setTotalPages(data?.data?.total_page);
        } else {
          setError("Failed to fetch cars data");
        }
      } catch (err) {
        console.error("Error fetching cars:", err);
        setError("An error occurred while fetching cars");
      } finally {
        setLoading(false);
      }
    },
    [buildApiUrl]
  );

  // fetch body styles from API
  const fetchBodyStyles = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/inventory/body-style/`
      );
      const data = await response.json();

      if (data.success) {
        setBodyStyles(data.data);
      } else {
        console.error("Failed to fetch body styles");
      }
    } catch (err) {
      console.error("Error fetching body styles:", err);
    }
  };

  // Load initial filter options and body styles
  useEffect(() => {
    fetchFilterOptions();
    fetchBodyStyles();
  }, [fetchFilterOptions]);

  // Fetch cars whenever filters or pagination changes
  useEffect(() => {
    fetchCars(currentPage);
  }, [currentPage, fetchCars]);

  // Reset filters when config changes
  useEffect(() => {
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedYear("");
    setSelectedEngineCapacity("");
    setSelectedBodyStyle("");
    //  setSelectedPriceRange("");
    setSelectedAvailability("");
    setCurrentPage(1);
  }, [config]);

  // Reset all filters
  const resetFilters = () => {
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedYear("");
    setSelectedEngineCapacity("");
    setSelectedBodyStyle("");
    //   setSelectedPriceRange("");
    setSelectedAvailability("");
    setCurrentPage(1);
  };

  // Apply filters and close mobile filters
  const applyFilters = () => {
    setCurrentPage(1);
    setShowMobileFilters(false);
    fetchCars(1);
  };

  // Pagination
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 relative min-h-screen ">
      {/* Mobile Filter Button */}
      <div className="md:hidden flex justify-center mb-4">
        <button
          className="w-full bg-black border border-gray-700 text-white py-2 rounded hover:bg-gray-800 transition flex items-center justify-center gap-2"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          {showMobileFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {/* Filter Sidebar - Hidden on mobile by default, shown when button clicked */}
      <div
        className={`w-full md:w-1/5 ${
          showMobileFilters ? "block" : "hidden md:block"
        }`}
      >
        <div className="md:sticky md:top-24 md:mb-15 relative z-50 bg-black p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Filter</h2>
          <div className="relative z-50">
            <PriceRangeFilter
              selectedPriceRange={selectedPriceRange}
              onPriceRangeChange={setSelectedPriceRange}
            />
          </div>
          {/* Brand filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Brand</label>
            <div className="relative">
              <select
                className="w-full p-2 bg-black border border-gray-700 rounded appearance-none"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
              >
                <option value="">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
          {/* Model Generation filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Model Generation
            </label>
            <div className="relative">
              <select
                className="w-full p-2 bg-black border border-gray-700 rounded appearance-none"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="">All Model</option>
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Body Style filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Body Style</label>
            <div className="relative">
              <select
                className="w-full p-2 bg-black border border-gray-700 rounded appearance-none"
                value={selectedBodyStyle}
                onChange={(e) => setSelectedBodyStyle(e.target.value)}
              >
                <option value="">All Body style</option>
                {bodyStyles.map((style) => (
                  <option key={style.id} value={style.id.toString()}>
                    {style.body}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
          {/* Availability filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Availability
            </label>
            <div className="relative">
              <select
                className="w-full p-2 bg-black border border-gray-700 rounded appearance-none"
                value={selectedAvailability}
                onChange={(e) => setSelectedAvailability(e.target.value)}
              >
                <option value="">All Available</option>
                {availabilities.map((availability) => (
                  <option key={availability} value={availability.toLowerCase()}>
                    {availability}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Apply Filters Button (Mobile Only) */}
          <div className="md:hidden flex gap-2">
            <button
              className="flex-1 bg-gray-700 border border-gray-600 text-white py-2 rounded hover:bg-gray-600 transition"
              onClick={() => setShowMobileFilters(false)}
            >
              Cancel
            </button>
            <button
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              onClick={applyFilters}
            >
              Apply Filters
            </button>
          </div>

          {/* Reset filters button */}
          <button
            className="w-full bg-black border border-gray-700 text-white py-2 rounded hover:bg-gray-800 transition mt-4"
            onClick={resetFilters}
          >
            Reset All Filters
          </button>
        </div>
      </div>

      {/* Right side for car listings */}
      <div className="w-full md:w-4/5">
        {/* Dynamic banner */}
        <div className="container mx-auto mb-8">
          <Link href={config.linkurl}>
            <div
              className=" relative bg-cover bg-no-repeat bg-center h-20 md:h-28 lg:h-35 w-full cursor-pointer rounded-[5px]"
              style={{
                backgroundImage: `url('${config.bannerImage}')`,
              }}
            >
              <div className="absolute inset-0 bg-black/10 flex items-end p-3 md:p-5">
                <div className="flex items-center justify-between w-full text-white">
                  <div className="group ">
                    <h2 className="text-xl md:text-3xl font-semibold mb-2 transition-all duration-300 group-hover:translate-x-1">
                      {config.heading}
                    </h2>
                  </div>
                  <svg
                    className="w-8 h-8 text-gray-600 rounded-[4px] bg-white p-1 ml-4 group-hover:translate-x-1 transition-transform duration-200"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3z" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400">Loading cars...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            <p className="text-xl">{error}</p>
            <button
              className="mt-4 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
              onClick={() => fetchCars(currentPage)}
            >
              Try Again
            </button>
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400">
              No cars found matching your filters.
            </p>
            <button
              className="mt-4 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {cars?.map((car) => (
              <Link
                key={car.id}
                href={`/car-details/${car.id}`}
                className="block bg-[#0D0D0D] text-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition"
              >
                {/* Image */}
                <div className="relative z-10">
                  {car?.feature_image ? (
                    <Image
                      src={car?.feature_image}
                      alt={car?.name}
                      width={292}
                      height={243}
                      // unoptimized
                      className="w-full h-[243px] object-cover"
                      priority
                    />
                  ) : (
                    <div className="w-full h-[243px] bg-gray-800 flex items-center justify-center">
                      <span className="text-gray-500">No Image</span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <h3 className="text-base font-semibold leading-tight">
                    {car?.name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">{car?.model}</p>

                  <div className="flex justify-between text-xs text-gray-400 border-b border-gray-700 pb-2 mt-2">
                    <span>{car?.fuel_type}</span>
                    <span>{car?.car_type}</span>
                    <span>{car?.mileage}</span>
                  </div>

                  <p className="font-bold text-base mt-3">
                    {formatBDT(Number(car?.price))}
                  </p>

                  <div className="w-full mt-3 bg-white text-black text-center py-2 rounded-md hover:bg-gray-200 transition text-sm font-medium">
                    Show Details
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-8 mb-8 flex justify-between">
            <button
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center space-x-2 text-gray-100 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Previous</span>
            </button>

            <div className="flex space-x-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded ${
                      currentPage === pageNum
                        ? "bg-gray-700 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-1 text-gray-400">...</span>
                  <button
                    onClick={() => paginate(totalPages)}
                    className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:text-white"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-2 text-gray-400 hover:text-white"
            >
              <span>Next</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
