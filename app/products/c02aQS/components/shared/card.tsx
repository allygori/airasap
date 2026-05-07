import Image from "next/image";
import ImgMain from "@/public/assets/img/products/rNnrD6/hMHB3egnjEoHfPnhMAVTCr8TQm2bVcRMyofvskDakGzg.webp";

type Props = {
  className?: string;
};

const Card = ({ className = "" }: Props) => {
  return (
    <div className={className}>
      <Image src={ImgMain} alt="Image main" />
    </div>
  );
};

export default Card;
