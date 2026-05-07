import Container from "@/components/shared/general/container";
import IconTruck from "@/components/icons/truck-02";
import IconShield from "@/components/icons/shield-01";
import IconReturn from "@/components/icons/return-02";

type Props = {
  className?: string;
};

const Guarantee = ({ className = "" }: Props) => {
  return (
    <section className={className}>
      <Container
        className={`w-full bg-white md:w-10/12 lg:w-7/12 xl:w-5/12`}
        classObject={{ padding: "px-0 md:px-5" }}
      >
        <div className="flex w-full items-start justify-start border-b border-t border-slate-200/90 px-3 py-2">
          <IconTruck className="mr-2 h-5 w-5 text-[#26aa99]" />
          <p className="text-sm font-medium">Garansi tiba: 21 - 24 Juni</p>
        </div>
        <div className="flex w-full items-start justify-start border-b border-slate-200/90 px-3 py-2">
          <IconShield className="mr-2 h-5 w-5 text-[#ee4d2d]" />
          <p className="text-sm font-medium">
            COD Cek Dulu - Bayar ketika sampai
          </p>
          {/* <div>
            <p className="text-sm font-medium">COD Cek Dulu</p>
            <p className="text-xs text-gray-500">Bayar ketika barang sampai</p>
          </div> */}
        </div>
        <div className="flex w-full items-start justify-start px-3 py-2">
          {/* <div className="mr-2 flex h-5 w-5 items-center justify-center">
            <IconReturn className="h-[1.1rem] w-[1.1rem] text-[#ee4d2d]" />
          </div> */}
          <div className="mr-2 flex h-5 w-5 items-center justify-center">
            <IconReturn className="h-[1.1rem] w-[1.1rem] text-[#ee4d2d]" />
          </div>
          <div>
            <p className="text-sm font-medium">Jaminan Return Barang</p>
            <p className="text-xs text-gray-500">
              Jika pesanan tidak sesuai atau ada cacat barang
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Guarantee;
