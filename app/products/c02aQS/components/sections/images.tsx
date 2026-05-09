"use client";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import styles from "./images.module.css";

import { CSSProperties, useState, useRef, useEffect } from "react";
import Image, { StaticImageData } from "next/image";
import { Swiper, SwiperSlide, SwiperRef } from "swiper/react";
import { register } from "swiper/element/bundle";
import { FreeMode, Pagination, Thumbs } from "swiper/modules";
import {
  variant,
  images,
  mainImages,
} from "@/app/products/c02aQS/lib/constants";

type Props = {
  className?: string | undefined;
};

type TImage = {
  name: string;
  value: string;
  src: StaticImageData;
};

const Images = ({ className = "" }: Props) => {
  useEffect(() => {
    register();
  }, []);

  const mainSwiperRef = useRef<SwiperRef>(null);
  const thumbsSwiperRef = useRef<SwiperRef>(null);
  const [mainRealIndex, setMainRealIndex] = useState<number>(0);
  const [mainPreviousRealIndex, setMainPreviousRealIndex] = useState<number>(0);

  const mainImagesTotal = mainImages.length;

  const chooseVariantColor = (image: TImage, index: number) => {
    mainSwiperRef.current?.swiper.slideToLoop(
      mainImagesTotal + index,
      500,
      false,
    );
  };

  const onMainActiveIndexChange = (realIndex: number) => {
    if (realIndex !== mainRealIndex) {
      setMainPreviousRealIndex(mainRealIndex);
      setMainRealIndex(realIndex);

      if (thumbsSwiperRef.current?.swiper) {
        if (realIndex >= mainImagesTotal) {
          thumbsSwiperRef.current?.swiper.slideTo(realIndex - mainImagesTotal);
        } else {
          thumbsSwiperRef.current?.swiper.slideTo(0);
        }
      }
    }
  };

  return (
    <section className={className}>
      {/* Swiper Utama */}
      <Swiper
        ref={mainSwiperRef}
        modules={[FreeMode, Pagination, Thumbs]}
        loop={true}
        navigation={false}
        centeredSlides={false}
        grabCursor={true}
        autoHeight={false}
        spaceBetween={0}
        pagination={{
          type: "fraction",
          renderFraction(currentClass, totalClass) {
            return `
              <div class="bg-background/80 text-center text-tiny font-medium text-foreground px-2 py-0.5 border border-border rounded-md inline-flex backdrop-blur-sm">
                <span class="${currentClass}"></span> / <span class="${totalClass}"></span>
              </div>
            `;
          },
        }}
        className={styles["swiper-ovveride"]}
        style={
          {
            "--swiper-navigation-color": "var(--primary)",
            "--swiper-pagination-color": "var(--primary)",
          } as CSSProperties
        }
        onSlideChange={(swiper) => onMainActiveIndexChange(swiper.realIndex)}
      >
        {images.map((image, idx) => (
          <SwiperSlide key={idx}>
            <div className="relative mx-auto w-full">
              <Image
                src={image.src}
                alt={image.name}
                className="h-auto w-full"
                priority={idx === 0}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Teks Deskripsi Varian */}
      <div className="bg-background py-1">
        <p className="mb-0 px-2 text-tiny text-muted-foreground">
          {variant.colors[mainRealIndex - mainImagesTotal]?.value ? (
            <span>Warna: {variant.colors[mainRealIndex - mainImagesTotal].name}</span>
          ) : (
            <span>Terdapat {variant.colors.length} variasi warna</span>
          )}
        </p>
      </div>

      {/* Swiper Thumbs (Daftar Varian) */}
      <div className="bg-background mx-1">
        <Swiper
          ref={thumbsSwiperRef}
          modules={[FreeMode, Thumbs]}
          loop={false}
          freeMode={true}
          watchSlidesProgress={true}
          slidesPerView={"auto"}
          spaceBetween={0}
          className="px-2 py-5"
        >
          {variant.colors.map((image, idx) => {
            const isActive = mainRealIndex === (mainImagesTotal + idx);
            return (
              <SwiperSlide
                key={idx}
                className={`${styles["swiper-slide-ovveride"]} w-auto px-1`}
              >
                <div
                  onClick={() => chooseVariantColor(image, idx)}
                  className={`relative aspect-square h-14 w-14 md:h-16 md:w-16 cursor-pointer transition-all border-2 ${isActive ? "border-primary-300 opacity-100" : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                >
                  <div className="h-full w-full">
                    <Image
                      src={image.src}
                      alt={image.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
};

export default Images;
