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

      // slide next
      if (mainRealIndex > realIndex) {
        thumbsSwiperRef.current?.swiper.slideTo(realIndex - mainImagesTotal);
      }
      // prev
      else {
        thumbsSwiperRef.current?.swiper.slideTo(realIndex - mainImagesTotal);
      }
    }
  };

  return (
    <section className={className}>
      <Swiper
        ref={mainSwiperRef}
        modules={[FreeMode, Pagination, Thumbs]}
        loop={true}
        navigation={false}
        centeredSlides={false}
        grabCursor={true}
        autoHeight={false}
        spaceBetween={0}
        // thumbs={{ swiper: thumbsSwiper }}
        pagination={{
          type: "fraction",
          renderFraction(currentClass, totalClass) {
            return `
              <div class="bg-surface-strong/75 text-center text-[10px] font-medium text-foreground px-2 py-0.5 border border-border rounded-md inline-flex backdrop-blur-sm">
                <span class="${currentClass}"></span> / <span class="${totalClass}"></span>
              </div>
            `;
          },
        }}
        className={`${styles["swiper-ovveride"]}`}
        style={
          {
            "--swiper-navigation-color": "var(--primary)",
            "--swiper-pagination-color": "var(--primary)",
          } as CSSProperties
        }
        onSlideChange={(swiper) => onMainActiveIndexChange(swiper.realIndex)}
      >
        {images.map((image, idx) => {
          return (
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
          );
        })}
      </Swiper>

      {/* variants:name */}
      <div className="bg-surface-strong border-b border-border py-1">
        <p className="mb-0 px-2 text-[10px] text-ink-muted">
          {variant.colors[mainRealIndex - mainImagesTotal]?.value ? (
            <span>
              Warna: {variant.colors[mainRealIndex - mainImagesTotal].name}
            </span>
          ) : (
            <span>Terdapat {variant.colors.length} variasi warna</span>
          )}
        </p>
      </div>

      {/* thumbs */}
      <div className="bg-surface-strong pb-2 pt-2">
        <Swiper
          ref={thumbsSwiperRef}
          modules={[FreeMode, Thumbs]}
          loop={false}
          freeMode={true}
          autoHeight={false}
          watchSlidesProgress={true}
          // breakpoints={breakpoints}
          slidesPerView={"auto"}
          spaceBetween={0}
        >
          {variant.colors.slice(0).map((image, idx) => {
            return (
              <SwiperSlide
                key={idx}
                className={`${styles["swiper-slide-ovveride"]} px-[0.175rem]`}
              >
                <div
                  className={`aspect-square h-14 w-14 overflow-hidden rounded-md transition-all md:h-16 md:w-16 cursor-pointer ${idx === mainRealIndex - mainImagesTotal ? "ring-2 ring-secondary ring-offset-2 ring-offset-surface-strong" : "opacity-60 grayscale-[0.5]"}`}
                  onClick={() => chooseVariantColor(image, idx)}
                >
                  <Image
                    src={image.src}
                    alt={image.name}
                    className="h-full w-full object-cover"
                  />
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
