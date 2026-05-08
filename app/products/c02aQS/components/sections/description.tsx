import Container from "@/components/shared/general/container";

type Props = {
  className?: string;
};

const Description = ({ className = "" }: Props) => {
  return (
    <section className={className}>
      <Container
        className={`w-full bg-background md:w-10/12 lg:w-7/12 xl:w-5/12`}
        classObject={{ padding: "px-3 md:px-5 py-4" }}
      >
        <h2 className="mb-2 text-sm font-semibold text-foreground uppercase tracking-wider">Deskripsi</h2>
        {/* title-short-description */}
        <div className="my-4">
          <h1 className="mb-2 text-center text-base font-semibold text-foreground">
            HANA DRESS
          </h1>
          <p className="text-center text-xs md:text-sm lg:text-sm text-foreground">
            Dengan terobosan bahan babyterry import <br />
            yang ngasih feel sejuk, flowly saat digunakan sehari-hari <br />
            karakteristik yang menyerap keringat bikin kamu percaya <br />
            diri saat beraktivitas
          </p>
        </div>
        {/* size-guide-table */}
        <div className="mx-0 my-8 flex flex-col items-center justify-center">
          <h2 className="mb-4 text-center text-base font-semibold text-foreground">
            Size Chart
          </h2>
          <div className="w-full overflow-x-auto">
            <table className="w-full table-auto border-collapse border border-border">
              <thead>
                <tr>
                  <th className="border border-border bg-primary px-2 py-3.5 text-center text-xs font-semibold text-white uppercase tracking-wider">
                    Ukuran
                  </th>
                  <th className="border border-border bg-primary px-2 py-3.5 text-center text-[10px] font-normal text-white uppercase tracking-wider">
                    Lingkar Dada
                  </th>
                  <th className="border border-border bg-primary px-2 py-3.5 text-center text-[10px] font-normal text-white uppercase tracking-wider">
                    Panjang Badan
                  </th>
                  <th className="border border-border bg-primary px-2 py-3.5 text-center text-[10px] font-normal text-white uppercase tracking-wider">
                    Lingkar Bawah
                  </th>
                  <th className="border border-border bg-primary px-2 py-3.5 text-center text-[10px] font-normal text-white uppercase tracking-wider">
                    Panjang Lengan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background/80">
                <tr>
                  <td className="border border-border p-2 text-center text-sm text-foreground font-medium">
                    Medium
                  </td>
                  <td className="border border-border p-2 text-center text-xs font-normal text-foreground">
                    100cm
                  </td>
                  <td className="border border-border p-2 text-center text-xs font-normal text-foreground">
                    135cm
                  </td>
                  <td className="border border-border p-2 text-center text-xs font-normal text-foreground">
                    180cm
                  </td>
                  <td className="border border-border p-2 text-center text-xs font-normal text-foreground">
                    45cm
                  </td>
                </tr>
                <tr>
                  <td className="border border-border p-2 text-center text-sm text-foreground font-medium">
                    Large
                  </td>
                  <td className="border border-border p-2 text-center text-xs font-normal text-foreground">
                    110cm
                  </td>
                  <td className="border border-border p-2 text-center text-xs font-normal text-foreground">
                    140cm
                  </td>
                  <td className="border border-border p-2 text-center text-xs font-normal text-foreground">
                    182cm
                  </td>
                  <td className="border border-border p-2 text-center text-xs font-normal text-foreground">
                    50cm
                  </td>
                </tr>
                <tr>
                  <td className="border border-border p-2 text-center text-sm text-foreground font-medium">
                    X-Large
                  </td>
                  <td className="border border-border p-2 text-center text-xs font-normal text-foreground">
                    120cm
                  </td>
                  <td className="border border-border p-2 text-center text-xs font-normal text-foreground">
                    140cm
                  </td>
                  <td className="border border-border p-2 text-center text-xs font-normal text-foreground">
                    184cm
                  </td>
                  <td className="border border-border p-2 text-center text-xs font-normal text-foreground">
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
