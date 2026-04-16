"use client";
import Image from "next/image";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const CallToActionSections = () => {
  return (
    <div className="relative py-24">
      <Image
        src={"/landing-call-to-action.jpg"}
        alt="HomeScout Search Section Background"
        fill
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-black/60"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative max-w-4xl xl:max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12"
      >
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0 md:mr-10">
            <h2 className="text-2xl font-bold text-white">
              Find Your Dream Rental Property Today!
            </h2>
          </div>
          <div>
            <p className="text-white mb-3">
              Discover a wide range of rental properties, from cozy apartments
              to spacious houses, all in one place. Start your search now and
              find the perfect home that suits your lifestyle and budget.
            </p>
            <div className="flex justify-center md:justify-start gap-4">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-block text-primary-700 bg-white rounded-lg px-6 py-3 font-semibold hover:bg-primary-500 hover:text-primary-50 cursor-pointer"
              >
                Search
              </button>
              <Link
                href="/signup"
                className="inline-block text-white bg-secondary-500 rounded-lg px-6 py-3 font-semibold hover:bg-secondary-600 "
                scroll={false}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CallToActionSections;
