import Container from '@/components/shared/general/container';
import Images from './components/sections/images';
import Price from './components/sections/price';
import TrustSignal from './components/sections/trust-signal';
import Description from './components/sections/description';
import Specs from './components/sections/specs';
import Reviews from './components/sections/reviews';
import FAQ from './components/sections/faq';
import CTA from './components/sections/cta';
import {
  DesktopVariants,
  DesktopBuyCard,
} from './components/sections/desktop-components';
import { ProductProvider } from './components/product-context';

const Page = () => {
  return (
    <main className="bg-surface md:bg-background text-foreground min-h-screen pb-24 md:pb-12">
      <ProductProvider>
        {/* =======================
            MOBILE VIEW (< md)
        ======================== */}
        <div className="block md:hidden">
          <Container
            className={`bg-background w-full md:w-10/12 lg:w-7/12 xl:w-5/12`}
            classObject={{ padding: 'px-0 md:px-5' }}
          >
            {/* section:images */}
            <Images />
          </Container>

          {/* section:price */}
          <Price />

          {/* section:product-name */}
          <section className="">
            <Container
              className={`bg-background w-full md:w-10/12 lg:w-7/12 xl:w-5/12`}
              classObject={{ padding: 'px-3 md:px-5 pb-4' }}
            >
              <h1 className="m-0 text-sm font-normal">
                Hana Dress Pakaian Simple Dress Muslimah
                Polos
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
            className="bg-background w-full md:max-w-4xl lg:max-w-6xl xl:max-w-7xl"
            classObject={{ padding: 'px-6 lg:px-8' }}
          >
            <div className="flex flex-col gap-6 pt-6 md:flex-row lg:gap-8 lg:pt-8">
              {/* Left Column: Images (Sticky) */}
              <div className="z-10 w-full shrink-0 md:sticky md:top-8 md:h-fit md:w-5/12 lg:w-4/12 xl:w-[350px]">
                <div className="bg-background border-border w-full overflow-hidden rounded-xl border shadow-sm">
                  <Images />
                </div>
              </div>

              {/* Middle Column: Details */}
              <div className="flex w-full flex-1 flex-col gap-6">
                {/* Title & Price */}
                <div className="flex flex-col gap-2">
                  <h1 className="text-foreground m-0 text-lg leading-snug font-bold lg:text-xl">
                    Hana Dress Pakaian Simple Dress Muslimah
                    Polos
                  </h1>
                  <div className="mb-2 flex items-center gap-2">
                    <p className="text-foreground text-sm">
                      Terjual{' '}
                      <span className="font-semibold">
                        937
                      </span>
                    </p>
                    <span className="text-muted-foreground">
                      •
                    </span>
                    <p className="text-foreground text-sm">
                      <span className="text-primary font-semibold">
                        ★ 4.9
                      </span>{' '}
                      (324 Rating)
                    </p>
                  </div>
                  <div className="text-foreground text-3xl font-extrabold">
                    Rp120.000
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs font-bold">
                      45%
                    </span>
                    <span className="text-muted-foreground text-sm line-through">
                      Rp220.000
                    </span>
                  </div>
                </div>

                <hr className="border-border/50" />

                {/* Variants */}
                <DesktopVariants />

                <hr className="border-border/50" />

                {/* Trust Signals & Specs */}
                <div className="flex flex-col gap-4">
                  <TrustSignal className="border-border bg-background rounded-xl border p-4" />
                  <Specs className="border-border bg-background rounded-xl border p-5 lg:p-6" />
                </div>

                {/* Description & Reviews */}
                <div className="mt-4 flex flex-col gap-6">
                  <div className="border-border bg-background rounded-xl border p-5 lg:p-6">
                    <h2 className="text-foreground mb-4 text-lg font-bold">
                      Deskripsi Produk
                    </h2>
                    <Description />
                  </div>

                  <div className="border-border bg-background rounded-xl border p-5 lg:p-6">
                    <h2 className="text-foreground mb-4 text-lg font-bold">
                      Ulasan Pembeli
                    </h2>
                    <Reviews />
                  </div>

                  <div className="border-border bg-background rounded-xl border p-5 lg:p-6">
                    <h2 className="text-foreground mb-4 text-lg font-bold">
                      Tanya Jawab
                    </h2>
                    <FAQ />
                  </div>
                </div>
              </div>

              {/* Right Column: Buy Card (Sticky) */}
              <div className="mt-6 w-full shrink-0 md:mt-0 md:w-full lg:sticky lg:top-8 lg:h-fit lg:w-3/12 xl:w-[300px]">
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
