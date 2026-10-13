// Círculo que gira junto a un texto mientras algo trabaja. Es decorativo: el
// texto de al lado ya dice qué pasa, así que los lectores de pantalla lo
// ignoran. Sin texto ni rol, las pruebas lo encuentran por `data-testid`.
export default function SpinnerView({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      data-testid="spinner"
      className={`inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`.trim()}
    />
  );
}
