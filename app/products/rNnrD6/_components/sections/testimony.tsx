"use client";

import "swiper/css";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import Container from "@/app/components/general/container";

// img:testimony
import ImgTestimony01 from "@/public/assets/img/products/rNnrD6/testimony/hMAgQ1GO5PYchC8hMKCcZ6MvsLGjmnQ4q0Zir2nfMIvA.webp";
import ImgTestimony02 from "@/public/assets/img/products/rNnrD6/testimony/hMHB3MY0hnAsJhqnhMKC9SwSKo6r4VjSuegK8eXNr71ag.webp";
import ImgTestimony03 from "@/public/assets/img/products/rNnrD6/testimony/hMHByBoR3PMGHfghMKC9Iy5mcFIPdgSEa7Lg3vrdEx2A.webp";

const Testimony = () => {
  return (
    <section className="">
      <div className="mb-2 bg-green-500 py-3.5 text-center text-gray-50">
        <h2 className="m-0 text-lg font-medium">Real Testimoni</h2>
      </div>
      <Container className={`w-full md:w-10/12 lg:w-5/12`}>
        {/* <div
        className={`m-0 w-full px-0 md:m-0 md:w-full md:px-0 lg:mx-auto lg:w-5/12 lg:px-5`}
      > */}
        <Swiper
          modules={[Autoplay]}
          centeredSlides={true}
          autoplay={{
            delay: 500,
            disableOnInteraction: false,
          }}
          speed={750}
          spaceBetween={0}
          slidesPerView={1}
          loop={true}
          grabCursor={true}
          onSlideChange={() => console.log("slide change")}
          onSwiper={(swiper) => console.log(swiper)}
        >
          <SwiperSlide key={"1"}>
            {/* image:testimony-01 */}
            <div className="mx-auto flex flex-row items-center justify-center">
              <Image src={ImgTestimony01} alt="Testimony 01" />
            </div>
          </SwiperSlide>
          <SwiperSlide key={"2"}>
            {/* image:testimony-02 */}
            <div className="mx-auto flex flex-row items-center justify-center">
              <Image src={ImgTestimony02} alt="Testimony 02" />
            </div>
          </SwiperSlide>
          <SwiperSlide key={"3"}>
            {/* image:testimony-03 */}
            <div className="mx-auto flex flex-row items-center justify-center">
              <Image src={ImgTestimony03} alt="Testimony 03" />
            </div>
          </SwiperSlide>
        </Swiper>
        {/* </div> */}
      </Container>
    </section>
  );
};

export default Testimony;
