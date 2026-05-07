import Image from "next/image";

// shared
import Container from "@/app/components/general/container";

// sections
import SectionFabricQuality from "./_components/sections/fabric-quality";
import SectionVariantColors from "./_components/sections/variant-colors";
import SectionTestimony from "./_components/sections/testimony";
import SectionPricing from "./_components/sections/pricing";
import SectionCOD from "./_components/sections/cod";
import SectionCTA from "./_components/sections/cta";
import SectionGuarantee from "./_components/sections/guarantee";

// images
import ImgMain from "@/public/assets/img/products/rNnrD6/hMHB3egnjEoHfPnhMAVTCr8TQm2bVcRMyofvskDakGzg.webp";

const Page = () => {
  return (
    <main className="flex min-h-screen flex-col">
      {/* section:hero */}
      <section>
        <Container
          className={`w-full md:w-10/12 lg:w-7/12 xl:w-5/12`}
          classObject={{ padding: "px-0 md:px-5" }}
        >
          {/* image */}
          <div className="mx-auto flex flex-row items-center justify-center">
            <Image src={ImgMain} alt="Main image" />
          </div>
          {/* title-short-description */}
          <div className="my-4">
            <h1 className="mb-2 text-center text-base font-semibold">
              HANA DRESS
            </h1>
            <p className="text-center text-xs md:text-sm lg:text-sm">
              Dengan terobosan bahan babyterry import <br />
              yang ngasih feel sejuk, flowly saat digunakan sehari-hari <br />
              karakteristik yang menyerap keringat bikin kamu percaya <br />
              diri saat beraktivitas
            </p>
          </div>
          {/* size-guide-table */}
          <div className="mx-5 my-8 flex flex-col items-center justify-center">
            <h2 className="mb-4 text-center text-base font-semibold">
              Size Chart
            </h2>
            <table className="table-auto border-collapse border border-slate-600">
              <thead>
                <tr>
                  <th className="border border-slate-300 bg-slate-900 px-2 py-3.5 text-center text-sm text-gray-50">
                    Ukuran
                  </th>
                  <th className="border border-slate-300 bg-slate-900 px-2 py-3.5 text-center text-xs font-normal text-gray-50">
                    Lingkar Dada
                  </th>
                  <th className="border border-slate-300 bg-slate-900 px-2 py-3.5 text-center text-xs font-normal text-gray-50">
                    Panjang Badan
                  </th>
                  <th className="border border-slate-300 bg-slate-900 px-2 py-3.5 text-center text-xs font-normal text-gray-50">
                    Lingkar Bawah
                  </th>
                  <th className="border border-slate-300 bg-slate-900 px-2 py-3.5 text-center text-xs font-normal text-gray-50">
                    Panjang Lengan
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2 text-center text-sm">
                    Medium
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                    100cm
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                    135cm
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                    180cm
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                    45cm
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 text-center text-sm">
                    Large
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                    110cm
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                    140cm
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                    182cm
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                    50cm
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 text-center text-sm">
                    X-Large
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                    120cm
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                    140cm
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                    184cm
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                    50cm
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* section:fabric-quality */}
      <SectionFabricQuality className="mb-4" />

      {/* section:colors */}
      <SectionVariantColors />

      {/* section:testimony */}
      {/* <SectionTestimony /> */}

      {/* section:price */}
      <SectionPricing />

      {/* section:cod */}
      <SectionCOD />

      {/* section:cta */}
      <SectionCTA />

      {/* section:guarantee */}
      <SectionGuarantee />
    </main>
  );
};

export default Page;
