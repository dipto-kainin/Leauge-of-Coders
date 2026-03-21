export default function Footer() {
  return (
    <footer className="w-full py-8 bg-background border-t border-white/5 flex items-center justify-center">
      <p className="text-muted-foreground text-sm font-medium tracking-wide">
        © {new Date().getFullYear()} Leauge-of-Coders. The grid is absolute.
      </p>
    </footer>
  );
}
