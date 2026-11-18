import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@chakra-ui/react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  AriaComponent,
  SVGRenderer,
]);

export default function EChart({
  option,
  label,
  height,
}: {
  option: echarts.EChartsCoreOption;
  label: string;
  height: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<echarts.ECharts | undefined>(undefined);
  const reducedMotion = usePrefersReducedMotion();
  useEffect(() => {
    if (!host.current) return;
    const chart = echarts.init(host.current, undefined, { renderer: 'svg' });
    instance.current = chart;
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(host.current);
    return () => {
      observer.disconnect();
      chart.dispose();
      instance.current = undefined;
    };
  }, []);
  useEffect(() => {
    instance.current?.setOption({
      ...option,
      aria: { enabled: true, label: { description: label } },
      animation: !reducedMotion,
      animationDuration: 480,
      animationDurationUpdate: 240,
    });
  }, [option, label, reducedMotion]);
  return (
    <div ref={host} style={{ width: '100%', height, minWidth: 0 }} role="img" aria-label={label} />
  );
}
