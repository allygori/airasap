import Container from '@/components/shared/general/container';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type Props = {
  className?: string;
};

const faqData = [
  {
    question: 'Apakah bahan Hana Dress ini nerawang?',
    answer:
      'Tidak, kami menggunakan bahan Katun Toyobo Premium yang memiliki serat rapat sehingga tidak menerawang namun tetap adem saat digunakan.',
  },
  {
    question:
      'Apakah bisa tukar ukuran (size) jika tidak pas?',
    answer:
      'Bisa, kami menerima penukaran ukuran maksimal 3 hari setelah barang diterima, selama tag masih terpasang dan produk belum dicuci.',
  },
  {
    question: 'Berapa lama estimasi pengiriman?',
    answer:
      'Untuk wilayah Jabodetabek estimasi 1-3 hari kerja, sedangkan luar pulau Jawa 3-7 hari kerja tergantung ekspedisi yang dipilih.',
  },
];

const FAQ = ({ className = '' }: Props) => {
  return (
    <section className={className}>
      <Container
        className={`bg-background w-full`}
        classObject={{ padding: 'px-3 md:px-5 py-6' }}
      >
        <h2 className="text-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
          Pertanyaan Umum (FAQ)
        </h2>
        <Accordion className="w-full">
          {faqData.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-border"
            >
              <AccordionTrigger className="text-foreground text-sm font-medium hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
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
