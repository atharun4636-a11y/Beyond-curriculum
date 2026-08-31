export const SkeletonCard = () => {
  return (
    <div className="ui-card skeleton-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="skeleton-shimmer" style={{ width: '100%', height: '140px', borderRadius: '8px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton-shimmer" style={{ width: '80px', height: '22px' }} />
        <div className="skeleton-shimmer" style={{ width: '100px', height: '22px' }} />
      </div>
      <div className="skeleton-shimmer" style={{ width: '70%', height: '24px' }} />
      <div className="skeleton-shimmer" style={{ width: '100%', height: '40px' }} />
      <div className="skeleton-shimmer" style={{ width: '100%', height: '36px', marginTop: 'auto' }} />
    </div>
  );
};

export const SkeletonGrid = ({ count = 6 }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
};

export const SkeletonTableRow = () => {
  return (
    <tr>
      <td colSpan={7} style={{ padding: '1rem' }}>
        <div className="skeleton-shimmer" style={{ width: '100%', height: '24px' }} />
      </td>
    </tr>
  );
};
