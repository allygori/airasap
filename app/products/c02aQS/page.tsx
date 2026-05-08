import Container from "@/components/shared/general/container";
import Images from "./components/sections/images-old";
import Price from "./components/sections/price";
import TrustSignal from "./components/sections/trust-signal";
import Description from "./components/sections/description";
import Specs from "./components/sections/specs";
import Reviews from "./components/sections/reviews";
import FAQ from "./components/sections/faq";
import CTA from "./components/sections/cta";

const Page = () => {
  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <Container
        className={`w-full bg-white md:w-10/12 lg:w-7/12 xl:w-5/12`}
        classObject={{ padding: "px-0 md:px-5" }}
      >
        {/* section:images */}
        <Images />
      </Container>

      {/* section:price */}
      <Price />

      {/* section:product-name */}
      <section className="">
        <Container
          className={`w-full bg-white md:w-10/12 lg:w-7/12 xl:w-5/12`}
          classObject={{ padding: "px-3 md:px-5 pb-4" }}
        >
          <h1 className="m-0 text-sm font-normal">
            Hana Dress Pakaian Simple Dress Muslimah Polos
          </h1>
        </Container>
      </section>

      {/* section:trust-signal */}
      <TrustSignal className="mb-3" />

      {/* section:specs */}
      <Specs className="mb-3" />

      {/* section:reviews (Reviews first as requested) */}
      <Reviews className="mb-3" />

      {/* section:description */}
      <Description className="mb-3 py-4" />

      {/* section:faq */}
      <FAQ className="mb-0 py-0" />

      {/* section:cta (Sticky) */}
      <CTA />
    </main>
  );
};

export default Page;
