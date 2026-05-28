import Container from '@/components/shared/general/container';

type Props = {
  className?: string;
};

const Description = ({ className = '' }: Props) => {
  return (
    <section className={className}>
      <Container
        className={`bg-background w-full`}
        classObject={{ padding: 'px-3 md:px-5 py-4' }}
      >
        <h2 className="text-foreground mb-2 text-sm font-semibold tracking-wider uppercase">
          Deskripsi
        </h2>
        {/* title-short-description */}
        <div className="my-4">
          <h1 className="text-foreground mb-2 text-center text-base font-semibold">
            HANA DRESS
          </h1>
          <p className="text-foreground text-center text-xs md:text-sm lg:text-sm">
            Dengan terobosan bahan babyterry import <br />
            yang ngasih feel sejuk, flowly saat digunakan
            sehari-hari <br />
            karakteristik yang menyerap keringat bikin kamu
            percaya <br />
            diri saat beraktivitas
          </p>
        </div>
        {/* size-guide-table */}
        <div className="mx-0 my-8 flex flex-col items-center justify-center">
          <h2 className="text-foreground mb-4 text-center text-base font-semibold">
            Size Chart
          </h2>
          <div className="w-full overflow-x-auto">
            <table className="border-border w-full table-auto border-collapse border">
              <thead>
                <tr>
                  <th className="border-border bg-primary border px-2 py-3.5 text-center text-xs font-semibold tracking-wider text-white uppercase">
                    Ukuran
                  </th>
                  <th className="border-border bg-primary text-tiny border px-2 py-3.5 text-center font-normal tracking-wider text-white uppercase">
                    Lingkar Dada
                  </th>
                  <th className="border-border bg-primary text-tiny border px-2 py-3.5 text-center font-normal tracking-wider text-white uppercase">
                    Panjang Badan
                  </th>
                  <th className="border-border bg-primary text-tiny border px-2 py-3.5 text-center font-normal tracking-wider text-white uppercase">
                    Lingkar Bawah
                  </th>
                  <th className="border-border bg-primary text-tiny border px-2 py-3.5 text-center font-normal tracking-wider text-white uppercase">
                    Panjang Lengan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background/80">
                <tr>
                  <td className="border-border text-foreground border p-2 text-center text-sm font-medium">
                    Medium
                  </td>
                  <td className="border-border text-foreground border p-2 text-center text-xs font-normal">
                    100cm
                  </td>
                  <td className="border-border text-foreground border p-2 text-center text-xs font-normal">
                    135cm
                  </td>
                  <td className="border-border text-foreground border p-2 text-center text-xs font-normal">
                    180cm
                  </td>
                  <td className="border-border text-foreground border p-2 text-center text-xs font-normal">
                    45cm
                  </td>
                </tr>
                <tr>
                  <td className="border-border text-foreground border p-2 text-center text-sm font-medium">
                    Large
                  </td>
                  <td className="border-border text-foreground border p-2 text-center text-xs font-normal">
                    110cm
                  </td>
                  <td className="border-border text-foreground border p-2 text-center text-xs font-normal">
                    140cm
                  </td>
                  <td className="border-border text-foreground border p-2 text-center text-xs font-normal">
                    182cm
                  </td>
                  <td className="border-border text-foreground border p-2 text-center text-xs font-normal">
                    50cm
                  </td>
                </tr>
                <tr>
                  <td className="border-border text-foreground border p-2 text-center text-sm font-medium">
                    X-Large
                  </td>
                  <td className="border-border text-foreground border p-2 text-center text-xs font-normal">
                    120cm
                  </td>
                  <td className="border-border text-foreground border p-2 text-center text-xs font-normal">
                    140cm
                  </td>
                  <td className="border-border text-foreground border p-2 text-center text-xs font-normal">
                    184cm
                  </td>
                  <td className="border-border text-foreground border p-2 text-center text-xs font-normal">
                    50cm
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Description;
