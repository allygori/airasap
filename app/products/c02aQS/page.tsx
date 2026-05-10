import Container from "@/components/shared/general/container";
import Images from "./components/sections/images";
import Price from "./components/sections/price";
import TrustSignal from "./components/sections/trust-signal";
import Description from "./components/sections/description";
import Specs from "./components/sections/specs";
import Reviews from "./components/sections/reviews";
import FAQ from "./components/sections/faq";
import CTA from "./components/sections/cta";
import { DesktopVariants, DesktopBuyCard } from "./components/sections/desktop-components";
import { ProductProvider } from "./components/product-context";

const Page = () => {
  return (
    <main className="min-h-screen bg-surface md:bg-background pb-24 md:pb-12 text-foreground">
      <ProductProvider>
        
        {/* =======================
            MOBILE VIEW (< md)
        ======================== */}
        <div className="block md:hidden">
          <Container
            className={`w-full bg-background md:w-10/12 lg:w-7/12 xl:w-5/12`}
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
              className={`w-full bg-background md:w-10/12 lg:w-7/12 xl:w-5/12`}
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
        </div>

        {/* =======================
            TABLET / DESKTOP VIEW (>= md)
            Tokopedia Style Layout
        ======================== */}
        <div className="hidden md:block">
          <Container
            className="w-full bg-background md:max-w-4xl lg:max-w-6xl xl:max-w-7xl"
            classObject={{ padding: "px-6 lg:px-8" }}
          >
            <div className="flex flex-col md:flex-row gap-6 lg:gap-8 pt-6 lg:pt-8">
              
              {/* Left Column: Images (Sticky) */}
              <div className="w-full md:w-5/12 lg:w-4/12 xl:w-[350px] shrink-0 md:sticky md:top-8 md:h-fit z-10">
                <div className="w-full bg-background rounded-xl overflow-hidden shadow-sm border border-border">
                  <Images />
                </div>
              </div>

              {/* Middle Column: Details */}
              <div className="w-full flex-1 flex flex-col gap-6">
                
                {/* Title & Price */}
                <div className="flex flex-col gap-2">
                  <h1 className="m-0 text-lg lg:text-xl font-bold text-foreground leading-snug">
                    Hana Dress Pakaian Simple Dress Muslimah Polos
                  </h1>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm text-foreground">Terjual <span className="font-semibold">937</span></p>
                    <span className="text-muted-foreground">•</span>
                    <p className="text-sm text-foreground"><span className="font-semibold text-primary">★ 4.9</span> (324 Rating)</p>
                  </div>
                  <div className="text-3xl font-extrabold text-foreground">
                    Rp120.000
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold">45%</span>
                    <span className="text-sm text-muted-foreground line-through">Rp220.000</span>
                  </div>
                </div>

                <hr className="border-border/50" />

                {/* Variants */}
                <DesktopVariants />

                <hr className="border-border/50" />

                {/* Trust Signals & Specs */}
                <div className="flex flex-col gap-4">
                  <TrustSignal className="rounded-xl border border-border p-4 bg-background" />
                  <Specs className="rounded-xl border border-border p-5 lg:p-6 bg-background" />
                </div>

                {/* Description & Reviews */}
                <div className="flex flex-col gap-6 mt-4">
                  <div className="rounded-xl border border-border p-5 lg:p-6 bg-background">
                    <h2 className="text-lg font-bold mb-4 text-foreground">Deskripsi Produk</h2>
                    <Description />
                  </div>
                  
                  <div className="rounded-xl border border-border p-5 lg:p-6 bg-background">
                    <h2 className="text-lg font-bold mb-4 text-foreground">Ulasan Pembeli</h2>
                    <Reviews />
                  </div>

                  <div className="rounded-xl border border-border p-5 lg:p-6 bg-background">
                    <h2 className="text-lg font-bold mb-4 text-foreground">Tanya Jawab</h2>
                    <FAQ />
                  </div>
                </div>
              </div>

              {/* Right Column: Buy Card (Sticky) */}
              <div className="w-full md:w-full lg:w-3/12 xl:w-[300px] shrink-0 mt-6 md:mt-0 lg:sticky lg:top-8 lg:h-fit">
                <DesktopBuyCard />
              </div>

            </div>
          </Container>
        </div>

      </ProductProvider>
    </main>
  );
};

export default Page;
