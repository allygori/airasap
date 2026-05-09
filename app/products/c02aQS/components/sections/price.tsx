import Container from "@/components/shared/general/container";

type Props = {
  className?: string;
};

const Price = ({ className = "" }: Props) => {
  return (
    <section className={className}>
      <Container
        className={`flex w-full flex-row items-center justify-between bg-background md:w-10/12 lg:w-7/12 xl:w-5/12`}
        classObject={{ padding: "px-3 md:px-5 pb-2 pt-4" }}
      >
        <div className="flex flex-row items-center">
          {/* price */}
          <div className="flex flex-row items-baseline">
            <span className="text-sm font-medium text-primary">Rp</span>
            <span className="text-lg font-medium text-primary">120.000</span>
          </div>
          {/* discount price */}
          <div className="mx-1 flex shrink grow-0 flex-row items-center truncate text-muted-foreground line-through">
            <span className="text-sm font-light">Rp</span>
            <span className="text-sm font-light">220.000</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-normal text-muted-foreground">937 Terjual</p>
        </div>

        {/* discount precentage */}
        {/* <div className="bg-primary-50 px-1 py-0.5 text-tiny font-semibold">
          <span className="text-primary">-45%</span>
        </div> */}
      </Container>
    </section>
  );
};

export default Price;
