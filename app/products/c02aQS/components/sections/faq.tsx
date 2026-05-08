import Container from "@/components/shared/general/container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Props = {
  className?: string;
};

const faqData = [
  {
    question: "Apakah bahan Hana Dress ini nerawang?",
    answer: "Tidak, kami menggunakan bahan Katun Toyobo Premium yang memiliki serat rapat sehingga tidak menerawang namun tetap adem saat digunakan."
  },
  {
    question: "Apakah bisa tukar ukuran (size) jika tidak pas?",
    answer: "Bisa, kami menerima penukaran ukuran maksimal 3 hari setelah barang diterima, selama tag masih terpasang dan produk belum dicuci."
  },
  {
    question: "Berapa lama estimasi pengiriman?",
    answer: "Untuk wilayah Jabodetabek estimasi 1-3 hari kerja, sedangkan luar pulau Jawa 3-7 hari kerja tergantung ekspedisi yang dipilih."
  }
];

const FAQ = ({ className = "" }: Props) => {
  return (
    <section className={className}>
      <Container
        className={`w-full bg-white md:w-10/12 lg:w-7/12 xl:w-5/12`}
        classObject={{ padding: "px-3 md:px-5 py-6" }}
      >
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-800">
          Pertanyaan Umum (FAQ)
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqData.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-sm font-medium text-slate-700">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-slate-500">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </section>
  );
};

export default FAQ;
