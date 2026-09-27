export function Spinner() {
  return <span className="spinner" />;
}

export function PageSpinner() {
  return (
    <div className="spinner-page">
      <Spinner />
    </div>
  );
}
