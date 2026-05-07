import Image from "next/image";
import Container from "@/app/components/general/container";
import ImgCOD from "@/public/assets/img/products/rNnrD6/hQY7ORMCfFdo0Q9hQYtV4GnXovRPuQ1iPwBXYzuW0Eg.png";

type Props = {
  className?: string;
};

const COD = ({ className }: Props) => {
  return (
    <section className={className}>
      <Container className={`w-8/12 md:w-4/12 lg:w-3/12 xl:w-2/12`}>
        {/* image:cod */}
        <div className="mx-auto mb-3 flex flex-row items-center justify-center">
          <Image src={ImgCOD} alt="Bisa COD" />
        </div>
      </Container>
    </section>
  );
};

export default COD;
