import { useCountUp } from '../../hooks/useCountUp';

export const CounterValue = ({ value, formatter }) => {
  const animatedValue = useCountUp(value, 600);
  return (
    <span className="metric-value">
      {formatter ? formatter(animatedValue) : animatedValue}
    </span>
  );
};
