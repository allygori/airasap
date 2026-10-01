type Props = {
  children?: React.ReactNode;
  className?: string;
  classObject?: {
    padding?: string;
  };
};

const Container = ({
  children,
  className = '',
  classObject = {
    padding: 'px-5',
  },
}: Props) => {
  return (
    <div
      className={`container mx-auto ${classObject?.padding || ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default Container;
