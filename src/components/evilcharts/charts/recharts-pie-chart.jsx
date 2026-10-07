// @ts-nocheck
/*
 * Vendored from the Evilcharts shadcn registry. See ./README.md for the source,
 * the install command, and what to redo after re-syncing.
 *
 * Type checking is off for this file on purpose. The registry ships TypeScript;
 * the CLI stripped the types to produce this JavaScript. That stripping turns
 * optional props into required ones and casts into `unknown`, so the checker
 * reports 18 findings here that are artefacts of the conversion, not defects.
 * The build and the render smoke test cover these files instead.
 */
'use client';
import { Children, createContext, isValidElement, use, useCallback, useId, useMemo, useState } from 'react';
import {
  LabelList as RechartsLabelList,
  Pie as RechartsPie,
  PieChart as RechartsPieChart,
  Sector,
} from 'recharts';
import { ChartTooltip, ChartTooltipContent } from '@/components/evilcharts/ui/recharts-tooltip';
import { ChartContainer, getColorsCount, LoadingIndicator } from '@/components/evilcharts/ui/recharts-chart';
import { ChartLegend, ChartLegendContent } from '@/components/evilcharts/ui/recharts-legend';
import { ChartBackground } from '@/components/evilcharts/ui/recharts-background';
import { motion } from 'motion/react';

// Constants
const LOADING_SECTORS = 5;
const LOADING_ANIMATION_DURATION = 2000; // full loading cycle duration in milliseconds
const DEFAULT_INNER_RADIUS = '0%';
const DEFAULT_OUTER_RADIUS = '80%';
const DEFAULT_CORNER_RADIUS = 0;
const DEFAULT_PADDING_ANGLE = 0;
const DEFAULT_START_ANGLE = 0;
const DEFAULT_END_ANGLE = 360;
// Stable empty-array reference so the `glowingSectors` default doesn't change every render
const EMPTY_GLOWING_SECTORS = [];

const PieChartContext = createContext(null);

// Reads the chart context, throwing a helpful error when used outside <EvilPieChart />
function usePieChart() {
  const context = use(PieChartContext);

  if (!context) {
    throw new Error('Pie chart parts (<Pie />, <Tooltip />, …) must be used within <EvilPieChart />');
  }

  return context;
}

/**
 * Root of the composible pie chart. Owns the data, the shared context, and the
 * loading skeleton. Everything visual, the pie itself, tooltip, legend, and an
 * optional background, is composed as children, so a consumer renders exactly
 * the parts they need.
 */
export function EvilPieChart({
  config,
  data,
  dataKey,
  nameKey,
  children,
  className,
  chartProps = undefined,
  defaultSelectedSector = null,
  onSelectionChange = undefined,
  isLoading = false,
}) {
  const [selectedSector, setSelectedSector] = useState(defaultSelectedSector);

  // Updates selection state and notifies the parent with the sector's value
  const selectSector = useCallback(
    (sectorName) => {
      setSelectedSector(sectorName);

      if (sectorName === null) {
        onSelectionChange?.(null);
        return;
      }

      const selectedItem = data.find((item) => item[nameKey] === sectorName);

      if (selectedItem) {
        onSelectionChange?.({ dataKey: sectorName, value: selectedItem[dataKey] });
      }
    },
    [data, dataKey, nameKey, onSelectionChange],
  );

  const contextValue = useMemo(
    () => ({
      config,
      data,
      dataKey,
      nameKey,
      isLoading,
      selectedSector,
      selectSector,
    }),
    [config, data, dataKey, nameKey, isLoading, selectedSector, selectSector],
  );

  return (
    <PieChartContext value={contextValue}>
      <ChartContainer className={className} config={config}>
        <LoadingIndicator isLoading={isLoading} />
        <RechartsPieChart id="evil-charts-pie-chart" accessibilityLayer {...chartProps}>
          {children}
        </RechartsPieChart>
      </ChartContainer>
    </PieChartContext>
  );
}

