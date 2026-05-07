import Link from "next/link";
import IconWA from "@/app/components/icons/whatsapp-01";

const ButtonWA = () => {
  return (
    <Link
      href={
        "https://wa.me/6281285123121?text=Halo%2C%20Saya%20tertarik%20promo%20%22HANA%20DRESS%22%20warna%20Navy%20Blue.%20Bagaimana%20cara%20pesannya%20ya%20Kak%3F"
      }
      role="button"
      className="inline-flex flex-row items-center justify-center rounded-xl border bg-[#25d366] px-4 py-3.5 md:px-5 md:py-3.5 lg:px-5 lg:py-3.5 xl:px-5 xl:py-3.5"
    >
      {/* bg-[#29af3e] */}
      <IconWA className="mr-2 h-5 w-5 text-white" />
      <span className="inline-block text-sm font-bold uppercase text-white md:text-sm lg:text-sm xl:text-base">
        AMBIL PROMONYA SEKARANG
      </span>
    </Link>
  );
};

export default ButtonWA;
