"use client";

import styles from "./images.module.css";

import { CSSProperties, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperClass } from "swiper";
import { FreeMode, Pagination, Thumbs } from "swiper/modules";

import {
  variant,
  images,
  mainImages,
} from "@/app/products/c02aQS/lib/constants";

type Props = {
  className?: string | undefined;
};

const Images = ({ className = "" }: Props) => {
  const [mainSwiper, setMainSwiper] = useState<SwiperClass | null>(null);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperClass | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const mainImagesTotal = mainImages.length; // Biasanya 1

  const handleThumbClick = (index: number) => {
    if (mainSwiper) {
      // Pindah ke slide varian warna (indeks warna dimulai setelah main images)
      mainSwiper.slideToLoop(mainImagesTotal + index, 500);
    }
  };

  const onMainSlideChange = (swiper: SwiperClass) => {
    const realIndex = swiper.realIndex;
    setActiveIndex(realIndex);

    if (thumbsSwiper) {
      // Sync thumbs swiper position
      if (realIndex >= mainImagesTotal) {
        thumbsSwiper.slideTo(realIndex - mainImagesTotal);
      } else {
        thumbsSwiper.slideTo(0);
      }
    }
  };

  return (
    <section className={className}>
      {/* Swiper Utama */}
      <Swiper
        onSwiper={setMainSwiper}
        style={{
          "--swiper-navigation-color": "#fff",
          "--swiper-pagination-color": "#fff",
        } as CSSProperties}
        loop={true}
        spaceBetween={0}
        navigation={false}
        modules={[FreeMode, Pagination, Thumbs]}
        onSlideChange={onMainSlideChange}
        pagination={{
          type: "fraction",
          renderFraction(currentClass, totalClass) {
            return `
              <div class="bg-white/75 text-center text-xs text-gray-800 px-1 py-0.5 border border-gray-300 rounded-md inline-flex opacity-90">
                <span class="${currentClass}"></span> / <span class="${totalClass}"></span>
              </div>
            `;
          },
        }}
        className={styles["swiper-ovveride"]}
      >
        {images.map((image, idx) => (
          <SwiperSlide key={idx}>
            <div className="relative mx-auto aspect-square w-full overflow-hidden">
              <Image
                src={image.src}
                alt={image.name}
                className="h-full w-full object-cover"
                priority={idx === 0}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Teks Deskripsi Varian */}
      <div className="mt-2">
        <p className="mb-0.5 px-0.5 text-xs">
          {activeIndex >= mainImagesTotal && variant.colors[activeIndex - mainImagesTotal] ? (
            <small>{variant.colors[activeIndex - mainImagesTotal].name}</small>
          ) : (
            <small>Terdapat {variant.colors.length} variasi warna</small>
          )}
        </p>
      </div>

      {/* Swiper Thumbs (Daftar Varian) */}
      <Swiper
        onSwiper={setThumbsSwiper}
        loop={false} // Thumbs biasanya tidak loop agar stabil
        spaceBetween={0}
        slidesPerView={"auto"}
        freeMode={true}
        watchSlidesProgress={true}
        modules={[FreeMode, Thumbs]}
        className="mt-2"
      >
        {variant.colors.map((image, idx) => (
          <SwiperSlide 
            key={idx} 
            className="w-auto px-[0.175rem]"
          >
            <div
              onClick={() => handleThumbClick(idx)}
              className={`aspect-square h-16 w-16 overflow-hidden md:h-20 md:w-20 cursor-pointer border-2 ${
                activeIndex === (mainImagesTotal + idx) ? "border-[#ee4d2d]" : "border-transparent"
              }`}
            >
              <Image
                src={image.src}
                alt={image.name}
                className="h-full w-full object-cover"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default Images;
