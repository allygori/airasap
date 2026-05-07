// import IconCOD from "@/app/components/icons/cod-01";
// import IconCOD2 from "@/app/components/icons/cod-02";
import Image from "next/image";
import Container from "@/app/components/general/container";
import ImgCOD from "@/public/assets/img/icons/cash-on-delivery.png";
import ImgReturn from "@/public/assets/img/icons/return.png";

const Guarantee = () => {
  return (
    <section className="">
      <Container
        className={`w-full bg-[#e6e5e0] py-6 md:w-full md:px-24 md:py-8 lg:w-7/12 lg:px-0 lg:py-8 xl:w-5/12 xl:px-8 xl:py-10`}
      >
        <h3 className="mb-8 text-center text-2xl font-semibold text-gray-700 md:mb-14 md:text-3xl lg:text-3xl">
          Chat CS untuk tanya stok dan ketersediaan Warna
        </h3>
        <div className="flex flex-col">
          <div className="mb-4 flex flex-row md:mb-6">
            <div className="flex flex-1 justify-center">
              <div className="h-24 w-24 contrast-75 md:h-28 md:w-28 lg:h-44 lg:w-44">
                <Image src={ImgReturn} alt="Return" />
              </div>
            </div>
            <div className="flex flex-1 justify-center">
              <div className="h-28 w-28 pt-2 contrast-100 md:h-28 md:w-28 lg:h-44 lg:w-52">
                <Image src={ImgCOD} alt="Cash on delivery" />
              </div>
            </div>
          </div>
          <div className="mb-2 flex flex-row md:mb-4">
            <div className="flex-1">
              <p className="text-center text-xl font-semibold text-gray-600 md:text-2xl">
                Jaminan Return <br />
                Barang
              </p>
            </div>
            <div className="flex-1">
              <p className="text-center text-xl font-semibold text-gray-600 md:text-2xl">
                Bisa COD
              </p>
            </div>
          </div>
          <div className="flex flex-row">
            <div className="flex-1">
              <p className="text-center text-base font-medium text-gray-500 md:text-xl">
                Jika pesanan tidak <br />
                sesuai atau ada <br />
                cacat barang
              </p>
            </div>
            <div className="flex-1">
              <p className="text-center text-base font-medium text-gray-500 md:text-xl">
                Bayar saat barang <br />
                sudah sampai
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Guarantee;
