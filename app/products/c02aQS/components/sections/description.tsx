import Container from "@/components/shared/general/container";

type Props = {
  className?: string;
};

const Description = ({ className = "" }: Props) => {
  return (
    <section className={className}>
      <Container
        className={`w-full bg-white md:w-10/12 lg:w-7/12 xl:w-5/12`}
        classObject={{ padding: "px-3 md:px-5 py-4" }}
      >
        <h2 className="mb-2 text-sm font-semibold text-black">Deskripsi</h2>
        {/* title-short-description */}
        <div className="my-4">
          <h1 className="mb-2 text-center text-base font-semibold">
            HANA DRESS
          </h1>
          <p className="text-center text-xs md:text-sm lg:text-sm">
            Dengan terobosan bahan babyterry import <br />
            yang ngasih feel sejuk, flowly saat digunakan sehari-hari <br />
            karakteristik yang menyerap keringat bikin kamu percaya <br />
            diri saat beraktivitas
          </p>
        </div>
        {/* size-guide-table */}
        <div className="mx-5 my-8 flex flex-col items-center justify-center">
          <h2 className="mb-4 text-center text-base font-semibold">
            Size Chart
          </h2>
          <table className="table-auto border-collapse border border-slate-600">
            <thead>
              <tr>
                <th className="border border-slate-300 bg-slate-900 px-2 py-3.5 text-center text-sm text-gray-50">
                  Ukuran
                </th>
                <th className="border border-slate-300 bg-slate-900 px-2 py-3.5 text-center text-xs font-normal text-gray-50">
                  Lingkar Dada
                </th>
                <th className="border border-slate-300 bg-slate-900 px-2 py-3.5 text-center text-xs font-normal text-gray-50">
                  Panjang Badan
                </th>
                <th className="border border-slate-300 bg-slate-900 px-2 py-3.5 text-center text-xs font-normal text-gray-50">
                  Lingkar Bawah
                </th>
                <th className="border border-slate-300 bg-slate-900 px-2 py-3.5 text-center text-xs font-normal text-gray-50">
                  Panjang Lengan
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 text-center text-sm">
                  Medium
                </td>
                <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                  100cm
                </td>
                <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                  135cm
                </td>
                <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                  180cm
                </td>
                <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                  45cm
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 text-center text-sm">
                  Large
                </td>
                <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                  110cm
                </td>
                <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                  140cm
                </td>
                <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                  182cm
                </td>
                <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                  50cm
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 text-center text-sm">
                  X-Large
                </td>
                <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                  120cm
                </td>
                <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                  140cm
                </td>
                <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                  184cm
                </td>
                <td className="border border-slate-300 p-2 text-center text-xs font-normal">
                  50cm
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
};

export default Description;
