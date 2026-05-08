import Container from "@/components/shared/general/container";
// import { HugeiconsIcon } from "@hugeicons/react";
import { HugeiconsIcon } from "@/components/icons/hugeicons-icon";
import { StarIcon } from "@hugeicons/core-free-icons";
import Image from "next/image";

type Props = {
  className?: string;
};

const reviews = [
  {
    id: 1,
    user: "S***a",
    rating: 5,
    date: "2024-05-01",
    comment: "Bajunya bagus banget, pas di badan. Bahannya adem dan tidak nerawang. Pengiriman cepat!",
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=200&h=200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=200&h=200&auto=format&fit=crop",
    ],
    video: {
      thumbnail: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=200&h=300&auto=format&fit=crop",
      url: "#"
    }
  },
  {
    id: 2,
    user: "B***u",
    rating: 4,
    date: "2024-04-28",
    comment: "Warna aslinya sedikit lebih gelap dari foto, tapi tetap bagus. Seller ramah.",
    images: [],
  }
];

const Reviews = ({ className = "" }: Props) => {
  return (
    <section className={className}>
      <Container
        className={`w-full bg-surface-strong md:w-10/12 lg:w-7/12 xl:w-5/12`}
        classObject={{ padding: "px-3 md:px-5 py-2" }}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Penilaian Produk
          </h2>
          <div className="flex items-center text-secondary">
            <span className="mr-1 text-xs font-bold">4.8/5</span>
            <HugeiconsIcon icon={StarIcon} size={12} className="fill-current" />
          </div>
        </div>

        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-border pb-3 last:border-0">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground">{review.user}</span>
                <span className="text-[10px] text-ink-muted">{review.date}</span>
              </div>

              <div className="mb-1 flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <HugeiconsIcon
                    key={i}
                    icon={StarIcon}
                    size={10}
                    className={i < review.rating ? "text-secondary fill-current" : "text-secondary"}
                  />
                ))}
              </div>

              <p className="mb-2 text-xs leading-relaxed text-foreground">
                {review.comment}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {review.video && (
                  <div className="relative aspect-[9/16] w-16 overflow-hidden rounded-md border border-border bg-surface">
                    <Image
                      src={review.video.thumbnail}
                      alt="Review video"
                      fill
                      className="object-cover opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-white">
                        <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                  </div>
                )}
                {review.images.map((img, i) => (
                  <div key={i} className="relative aspect-square w-16 overflow-hidden rounded-md border border-border">
                    <Image
                      src={img}
                      alt="Review image"
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button className="mt-2 w-full rounded-md border border-border py-1.5 text-[11px] font-medium text-ink-muted hover:bg-surface">
          Lihat Semua Ulasan
        </button>
      </Container>
    </section>
  );
};

export default Reviews;