/**
 * The pie series. Self-contained: it generates its own radial color gradients
 * and glow filters under a unique id, so any number of pies, each with its own
 * shape and clickability, can live on one page without style collisions. While
 * the chart is loading it renders an animated skeleton in place of the data.
 * Compose <Label /> inside it to draw labels on each sector.
 */
function Pie({
  variant = 'gradient',
  innerRadius = DEFAULT_INNER_RADIUS,
  outerRadius = DEFAULT_OUTER_RADIUS,
  cornerRadius = DEFAULT_CORNER_RADIUS,
  paddingAngle = DEFAULT_PADDING_ANGLE,
  startAngle = DEFAULT_START_ANGLE,
  endAngle = DEFAULT_END_ANGLE,
  isClickable = false,
  glowingSectors = EMPTY_GLOWING_SECTORS,
  children = undefined,
  pieProps = undefined,
}) {
  const { config, data, dataKey, nameKey, isLoading, selectedSector, selectSector } = usePieChart();
  const id = useId().replace(/:/g, ''); // unique id scopes this pie's style defs

  if (isLoading) {
    return (
      <RechartsPie
        data={LOADING_PIE_DATA}
        dataKey="value"
        nameKey="name"
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        cornerRadius={cornerRadius}
        paddingAngle={paddingAngle}
        startAngle={startAngle}
        endAngle={endAngle}
        strokeWidth={0}
        isAnimationActive={false}
        shape={(props) => <AnimatedLoadingSector {...props} />}
      />
    );
  }

  const label = resolveLabel(children, dataKey);

  const preparedData = data.map((item) => ({
    ...item,
    fill: `url(#${id}-colors-${item[nameKey]})`,
  }));

  return (
    <>
      <RechartsPie
        data={preparedData}
        dataKey={dataKey}
        nameKey={nameKey}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        cornerRadius={cornerRadius}
        paddingAngle={paddingAngle}
        startAngle={startAngle}
        endAngle={endAngle}
        strokeWidth={0}
        isAnimationActive
        style={isClickable ? { cursor: 'pointer' } : undefined}
        onClick={(_, index) => {
          if (!isClickable) return;
          const clickedName = data[index]?.[nameKey];
          // Clicking the selected sector clears the selection, otherwise selects it
          selectSector(selectedSector === clickedName ? null : clickedName);
        }}
        shape={(props) => {
          const sectorName = data[props.index ?? 0]?.[nameKey];
          const isGlowing = glowingSectors.includes(sectorName);
          const isDimmed = isClickable && selectedSector !== null && selectedSector !== sectorName;

          return (
            <Sector
              {...props}
              fill={`url(#${id}-colors-${sectorName})`}
              filter={isGlowing ? `url(#${id}-glow-${sectorName})` : undefined}
              stroke={paddingAngle < 0 ? 'var(--background)' : 'none'}
              strokeWidth={paddingAngle < 0 ? 5 : 0}
              opacity={isDimmed ? 0.15 : 1}
              className="transition-opacity duration-200"
            />
          );
        }}
        {...pieProps}
      >
        {label}
      </RechartsPie>
      <defs>
        <RadialColorGradient id={id} config={config} variant={variant} />
        {glowingSectors.length > 0 && <GlowFilter id={id} glowingSectors={glowingSectors} />}
      </defs>
    </>
  );
}

/**
 * Declares per-sector labels for the <Pie /> it is composed inside. It renders
 * nothing on its own, the parent <Pie /> reads its props and wires them into a
 * Recharts LabelList drawn over the sectors.
 */
const Label = () => null;

/**
 * The hover tooltip. Hidden automatically while the chart is loading.
 */
function Tooltip({ variant = undefined, roundness = undefined, defaultIndex = undefined }) {
  const { isLoading, nameKey } = usePieChart();

  if (isLoading) return null;

  return (
    <ChartTooltip
      defaultIndex={defaultIndex}
      content={<ChartTooltipContent nameKey={nameKey} hideLabel roundness={roundness} variant={variant} />}
    />
  );
}

/**
 * The sector legend. When `isClickable` is set, each entry toggles selection of
 * its sector, driving the shared selection state read by the <Pie />.
 */
