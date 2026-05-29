import { HeaderTool } from '@/components/shared/layout/header-tool';

type Props = {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  return (
    <>
      <HeaderTool />
      {children}
    </>
  );
};

export default Layout;
