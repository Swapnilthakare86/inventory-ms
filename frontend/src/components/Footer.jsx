export default function Footer() {
  return (
    <footer
      className="d-flex align-items-center justify-content-between px-4 py-2 border-top bg-white text-muted"
      style={{ fontSize: 12, position: 'sticky', bottom: 0, zIndex: 100 }}
    >
      <span>&copy; {new Date().getFullYear()} Inventory MS. All rights reserved.</span>
    </footer>
  );
}
