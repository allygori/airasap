import { StaticImageData } from "next/image";
// images
import ImgMain from "@/public/assets/img/products/rNnrD6/hMHB3egnjEoHfPnhMAVTCr8TQm2bVcRMyofvskDakGzg.webp";
import ImgColorSageGreen from "@/public/assets/img/products/rNnrD6/hMAZLvtMCEywfXshMK83UFvMsxG4DDSMaSI0hJZMUMg.webp";
import ImgColorNavyBlue from "@/public/assets/img/products/rNnrD6/hMHBy28zs3uwL0YhMK8DpXonTXXG9dRzG3Bw1YXH1NnQ.webp";
import ImgColorBeige from "@/public/assets/img/products/rNnrD6/h9PdaFlzFF8dCmqh9PtKu7IfyEpCkRJG1Mpbj30zXWw.webp";
import ImgColorBlack from "@/public/assets/img/products/rNnrD6/hMHBy28zs3uwL0YhMK8OvpzHVhKC6kT6yjG0ga9YqiMA.webp";
import ImgColorArmyGreen from "@/public/assets/img/products/rNnrD6/hMAwtJzi9fHx0hNhMK87XA7uHYQ4KJQk3KA5IPiA6w.webp";
import ImgColorDustyPink from "@/public/assets/img/products/rNnrD6/hMHB3MY0hnAsJhqnhMK8k9lvFsHP0LPTZmIJkOZGntuiA.webp";
import ImgColorMistyGrey from "@/public/assets/img/products/rNnrD6/hMHBBcKz2HFHLi1hMK8SiDww9CyhpTGCHXp1JPMkXPQ.webp";
import ImgColorMocca from "@/public/assets/img/products/rNnrD6/h9PdaFlzFF8dCmqh9PtRIsdWnCaQdQCpQihNbpQw.webp";
// import ImgColorLylac from "@/public/assets/img/products/rNnrD6/h9Pd3o9rFDyqxuh9PtS8WBPYFEgWHRgOt0iDStytDuQ.webp";

export type TImage = {
  name: string;
  value: string;
  src: StaticImageData;
};

export const mainImages: TImage[] = [
  { name: "Main", value: "main-01", src: ImgMain },
];

export const colors: TImage[] = [
  { name: "Sage", value: "sage-green", src: ImgColorSageGreen },
  { name: "Navy", value: "navy-blue", src: ImgColorNavyBlue },
  { name: "Beige", value: "beige", src: ImgColorBeige },
  { name: "Black", value: "black", src: ImgColorBlack },
  { name: "Army", value: "army-green", src: ImgColorArmyGreen },
  { name: "Pink", value: "dusty-pink", src: ImgColorDustyPink },
  { name: "Misty", value: "misty-grey", src: ImgColorMistyGrey },
  { name: "Mocca", value: "mocca", src: ImgColorMocca },
  // { name: "Lylac", value: "lylac", src: ImgColorLylac },
];

export const sizes = [
  { name: "S", value: "s" },
  { name: "M", value: "m" },
  { name: "L", value: "l" },
  { name: "XL", value: "xl" },
];

export const variant = { colors, sizes };
export const images = [...mainImages, ...colors];
