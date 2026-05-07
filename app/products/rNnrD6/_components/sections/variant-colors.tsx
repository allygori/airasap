// next-components
import Image from "next/image";

// shared
import Container from "@/app/components/general/container";

// images
import ImgColorSageGreen from "@/public/assets/img/products/rNnrD6/hMAZLvtMCEywfXshMK83UFvMsxG4DDSMaSI0hJZMUMg.webp";
import ImgColorNavyBlue from "@/public/assets/img/products/rNnrD6/hMHBy28zs3uwL0YhMK8DpXonTXXG9dRzG3Bw1YXH1NnQ.webp";
import ImgColorBeige from "@/public/assets/img/products/rNnrD6/h9PdaFlzFF8dCmqh9PtKu7IfyEpCkRJG1Mpbj30zXWw.webp";
import ImgColorBlack from "@/public/assets/img/products/rNnrD6/hMHBy28zs3uwL0YhMK8OvpzHVhKC6kT6yjG0ga9YqiMA.webp";
import ImgColorArmyGreen from "@/public/assets/img/products/rNnrD6/hMAwtJzi9fHx0hNhMK87XA7uHYQ4KJQk3KA5IPiA6w.webp";
import ImgColorDustyPink from "@/public/assets/img/products/rNnrD6/hMHB3MY0hnAsJhqnhMK8k9lvFsHP0LPTZmIJkOZGntuiA.webp";
import ImgColorMistyGrey from "@/public/assets/img/products/rNnrD6/hMHBBcKz2HFHLi1hMK8SiDww9CyhpTGCHXp1JPMkXPQ.webp";
import ImgColorMocca from "@/public/assets/img/products/rNnrD6/h9PdaFlzFF8dCmqh9PtRIsdWnCaQdQCpQihNbpQw.webp";
import ImgColorLylac from "@/public/assets/img/products/rNnrD6/h9Pd3o9rFDyqxuh9PtS8WBPYFEgWHRgOt0iDStytDuQ.webp";

const VariantColors = () => {
  return (
    <section>
      <div className="mb-2 bg-green-500 py-3.5 text-center text-gray-50">
        <h2 className="m-0 text-lg font-medium">Pilihan Warna</h2>
      </div>
      <Container
        className={`w-full md:w-10/12 lg:w-7/12 xl:w-5/12`}
        classObject={{ padding: "px-0 md:px-5 lg:px-5" }}
      >
        {/* image:color-sage-green */}
        <div className="mx-auto mb-3 flex flex-row items-center justify-center">
          <Image src={ImgColorSageGreen} alt="Color sage green" />
        </div>
        {/* image:color-navy-blue */}
        <div className="mx-auto mb-3 flex flex-row items-center justify-center">
          <Image src={ImgColorNavyBlue} alt="Color navy blue" />
        </div>
        {/* image:color-beige */}
        <div className="mx-auto mb-3 flex flex-row items-center justify-center">
          <Image src={ImgColorBeige} alt="Color beige" />
        </div>
        {/* image:black */}
        <div className="mx-auto mb-3 flex flex-row items-center justify-center">
          <Image src={ImgColorBlack} alt="Color black" />
        </div>
        {/* image:army-green */}
        <div className="mx-auto mb-3 flex flex-row items-center justify-center">
          <Image src={ImgColorArmyGreen} alt="Color army green" />
        </div>
        {/* image:dusty-pink */}
        <div className="mx-auto mb-3 flex flex-row items-center justify-center">
          <Image src={ImgColorDustyPink} alt="Color dusty pink" />
        </div>
        {/* image:misty-grey */}
        <div className="mx-auto mb-3 flex flex-row items-center justify-center">
          <Image src={ImgColorMistyGrey} alt="Color misty grey" />
        </div>
        {/* image:mocca */}
        <div className="mx-auto mb-3 flex flex-row items-center justify-center">
          <Image src={ImgColorMocca} alt="Color mocca" />
        </div>
        {/* image:lylac */}
        <div className="mx-auto mb-3 flex flex-row items-center justify-center">
          <Image src={ImgColorLylac} alt="Color lylac" />
        </div>
      </Container>
    </section>
  );
};

export default VariantColors;
