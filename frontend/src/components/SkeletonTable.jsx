export default function SkeletonTable({ cols = 5, rows = 5 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j}>
              <div className="placeholder-glow">
                <span className="placeholder col-12 rounded" style={{ height: 16 }} />
              </div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
