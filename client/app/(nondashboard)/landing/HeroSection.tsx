"use client";
import Image from "next/image";
import { motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
const HeroSection = () => {
  return (
    <div className="relative h-screen">
      <Image
        src={"/landing-splash.jpg"}
        alt="HomeScout Rental Platform Hero Section"
        fill
        className="object-cover object-center"
        priority
      />
      <div className="absolute inset-0 bg-black/60" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute top-1/3 -translate-y-1/2 text-center w-full"
      >
        <div className="max-w-4xl mx-auto px-16 sm:px-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Start your rental journey with HomeScout today!
          </h1>
          <p className="text-xl text-white mb-8">
            Discover your perfect rental home with HomeScout. Our platform
            offers a seamless experience to find, compare, and secure your ideal
            rental property. Whether you&apos;re looking for a cozy apartment or
            a spacious house, HomeScout has you covered. Start exploring now and
            find your next home with ease!
          </p>

          <div className="flex justify-center">
            <Input
              type="text"
              value="search query"
              onChange={() => {}}
              placeholder="Search by city, neighborhood or address"
              className="w-full max-w-lg rounded-none rounded-l-xl border-none bg-white h-12"
            />
            <Button
              onClick={() => {}}
              className="bg-secondary-500 text-white rounded-none rounded-r-xl border-none hover:bg-secondary-600 h-12 cursor-pointer"
            >
              Search
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection;