function Legend({ variant = undefined, align = 'center', verticalAlign = 'bottom', isClickable = false }) {
  const { nameKey, selectedSector, selectSector } = usePieChart();

  return (
    <ChartLegend
      verticalAlign={verticalAlign}
      align={align}
      content={
        <ChartLegendContent
          selected={selectedSector}
          onSelectChange={selectSector}
          isClickable={isClickable}
          nameKey={nameKey}
          variant={variant}
        />
      }
    />
  );
}

/**
 * An optional decorative pattern drawn behind the pie. Compose it before the
 * <Pie /> so it sits underneath the sectors.
 */
function Background({ variant = 'dots' }) {
  return <ChartBackground variant={variant} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Label helper
// ─────────────────────────────────────────────────────────────────────────────

// Pulls a <Label /> out of a pie's children into a Recharts LabelList element
const resolveLabel = (children, valueKey) => {
  let label = null;

  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== Label) return;

    const { dataKey, labelListProps } = child.props;

    label = (
      <RechartsLabelList
        dataKey={dataKey ?? valueKey}
        stroke="none"
        fontSize={12}
        fontWeight={500}
        fill="currentColor"
        className="fill-background"
        {...labelListProps}
      />
    );
  });

  return label;
};

/**
 * Radial-style color gradients, one per sector. Each sector's fill paints from
 * the gradient that matches its name, supporting both single and multi-color
 * config entries.
 */
const RadialColorGradient = ({ id, config }) => {
  return (
    <>
      {Object.entries(config).map(([sectorKey, sectorConfig]) => {
        const colorsCount = getColorsCount(sectorConfig);

        return (
          <linearGradient
            key={`${id}-colors-${sectorKey}`}
            id={`${id}-colors-${sectorKey}`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            {colorsCount === 1 ? (
              <>
                <stop offset="0%" stopColor={`var(--color-${sectorKey}-0)`} />
                <stop offset="100%" stopColor={`var(--color-${sectorKey}-0)`} />
              </>
            ) : (
              Array.from({ length: colorsCount }, (_, index) => {
                const offset = `${(index / (colorsCount - 1)) * 100}%`;
                return (
                  <stop
                    key={offset}
                    offset={offset}
                    stopColor={`var(--color-${sectorKey}-${index}, var(--color-${sectorKey}-0))`}
                  />
                );
              })
            )}
          </linearGradient>
        );
      })}
    </>
  );
};

/** Soft outer-glow SVG filter, one per glowing sector. */
const GlowFilter = ({ id, glowingSectors }) => {
  return (
    <>
      {glowingSectors.map((sectorName) => (
        <filter
          key={`${id}-glow-${sectorName}`}
          id={`${id}-glow-${sectorName}`}
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      ))}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

// Equal-sized sectors used to render the circular pulsing loading skeleton
const LOADING_PIE_DATA = Array.from({ length: LOADING_SECTORS }, (_, i) => ({
  name: `loading${i}`,
  value: 100 / LOADING_SECTORS,
}));

/**
 * A single skeleton sector shown while the chart is loading. Each sector pulses
 * with a staggered delay, producing a wave that travels around the pie.
 */
const AnimatedLoadingSector = (props) => {
  const { index = 0, ...sectorProps } = props;

  // Staggered delay so the pulse sweeps around the circle
  const delay = (index / LOADING_SECTORS) * (LOADING_ANIMATION_DURATION / 1000);

  return (
    <motion.g
      initial={{ opacity: 0.15 }}
      animate={{ opacity: [0.15, 0.5, 0.15] }}
      transition={{
        duration: LOADING_ANIMATION_DURATION / 1000,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Sector {...sectorProps} fill="currentColor" />
    </motion.g>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Static parts attached to the root
// ─────────────────────────────────────────────────────────────────────────────

EvilPieChart.Pie = Pie;
EvilPieChart.Label = Label;
EvilPieChart.Tooltip = Tooltip;
EvilPieChart.Legend = Legend;
EvilPieChart.Background = Background;
