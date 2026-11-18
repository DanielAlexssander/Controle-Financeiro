import { lazy, Suspense } from 'react';
import type { EChartsCoreOption } from 'echarts/core';
import { useColorMode } from '@chakra-ui/react';
import { darkColors, getChartColors, lightColors } from '../theme/colors';

const EChart = lazy(() => import('./EChart'));

function Chart(props: { option: EChartsCoreOption; label: string; height: number }) {
  return (
    <Suspense fallback={<div style={{ height: props.height }} aria-busy="true" />}>
      <EChart {...props} />
    </Suspense>
  );
}

export function HistoryChart({
  months,
  values,
  bars = false,
  currency = 'BRL',
}: {
  months: string[];
  values: number[];
  bars?: boolean;
  currency?: 'BRL' | 'USD';
}) {
  const { colorMode } = useColorMode();
  const c = colorMode === 'dark' ? darkColors : lightColors;
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency });
  const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
  const format = (value: number) =>
    bars ? value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%' : money.format(value);
  return (
    <Chart
      height={260}
      label={months.map((m, i) => m + ' ' + format(values[i])).join(', ')}
      option={{
        grid: { left: 8, right: 14, top: 14, bottom: 8, containLabel: true },
        textStyle: { color: c.textSecondary, fontFamily: 'Inter, sans-serif' },
        tooltip: {
          trigger: 'axis',
          confine: true,
          renderMode: 'richText',
          backgroundColor: c.bgCard,
          borderColor: c.border,
          textStyle: { color: c.text },
          valueFormatter: format,
        },
        xAxis: {
          type: 'category',
          data: months,
          boundaryGap: bars,
          axisTick: { show: false },
          axisLine: { lineStyle: { color: c.border } },
          axisLabel: { color: c.textMuted, hideOverlap: true, margin: 14 },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            color: c.textMuted,
            formatter: (v: number) => compact.format(v) + (bars ? '%' : ''),
          },
          splitLine: { lineStyle: { color: c.border, type: 'dashed' } },
        },
        series: [
          bars
            ? {
                type: 'bar',
                name: 'Variação mensal',
                barMaxWidth: 48,
                data: values.map((value) => ({
                  value,
                  itemStyle: { color: value >= 0 ? c.success : c.danger, borderRadius: 3 },
                })),
              }
            : {
                type: 'line',
                name: 'Patrimônio',
                data: values,
                smooth: 0.18,
                symbolSize: 7,
                itemStyle: { color: c.primary },
                lineStyle: { width: 3 },
                areaStyle: {
                  color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                      { offset: 0, color: c.primary + '49' },
                      { offset: 1, color: c.primary + '00' },
                    ],
                  },
                },
              },
        ],
      }}
    />
  );
}

export function AllocationChart({
  items,
  total,
  format,
  emptyText,
}: {
  items: { name: string; value: number; color?: string }[];
  total: number;
  format: (value: number) => string;
  emptyText: string;
}) {
  const { colorMode } = useColorMode();
  const c = colorMode === 'dark' ? darkColors : lightColors;
  const hasItems = items.length > 0;
  const share = (value: number) =>
    total > 0 ? ((value / total) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0';
  return (
    <div className="allocation">
      <div className="donut">
        {hasItems ? (
          <Chart
            height={252}
            label={items.map((i) => i.name + ' ' + format(i.value)).join(', ')}
            option={{
              color: getChartColors(colorMode === 'dark'),
              tooltip: {
                trigger: 'item',
                confine: true,
                renderMode: 'richText',
                backgroundColor: c.bgCard,
                borderColor: c.border,
                textStyle: { color: c.text },
                valueFormatter: (value: number) => format(value) + ' (' + share(value) + '%)',
              },
              legend: {
                type: 'scroll',
                left: 'center',
                bottom: 0,
                icon: 'circle',
                itemWidth: 8,
                itemHeight: 8,
                textStyle: { color: c.textSecondary },
                pageTextStyle: { color: c.textSecondary },
              },
              series: [
                {
                  type: 'pie',
                  radius: [54, 90],
                  center: ['50%', '50%'],
                  showEmptyCircle: true,
                  stillShowZeroSum: false,
                  emptyCircleStyle: { color: c.border },
                  itemStyle: { borderColor: c.bgCard, borderWidth: 2 },
                  label: { show: false },
                  data: items.map((i) => ({
                    name: i.name,
                    value: i.value,
                    itemStyle: { color: i.color },
                  })),
                },
              ],
            }}
          />
        ) : (
          <div className="empty-ring" aria-hidden="true" />
        )}
        <div className="donut-total">
          <span>Total</span>
          <strong>{format(total)}</strong>
        </div>
      </div>
      {!hasItems && <p className="empty-caption">{emptyText}</p>}
    </div>
  );
}
