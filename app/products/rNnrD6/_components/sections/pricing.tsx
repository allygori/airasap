// shared
import Container from "@/app/components/general/container";

const Pricing = () => {
  return (
    <section className="my-6">
      <Container className={`w-8/12 md:w-5/12 lg:w-3/12 xl:w-2/12`}>
        <p className="mb-2 text-center text-sm font-normal text-zinc-900">
          Flash Sale Promo
        </p>
        <p className="mb-2 text-center text-3xl font-bold text-zinc-900 line-through">
          Rp 220.000
        </p>
        <div className="rounded-md border bg-zinc-900 py-1 text-center text-white">
          <p className="text-base font-medium">Hanya Rp 120.000,-</p>
        </div>
        <p className="mb-2 text-center text-xs font-normal text-zinc-900">
          <small>Berlaku hanya untuk hari ini</small>
        </p>
        <p className="mb-4 text-center text-base font-normal text-zinc-900">
          <strong>( Hemat s/d Rp 100.000,- )</strong>
        </p>
        <p className="mb-2 text-center text-sm font-medium text-zinc-900">
          Bundling Promo
        </p>
        <p className="mb-4 text-center text-3xl font-bold text-zinc-900">
          Rp 199.000
        </p>
        <div className="mb-4 rounded-md border bg-zinc-900 py-1 text-center text-white">
          <p>Dapat 2 pcs</p>
        </div>
        <p className="mb-2 text-center text-base font-normal text-zinc-900">
          <strong>( Hemat s/d Rp 241.000,- )</strong>
        </p>
      </Container>
    </section>
  );
};

export default Pricing;
