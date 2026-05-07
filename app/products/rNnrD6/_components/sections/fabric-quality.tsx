import Image from "next/image";
import Container from "@/app/components/general/container";
import ImgFabricQuality from "@/public/assets/img/products/rNnrD6/hMAgkDhf3hMXh3khMA5Q1TnOyVhYdHSxCHISy7ksMn8g.webp";

type Props = {
  className?: string;
};

const FabricQuality = ({ className = "" }: Props) => {
  return (
    <section className={className}>
      <div className="mb-2 bg-green-500 py-3.5 text-center text-gray-50">
        <h2 className="m-0 text-lg font-medium">Kualitas Bahan</h2>
      </div>
      <Container
        className={`w-full md:w-10/12 lg:w-7/12 xl:w-5/12`}
        classObject={{ padding: "px-0 md:px-5" }}
      >
        {/* image */}
        <div className="mx-auto mb-2 flex flex-row items-center justify-center">
          <Image src={ImgFabricQuality} alt="Image quality" />
        </div>
        <ul className="m-0 mx-auto p-0 text-center text-sm font-normal">
          <li className="py-2 text-center md:py-1">
            Bahan tidak mudah kusut dan mudah di setrika
          </li>
          <li className="py-2 text-center md:py-1">
            Ringan dan adem tetapi tidak transparan
          </li>
          <li className="py-2 text-center md:py-1">
            jahitan rapih dan tidak asal asalan
          </li>
          <li className="py-2 text-center md:py-1">
            Wudhu friendly karena terdapat karet di pergelangan tangan
          </li>
          <li className="py-2 text-center md:py-1">Banyak Pilihan Warna</li>
        </ul>
      </Container>
    </section>
  );
};

export default FabricQuality;
