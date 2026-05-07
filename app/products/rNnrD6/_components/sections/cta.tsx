import Container from "@/app/components/general/container";
import ButtonWA from "../shared/button-wa";

const CTA = () => {
  return (
    <section className="mb-8 md:mb-12">
      {/* <Container className={`w-10/12 md:w-6/12 lg:w-5/12 xl:w-3/12`}> */}
      <Container className={`flex w-full items-center justify-center`}>
        <ButtonWA />
      </Container>

      <div className="mt-4">
        <p className="mb-2 text-center text-2xs font-medium text-zinc-900">
          KLIK TOMBOL DI ATAS
        </p>
        <p className="text-center text-2xs font-medium text-zinc-900">
          Otomatis akan diarahkan <br /> ke customer service kami via WhatsApp
        </p>
      </div>
    </section>
  );
};

export default CTA;
