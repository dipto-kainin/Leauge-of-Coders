export default function Footer() {
  return (
    <footer className="w-full py-8 bg-surface-lowest border-t border-[rgba(0,245,255,0.08)] flex items-center justify-center">
      <p className="text-muted-foreground text-sm font-medium tracking-wide">
        © {new Date().getFullYear()}{" "}
        <span className="neon-text font-pixel">League-of-Coders</span>. The grid is absolute.
      </p>
    </footer>
  );
}
