import { ChartAreaIcon } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ChartBarOrderTrends } from './chart-bar-order-trends';
import { ProfitOrder, ProfitProduct } from '../types';
import { ChartPieProfitContribution } from './chart-pie-profit-contributions';

type ChartsSectionProps = {
  start: Date | string;
  end: Date | string;
  orders: ProfitOrder[];
  products: ProfitProduct[];
};

const ChartsSection = ({
  start,
  end,
  orders,
  products,
}: ChartsSectionProps) => {
  return (
    <Accordion
      multiple
      defaultValue={['cogs']}
      className="rounded-md border bg-white px-4 dark:bg-gray-950"
    >
      <AccordionItem value="cogs" className="border-0">
        <AccordionTrigger className="py-4 hover:no-underline">
          <span className="flex items-center gap-2 text-xl font-semibold">
            <ChartAreaIcon className="h-5 w-5" /> Charts
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ChartBarOrderTrends
              start={start}
              end={end}
              orders={orders}
            />

            <ChartPieProfitContribution
              start={start}
              end={end}
              products={products}
            />
          </div>

          {/* <pre>{JSON.stringify(orders, null, 2)}</pre> */}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default ChartsSection;
